
'use server';

import { revalidatePath } from 'next/cache';
import { generateDietPlan } from '@/ai/flows/generate-diet-plan';
import { generateWorkoutPlan } from '@/ai/flows/generate-workout-plan';
import { updateUserProfile } from './firebase/firestore';
import type { UserProfile } from './definitions';
import { type ProfileUpdateData } from './schema';

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
        
        // Revalidate paths after plans are updated
        revalidatePath('/profile');
        revalidatePath('/diet-plan');
        revalidatePath('/workout-plan');

    } catch (error) {
        console.error(`Ошибка при генерации планов для пользователя ${userId}:`, error);
    }
}


export async function updateUserAndGeneratePlans(userId: string, profile: UserProfile, data: ProfileUpdateData) {
    try {
        const aiInput = {
            age: profile.age,
            gender: profile.gender,
            weight: data.weight,
            height: data.height,
            goal: data.goal,
        };

        const updatedProfileData: Partial<UserProfile> = {
            weight: data.weight,
            height: data.height,
            goal: data.goal,
        };
        
        await updateUserProfile(userId, updatedProfileData);
        
        // We don't await this so the UI can update faster.
        generateAndSavePlans(userId, aiInput);

        revalidatePath('/profile');

        return { success: true };
    } catch (error) {
        console.error('Ошибка обновления профиля:', error);
        return { success: false, error: 'Не удалось обновить профиль и сгенерировать новые планы.' };
    }
}
