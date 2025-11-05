
'use server';

import { revalidatePath } from 'next/cache';
import { generateDietPlan } from '@/ai/flows/generate-diet-plan';
import { generateWorkoutPlan } from '@/ai/flows/generate-workout-plan';
import type { UserProfile } from './definitions';
import { type ProfileUpdateData } from './schema';
import { adminDb } from './firebase/admin';


async function generateAndSavePlans(userId: string, aiInput: { age: number, gender: 'male' | 'female', weight: number, height: number, goal: 'weight loss' | 'muscle gain' }) {
    try {
        console.log(`Начало генерации планов для пользователя ${userId}`);
        const userRef = adminDb.collection('users').doc(userId);

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
        throw new Error('Не удалось сгенерировать или сохранить планы.');
    }
}


export async function completeRegistration(userData: Omit<UserProfile, 'dietPlan' | 'workoutPlan' | 'createdAt'>) {
    try {
        const userRef = adminDb.collection('users').doc(userData.uid);
        
        const fullProfileData: Omit<UserProfile, 'dietPlan' | 'workoutPlan'> = {
            ...userData,
            createdAt: new Date().toISOString(),
        };
        await userRef.set(fullProfileData);
        console.log(`Профиль для пользователя ${userData.uid} успешно создан.`);

        await generateAndSavePlans(userData.uid, {
            age: userData.age,
            gender: userData.gender,
            weight: userData.weight,
            height: userData.height,
            goal: userData.goal,
        });

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
        const userRef = adminDb.collection('users').doc(userId);

        const updatedProfileData = {
            weight: data.weight,
            height: data.height,
            goal: data.goal,
        };
        
        await userRef.update(updatedProfileData);
        
        const aiInput = {
            age: profile.age,
            gender: profile.gender,
            weight: data.weight,
            height: data.height,
            goal: data.goal,
        };

        await generateAndSavePlans(userId, aiInput);

        revalidatePath('/profile', 'layout');
        revalidatePath('/diet-plan', 'layout');
        revalidatePath('/workout-plan', 'layout');

        return { success: true };
    } catch (error: any) {
        console.error('Ошибка обновления профиля:', error);
        return { success: false, error: error.message || 'Не удалось обновить профиль и сгенерировать новые планы.' };
    }
}
