
'use server';

import { revalidatePath } from 'next/cache';
import { generateDietPlan } from '@/ai/flows/generate-diet-plan';
import { generateWorkoutPlan } from '@/ai/flows/generate-workout-plan';
import { getAuthenticatedAppForUser } from '@/lib/firebase/server-app';
import type { UserProfile } from './definitions';
import { type ProfileUpdateData } from './schema';


// This function now runs on the server and is self-contained.
async function generateAndSavePlans(userId: string, aiInput: { age: number, gender: 'male' | 'female', weight: number, height: number, goal: 'weight loss' | 'muscle gain' }) {
    try {
        console.log(`Начало генерации планов для пользователя ${userId}`);
        const { firestore } = await getAuthenticatedAppForUser();
        const userRef = firestore.collection('users').doc(userId);

        const [dietPlanResult, workoutPlanResult] = await Promise.all([
            generateDietPlan(aiInput),
            generateWorkoutPlan(aiInput),
        ]);

        const plansData = {
            dietPlan: dietPlanResult,
            workoutPlan: workoutPlanResult,
        };

        await userRef.set(plansData, { merge: true });
        console.log(`Планы для пользователя ${userId} успешно созданы и сохранены.`);
        
    } catch (error) {
        console.error(`Ошибка при генерации или сохранении планов для пользователя ${userId}:`, error);
        // Re-throw the error to be caught by the calling function
        throw new Error('Не удалось сгенерировать или сохранить планы.');
    }
}


export async function completeRegistration(userData: Omit<UserProfile, 'dietPlan' | 'workoutPlan' | 'createdAt'>) {
    try {
        const { firestore } = await getAuthenticatedAppForUser();
        const userRef = firestore.collection('users').doc(userData.uid);
        
        // 1. Create the initial user profile document
        const fullProfileData = {
            ...userData,
            createdAt: new Date().toISOString(),
        };
        await userRef.set(fullProfileData);
        console.log(`Профиль для пользователя ${userData.uid} успешно создан.`);

        // 2. Generate and save plans, awaiting completion
        await generateAndSavePlans(userData.uid, {
            age: userData.age,
            gender: userData.gender,
            weight: userData.weight,
            height: userData.height,
            goal: userData.goal,
        });

        // 3. Revalidate paths to show new data
        revalidatePath('/profile', 'layout');
        revalidatePath('/diet-plan', 'layout');
        revalidatePath('/workout-plan', 'layout');
        
        return { success: true };

    } catch (error: any) {
        console.error('Ошибка при полной регистрации пользователя:', error);
        return { success: false, error: error.message || 'Не удалось создать профиль и сгенерировать планы.' };
    }
}


export async function updateUserAndGeneratePlans(userId: string, profile: UserProfile, data: ProfileUpdateData) {
    try {
        const { firestore } = await getAuthenticatedAppForUser();
        const userRef = firestore.collection('users').doc(userId);

        const updatedProfileData = {
            weight: data.weight,
            height: data.height,
            goal: data.goal,
        };
        
        // 1. Update the user's core profile data.
        await userRef.set(updatedProfileData, { merge: true });
        
        const aiInput = {
            age: profile.age,
            gender: profile.gender,
            weight: data.weight,
            height: data.height,
            goal: data.goal,
        };

        // 2. Await the generation and saving of new plans.
        await generateAndSavePlans(userId, aiInput);

        // 3. Revalidate paths to show the newly generated data.
        revalidatePath('/profile', 'layout');
        revalidatePath('/diet-plan', 'layout');
        revalidatePath('/workout-plan', 'layout');

        return { success: true };
    } catch (error: any) {
        console.error('Ошибка обновления профиля:', error);
        return { success: false, error: error.message || 'Не удалось обновить профиль и сгенерировать новые планы.' };
    }
}
