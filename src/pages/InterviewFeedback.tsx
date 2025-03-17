import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { collection, doc, getDoc, getDocs, setDoc, Timestamp } from "firebase/firestore";


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
}

interface InterviewData {
  title: string;
  createdAt: Timestamp;
  questionCount: number;
  jobTitle: string;
}

export default function InterviewFeedback() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [overallFeedback, setOverallFeedback] = useState<string>("");
  const [interviewId, setInterviewId] = useState<string>("");

  useEffect(() => {
    // Get interview ID from sessionStorage
    const savedInterviewId = sessionStorage.getItem("currentInterviewId");
    if (!savedInterviewId) {
      alert("No interview selected for feedback");
      navigate("/questions/question-list");
      return;
    }

    setInterviewId(savedInterviewId);
    loadInterviewData(savedInterviewId);
  }, [navigate]);

  const loadInterviewData = async (interviewId: string) => {
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
            score: aiResponse.score
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
        score: 0
      }));
      
      setFeedbackItems(blankItems);
      setOverallFeedback("");
      generateFeedback(interviewId, blankItems);
    }
  };

  // const renderFeedbackItem = (item: FeedbackItem, index: number) => {
  //   return (
  //     <Card key={item.questionId} className="mb-6">
  //       <CardHeader>
  //         <CardTitle className="text-lg">Question {index + 1}</CardTitle>
  //       </CardHeader>
  //       <CardContent>
  //         <div className="space-y-4">
  //           <div>
  //             <h3 className="font-medium text-muted-foreground mb-1">Question:</h3>
  //             <p>{item.question}</p>
  //           </div>
            
  //           <div>
  //             <h3 className="font-medium text-muted-foreground mb-1">Your Answer:</h3>
  //             <p className="text-sm bg-muted p-3 rounded-md">{item.transcript}</p>
  //           </div>
            
  //           {!item.feedback ? (
  //             <div className="space-y-2">
  //               <Skeleton className="h-4 w-full" />
  //               <Skeleton className="h-4 w-5/6" />
  //               <Skeleton className="h-4 w-4/6" />
  //             </div>
  //           ) : (
  //             <div>
  //               <h3 className="font-medium text-muted-foreground mb-1">Feedback:</h3>
  //               <div className="prose prose-sm max-w-none">
  //                 <p>{item.feedback}</p>
                  
  //                 {item.strengths && item.strengths.length > 0 && (
  //                   <div className="mt-3">
  //                     <h4 className="text-sm font-medium text-green-600 dark:text-green-400">Strengths:</h4>
  //                     <ul className="pl-5 list-disc text-sm">
  //                       {item.strengths.map((strength, i) => (
  //                         <li key={i}>{strength}</li>
  //                       ))}
  //                     </ul>
  //                   </div>
  //                 )}
                  
  //                 {item.improvements && item.improvements.length > 0 && (
  //                   <div className="mt-3">
  //                     <h4 className="text-sm font-medium text-amber-600 dark:text-amber-400">Areas for Improvement:</h4>
  //                     <ul className="pl-5 list-disc text-sm">
  //                       {item.improvements.map((improvement, i) => (
  //                         <li key={i}>{improvement}</li>
  //                       ))}
  //                     </ul>
  //                   </div>
  //                 )}
  //               </div>
  //             </div>
  //           )}
  //         </div>
  //       </CardContent>
  //     </Card>
  //   );
  // };

  const renderFeedbackItem = (item: FeedbackItem, index: number) => {
    return (
      <Card key={item.questionId} className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Question {index + 1}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-muted-foreground mb-1">Question:</h3>
              <p>{item.question}</p>
            </div>
            
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
              <FeedbackDisplay
                assessment={item.feedback}
                strengths={item.strengths || []}
                improvements={item.improvements || []}
                score={item.score || 0}
              />
            )}
          </div>
        </CardContent>
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
          onClick={() => navigate("/questions/question-list")}
          className="bg-violet-500 text-white hover:bg-violet-300 hover:text-black"
        >
          Back to Questions
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

      {/* Overall Feedback */}
      {/* <Card className="mb-8">
        <CardHeader>
          <CardTitle>Overall Feedback</CardTitle>
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
              <p>{overallFeedback}</p>
            </div>
          )}
        </CardContent>
      </Card> */}

<Card className="mb-8">
  <CardHeader>
    <CardTitle>Overall Feedback</CardTitle>
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
        <h2 className="text-xl font-bold mb-4">Detailed Feedback</h2>
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