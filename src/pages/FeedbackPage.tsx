import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  deleteDoc, 
  getDoc, 
  orderBy, 
  Timestamp 
} from "firebase/firestore";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, Briefcase, Eye, Trash2, Star, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { db } from "@/config/firebase.config";

interface FeedbackItem {
  questionId: string;
  question: string;
  transcript: string;
  feedback: string;
  strengths: string[];
  improvements: string[];
  score: number;
  preferredAnswer?: string;
}

interface FeedbackSummary {
  items: FeedbackItem[];
  overall: string;
  generatedAt: Timestamp;
}

interface InterviewData {
  title: string;
  createdAt: Timestamp;
  questionCount: number;
  jobTitle: string;
}

interface FeedbackEntry {
  id: string;
  interviewData: InterviewData;
  feedbackSummary: FeedbackSummary;
  averageScore: number;
}

export default function UserFeedbackDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<FeedbackEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackEntry | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    loadAllFeedback();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredEntries(feedbackEntries);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      const filtered = feedbackEntries.filter(
        entry => 
          entry.interviewData.title.toLowerCase().includes(lowercasedSearch) ||
          entry.interviewData.jobTitle.toLowerCase().includes(lowercasedSearch)
      );
      setFilteredEntries(filtered);
    }
  }, [searchTerm, feedbackEntries]);

  const loadAllFeedback = async () => {
    try {
      setLoading(true);
      
      // Get all interviews
      const interviewsRef = collection(db, "interviews");
      const interviewsQuery = query(interviewsRef, orderBy("createdAt", "desc"));
      const interviewsSnapshot = await getDocs(interviewsQuery);
      
      const entries: FeedbackEntry[] = [];
      
      // For each interview, check if feedback exists
      for (const interviewDoc of interviewsSnapshot.docs) {
        const interviewId = interviewDoc.id;
        const interviewData = interviewDoc.data() as InterviewData;
        
        // Check if feedback exists for this interview
        const feedbackRef = doc(db, "interviews", interviewId, "feedback", "summary");
        const feedbackSnapshot = await getDoc(feedbackRef);
        
        if (feedbackSnapshot.exists()) {
          const feedbackSummary = feedbackSnapshot.data() as FeedbackSummary;
          
          // Calculate average score
          const totalScore = feedbackSummary.items.reduce((sum, item) => sum + (item.score || 0), 0);
          const averageScore = Math.round(totalScore / feedbackSummary.items.length);
          
          entries.push({
            id: interviewId,
            interviewData,
            feedbackSummary,
            averageScore
          });
        }
      }
      
      setFeedbackEntries(entries);
      setFilteredEntries(entries);
    } catch (error) {
      console.error("Error loading feedback entries:", error);
      alert("Failed to load feedback entries. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!feedbackToDelete) return;
    
    try {
      // Delete the feedback document
      await deleteDoc(doc(db, "interviews", feedbackToDelete, "feedback", "summary"));
      
      // Update the local state
      const updatedEntries = feedbackEntries.filter(entry => entry.id !== feedbackToDelete);
      setFeedbackEntries(updatedEntries);
      setFilteredEntries(updatedEntries.filter(
        entry => 
          entry.interviewData.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.interviewData.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
      ));
      
      // Close dialog and reset state
      setDeleteDialogOpen(false);
      setFeedbackToDelete(null);
    } catch (error) {
      console.error("Error deleting feedback:", error);
      alert("Failed to delete feedback. Please try again.");
    }
  };

  const viewFeedbackDetails = (id: string) => {
    navigate(`/mock-interview/feedback/${id}`);
  };

  const openDetailsDialog = (feedback: FeedbackEntry) => {
    setSelectedFeedback(feedback);
    setDetailsDialogOpen(true);
  };

  const confirmDelete = (id: string) => {
    setFeedbackToDelete(id);
    setDeleteDialogOpen(true);
  };

  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return "N/A";
    return timestamp.toDate().toLocaleDateString();
  };

  // Render a score badge with appropriate color
  const renderScoreBadge = (score: number) => {
    let color = "bg-gray-200 text-gray-800";
    
    if (score >= 8) {
      color = "bg-green-100 text-green-800";
    } else if (score >= 6) {
      color = "bg-blue-100 text-blue-800";
    } else if (score >= 4) {
      color = "bg-yellow-100 text-yellow-800";
    } else {
      color = "bg-red-100 text-red-800";
    }
    
    return (
      <Badge className={`${color} px-2 py-1 text-xs font-medium rounded flex items-center gap-1`}>
        <Star size={12} />
        {score}/10
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-16 px-4 max-w-6xl">
        <h1 className="text-2xl font-bold mb-8">Loading Feedback Entries...</h1>
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Interview Feedback History</h1>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or job..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No feedback entries found.</p>
          <Button 
            variant="outline" 
            className="mt-4 bg-violet-500 text-white hover:bg-violet-300 hover:text-black"
            onClick={() => navigate("/questions/question-list")}
          >
            Start a Practice Interview
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntries.map((entry) => (
            <Card key={entry.id} className="overflow-hidden border border-gray-200 hover:border-violet-300 transition-all">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-1">{entry.interviewData.title}</CardTitle>
                  {renderScoreBadge(entry.averageScore)}
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Briefcase size={16} className="text-muted-foreground" />
                    <span className="text-muted-foreground">Job Title:</span>
                    <span className="font-medium line-clamp-1">{entry.interviewData.jobTitle}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-muted-foreground" />
                    <span className="text-muted-foreground">Interview Date:</span>
                    <span>{formatDate(entry.interviewData.createdAt)}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">Questions:</span>
                    <span>{entry.interviewData.questionCount}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex justify-between gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => openDetailsDialog(entry)}
                >
                  <Eye size={16} className="mr-1" /> Preview
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="flex-1 bg-violet-500 hover:bg-violet-600"
                  onClick={() => viewFeedbackDetails(entry.id)}
                >
                  Full Details <ChevronRight size={16} className="ml-1" />
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-10 p-0"
                  onClick={() => confirmDelete(entry.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Feedback preview dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{selectedFeedback?.interviewData.title}</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <Badge variant="outline" className="font-normal">
                {selectedFeedback?.interviewData.jobTitle}
              </Badge>
              <Badge variant="secondary" className="font-normal">
                {formatDate(selectedFeedback?.interviewData.createdAt)}
              </Badge>
              {selectedFeedback && renderScoreBadge(selectedFeedback.averageScore)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 my-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Overall Feedback</h3>
              <div className="bg-muted p-4 rounded-md whitespace-pre-line">
                {selectedFeedback?.feedbackSummary.overall}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">Question Highlights</h3>
              <div className="space-y-4">
                {selectedFeedback?.feedbackSummary.items.slice(0, 2).map((item, index) => (
                  <div key={item.questionId} className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">Question {index + 1}: {item.question}</h4>
                    <div className="mt-2">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Strengths:</p>
                      <ul className="text-sm list-disc list-inside">
                        {item.strengths.slice(0, 2).map((strength, i) => (
                          <li key={i}>{strength}</li>
                        ))}
                        {item.strengths.length > 2 && <li>...</li>}
                      </ul>
                    </div>
                  </div>
                ))}
                {(selectedFeedback?.feedbackSummary.items.length || 0) > 2 && (
                  <p className="text-center text-sm text-muted-foreground">
                    + {(selectedFeedback?.feedbackSummary.items.length || 0) - 2} more questions
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
            <Button 
              className="bg-violet-500 hover:bg-violet-600"
              onClick={() => {
                setDetailsDialogOpen(false);
                if (selectedFeedback) viewFeedbackDetails(selectedFeedback.id);
              }}
            >
              View Full Details
              <ChevronRight size={16} className="ml-1" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this feedback entry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFeedbackToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}