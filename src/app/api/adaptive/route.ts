import { NextRequest, NextResponse } from 'next/server';
import { getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { z } from 'zod';
import '@/lib/firebase/admin';
import { calculateTDEE, generateAdaptivePlan } from '@/ai/services/adaptive-coach';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const AdaptInputSchema = z.object({
  age: z.number(),
  gender: z.enum(['male', 'female']),
  weight: z.number(),
  height: z.number(),
  goal: z.enum(['weight loss', 'muscle gain', 'maintenance']),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very-active']),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  equipment: z.enum(['gym', 'home', 'no-equipment']),
  dietRestriction: z.enum(['none', 'vegan', 'vegetarian', 'halal', 'gluten-free', 'lactose-free']),
  allergies: z.array(z.string()).default([]),
  injuries: z.array(z.string()).default([]),
  tdee: z.number().optional(),
  macros: z.object({ protein: z.number(), fat: z.number(), carbs: z.number() }).optional(),
  currentDietPlan: z.any().optional(),
  currentWorkoutPlan: z.any().optional(),
  progressLast7Days: z.object({
    avgCaloriesConsumed: z.number(),
    avgCaloriesBurned: z.number(),
    workoutsCompleted: z.number(),
    workoutsSkipped: z.number(),
    weightChange: z.number(),
  }),
  lastMissedWorkouts: z.number().default(0),
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401, headers: corsHeaders });
    }

    const idToken = authHeader.slice(7);
    await getAuth(getApp('firebase-admin-app')).verifyIdToken(idToken);

    const body = await request.json();
    const input = AdaptInputSchema.parse(body);

    // Calculate or use provided TDEE
    const tdeeData = input.tdee && input.macros
      ? { tdee: input.tdee, macros: input.macros }
      : calculateTDEE(input.weight, input.height, input.age, input.gender, input.activityLevel, input.goal);

    // Get adaptive recommendations
    const adaptation = await generateAdaptivePlan({
      ...input,
      progressLast7Days: input.progressLast7Days,
      lastMissedWorkouts: input.lastMissedWorkouts,
    });

    return NextResponse.json({
      tdee: adaptation.tdee,
      macros: adaptation.macros,
      recommendations: adaptation.recommendations,
      dietAlternatives: adaptation.dietAlternatives,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('API /adaptive error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Неверные данные запроса', details: error.errors }, { status: 400, headers: corsHeaders });
    }
    return NextResponse.json({ error: 'Не удалось обработать запрос' }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
