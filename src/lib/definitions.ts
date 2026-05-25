import type { GenerateDietPlanOutput } from "@/ai/flows/generate-diet-plan";
import type { GenerateWorkoutPlanOutput } from "@/ai/flows/generate-workout-plan";

export type UserProfile = {
  uid: string;
  email: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  weight: number;
  height: number;
  goal: 'weight loss' | 'muscle gain';
  dietPlan?: GenerateDietPlanOutput;
  workoutPlan?: GenerateWorkoutPlanOutput;
  language?: 'ru' | 'kk' | 'en';
  createdAt: string; 
};

export type ProgressLog = {
  id: string; // YYYY-MM-DD
  userId: string;
  date: string; // ISO string
  caloriesConsumed: number;
  workoutCompleted?: boolean;
};
