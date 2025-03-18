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
  strengths: string[]; 
  improvements: string[];
  score: number;
  preferredAnswer?: string; // Added preferred answer field
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Build the appropriate prompt based on whether this is overall feedback or specific question feedback
    let prompt = "";
    
    if (request.overall && request.items) {
      // Create a prompt for overall interview performance
      const questionsAndAnswers = request.items.map((item, index) => 
        `Question ${index + 1}: ${item.question}\nAnswer: ${item.transcript}\n`
      ).join('\n');
      
      prompt = `
           Please provide a brief overall feedback for a mock interview for a ${request.jobTitle} position.
            
            Here are the questions and answers:
            
            ${questionsAndAnswers}
            
            Summarize the candidate's performance in 3-4 sentences, highlighting key strengths and areas for improvement.
            Keep the response concise and to the point.
            `;
                
      // For overall feedback, return with empty arrays for strengths/improvements and 0 for score
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
      prompt = `
            Question: "${request.question}"
            User Response: "${request.transcript}"
            Interview Context: "${request.jobTitle}"
            
            Please analyze the user's response for this mock interview question. 
            Ensure the answer does not include asterisks (*) or unnecessary symbols.

            Format your response exactly as follows:
            
            Feedback: A brief overall assessment of the response.
            
            Strengths:
            • [First strength]
            • [Second strength]
            • [Optional third strength]
            
            Improvements:
            • [First area for improvement with actionable suggestion]
            • [Second area for improvement with actionable suggestion]
            • [Optional third area for improvement]
            
            Preferred Answer:
            [Write a model answer that would be considered excellent for this interview question. Keep it concise but comprehensive, demonstrating key points that should be addressed.]
            
            Score: [number between 1-10]

            Ensure the feedback is constructive and specific to help the user refine their interview skills.
            `;
            
      // Generate content using Gemini
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      // Process the response for specific question feedback with improved parsing
      const feedbackMatch = content.match(/Feedback:(.*?)(?=Strengths:|$)/s);
      const strengthsMatch = content.match(/Strengths:(.*?)(?=Improvements:|$)/s);
      const improvementsMatch = content.match(/Improvements:(.*?)(?=Preferred Answer:|$)/s);
      const preferredAnswerMatch = content.match(/Preferred Answer:(.*?)(?=Score:|$)/s);
      const scoreMatch = content.match(/Score:.*?(\d+)/);
      
      // Extract and clean the feedback text
      const feedback = feedbackMatch 
        ? feedbackMatch[1].trim() 
        : "No feedback provided.";
      
      // Function to parse bullet points
      const parseBulletPoints = (text: string | null): string[] => {
        if (!text) return [];
        
        return text
          .split('•')
          .map(item => item.replace(/\*/g, '').trim())
          .filter(item => item.length > 0);
      };
      
      const strengths = parseBulletPoints(strengthsMatch ? strengthsMatch[1] : null);
      const improvements = parseBulletPoints(improvementsMatch ? improvementsMatch[1] : null);
      const preferredAnswer = preferredAnswerMatch ? preferredAnswerMatch[1].trim() : "";
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
      
      return {
        feedback,
        strengths,
        improvements,
        score,
        preferredAnswer
      };
    } else {
      throw new Error('Invalid request parameters');
    }
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