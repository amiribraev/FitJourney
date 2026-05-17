import { NextRequest, NextResponse } from 'next/server';
import { getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import '@/lib/firebase/admin';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const ProgressLogSchema = z.object({
  caloriesConsumed: z.number().min(0),
  caloriesBurned: z.number().min(0).optional().default(0),
  workoutCompleted: z.boolean().optional().default(false),
  workoutId: z.string().optional(),
  notes: z.string().optional(),
  date: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401, headers: corsHeaders });
    }

    const idToken = authHeader.slice(7);
    const decoded = await getAuth(getApp('firebase-admin-app')).verifyIdToken(idToken);
    const userId = decoded.uid;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    const db = getFirestore(getApp('firebase-admin-app'));
    const logsRef = db.collection('users').doc(userId).collection('progressLogs');
    const snapshot = await logsRef
      .orderBy('date', 'desc')
      .limit(limit)
      .get();

    const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ logs }, { headers: corsHeaders });
  } catch (error) {
    console.error('API /progress GET error:', error);
    return NextResponse.json({ error: 'Ошибка получения прогресса' }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401, headers: corsHeaders });
    }

    const idToken = authHeader.slice(7);
    const decoded = await getAuth(getApp('firebase-admin-app')).verifyIdToken(idToken);
    const userId = decoded.uid;

    const body = await request.json();
    const validated = ProgressLogSchema.parse(body);

    const today = new Date();
    const logId = validated.date || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const logData = {
      id: logId,
      userId,
      date: logId,
      caloriesConsumed: validated.caloriesConsumed,
      caloriesBurned: validated.caloriesBurned,
      workoutCompleted: validated.workoutCompleted,
      workoutId: validated.workoutId,
      notes: validated.notes ?? null,
      createdAt: new Date().toISOString(),
    };

    const db = getFirestore(getApp('firebase-admin-app'));
    await db.collection('users').doc(userId).collection('progressLogs').doc(logId).set(logData, { merge: true });

    return NextResponse.json({ success: true, log: logData }, { headers: corsHeaders });
  } catch (error) {
    console.error('API /progress POST error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Неверные данные', details: error.errors }, { status: 400, headers: corsHeaders });
    }
    return NextResponse.json({ error: 'Не удалось сохранить прогресс' }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
