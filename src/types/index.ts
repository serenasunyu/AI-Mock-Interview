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