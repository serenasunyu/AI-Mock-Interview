import { useEffect, useState, useRef } from "react";
import { collection, getDocs, addDoc, Timestamp, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase.config";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Trash2, XCircle } from "lucide-react";
// Import Sonner for toast notifications
import { toast, Toaster } from "sonner";

interface SavedQuestion {
  id: string;
  jobTitle: string;
  questions: string[];
  timestamp: Timestamp;
}

interface QuestionItem {
  id: string; // Unique identifier combining entry.id + question index
  entryId: string; // Original document ID
  jobTitle: string;
  question: string;
  timestamp: Timestamp;
}

type SortOption = "newest" | "oldest" | "jobTitle";

// Custom hook for confirmation
function useConfirmation() {
  const [state, setState] = useState<{
    isOpen: boolean;
    onConfirm?: () => void;
    title: string;
    description: string;
  }>({
    isOpen: false,
    title: "",
    description: "",
  });

  const confirm = (title: string, description: string) => {
    return new Promise<boolean>((resolve) => {
      setState({
        isOpen: true,
        onConfirm: () => {
          resolve(true);
          setState({ ...state, isOpen: false });
        },
        title,
        description,
      });
    });
  };

  const handleCancel = () => {
    setState({ ...state, isOpen: false });
  };

  return {
    state,
    confirm,
    handleCancel
  };
}

export default function QuestionList() {
  const [savedQuestions, setSavedQuestions] = useState<SavedQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<SavedQuestion[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [jobTitleFilter, setJobTitleFilter] = useState<string>("");
  const [uniqueJobTitles, setUniqueJobTitles] = useState<string[]>([]);
  const fetched = useRef(false);

  const navigate = useNavigate();
  const [selectedQuestions, setSelectedQuestions] = useState<QuestionItem[]>([]);
  const [newQuestion, setNewQuestion] = useState<string>("");
  const [newJobTitle, setNewJobTitle] = useState<string>("");
  
  // Delete confirmation state using custom confirmation hook
  const confirmation = useConfirmation();

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const fetchQuestions = async () => {
      const querySnapshot = await getDocs(collection(db, "interviewQuestions"));
      const questionsData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          jobTitle: data.jobTitle,
          questions: data.questions,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp : Timestamp.now(),
        } as SavedQuestion;
      });

      setSavedQuestions(questionsData);

      // Extract unique job titles for filter dropdown
      const jobTitles = [...new Set(questionsData.map(item => item.jobTitle))];
      setUniqueJobTitles(jobTitles);
    };

    fetchQuestions();
  }, []);

  useEffect(() => {
    let result = [...savedQuestions];

    // Apply job title filter if selected
    if (jobTitleFilter) {
      result = result.filter(item => item.jobTitle === jobTitleFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === "newest") {
        return b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime();
      } else if (sortBy === "oldest") {
        return a.timestamp.toDate().getTime() - b.timestamp.toDate().getTime();
      } else if (sortBy === "jobTitle") {
        return a.jobTitle.localeCompare(b.jobTitle);
      }
      return 0;
    });

    setFilteredQuestions(result);
  }, [savedQuestions, sortBy, jobTitleFilter]);

  const toggleQuestionSelection = (entry: SavedQuestion, questionIndex: number) => {
    const question = entry.questions[questionIndex];
    const questionId = `${entry.id}-${questionIndex}`;

    setSelectedQuestions(prev => {
      // Check if this question is already selected
      const isSelected = prev.some(item => item.id === questionId);

      if (isSelected) {
        // Remove if already selected
        return prev.filter(item => item.id !== questionId);
      } else {
        // Add if not selected
        return [...prev, {
          id: questionId,
          entryId: entry.id,
          jobTitle: entry.jobTitle,
          question: question,
          timestamp: entry.timestamp
        }];
      }
    });
  };

  const isQuestionSelected = (entryId: string, questionIndex: number) => {
    const questionId = `${entryId}-${questionIndex}`;
    return selectedQuestions.some(item => item.id === questionId);
  };

  const toggleAllQuestionsForJobTitle = (entry: SavedQuestion, checked: boolean) => {
    if (checked) {
      // Select all questions under this job title
      const questionsToAdd = entry.questions.map((question, index) => {
        const questionId = `${entry.id}-${index}`;
        // Only add if not already in the selected list
        if (!selectedQuestions.some(item => item.id === questionId)) {
          return {
            id: questionId,
            entryId: entry.id,
            jobTitle: entry.jobTitle,
            question: question,
            timestamp: entry.timestamp
          };
        }
        return null;
      }).filter(Boolean) as QuestionItem[];

      setSelectedQuestions(prev => [...prev, ...questionsToAdd]);
    } else {
      // Deselect all questions under this job title
      setSelectedQuestions(prev => 
        prev.filter(item => item.entryId !== entry.id)
      );
    }
  };

  const getSelectAllState = (entry: SavedQuestion) => {
    const totalQuestions = entry.questions.length;
    if (totalQuestions === 0) return "unchecked";
    
    const selectedCount = entry.questions.filter((_, index) => 
      isQuestionSelected(entry.id, index)
    ).length;
    
    if (selectedCount === 0) return "unchecked";
    if (selectedCount === totalQuestions) return "checked";
    return "indeterminate";
  };

  const startMockInterview = () => {
    if (selectedQuestions.length === 0) {
      toast.error("No questions selected", {
        description: "Please select at least one question for your mock interview."
      });
      return;
    }

    // Save selected questions to session storage for the mock interview page
    sessionStorage.setItem('mockInterviewQuestions', JSON.stringify(selectedQuestions));

    // Navigate to the mock interview page
    navigate('/mock-interview');
  };

  const clearSelection = () => {
    setSelectedQuestions([]);
  };

  // Handle adding a new question
  const handleAddQuestion = async () => {
    if (!newQuestion || !newJobTitle) {
      toast.error("Missing information", {
        description: "Please provide both a job title and a question."
      });
      return;
    }

    try {
      // Add to Firestore first to get the real document ID
      const docRef = await addDoc(collection(db, "interviewQuestions"), {
        jobTitle: newJobTitle,
        questions: [newQuestion],
        timestamp: Timestamp.now(),
      });

      // Then update the local state with the real document ID
      const newEntry: SavedQuestion = {
        id: docRef.id,
        jobTitle: newJobTitle,
        questions: [newQuestion],
        timestamp: Timestamp.now(),
      };

      setSavedQuestions(prev => [...prev, newEntry]);

      // Update job titles list if needed
      if (!uniqueJobTitles.includes(newJobTitle)) {
        setUniqueJobTitles(prev => [...prev, newJobTitle]);
      }

      // Clear inputs after submission
      setNewQuestion("");
      setNewJobTitle("");

      toast.success("Question added", {
        description: "Your new question has been saved successfully."
      });
    } catch (error) {
      console.error("Error adding question:", error);
      toast.error("Error", {
        description: "Failed to add your question. Please try again."
      });
    }
  };

  // Handle deleting a question with confirmation
  const openDeleteConfirmation = async (type: "question" | "section", entryId: string, questionIndex?: number, jobTitle?: string) => {
    const title = type === "question" ? "Delete Question" : "Delete Job Title Section";
    const description = type === "question" 
      ? "Are you sure you want to delete this question? This action cannot be undone."
      : `Are you sure you want to delete the entire "${jobTitle}" section and all its questions? This action cannot be undone.`;
    
    const confirmed = await confirmation.confirm(title, description);
    
    if (confirmed) {
      try {
        if (type === "question" && questionIndex !== undefined) {
          // Find the entry
          const entry = savedQuestions.find(q => q.id === entryId);
          if (!entry) {
            throw new Error("Question not found");
          }

          // Remove the question from the array
          const updatedQuestions = [...entry.questions];
          updatedQuestions.splice(questionIndex, 1);

          if (updatedQuestions.length === 0) {
            // Delete the entire document if no questions remain
            await deleteDoc(doc(db, "interviewQuestions", entryId));
            
            // Update local state
            setSavedQuestions(prev => prev.filter(q => q.id !== entryId));
            
            // Remove from selected questions if needed
            setSelectedQuestions(prev => 
              prev.filter(item => item.entryId !== entryId)
            );

            // Update job titles list if needed
            const jobTitleStillExists = savedQuestions.some(q => 
              q.id !== entryId && q.jobTitle === entry.jobTitle
            );
            
            if (!jobTitleStillExists) {
              setUniqueJobTitles(prev => prev.filter(title => title !== entry.jobTitle));
            }

            toast.success("Section deleted", {
              description: `"${entry.jobTitle}" section has been deleted as it had no remaining questions.`
            });
          } else {
            // Update the document with the remaining questions
            await updateDoc(doc(db, "interviewQuestions", entryId), {
              questions: updatedQuestions
            });
            
            // Update local state
            setSavedQuestions(prev => 
              prev.map(q => 
                q.id === entryId 
                  ? { ...q, questions: updatedQuestions } 
                  : q
              )
            );
            
            // Remove from selected questions if needed
            const questionId = `${entryId}-${questionIndex}`;
            setSelectedQuestions(prev => 
              prev.filter(item => item.id !== questionId)
            );

            toast.success("Question deleted", {
              description: "The question has been deleted successfully."
            });
          }
        } else if (type === "section") {
          // Delete the entire document
          await deleteDoc(doc(db, "interviewQuestions", entryId));
          
          // Find the entry to get the job title
          const entry = savedQuestions.find(q => q.id === entryId);
          
          // Update local state
          setSavedQuestions(prev => prev.filter(q => q.id !== entryId));
          
          // Remove from selected questions if needed
          setSelectedQuestions(prev => 
            prev.filter(item => item.entryId !== entryId)
          );

          // Update job titles list if needed
          if (entry) {
            const jobTitleStillExists = savedQuestions.some(q => 
              q.id !== entryId && q.jobTitle === entry.jobTitle
            );
            
            if (!jobTitleStillExists) {
              setUniqueJobTitles(prev => prev.filter(title => title !== entry.jobTitle));
            }
          }

          toast.success("Section deleted", {
            description: entry ? `"${entry.jobTitle}" section has been deleted successfully.` : "Section has been deleted successfully."
          });
        }
      } catch (error) {
        console.error("Error deleting:", error);
        toast.error("Error", {
          description: "Failed to delete. Please try again."
        });
      }
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Sonner Toaster component */}
      <Toaster position="top-right" />
      
      <h1 className="text-4xl text-gray-800 font-bold text-center mb-6">
        Your Saved Questions
      </h1>

      {/* Form to add new question */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold">Add a New Question</h2>
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Job Title"
              value={newJobTitle}
              onChange={(e) => setNewJobTitle(e.target.value)}
              className="mb-2"
            />
            <Input
              type="text"
              placeholder="Your New Question"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
            />
          </div>
          <Button onClick={handleAddQuestion} className="bg-violet-500 hover:bg-violet-300 hover:text-black">
            Add Question
          </Button>
        </CardContent>
      </Card>

      {/* Selection counter and actions */}
      <Card className="mb-6">
        <CardContent className="p-4 flex justify-between items-center">
          <div>
            <span className="font-medium">{selectedQuestions.length} questions selected</span>
            {selectedQuestions.length > 0 && (
              <Button 
                onClick={clearSelection}
                variant="ghost" 
                className="ml-4 text-sm text-destructive hover:text-destructive/90"
              >
                Clear selection
              </Button>
            )}
          </div>
          <Button
            onClick={startMockInterview}
            disabled={selectedQuestions.length === 0}
            variant={selectedQuestions.length > 0 ? "default" : "outline"}
            className="bg-violet-500 hover:bg-violet-300 hover:text-black"
          >
            Start Mock Interview
          </Button>
        </CardContent>
      </Card>

      {/* filters */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Job Title</label>
          <select
            className="w-full p-2 border rounded-md"
            value={jobTitleFilter}
            onChange={(e) => setJobTitleFilter(e.target.value)}
          >
            <option value="">All Job Titles</option>
            {uniqueJobTitles.map(title => (
              <option key={title} value={title}>{title}</option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
          <select
            className="w-full p-2 border rounded-md"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="jobTitle">Job Title (A-Z)</option>
          </select>
        </div>
      </div>

      {filteredQuestions.length > 0 ? (
        filteredQuestions.map((entry) => (
          <Card key={entry.id} className="mb-6">
            <CardContent className="p-4">
              <div className="flex justify-between mb-2">
                <h2 className="text-xl font-semibold text-gray-700">{entry.jobTitle}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {new Date(entry.timestamp.toDate()).toLocaleDateString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                    onClick={() => openDeleteConfirmation("section", entry.id, undefined, entry.jobTitle)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete section</span>
                  </Button>
                </div>
              </div>
              
              {/* Select All row */}
              <div className="flex items-center py-2 border-b border-gray-200 mb-2">
                <div className="flex items-center">
                  <Checkbox 
                    id={`select-all-${entry.id}`}
                    checked={getSelectAllState(entry) === "checked"}
                    className={`mr-2 ${getSelectAllState(entry) === "indeterminate" ? "bg-primary/50 text-primary-foreground" : ""}`}
                    onCheckedChange={(checked) => toggleAllQuestionsForJobTitle(entry, checked === true)}
                  />
                  <Label 
                    htmlFor={`select-all-${entry.id}`}
                    className="font-medium text-gray-600 cursor-pointer flex items-center"
                  >
                    {getSelectAllState(entry) === "indeterminate" && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full mr-2">Partial</span>
                    )}
                    Select All
                  </Label>
                </div>
              </div>
              
              {/* Questions list */}
              <div className="space-y-2 mt-3">
                {entry.questions.map((q, index) => (
                  <div key={index} className="flex items-start group">
                    <Checkbox 
                      id={`q-${entry.id}-${index}`}
                      checked={isQuestionSelected(entry.id, index)}
                      onCheckedChange={() => toggleQuestionSelection(entry, index)}
                      className="mt-1 mr-2"
                    />
                    <Label 
                      htmlFor={`q-${entry.id}-${index}`}
                      className={`${isQuestionSelected(entry.id, index) ? 'text-primary font-medium' : ''} cursor-pointer flex-grow`}
                    >
                      {q}
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/90 hover:bg-destructive/10 transition-opacity"
                      onClick={() => openDeleteConfirmation("question", entry.id, index)}
                    >
                      <XCircle className="h-4 w-4" />
                      <span className="sr-only">Delete question</span>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Alert variant="default" className="bg-muted">
          <AlertDescription className="text-center">
            {savedQuestions.length > 0 
              ? "No questions match your filters."
              : "No saved questions yet."
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Custom Confirmation Dialog */}
      {confirmation.state.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-2">{confirmation.state.title}</h3>
            <p className="text-gray-600 mb-6">{confirmation.state.description}</p>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={confirmation.handleCancel}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => confirmation.state.onConfirm && confirmation.state.onConfirm()}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}