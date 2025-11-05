'use server';

/**
 * @fileOverview A workout plan generation AI agent.
 * 
 * - generateWorkoutPlan - A function that handles the workout plan generation process.
 * - GenerateWorkoutPlanInput - The input type for the generateWorkoutPlan function.
 * - GenerateWorkoutPlanOutput - The return type for the generateWorkoutPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWorkoutPlanInputSchema = z.object({
  age: z.number().describe('The age of the user.'),
  gender: z.enum(['male', 'female']).describe('The gender of the user.'),
  weight: z.number().describe('The weight of the user in kilograms.'),
  height: z.number().describe('The height of the user in centimeters.'),
  goal: z.enum(['weight loss', 'muscle gain']).describe('The fitness goal of the user.'),
});
export type GenerateWorkoutPlanInput = z.infer<typeof GenerateWorkoutPlanInputSchema>;

const GenerateWorkoutPlanOutputSchema = z.object({
  weeklyWorkoutPlan: z.record(z.string(), z.array(z.string())).describe('A weekly workout plan, with days of the week as keys and an array of exercises as values.'),
});
export type GenerateWorkoutPlanOutput = z.infer<typeof GenerateWorkoutPlanOutputSchema>;

export async function generateWorkoutPlan(input: GenerateWorkoutPlanInput): Promise<GenerateWorkoutPlanOutput> {
  return generateWorkoutPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWorkoutPlanPrompt',
  input: {schema: GenerateWorkoutPlanInputSchema},
  output: {schema: GenerateWorkoutPlanOutputSchema},
  prompt: `You are a personal trainer who creates weekly workout plans based on the user's information.

  User Information:
  Age: {{{age}}}
  Gender: {{{gender}}}
  Weight: {{{weight}}} kg
  Height: {{{height}}} cm
  Goal: {{{goal}}}

  Create a weekly workout plan that is tailored to the user's goal. The workout plan should include the day of the week and a list of exercises for that day.

  The workout plan should be structured as a JSON object where each day of the week (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday) is a key, and the value is an array of exercises for that day.

  For weight loss, focus on cardio and full body workouts with moderate weight.
  For muscle gain, focus on compound exercises with heavy weight and lower reps.

  Example:
  {
    "Monday": ["30 minutes of jogging", "Full body circuit training"],
    "Tuesday": ["Rest"],
    "Wednesday": ["30 minutes of swimming", "Strength training"],
    "Thursday": ["Rest"],
    "Friday": ["30 minutes of cycling", "Full body circuit training"],
    "Saturday": ["Rest"],
    "Sunday": ["Yoga"]
  }
  `,
});

const generateWorkoutPlanFlow = ai.defineFlow(
  {
    name: 'generateWorkoutPlanFlow',
    inputSchema: GenerateWorkoutPlanInputSchema,
    outputSchema: GenerateWorkoutPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
