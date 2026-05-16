import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

export const generateFollowUpQuestion = async (complaintText) => {
  const prompt = `A user submitted the following complaint: "${complaintText}". Please generate exactly one short, relevant follow-up question to gather more details. Return only the question.`;
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
};
