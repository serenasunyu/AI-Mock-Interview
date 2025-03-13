import { useState } from "react";
import { Button } from "@/components/ui/button";

const AIQuestionsSection = () => {
  const [questions, setQuestions] = useState<string[]>([
    "Tell me about yourself.",
    "What are your strengths and weaknesses?",
    "Why do you want to work here?",
    "Describe a challenge you faced and how you handled it.",
    "Where do you see yourself in 5 years?",
    "Why should we hire you?",
    "Tell me about a time you worked in a team.",
    "Describe a situation where you had to meet a tight deadline.",
    "What motivates you?",
    "Do you have any questions for us?",
  ]);

  // Delete a question by index
  const deleteQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  // Generate 10 more questions (replace with real API call)
  const generateMoreQuestions = () => {
    const newQuestions = [
      "What do you know about our company?",
      "How do you handle conflict at work?",
      "What is your greatest achievement?",
      "Describe your ideal work environment.",
      "Tell me about a time you failed and what you learned.",
      "How do you handle criticism?",
      "What do you do in your free time?",
      "Describe a project you're proud of.",
      "Tell me about a time you showed leadership.",
      "What do you think makes a good team player?",
    ];
    setQuestions((prev) => [...prev, ...newQuestions]);
  };

  // Save questions for later (replace with actual API request)
  const saveQuestions = () => {
    console.log("Saving questions:", questions);
    alert("Questions saved successfully!");
  };

  return (
    <div className="border rounded-lg p-4 shadow-md bg-white">
      <h2 className="font-bold text-lg mb-2">Your Interview Questions</h2>

      {/* Display Questions */}
      <div className="space-y-2">
        {questions.length > 0 ? (
          questions.map((question, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-2 border-b last:border-b-0"
            >
              <span className="text-gray-700">{question}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteQuestion(index)}
                className="text-red-500"
              >
                Delete
              </Button>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-center">
            Your interview questions will appear here
          </p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex justify-between mt-4">
        <Button onClick={generateMoreQuestions} variant="outline">
          More
        </Button>
        <Button onClick={saveQuestions} variant="default">
          Save
        </Button>
      </div>
    </div>
  );
};

export default AIQuestionsSection;
