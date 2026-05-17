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

const MeasurementSchema = z.object({
  weight: z.number().positive(),
  chest: z.number().positive().optional(),
  waist: z.number().positive().optional(),
  hips: z.number().positive().optional(),
  biceps: z.number().positive().optional(),
  thigh: z.number().positive().optional(),
  bodyFatPercent: z.number().min(0).max(100).optional(),
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
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const db = getFirestore(getApp('firebase-admin-app'));
    const measurementsRef = db.collection('users').doc(userId).collection('bodyMeasurements');
    const snapshot = await measurementsRef
      .orderBy('date', 'desc')
      .limit(limit)
      .get();

    const measurements = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ measurements }, { headers: corsHeaders });
  } catch (error) {
    console.error('API /measurements GET error:', error);
    return NextResponse.json({ error: 'Ошибка получения замеров' }, { status: 500, headers: corsHeaders });
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
    const validated = MeasurementSchema.parse(body);

    const today = new Date();
    const measurementId = validated.date || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}-${today.getTime()}`;

    const measurementData = {
      id: measurementId,
      userId,
      date: validated.date || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
      weight: validated.weight,
      ...(validated.chest !== undefined && { chest: validated.chest }),
      ...(validated.waist !== undefined && { waist: validated.waist }),
      ...(validated.hips !== undefined && { hips: validated.hips }),
      ...(validated.biceps !== undefined && { biceps: validated.biceps }),
      ...(validated.thigh !== undefined && { thigh: validated.thigh }),
      ...(validated.bodyFatPercent !== undefined && { bodyFatPercent: validated.bodyFatPercent }),
      notes: validated.notes ?? null,
    };

    const db = getFirestore(getApp('firebase-admin-app'));
    await db.collection('users').doc(userId).collection('bodyMeasurements').doc(measurementId).set(measurementData);

    // Also update user weight
    await db.collection('users').doc(userId).update({
      weight: validated.weight,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, measurement: measurementData }, { headers: corsHeaders });
  } catch (error) {
    console.error('API /measurements POST error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Неверные данные', details: error.errors }, { status: 400, headers: corsHeaders });
    }
    return NextResponse.json({ error: 'Не удалось сохранить замер' }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
