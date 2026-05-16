import { NextRequest, NextResponse } from 'next/server';
import { getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { z } from 'zod';
import { generateDietPlan } from '@/ai/flows/generate-diet-plan';
import { generateWorkoutPlan } from '@/ai/flows/generate-workout-plan';
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
  goal: z.enum(['weight loss', 'muscle gain']),
  types: z.array(z.enum(['diet', 'workout'])).min(1).default(['diet', 'workout']),
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
    const input = PlanInputSchema.parse(body);

    const aiInput = {
      age: input.age,
      gender: input.gender,
      weight: input.weight,
      height: input.height,
      goal: input.goal,
    };

    const result: { dietPlan?: Awaited<ReturnType<typeof generateDietPlan>>; workoutPlan?: Awaited<ReturnType<typeof generateWorkoutPlan>> } = {};

    const tasks: Promise<void>[] = [];

    if (input.types.includes('diet')) {
      tasks.push(
        generateDietPlan(aiInput).then((plan) => {
          result.dietPlan = plan;
        })
      );
    }
    if (input.types.includes('workout')) {
      tasks.push(
        generateWorkoutPlan(aiInput).then((plan) => {
          result.workoutPlan = plan;
        })
      );
    }

    await Promise.all(tasks);

    return NextResponse.json(result, { headers: corsHeaders });
  } catch (error) {
    console.error('API /plans/generate error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Неверные данные запроса' }, { status: 400, headers: corsHeaders });
    }
    return NextResponse.json({ error: 'Не удалось сгенерировать планы' }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
