import { auth } from './firebase';
import type { DietPlan, Goal, Gender, WorkoutPlan, ActivityLevel, FitnessLevel, Equipment, DietRestriction } from './types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:9002';

export type PlanGenerateInput = {
  age: number;
  gender: Gender;
  weight: number;
  height: number;
  goal: Goal;
  activityLevel?: ActivityLevel;
  fitnessLevel?: FitnessLevel;
  equipment?: Equipment;
  dietRestriction?: DietRestriction;
  allergies?: string[];
  injuries?: string[];
  types?: ('diet' | 'workout')[];
};

export async function generatePlans(input: PlanGenerateInput): Promise<{
  dietPlan?: DietPlan;
  workoutPlan?: WorkoutPlan;
}> {
  const user = auth.currentUser;
  if (!user) throw new Error('Необходимо войти в аккаунт');

  const token = await user.getIdToken();
  const response = await fetch(`${API_URL}/api/plans/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...input,
      types: input.types ?? ['diet', 'workout'],
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? 'Ошибка генерации планов');
  }

  return response.json();
}

export type ProgressLogInput = {
  caloriesConsumed: number;
  caloriesBurned?: number;
  workoutCompleted?: boolean;
  workoutId?: string;
  notes?: string;
  date?: string;
};

export async function logProgress(input: ProgressLogInput): Promise<any> {
  const user = auth.currentUser;
  if (!user) throw new Error('Необходимо войти в аккаунт');

  const token = await user.getIdToken();
  const response = await fetch(`${API_URL}/api/progress`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? 'Ошибка сохранения прогресса');
  }

  return response.json();
}

export async function getProgressLogs(limit = 30): Promise<any[]> {
  const user = auth.currentUser;
  if (!user) throw new Error('Необходимо войти в аккаунт');

  const token = await user.getIdToken();
  const response = await fetch(`${API_URL}/api/progress?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Ошибка получения прогресса');
  }

  const data = await response.json();
  return data.logs ?? [];
}

export type BodyMeasurementInput = {
  weight: number;
  chest?: number;
  waist?: number;
  hips?: number;
  biceps?: number;
  thigh?: number;
  bodyFatPercent?: number;
  notes?: string;
  date?: string;
};

export async function addMeasurement(input: BodyMeasurementInput): Promise<any> {
  const user = auth.currentUser;
  if (!user) throw new Error('Необходимо войти в аккаунт');

  const token = await user.getIdToken();
  const response = await fetch(`${API_URL}/api/measurements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? 'Ошибка сохранения замера');
  }

  return response.json();
}

export async function getMeasurements(limit = 50): Promise<any[]> {
  const user = auth.currentUser;
  if (!user) throw new Error('Необходимо войти в аккаунт');

  const token = await user.getIdToken();
  const response = await fetch(`${API_URL}/api/measurements?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Ошибка получения замеров');
  }

  const data = await response.json();
  return data.measurements ?? [];
}

export type CalendarEntryInput = {
  date: string;
  dayOfWeek: string;
  workoutSummary: string;
  exercisesCount: number;
  durationMinutes: number;
  status?: 'planned' | 'completed' | 'skipped' | 'rescheduled';
  notes?: string;
};

export async function addCalendarEntry(input: CalendarEntryInput): Promise<any> {
  const user = auth.currentUser;
  if (!user) throw new Error('Необходимо войти в аккаунт');

  const token = await user.getIdToken();
  const response = await fetch(`${API_URL}/api/calendar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? 'Ошибка сохранения записи календаря');
  }

  return response.json();
}

export async function getCalendarEntries(startDate?: string, endDate?: string): Promise<any[]> {
  const user = auth.currentUser;
  if (!user) throw new Error('Необходимо войти в аккаунт');

  const token = await user.getIdToken();
  let url = `${API_URL}/api/calendar?`;
  if (startDate) url += `&startDate=${startDate}`;
  if (endDate) url += `&endDate=${endDate}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Ошибка получения календаря');
  }

  const data = await response.json();
  return data.entries ?? [];
}

export async function updateCalendarEntry(entryId: string, status: string, notes?: string): Promise<any> {
  const user = auth.currentUser;
  if (!user) throw new Error('Необходимо войти в аккаунт');

  const token = await user.getIdToken();
  const response = await fetch(`${API_URL}/api/calendar?id=${entryId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status, notes }),
  });

  if (!response.ok) {
    throw new Error('Ошибка обновления записи');
  }

  return response.json();
}

export type AdaptiveInput = {
  age: number;
  gender: Gender;
  weight: number;
  height: number;
  goal: Goal;
  activityLevel: ActivityLevel;
  fitnessLevel: FitnessLevel;
  equipment: Equipment;
  dietRestriction: DietRestriction;
  allergies: string[];
  injuries: string[];
  tdee?: number;
  macros?: { protein: number; fat: number; carbs: number };
  currentDietPlan?: any;
  currentWorkoutPlan?: any;
  progressLast7Days: {
    avgCaloriesConsumed: number;
    avgCaloriesBurned: number;
    workoutsCompleted: number;
    workoutsSkipped: number;
    weightChange: number;
  };
  lastMissedWorkouts?: number;
};

export async function getAdaptivePlan(input: AdaptiveInput): Promise<{
  tdee: number;
  macros: { protein: number; fat: number; carbs: number };
  recommendations: {
    calorieAdjustment: number;
    workoutIntensityChange: 'increase' | 'maintain' | 'decrease';
    specificNotes: string[];
  };
  dietAlternatives: string[];
}> {
  const user = auth.currentUser;
  if (!user) throw new Error('Необходимо войти в аккаунт');

  const token = await user.getIdToken();
  const response = await fetch(`${API_URL}/api/adaptive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? 'Ошибка адаптации плана');
  }

  return response.json();
}
