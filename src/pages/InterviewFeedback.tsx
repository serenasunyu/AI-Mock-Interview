import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { collection, doc, getDoc, getDocs, setDoc, Timestamp } from "firebase/firestore";
import { ChevronDown, ChevronUp } from "lucide-react";

import { generateAIFeedback } from "@/lib/ai-service";
import { db } from "@/config/firebase.config";
import FeedbackDisplay from "@/components/FeedbackDisplay";

interface FeedbackItem {
  questionId: string;
  question: string;
  transcript: string;
  feedback: string;
  strengths: string[];
  improvements: string[];
  score: number;
  preferredAnswer?: string; // Added preferred answer field
}

interface InterviewData {
  title: string;
  createdAt: Timestamp;
  questionCount: number;
  jobTitle: string;
}

export default function InterviewFeedback() {
  const navigate = useNavigate();
  const { interviewId: urlInterviewId } = useParams(); // Get interview ID from URL params
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [overallFeedback, setOverallFeedback] = useState<string>("");
  const [interviewId, setInterviewId] = useState<string>("");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Get interview ID from URL params
    const routeInterviewId = urlInterviewId && urlInterviewId !== "null" ? urlInterviewId : null;
    
    // Fall back to session storage if not in URL
    const savedInterviewId = sessionStorage.getItem("currentInterviewId");
    
    // Use route ID first, then session storage
    const finalInterviewId = routeInterviewId || savedInterviewId;
    
    if (!finalInterviewId) {
      alert("No interview selected for feedback");
      navigate("/questions/question-list");
      return;
    }
    
    // Update URL if needed (coming from session storage)
    if (!routeInterviewId || routeInterviewId === "null") {
      navigate(`/mock-interview/feedback/${finalInterviewId}`, { replace: true });
    }
    
    setInterviewId(finalInterviewId);
    loadInterviewData(finalInterviewId);
  }, [navigate, urlInterviewId]);

  const loadInterviewData = async (interviewId: string) => {
    if (!interviewId) {
      console.error("No interview ID provided");
      return;
    }
    
    try {
      setLoading(true);
      
      // Get interview metadata
      const interviewRef = doc(db, "interviews", interviewId);
      const interviewSnapshot = await getDoc(interviewRef);
      
      if (!interviewSnapshot.exists()) {
        throw new Error("Interview not found");
      }
      
      const interviewData = interviewSnapshot.data() as InterviewData;
      setInterviewData(interviewData);
      
      // Get all transcriptions
      const transcriptionsCollection = collection(interviewRef, "transcriptions");
      const transcriptionsSnapshot = await getDocs(transcriptionsCollection);
      
      const transcriptions: {
        questionId: string;
        question: string;
        transcript: string;
      }[] = [];
      
      transcriptionsSnapshot.forEach((doc) => {
        const data = doc.data();
        transcriptions.push({
          questionId: doc.id,
          question: data.question,
          transcript: data.transcript
        });
      });
      
      // Check if feedback already exists
      // FIX: Use collection then doc to maintain proper hierarchy
      const feedbackCollection = collection(db, "interviews", interviewId, "feedback");
      const feedbackDoc = await getDoc(doc(feedbackCollection, "summary"));
      
      if (feedbackDoc.exists()) {
        // Feedback already generated, load it
        const feedbackData = feedbackDoc.data();
        setFeedbackItems(feedbackData.items || []);
        setOverallFeedback(feedbackData.overall || "");
      } else {
        // Set up blank feedback items
        const blankFeedbackItems = transcriptions.map(transcription => ({
          questionId: transcription.questionId,
          question: transcription.question,
          transcript: transcription.transcript,
          feedback: "",
          strengths: [],
          improvements: [],
          score: 0
        }));
        
        setFeedbackItems(blankFeedbackItems);
        // Start feedback generation
        generateFeedback(interviewId, blankFeedbackItems);
      }
    } catch (error) {
      console.error("Error loading interview data:", error);
      alert("Failed to load interview data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateFeedback = async (interviewId: string, items: FeedbackItem[]) => {
    try {
      setProcessing(true);
      
      // Clone the items to avoid state mutation issues
      const updatedItems = [...items];
      
      // Process each question/answer for feedback
      for (let i = 0; i < updatedItems.length; i++) {
        const item = updatedItems[i];
        
        // Update UI with progress
        setFeedbackItems(current => {
          const updated = [...current];
          updated[i] = { ...updated[i], feedback: "Generating feedback..." };
          return updated;
        });
        
        // Generate AI feedback for this question/answer
        try {
          const aiResponse = await generateAIFeedback({
            question: item.question,
            transcript: item.transcript,
            jobTitle: interviewData?.jobTitle || ""
          });
          
          // Update the feedback item with AI response
          updatedItems[i] = {
            ...item,
            feedback: aiResponse.feedback,
            strengths: aiResponse.strengths,
            improvements: aiResponse.improvements,
            score: aiResponse.score,
            preferredAnswer: aiResponse.preferredAnswer // Add preferred answer
          };
          
          // Update state with the latest item
          setFeedbackItems(current => {
            const updated = [...current];
            updated[i] = updatedItems[i];
            return updated;
          });
        } catch (error) {
          console.error(`Error generating feedback for question ${i+1}:`, error);
          updatedItems[i] = {
            ...item,
            feedback: "Failed to generate feedback. Please try again later."
          };
        }
      }
      
      // Generate overall feedback
      try {
        const overallResponse = await generateAIFeedback({
          overall: true,
          items: updatedItems,
          jobTitle: interviewData?.jobTitle || ""
        });
        
        setOverallFeedback(overallResponse.feedback);
        
        // Save all feedback to Firebase
        await saveAllFeedback(interviewId, updatedItems, overallResponse.feedback);
      } catch (error) {
        console.error("Error generating overall feedback:", error);
        setOverallFeedback("Failed to generate overall feedback. Please try again later.");
      }
    } catch (error) {
      console.error("Error in feedback generation process:", error);
      alert("An error occurred while generating feedback. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const saveAllFeedback = async (interviewId: string, items: FeedbackItem[], overall: string) => {
    try {
      // FIX: Use collection then doc to maintain proper hierarchy
      const feedbackCollection = collection(db, "interviews", interviewId, "feedback");
      const feedbackDoc = doc(feedbackCollection, "summary");
      
      await setDoc(feedbackDoc, {
        items,
        overall,
        generatedAt: Timestamp.now()
      });
      
      console.log("Feedback saved successfully");
    } catch (error) {
      console.error("Error saving feedback:", error);
    }
  };

  const regenerateFeedback = () => {
    if (window.confirm("This will regenerate AI feedback for all answers. Continue?")) {
      // Reset feedback items to blanks with transcripts
      const blankItems = feedbackItems.map(item => ({
        ...item,
        feedback: "",
        strengths: [],
        improvements: [],
        score: 0,
        preferredAnswer: undefined // Reset preferred answer
      }));
      
      setFeedbackItems(blankItems);
      setOverallFeedback("");
      generateFeedback(interviewId, blankItems);
    }
  };

  const toggleExpand = (questionId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const renderFeedbackItem = (item: FeedbackItem, index: number) => {
    const isExpanded = !!expandedItems[item.questionId];
    
    return (
      <Card key={item.questionId} className="mb-4">
        <CardHeader 
          className="cursor-pointer flex flex-row items-center justify-between" 
          onClick={() => toggleExpand(item.questionId)}
        >
          <div className="flex-1">
            <CardTitle className="text-lg">Question {index + 1}</CardTitle>
            <p className="text-base text-muted-foreground mt-1">{item.question}</p>
          </div>
          <div className="flex items-center">
            {item.score > 0 && (
              <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center mr-2">
                <span className="text-violet-600 font-semibold text-sm">{item.score}/10</span>
              </div>
            )}
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-muted-foreground mb-1">Your Answer:</h3>
                <p className="text-sm bg-muted p-3 rounded-md">{item.transcript}</p>
              </div>
              
              {!item.feedback ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
              ) : (
                <div>
                  <h3 className="font-medium text-muted-foreground mb-1">Feedback:</h3>
                  <FeedbackDisplay
                    assessment={item.feedback}
                    strengths={item.strengths || []}
                    improvements={item.improvements || []}
                    preferredAnswer={item.preferredAnswer} // Pass preferred answer to the component
                  />
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-16 px-4 max-w-4xl">
        <h1 className="text-2xl font-bold mb-8">Loading Interview Data...</h1>
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-60 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Interview Feedback</h1>
        <Button 
          variant="outline"
          onClick={() => navigate("/mock-interview/feedback")}
          className="bg-violet-500 text-white hover:bg-violet-300 hover:text-black"
        >
          Back to Feedback History
        </Button>
      </div>

      {interviewData && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{interviewData.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Job Title:</span> {interviewData.jobTitle}
              </div>
              <div>
                <span className="text-muted-foreground">Questions:</span> {interviewData.questionCount}
              </div>
              <div>
                <span className="text-muted-foreground">Date:</span> {interviewData.createdAt.toDate().toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Overall Feedback</CardTitle>
          {feedbackItems.length > 0 && (
            <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center">
              <span className="text-violet-600 font-semibold">
                {Math.round(feedbackItems.reduce((sum, item) => sum + (item.score || 0), 0) / feedbackItems.length)}
                /10
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!overallFeedback ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          ) : (
            <div className="prose max-w-none">
              <p className="text-base leading-relaxed whitespace-pre-line">{overallFeedback}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-Question Feedback */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Detailed Feedback</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Toggle all items - if any are collapsed, expand all; otherwise collapse all
              const anyCollapsed = feedbackItems.some(item => !expandedItems[item.questionId]);
              const newExpandedState = anyCollapsed
                ? Object.fromEntries(feedbackItems.map(item => [item.questionId, true]))
                : {};
              setExpandedItems(newExpandedState);
            }}
            className="text-violet-600 hover:text-violet-800"
          >
            {feedbackItems.some(item => !expandedItems[item.questionId]) ? 'Expand All' : 'Collapse All'}
          </Button>
        </div>
        {feedbackItems.map((item, index) => renderFeedbackItem(item, index))}
      </div>

      <div className="flex justify-end mb-16">
        <Button
          variant="outline"
          onClick={regenerateFeedback}
          disabled={processing}
          className="bg-violet-500 text-white hover:bg-violet-300 hover:text-black"
        >
          {processing ? "Generating Feedback..." : "Regenerate Feedback"}
        </Button>
      </div>
    </div>
  );
}