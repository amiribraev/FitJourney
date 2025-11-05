
'use server';

import { revalidatePath } from 'next/cache';
import { generateDietPlan } from '@/ai/flows/generate-diet-plan';
import { generateWorkoutPlan } from '@/ai/flows/generate-workout-plan';
import { createUserProfile, updateUserProfile } from './firebase/firestore';
import type { UserProfile } from './definitions';
import { type ProfileUpdateData } from './schema';

// Helper function to run plan generation in the background
async function generateAndSavePlans(userId: string, aiInput: { age: number, gender: 'male' | 'female', weight: number, height: number, goal: 'weight loss' | 'muscle gain' }) {
    try {
        console.log(`Начало генерации планов для пользователя ${userId}`);
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
        
        // Revalidate paths after plans are updated to show new data
        revalidatePath('/profile');
        revalidatePath('/diet-plan');
        revalidatePath('/workout-plan');

    } catch (error) {
        console.error(`Ошибка при генерации планов для пользователя ${userId}:`, error);
        // We don't throw here to avoid crashing the whole process if plan generation fails.
        // The user profile is already created.
    }
}

export async function completeRegistration(userData: Omit<UserProfile, 'dietPlan' | 'workoutPlan' | 'createdAt'>) {
    try {
        await createUserProfile(userData.uid, {
            ...userData,
            createdAt: new Date().toISOString(),
        });
        
        // Non-blocking call to generate plans in the background
        generateAndSavePlans(userData.uid, {
            age: userData.age,
            gender: userData.gender,
            weight: userData.weight,
            height: userData.height,
            goal: userData.goal,
        });

        revalidatePath('/profile');
        return { success: true };

    } catch (error) {
        console.error('Ошибка при создании профиля пользователя:', error);
        return { success: false, error: 'Не удалось создать профиль пользователя.' };
    }
}


export async function updateUserAndGeneratePlans(userId: string, profile: UserProfile, data: ProfileUpdateData) {
    try {
        const updatedProfileData: Partial<UserProfile> = {
            weight: data.weight,
            height: data.height,
            goal: data.goal,
        };
        
        // First, update the user's core profile data.
        await updateUserProfile(userId, updatedProfileData);
        
        const aiInput = {
            age: profile.age, // age and gender don't change
            gender: profile.gender,
            weight: data.weight, // use new weight
            height: data.height, // use new height
            goal: data.goal,     // use new goal
        };

        // We don't await this so the UI can update faster.
        // This will generate and save plans in the background.
        generateAndSavePlans(userId, aiInput);

        // Revalidate profile page immediately to show new weight/height/goal
        revalidatePath('/profile');

        return { success: true };
    } catch (error) {
        console.error('Ошибка обновления профиля:', error);
        return { success: false, error: 'Не удалось обновить профиль и сгенерировать новые планы.' };
    }
}

