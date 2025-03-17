import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import AIQuestionsSection from "@/components/AIQuestionsSection";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "@/config/firebase.config";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

interface Question {
  id: number;
  text: string;
}

export default function InterviewQuestionsGenerator() {
  const [jobTitle, setJobTitle] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [experienceLevel, setExperienceLevel] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [customType, setCustomType] = useState<string>("");
  const [industry, setIndustry] = useState<string>("");
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [displayedQuestions, setDisplayedQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const questionsPerPage = 10;

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(API_KEY);
  const { userId } = useAuth();
  const navigate = useNavigate(); 
  const isSaving = useRef(false);

  // Generate AI interview questions
  const generateQuestions = async (shouldAppend = false) => {
    if (!jobTitle) return;

    setIsGenerating(true);

    const prompt = `Generate 10 interview questions based on the ${type} for a ${jobTitle} at ${
      experienceLevel || "any"
    } level in the ${industry || "general"} industry.${
      jobDescription ? ` Consider the following job description: "${jobDescription}".` : ""
    } Only output the 10 questions as a numbered list without any additional text.`;    

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const response = await model.generateContent(prompt);

      // Extract AI response text
      const text = await response.response.text();
      const generatedQuestions = text
        .split("\n")
        .filter((q) => q.trim())
        .map((q, index) => ({
          id: Date.now() + index, // Use timestamp + index for unique IDs
          text: q.replace(/^\d+\.\s*/, "").trim(),
        }));

      if (shouldAppend) {
        // Append new questions to existing ones
        const updatedQuestions = [...allQuestions, ...generatedQuestions];
        setAllQuestions(updatedQuestions);
        
        // Update displayed questions
        updateDisplayedQuestions(updatedQuestions, currentPage);
      } else {
        // Replace with new questions
        setAllQuestions(generatedQuestions);
        setDisplayedQuestions(generatedQuestions.slice(0, questionsPerPage));
        setCurrentPage(1);
      }
      
      setIsGenerating(false);
    } catch (error) {
      console.error("Error generating questions: ", error);
      setIsGenerating(false);
    }
  };

  // Update which questions are displayed based on current page
  const updateDisplayedQuestions = (questions: Question[], page: number) => {
    const startIndex = 0;
    const endIndex = page * questionsPerPage;
    setDisplayedQuestions(questions.slice(startIndex, endIndex));
  };

  // Load more questions (show next page)
  const loadMoreQuestions = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    updateDisplayedQuestions(allQuestions, nextPage);
  };

  // Delete a question by index
  const deleteQuestion = (id: number) => {
    const updatedQuestions = allQuestions.filter(q => q.id !== id);
    setAllQuestions(updatedQuestions);
    updateDisplayedQuestions(updatedQuestions, currentPage);
  };

  // Generate 10 more questions
  const generateMoreQuestions = async () => {
    await generateQuestions(true); // Pass true to append instead of replace
  };

  // Save questions for later
  const saveQuestions = async () => {
    if (isSaving.current) return; // Prevent duplicate saves

    isSaving.current = true; // Set flag to prevent duplicate submissions
    try {
      const docRef = await addDoc(collection(db, "interviewQuestions"), {
        jobTitle,
        experienceLevel,
        type: type === "others" ? customType : type,
        industry,
        questions: allQuestions.map((q) => q.text),
        timestamp: Timestamp.now(),
        userId,
      });
      alert("Questions saved successfully!");
      console.log("Questions saved with ID:", docRef.id);
      navigate("/questionlist");
    } catch (error) {
      console.error("Error saving questions: ", error);
    } finally {
      isSaving.current = false; // Reset flag after save completes
    }
  };

  // Check if there are more questions to load
  const hasMoreQuestionsToLoad = allQuestions.length > currentPage * questionsPerPage;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-violet-800 mb-2">
          Free AI Interview Questions Generator ✨
        </h1>
        <p className="text-lg text-gray-700">
          Get tailored interview questions for any job, skill level, or industry
          in seconds.
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="job-title">Job Title</Label>
              <Input
                id="job-title"
                placeholder="Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="mt-1 placeholder:text-sm"
              />
            </div>

            <div>
              <Label htmlFor="experience-level">Experience Level</Label>
              <Select
                value={experienceLevel || ""}
                onValueChange={setExperienceLevel}
              >
                <SelectTrigger id="experience-level" className="mt-1">
                  <SelectValue placeholder="Select Experience Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry-level">Entry-level</SelectItem>
                  <SelectItem value="mid-level">Mid-level</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type-of-interview">Type of Interview</Label>
              <Select value={type} onValueChange={(value) => setType(value)}>
                <SelectTrigger id="type-of-interview" className="mt-1">
                  <SelectValue placeholder="Select a Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone-screening">
                    Phone Screening
                  </SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="behavioural">Behavioural</SelectItem>
                  <SelectItem value="case-study">Case Study</SelectItem>
                  <SelectItem value="others">Others</SelectItem>
                </SelectContent>
              </Select>

              {type === "others" && (
                <div className="mt-2">
                  <Input
                    id="custom-type"
                    placeholder="Enter interview type"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="industry">Industry (optional)</Label>
              <Input
                id="industry"
                placeholder="Software & Technology"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="mt-1 placeholder:text-sm"
              />
            </div>

            <div>
              <Label htmlFor="job-title">Job description (optional)</Label>
              <textarea
                id="job-description"
                placeholder="Job description..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="mt-1 placeholder:text-sm border w-full pl-2 pt-2"
              />
            </div>
          </div>

          <Button
            className="w-full mt-6 py-6 text-lg bg-violet-600 hover:bg-violet-700"
            onClick={() => generateQuestions(false)}
            disabled={isGenerating || !jobTitle}
          >
            {isGenerating ? "Generating..." : "Generate interview questions"}
          </Button>
        </CardContent>
      </Card>

      {/* Display AI generated questions */}
      <Card>
        <CardHeader>
          <CardTitle>Your interview questions</CardTitle>
        </CardHeader>
        <CardContent>
          {displayedQuestions.length > 0 ? (
            <ul className="space-y-4">
              {displayedQuestions.map((question) => (
                <li key={question.id} className="p-4 bg-gray-50 rounded-md flex justify-between items-center">
                  {question.text}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteQuestion(question.id)}
                    className="text-red-500 text-right ml-auto"
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center text-gray-500 py-32">
              Your interview questions will appear here
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-between mt-4">
            {displayedQuestions.length > 0 && (
              <Button 
                onClick={generateMoreQuestions} 
                variant="outline"
                disabled={isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate More"}
              </Button>
            )}
            
            {hasMoreQuestionsToLoad && (
              <Button 
                onClick={loadMoreQuestions} 
                variant="outline"
                className="text-blue-600"
              >
                Load More Questions
              </Button>
            )}
            
            {userId && displayedQuestions.length > 0 && (
              <Button 
                onClick={saveQuestions} 
                variant="default" 
                className="bg-violet-500 hover:bg-violet-300"
              >
                Save
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}