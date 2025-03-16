import { useEffect, useState, useRef } from "react";
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/config/firebase.config";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
      alert("Please select at least one question for your mock interview.");
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
      alert("Please provide both a job title and a question.");
      return;
    }

    // Add the new question to Firestore
    const newQuestions = [...savedQuestions];
    const existingJobTitle = newQuestions.find(item => item.jobTitle === newJobTitle);

    if (existingJobTitle) {
      existingJobTitle.questions.push(newQuestion); // Add the question to an existing job title
    } else {
      newQuestions.push({
        id: new Date().toISOString(),
        jobTitle: newJobTitle,
        questions: [newQuestion],
        timestamp: Timestamp.now(),
      });
    }

    setSavedQuestions(newQuestions);

    // Add to Firestore
    await addDoc(collection(db, "interviewQuestions"), {
      jobTitle: newJobTitle,
      questions: [newQuestion],
      timestamp: Timestamp.now(),
    });

    // Clear inputs after submission
    setNewQuestion("");
    setNewJobTitle("");
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-6">
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
          <Button onClick={handleAddQuestion} className="bg-violet-500">
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
            className="bg-violet-500"
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
                <span className="text-sm text-gray-500 self-center">
                  {new Date(entry.timestamp.toDate()).toLocaleDateString()}
                </span>
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
                  <div key={index} className="flex items-start">
                    <Checkbox 
                      id={`q-${entry.id}-${index}`}
                      checked={isQuestionSelected(entry.id, index)}
                      onCheckedChange={() => toggleQuestionSelection(entry, index)}
                      className="mt-1 mr-2"
                    />
                    <Label 
                      htmlFor={`q-${entry.id}-${index}`}
                      className={`${isQuestionSelected(entry.id, index) ? 'text-primary font-medium' : ''} cursor-pointer`}
                    >
                      {q}
                    </Label>
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
    </div>
  );
}