
import { NextRequest, NextResponse } from 'next/server';
import { generateDietPlan } from '@/ai/flows/generate-diet-plan';
import { generateWorkoutPlan } from '@/ai/flows/generate-workout-plan';
import { updateUserProfile } from '@/lib/firebase/firestore';
import type { UserProfile } from '@/lib/definitions';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, userProfile } = body;

    if (!userId || !userProfile) {
      return NextResponse.json({ success: false, error: 'Missing userId or userProfile' }, { status: 400 });
    }

    const aiInput = {
        age: userProfile.age,
        gender: userProfile.gender,
        weight: userProfile.weight,
        height: userProfile.height,
        goal: userProfile.goal,
    };

    const [dietPlanResult, workoutPlanResult] = await Promise.all([
        generateDietPlan(aiInput),
        generateWorkoutPlan(aiInput),
    ]);

    const plansData: Partial<UserProfile> = {
        dietPlan: dietPlanResult,
        workoutPlan: workoutPlanResult,
    };

    await updateUserProfile(userId, plansData);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error in /api/generate-plans:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
