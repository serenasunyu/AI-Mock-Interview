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
import AIQuestionsSection from "@/components/AIQuestionsSection";

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

  // Mock function to simulate generating questions
  const generateQuestions = () => {
    setIsGenerating(true);

    // Example mock questions for a Software Engineer role
    setTimeout(() => {
      const generatedQuestions: Question[] = [
        {
          id: 1,
          text: "Can you explain the difference between let, const, and var in JavaScript?",
        },
        {
          id: 2,
          text: "What experience do you have with version control systems like Git?",
        },
        {
          id: 3,
          text: "Describe a challenging bug you encountered and how you solved it.",
        },
        {
          id: 4,
          text: "How do you approach learning new technologies or frameworks?",
        },
        {
          id: 5,
          text: "What is your experience with agile development methodologies?",
        },
        {
          id: 6,
          text: "Can you walk me through your process for testing your code?",
        },
        {
          id: 7,
          text: "How do you stay up-to-date with the latest trends in software development?",
        },
      ];

      setQuestions(generatedQuestions);
      setIsGenerating(false);
    }, 1500);
  };

  // const downloadQuestions = () => {
  //   // Create a text version of the questions
  //   const questionsText = questions
  //     .map((q, index) => `${index + 1}. ${q.text}`)
  //     .join("\n\n");

  //   const jobInfo =
  //     `Interview Questions for ${jobTitle} (${experienceLevel})\n` +
  //     `Industry: ${industry || "Not specified"}\n\n`;

  //   const content = jobInfo + questionsText;

  //   // Create a blob and download link
  //   const blob = new Blob([content], { type: "text/plain" });
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement("a");
  //   a.href = url;
  //   a.download = `${jobTitle
  //     .toLowerCase()
  //     .replace(/\s+/g, "-")}-interview-questions.txt`;
  //   document.body.appendChild(a);
  //   a.click();
  //   document.body.removeChild(a);
  //   URL.revokeObjectURL(url);
  // };

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
                  {/* <Label htmlFor="custom-type" className="mb-2">Other Type</Label> */}
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

      {questions.length > 0 ? (
        <AIQuestionsSection />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your interview questions</CardTitle>
          </CardHeader>
          <CardContent>
            {questions.length > 0 ? (
              <ul className="space-y-4">
                {questions.map((question) => (
                  <li key={question.id} className="p-4 bg-gray-50 rounded-md">
                    {question.text}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-gray-500 py-32">
                Your interview questions will appear here
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* {questions.length > 0 && (
        <div className="mt-6 text-center">
          <Button
            onClick={downloadQuestions}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Download Questions
          </Button>
        </div>
      )} */}
      {/* <div className="mt-6 text-center">
        <Button 
          onClick={downloadQuestions}
          className="w-full mt-6 py-6 text-lg bg-violet-600 hover:bg-violet-700"
          disabled={questions.length === 0}
        >
          Download Questions
        </Button>
      </div> */}
    </div>
  );
}
