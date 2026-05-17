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

const CalendarEntrySchema = z.object({
  date: z.string(),
  dayOfWeek: z.string(),
  workoutSummary: z.string(),
  exercisesCount: z.number().min(0),
  durationMinutes: z.number().min(0),
  status: z.enum(['planned', 'completed', 'skipped', 'rescheduled']).optional().default('planned'),
  notes: z.string().optional(),
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const db = getFirestore(getApp('firebase-admin-app'));
    const calendarRef = db.collection('users').doc(userId).collection('workoutCalendar');

    let query: FirebaseFirestore.Query = calendarRef.orderBy('date', 'desc').limit(limit);

    if (startDate && endDate) {
      query = calendarRef
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .orderBy('date')
        .limit(limit);
    }

    const snapshot = await query.get();
    const entries = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ entries }, { headers: corsHeaders });
  } catch (error) {
    console.error('API /calendar GET error:', error);
    return NextResponse.json({ error: 'Ошибка получения календаря' }, { status: 500, headers: corsHeaders });
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
    const validated = CalendarEntrySchema.parse(body);

    const entryId = `${validated.date}-${Date.now()}`;
    const entryData: Record<string, any> = {
      id: entryId,
      userId,
      date: validated.date,
      dayOfWeek: validated.dayOfWeek,
      workoutSummary: validated.workoutSummary,
      exercisesCount: validated.exercisesCount,
      durationMinutes: validated.durationMinutes,
      status: validated.status ?? 'planned',
      notes: validated.notes ?? null,
      createdAt: new Date().toISOString(),
    };

    if (validated.status === 'completed') {
      entryData.completedAt = new Date().toISOString();
    }

    const db = getFirestore(getApp('firebase-admin-app'));
    await db.collection('users').doc(userId).collection('workoutCalendar').doc(entryId).set(entryData);

    return NextResponse.json({ success: true, entry: entryData }, { headers: corsHeaders });
  } catch (error) {
    console.error('API /calendar POST error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Неверные данные', details: error.errors }, { status: 400, headers: corsHeaders });
    }
    return NextResponse.json({ error: 'Не удалось сохранить запись календаря' }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401, headers: corsHeaders });
    }

    const idToken = authHeader.slice(7);
    const decoded = await getAuth(getApp('firebase-admin-app')).verifyIdToken(idToken);
    const userId = decoded.uid;

    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('id');
    if (!entryId) {
      return NextResponse.json({ error: 'Не указан id записи' }, { status: 400, headers: corsHeaders });
    }

    const body = await request.json();
    const updateData: Record<string, any> = {};
    if (body.status) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;

    if (body.status === 'completed') {
      updateData.completedAt = new Date().toISOString();
    }

    const db = getFirestore(getApp('firebase-admin-app'));
    await db.collection('users').doc(userId).collection('workoutCalendar').doc(entryId).update(updateData);

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error('API /calendar PUT error:', error);
    return NextResponse.json({ error: 'Не удалось обновить запись' }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
