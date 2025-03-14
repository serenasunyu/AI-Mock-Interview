import { useState } from "react";
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
import { useRef } from "react";

interface Question {
  id: number;
  text: string;
}

export default function InterviewQuestionsGenerator() {
  const [jobTitle, setJobTitle] = useState<string>("");
  const [experienceLevel, setExperienceLevel] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [customType, setCustomType] = useState<string>("");
  const [industry, setIndustry] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(API_KEY);
  const { userId } = useAuth();
  const navigate = useNavigate(); 
  const isSaving = useRef(false);

  // Generate AI interview questions
  const generateQuestions = async () => {
    if (!jobTitle) return;

    setIsGenerating(true);

    // const prompt = `Generate interview questions for a ${jobTitle} at ${experienceLevel || "any"} level in the ${industry || "general"} industry.`;
    const prompt = `Generate 10 interview questions based on the ${type} for a ${jobTitle} at ${
      experienceLevel || "any"
    } level in the ${
      industry || "general"
    } industry. Only output the 10 questions as a numbered list without any additional text.`;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const response = await model.generateContent(prompt);

      // Extract AI response text
      const text = await response.response.text();
      const generatedQuestions = text
        .split("\n")
        .filter((q) => q.trim())
        .map((q, index) => ({
          id: index + 1,
          text: q.replace(/^\d+\.\s*/, "").trim(),
        }));

      setQuestions(generatedQuestions);
      // setIsGenerating(false);

      // Save generated questions to Firebase
      // const docRef = await addDoc(collection(db, "interviewQuestions"), {
      //   jobTitle,
      //   experienceLevel,
      //   type: type === "others" ? customType : type,
      //   industry,
      //   questions: generatedQuestions.map((q) => q.text),
      //   timestamp: Timestamp.now(),
      // });

      // console.log("Questions saved to Firebase: ", docRef.id);
    } catch (error) {
      console.error("Error generating questions: ", error);
      setIsGenerating(false);
    }
  };

  // Delete a question by index
  const deleteQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  // Generate 10 more questions
  const generateMoreQuestions = async () => {
    await generateQuestions();
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
        questions: questions.map((q) => q.text),
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
              <Label htmlFor="job-title">Job title</Label>
              <Input
                id="job-title"
                placeholder="Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="mt-1 placeholder:text-sm"
              />
            </div>

            <div>
              <Label htmlFor="experience-level">Experience level</Label>
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
          </div>

          <Button
            className="w-full mt-6 py-6 text-lg bg-violet-600 hover:bg-violet-700"
            onClick={generateQuestions}
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
          {questions.length > 0 ? (
            <ul className="space-y-4">
              {questions.map((question, index) => (
                <li key={question.id} className="p-4 bg-gray-50 rounded-md flex justify-between items-center">
                  {question.text}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteQuestion(index)}
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
            <Button onClick={generateMoreQuestions} variant="outline">
              More
            </Button>
            {userId && (
              <Button onClick={saveQuestions} variant="default" className="bg-violet-500 hover:bg-violet-300">
                Save
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
