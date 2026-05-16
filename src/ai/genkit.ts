import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Initialize Genkit with Google AI plugin and optimized configuration
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});

// Configuration for AI requests
export const aiConfig = {
  maxOutputTokens: parseInt(process.env.NEXT_PUBLIC_AI_MAX_OUTPUT_TOKENS || '2000'),
  temperature: parseFloat(process.env.NEXT_PUBLIC_AI_TEMPERATURE || '0.7'),
  timeout: parseInt(process.env.NEXT_PUBLIC_AI_REQUEST_TIMEOUT || '30000'),
  maxRetries: parseInt(process.env.NEXT_PUBLIC_AI_MAX_RETRIES || '3'),
};
