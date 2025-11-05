
'use server';

import { revalidatePath } from 'next/cache';
import { generateDietPlan } from '@/ai/flows/generate-diet-plan';
import { generateWorkoutPlan } from '@/ai/flows/generate-workout-plan';
import { createUserProfile, getUserProfile, updateUserProfile } from './firebase/firestore';
import type { UserProfile } from './definitions';
import { RegistrationSchema, type ProfileUpdateData, type RegistrationData } from './schema';


export async function completeRegistration(userId: string, data: RegistrationData) {
  const validationResult = RegistrationSchema.safeParse(data);

  if (!validationResult.success) {
    console.error('Registration validation failed:', validationResult.error.flatten());
    return { success: false, error: 'Предоставлены неверные данные.' };
  }

  const { name, email, age, gender, weight, height, goal } = validationResult.data;

  try {
    const userProfileData: Omit<UserProfile, 'dietPlan' | 'workoutPlan'> = {
      uid: userId,
      email,
      name,
      age,
      gender,
      weight,
      height,
      goal,
      createdAt: new Date().toISOString(),
    };
    
    await createUserProfile(userId, userProfileData);
    
    // We don't await this so the registration can complete faster.
    generateAndSavePlans(userId, { age, gender, weight, height, goal }).then(() => {
        revalidatePath('/profile');
        revalidatePath('/diet-plan');
        revalidatePath('/workout-plan');
    });

    return { success: true };

  } catch (error: any) {
    console.error('Ошибка завершения регистрации:', error.message);
    return { success: false, error: 'Не удалось создать профиль пользователя.' };
  }
}

// Helper function to run plan generation in the background
async function generateAndSavePlans(userId: string, aiInput: { age: number, gender: 'male' | 'female', weight: number, height: number, goal: 'weight loss' | 'muscle gain' }) {
    try {
        const [dietPlanResult, workoutPlanResult] = await Promise.all([
            generateDietPlan(aiInput),
            generateWorkoutPlan(aiInput),
        ]);

        const plansData: Partial<UserProfile> = {
            dietPlan: dietPlanResult,
            workoutPlan: workoutPlanResult,
        };

        await updateUserProfile(userId, plansData);
        console.log(`Планы для пользователя ${userId} успешно созданы и сохранены.`);
    } catch (error) {
        console.error(`Ошибка при генерации планов для пользователя ${userId}:`, error);
    }
}


export async function updateUserAndGeneratePlans(userId: string, data: ProfileUpdateData) {
    try {
        const existingProfile = await getUserProfile(userId);
        if (!existingProfile) {
            return { success: false, error: 'Профиль пользователя не найден.' };
        }

        const aiInput = {
            age: existingProfile.age,
            gender: existingProfile.gender,
            weight: data.weight,
            height: data.height,
            goal: data.goal,
        };

        // Update profile and generate plans in parallel
        const [dietPlanResult, workoutPlanResult, _] = await Promise.all([
            generateDietPlan(aiInput),
            generateWorkoutPlan(aiInput),
            updateUserProfile(userId, {
                weight: data.weight,
                height: data.height,
                goal: data.goal,
            })
        ]);

        await updateUserProfile(userId, {
            dietPlan: dietPlanResult,
            workoutPlan: workoutPlanResult,
        });

        revalidatePath('/profile');
        revalidatePath('/diet-plan');
        revalidatePath('/workout-plan');

        return { success: true };
    } catch (error) {
        console.error('Ошибка обновления профиля:', error);
        return { success: false, error: 'Не удалось обновить профиль и сгенерировать новые планы.' };
    }
}
