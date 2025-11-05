'use server';

import { doc, updateDoc } from 'firebase/firestore';
import { generateDietPlan } from '@/ai/flows/generate-diet-plan';
import { generateWorkoutPlan } from '@/ai/flows/generate-workout-plan';
import { firestore } from '@/firebase/server-app';

type PlanGenerationInput = {
  age: number;
  gender: 'male' | 'female';
  weight: number;
  height: number;
  goal: 'weight loss' | 'muscle gain';
};

/**
 * Generates diet and workout plans using AI and saves them to the user's Firestore document.
 * This is a "fire-and-forget" function from the client's perspective.
 * @param userId The UID of the user.
 * @param input The user's profile data for plan generation.
 */
export async function generatePlansForUser(userId: string, input: PlanGenerationInput) {
  try {
    console.log(`Starting plan generation for user: ${userId}`);

    // Generate both plans in parallel to save time.
    const [dietPlanResult, workoutPlanResult] = await Promise.allSettled([
      generateDietPlan(input),
      generateWorkoutPlan(input),
    ]);

    // Check the results of the promises.
    if (dietPlanResult.status === 'rejected') {
      console.error(`Diet plan generation failed for user ${userId}:`, dietPlanResult.reason);
      throw new Error('Failed to generate diet plan.');
    }
    if (workoutPlanResult.status === 'rejected') {
      console.error(`Workout plan generation failed for user ${userId}:`, workoutPlanResult.reason);
      throw new Error('Failed to generate workout plan.');
    }

    const dietPlan = dietPlanResult.value;
    const workoutPlan = workoutPlanResult.value;

    const userDocRef = doc(firestore, 'users', userId);

    // Update the user's document with the generated plans.
    await updateDoc(userDocRef, {
      dietPlan: dietPlan,
      workoutPlan: workoutPlan,
    });

    console.log(`Successfully generated and saved plans for user: ${userId}`);
    return { success: true };
  } catch (error) {
    console.error(`An error occurred in generatePlansForUser for user ${userId}:`, error);
    // Even if it fails, we don't want to block the client.
    // The error is logged on the server for debugging.
    return { success: false, error: (error as Error).message };
  }
}
