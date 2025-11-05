'use server';

import { revalidatePath } from 'next/cache';
import { generateDietPlan } from '@/ai/flows/generate-diet-plan';
import { generateWorkoutPlan } from '@/ai/flows/generate-workout-plan';
import { createUserProfile, getUserProfile, updateUserProfile } from './firebase/firestore';
import type { UserProfile } from './definitions';
import { RegistrationSchema } from './schema';

export async function completeRegistration(userId: string, data: unknown) {
  const validationResult = RegistrationSchema.safeParse(data);

  if (!validationResult.success) {
    return { success: false, error: 'Invalid data provided.' };
  }

  const { name, email, age, gender, weight, height, goal } = validationResult.data;

  try {
    const aiInput = { age, gender, weight, height, goal };

    // Generate plans in parallel
    const [dietPlanResult, workoutPlanResult] = await Promise.all([
      generateDietPlan(aiInput),
      generateWorkoutPlan(aiInput),
    ]);

    const userProfileData: Omit<UserProfile, 'createdAt'> = {
      uid: userId,
      email,
      name,
      age,
      gender,
      weight,
      height,
      goal,
      dietPlan: dietPlanResult,
      workoutPlan: workoutPlanResult,
    };

    await createUserProfile(userId, userProfileData);

    revalidatePath('/profile');
    revalidatePath('/diet-plan');
    revalidatePath('/workout-plan');

    return { success: true, data: userProfileData };
  } catch (error) {
    console.error('Registration completion error:', error);
    return { success: false, error: 'Failed to generate plans or save profile.' };
  }
}

export async function updateUserAndGeneratePlans(userId: string, data: { weight: number; height: number; goal: 'weight loss' | 'muscle gain' }) {
    try {
        const existingProfile = await getUserProfile(userId);
        if (!existingProfile) {
            return { success: false, error: 'User profile not found.' };
        }

        const aiInput = {
            age: existingProfile.age,
            gender: existingProfile.gender,
            weight: data.weight,
            height: data.height,
            goal: data.goal,
        };

        const [dietPlanResult, workoutPlanResult] = await Promise.all([
            generateDietPlan(aiInput),
            generateWorkoutPlan(aiInput),
        ]);

        const updatedData: Partial<UserProfile> = {
            weight: data.weight,
            height: data.height,
            goal: data.goal,
            dietPlan: dietPlanResult,
            workoutPlan: workoutPlanResult,
        };

        await updateUserProfile(userId, updatedData);

        revalidatePath('/profile');
        revalidatePath('/diet-plan');
        revalidatePath('/workout-plan');

        return { success: true, data: updatedData };
    } catch (error) {
        console.error('Profile update error:', error);
        return { success: false, error: 'Failed to update profile and generate new plans.' };
    }
}
