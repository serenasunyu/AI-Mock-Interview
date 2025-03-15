import { GoogleGenerativeAI } from "@google/generative-ai";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
export const genAI = new GoogleGenerativeAI(API_KEY);
