import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export interface GeminiFeedbackResponse {
  score: number;
  strengths: string[];
  improvements: string[];
  suggestedAnswer: string;
}

/**
 * Sends interview question and answer to Gemini API and returns structured feedback
 * 
 * @param question The interview question asked
 * @param answer The candidate's answer to the question
 * @returns Structured feedback with score, strengths, improvements, and suggested answer
 */
export async function getGeminiFeedback(
  question: string,
  answer: string
): Promise<GeminiFeedbackResponse> {
  try {
    // Get the Gemini flash model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create a prompt that instructs Gemini to analyze the interview answer
    const prompt = `
      You are an expert interview coach analyzing responses to job interview questions.
      
      Question: "${question}"
      
      Candidate's Answer: "${answer}"
      
      Please analyze this interview response and provide structured feedback in JSON format with the following fields:
      1. "score": A numerical score from 1-10 (with 10 being excellent)
      2. "strengths": An array of 2-3 specific strengths of the answer
      3. "improvements": An array of 2-3 specific suggestions for improvement
      4. "suggestedAnswer": A concise model answer that demonstrates an excellent response
      
      Provide only the JSON response, nothing else.
    `;

    // Call the Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract the JSON from the response
    // Sometimes the AI might include backticks or the word 'json' in its response
    const jsonString = text.replace(/```json|```/g, '').trim();
    
    // Parse the JSON response
    const parsedResponse = JSON.parse(jsonString) as GeminiFeedbackResponse;
    
    // Ensure the response meets expected structure
    return {
      score: Math.min(10, Math.max(1, parsedResponse.score)), // Ensure score is between 1-10
      strengths: parsedResponse.strengths.slice(0, 3), // Limit to 3 strengths
      improvements: parsedResponse.improvements.slice(0, 3), // Limit to 3 improvements
      suggestedAnswer: parsedResponse.suggestedAnswer,
    };
  } catch (error) {
    console.error("Error getting feedback from Gemini:", error);
    
    // Return a fallback response in case of error
    return {
      score: 5,
      strengths: [
        "The candidate attempted to address the question",
        "Basic communication skills were demonstrated"
      ],
      improvements: [
        "Provide more specific examples",
        "Structure the answer more clearly",
        "Focus more directly on addressing the question asked"
      ],
      suggestedAnswer: "We couldn't generate a suggested answer at this time. Please try again later."
    };
  }
}