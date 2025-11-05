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
  createdAt: string; 
};
