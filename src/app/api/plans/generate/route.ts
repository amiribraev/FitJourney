import { NextRequest, NextResponse } from 'next/server';
import { getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { z } from 'zod';
import { generateDietPlan, type GenerateDietPlanInput } from '@/ai/flows/generate-diet-plan';
import { generateWorkoutPlan, type GenerateWorkoutPlanInput } from '@/ai/flows/generate-workout-plan';
import { calculateTDEE } from '@/ai/services/adaptive-coach';
import { getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebase/admin';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const PlanInputSchema = z.object({
  age: z.number(),
  gender: z.enum(['male', 'female']),
  weight: z.number(),
  height: z.number(),
  goal: z.enum(['weight loss', 'muscle gain', 'maintenance']),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very-active']).optional().default('moderate'),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('beginner'),
  equipment: z.enum(['gym', 'home', 'no-equipment']).optional().default('no-equipment'),
  dietRestriction: z.enum(['none', 'vegan', 'vegetarian', 'halal', 'gluten-free', 'lactose-free']).optional().default('none'),
  allergies: z.array(z.string()).default([]),
  injuries: z.array(z.string()).default([]),
  types: z.array(z.enum(['diet', 'workout'])).min(1).default(['diet', 'workout']),
  language: z.enum(['ru', 'kk', 'en']).optional().default('ru'),
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'РўСЂРµР±СѓРµС‚СЃСЏ Р°РІС‚РѕСЂРёР·Р°С†РёСЏ' }, { status: 401, headers: corsHeaders });
    }

    const idToken = authHeader.slice(7);
    const decoded = await getAuth(getApp('firebase-admin-app')).verifyIdToken(idToken);
    const userId = decoded.uid;

    const body = await request.json();
    const input = PlanInputSchema.parse(body);

    // Calculate TDEE and macros server-side
    const { tdee, macros } = calculateTDEE(input.weight, input.height, input.age, input.gender, input.activityLevel, input.goal);

    // Update user profile with new data
    const db = getFirestore(getApp('firebase-admin-app'));
    await db.collection('users').doc(userId).update({
      age: input.age,
      gender: input.gender,
      weight: input.weight,
      height: input.height,
      goal: input.goal,
      activityLevel: input.activityLevel,
      fitnessLevel: input.fitnessLevel,
      equipment: input.equipment,
      dietRestriction: input.dietRestriction,
      allergies: input.allergies,
      injuries: input.injuries,
      language: input.language,
      tdee,
      macros,
      updatedAt: new Date().toISOString(),
    });

    const dietInput: GenerateDietPlanInput = {
      age: input.age,
      gender: input.gender,
      weight: input.weight,
      height: input.height,
      goal: input.goal,
      activityLevel: input.activityLevel,
      fitnessLevel: input.fitnessLevel,
      dietRestriction: input.dietRestriction,
      allergies: input.allergies,
      equipment: input.equipment,
      tdee,
      macros,
    };

    const workoutInput: GenerateWorkoutPlanInput = {
      age: input.age,
      gender: input.gender,
      weight: input.weight,
      height: input.height,
      goal: input.goal,
      fitnessLevel: input.fitnessLevel,
      equipment: input.equipment,
      activityLevel: input.activityLevel,
      injuries: input.injuries,
      language: input.language,
    };

    const result: { dietPlan?: any; workoutPlan?: any } = {};
    const tasks: Promise<void>[] = [];

    if (input.types.includes('diet')) {
      tasks.push(
        generateDietPlan(dietInput).then((plan) => {
          result.dietPlan = {
            ...plan,
            generatedAt: new Date().toISOString(),
            tdeeUsed: tdee,
            macrosUsed: macros,
          };
        })
      );
    }
    if (input.types.includes('workout')) {
      tasks.push(
        generateWorkoutPlan(workoutInput).then((plan) => {
          result.workoutPlan = {
            ...plan,
            generatedAt: new Date().toISOString(),
          };
        })
      );
    }

    await Promise.all(tasks);

    return NextResponse.json(result, { headers: corsHeaders });
  } catch (error) {
    console.error('API /plans/generate error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'РќРµРІРµСЂРЅС‹Рµ РґР°РЅРЅС‹Рµ Р·Р°РїСЂРѕСЃР°', details: error.errors }, { status: 400, headers: corsHeaders });
    }
    return NextResponse.json({ error: 'РќРµ СѓРґР°Р»РѕСЃСЊ СЃРіРµРЅРµСЂРёСЂРѕРІР°С‚СЊ РїР»Р°РЅС‹' }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
