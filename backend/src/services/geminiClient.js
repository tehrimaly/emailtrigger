import { GoogleGenAI } from '@google/genai';

let client = null;

export function getGeminiClient() {
  if (client) return client;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Missing GEMINI_API_KEY. Get a free key at https://aistudio.google.com/app/apikey and add it to backend/.env'
    );
  }

  client = new GoogleGenAI({ apiKey });
  return client;
}

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
