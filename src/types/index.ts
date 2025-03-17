import { FieldValue, Timestamp } from "firebase/firestore";

// user data
export interface User {
    id: string;
    name: string;
    email: string;
    imageUrl: string;
    createdAt: Timestamp | FieldValue;
    updatedAt: Timestamp | FieldValue;
};

// edit interview page 
export interface Interview {
    id: string;
    position: string;
    description: string;
    experience: number;
    userId: string;
    techStack: string;
    questions: { question: string; answer: string } [];
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

// user answers
export interface UserAnswer {
    id: string;
    mockIdRef: string;
    question: string;
    correct_ans: string;
    user_ans: string;
    feedback: string;
    rating: number;
    userId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

// AI feedback
export interface FeedbackQuestion {
    question: string;
    answer: string;
    feedback: {
      score: number;
      strengths: string[];
      improvements: string[];
      suggestedAnswer: string;
    }
  };

  export interface TranscriptionSegment {
    speaker: "interviewer" | "candidate";
    text: string;
    startTime: number;
    endTime: number;
  };