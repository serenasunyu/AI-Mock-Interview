// lib/ai-service.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

// Define interface for the request to the AI service
interface AIFeedbackRequest {
  question?: string;
  transcript?: string;
  jobTitle?: string;
  overall?: boolean;
  items?: Array<{
    question: string;
    transcript: string;
    feedback: string;
    strengths: string[];
    improvements: string[];
    score: number;
  }>;
}

// Define interface for the response from the AI service
interface AIFeedbackResponse {
  feedback: string;
  strengths: string[]; // Non-optional to match FeedbackItem
  improvements: string[]; // Non-optional to match FeedbackItem
  score: number; // Non-optional to match FeedbackItem
}

// Function to generate feedback using Gemini AI
export async function generateAIFeedback(request: AIFeedbackRequest): Promise<AIFeedbackResponse> {
  try {
    // Initialize the Gemini API client using Vite environment variable format
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    if (!API_KEY) {
      throw new Error("Gemini API key is not defined");
    }
    
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Build the appropriate prompt based on whether this is overall feedback or specific question feedback
    let prompt = "";
    
    if (request.overall && request.items) {
      // Create a prompt for overall interview performance
      const questionsAndAnswers = request.items.map((item, index) => 
        `Question ${index + 1}: ${item.question}\nAnswer: ${item.transcript}\n`
      ).join('\n');
      
      prompt = `Please provide overall feedback for a mock interview for a ${request.jobTitle} position. 
                Here are all the questions and answers:
                
                ${questionsAndAnswers}
                
                Give comprehensive feedback on the entire interview performance, highlighting patterns, 
                overall strengths and weaknesses, and concrete suggestions for improvement.`;
                
      // For overall feedback, return with empty arrays for strengths/improvements and 0 for score
      // to match the non-optional type requirements
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      return {
        feedback: content,
        strengths: [],
        improvements: [],
        score: 0
      };
    } else if (request.question && request.transcript) {
      // Create a prompt for specific question feedback
      prompt = `Please evaluate this answer for a ${request.jobTitle} interview:
                
                Question: ${request.question}
                
                Answer: ${request.transcript}
                
                Provide detailed feedback on the response including:
                1. Overall assessment
                2. 2-3 specific strengths
                3. 2-3 areas for improvement with actionable suggestions
                4. A score from 1-10`;
    } else {
      throw new Error('Invalid request parameters');
    }

    // Generate content using Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();
    
    // Process the response for specific question feedback
    // This is simplified parsing - you might want more robust parsing logic
    const strengthsMatch = content.match(/Strengths:(.*?)(?=Areas for improvement:|$)/s);
    const improvementsMatch = content.match(/Areas for improvement:(.*?)(?=Score:|$)/s);
    const scoreMatch = content.match(/Score:.*?(\d+)/);
    
    const strengths = strengthsMatch 
      ? strengthsMatch[1].split(/\d+\./).filter(s => s.trim()).map(s => s.trim())
      : [];
    
    const improvements = improvementsMatch
      ? improvementsMatch[1].split(/\d+\./).filter(s => s.trim()).map(s => s.trim())
      : [];
    
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    
    return {
      feedback: content.split('Strengths:')[0].trim(),
      strengths: strengths,
      improvements: improvements,
      score: score
    };
    
  } catch (error) {
    console.error('Error generating AI feedback:', error);
    // Return default values to match the non-optional type requirements
    return {
      feedback: "Error generating feedback. Please try again.",
      strengths: [],
      improvements: [],
      score: 0
    };
  }
}