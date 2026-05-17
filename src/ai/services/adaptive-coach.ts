'use server';

/**
 * @fileOverview Adaptive AI coach service.
 * Handles plan adjustments based on user progress, missed workouts, weight changes.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AdaptationInputSchema = z.object({
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
  currentDietPlan: z.any().optional().describe('Текущий план питания'),
  currentWorkoutPlan: z.any().optional().describe('Текущий план тренировок'),
  progressLast7Days: z.object({
    avgCaloriesConsumed: z.number(),
    avgCaloriesBurned: z.number(),
    workoutsCompleted: z.number(),
    workoutsSkipped: z.number(),
    weightChange: z.number().describe('Изменение веса за неделю в кг'),
  }),
  lastMissedWorkouts: z.number().describe('Количество пропущенных тренировок подряд'),
});

export type AdaptationInput = z.infer<typeof AdaptationInputSchema>;

const AdaptationOutputSchema = z.object({
  tdee: z.number().describe('Обновлённая суточная норма калорий'),
  macros: z.object({
    protein: z.number().describe('Белки в граммах'),
    fat: z.number().describe('Жиры в граммах'),
    carbs: z.number().describe('Углеводы в граммах'),
  }),
  recommendations: z.object({
    calorieAdjustment: z.number().describe('Корректировка калорий: положительное число = добавить, отрицательное = убрать'),
    workoutIntensityChange: z.enum(['increase', 'maintain', 'decrease']).describe('Рекомендуемое изменение интенсивности'),
    specificNotes: z.array(z.string()).describe('Конкретные рекомендации для пользователя'),
  }),
  dietAlternatives: z.array(z.string()).describe('Альтернативные блюда на случай аллергий'),
});

export type AdaptationOutput = z.infer<typeof AdaptationOutputSchema>;

export async function generateAdaptivePlan(input: AdaptationInput): Promise<AdaptationOutput> {
  try {
    const { output } = await generateAdaptivePlanFlow(input);
    return output!;
  } catch (error) {
    console.error('Error generating adaptive plan:', error);
    throw new Error('Не удалось скорректировать план');
  }
}

const generateAdaptivePlanFlow = ai.defineFlow(
  {
    name: 'generateAdaptivePlanFlow',
    inputSchema: AdaptationInputSchema,
    outputSchema: AdaptationOutputSchema,
  },
  async (input) => {
    const progress = input.progressLast7Days;

    // Calculate base TDEE using Mifflin-St Jeor
    const bmr = input.gender === 'male'
      ? (10 * input.weight) + (6.25 * input.height) - (5 * input.age) + 5
      : (10 * input.weight) + (6.25 * input.height) - (5 * input.age) - 161;

    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      'very-active': 1.9,
    };

    let tdee = Math.round(bmr * activityMultipliers[input.activityLevel]);

    // Adjust based on progress
    let calorieAdjustment = 0;
    if (input.goal === 'weight loss') {
      if (progress.weightChange < -0.5) {
        calorieAdjustment = 100;
      } else if (progress.weightChange > 0.3) {
        calorieAdjustment = -200;
      }
    } else if (input.goal === 'muscle gain') {
      if (progress.weightChange < 0.1) {
        calorieAdjustment = 200;
      } else if (progress.weightChange > 0.8) {
        calorieAdjustment = -100;
      }
    }

    if (progress.workoutsSkipped >= 3) {
      calorieAdjustment -= 150;
    }

    tdee = Math.round(tdee + calorieAdjustment);

    // Calculate macros
    let proteinRatio = 0.2;
    let fatRatio = 0.25;
    let carbsRatio = 0.55;

    if (input.goal === 'muscle gain') {
      proteinRatio = 0.3;
      fatRatio = 0.25;
      carbsRatio = 0.45;
    } else if (input.goal === 'weight loss') {
      proteinRatio = 0.35;
      fatRatio = 0.3;
      carbsRatio = 0.35;
    }

    const protein = Math.round((tdee * proteinRatio) / 4);
    const fat = Math.round((tdee * fatRatio) / 9);
    const carbs = Math.round((tdee * carbsRatio) / 4);

    let intensityChange: 'increase' | 'maintain' | 'decrease' = 'maintain';
    if (progress.workoutsCompleted >= 5 && progress.workoutsSkipped === 0) {
      intensityChange = 'increase';
    } else if (progress.workoutsSkipped >= 4) {
      intensityChange = 'decrease';
    }

    const notes: string[] = [];
    if (progress.weightChange > 0 && input.goal === 'weight loss') {
      notes.push('На этой неделе вес немного вырос — не переживайте, это может быть вода. Продолжайте придерживаться плана.');
    } else if (progress.weightChange < -0.7 && input.goal === 'weight loss') {
      notes.push('Отличный результат! Если чувствуете слабость — добавьте 100–150 ккал в рацион.');
    }

    if (progress.workoutsSkipped >= 3) {
      notes.push('Пропустили несколько тренировок — не страшно. Давайте вернёмся к плану постепенно, не перегружайтесь.');
    }

    const specificNotes = [
      ...notes,
      ...(input.allergies.length > 0
        ? [`Учтены ограничения: ${input.allergies.join(', ')}`]
        : []),
    ];

    // Generate food alternatives for dietary restrictions
    const dietAlternatives = generateAlternatives(input.dietRestriction, input.allergies);

    return {
      tdee,
      macros: { protein, fat, carbs },
      recommendations: {
        calorieAdjustment,
        workoutIntensityChange: intensityChange,
        specificNotes,
      },
      dietAlternatives,
    };
  },
);

function generateAlternatives(restriction: string, allergies: string[]): string[] {
  const alternatives: Record<string, string[]> = {
    'gluten-free': ['Рис вместо пшеницы', 'Гречка вместо макарон', 'Кукурузная мука вместо пшеничной', 'Овсянка долгой варки без глютена', 'Киноа вместо риса'],
    'lactose-free': ['Миндальное молоко вместо коровьего', 'Тофу вместо сыра', 'Кокосовое молоко вместо обычного', 'Овсяное молоко без лактозы'],
    vegan: ['Тофу/темпе вместо мяса', 'Чечевица/фасоль вместо рыбы', 'Соевое молоко вместо коровьего', 'Веганский протеиновый порошок', 'Нут вместо курицы'],
    vegetarian: ['Тофу вместо курицы', 'Фасоль вместо рыбы', 'Сыр вместо мяса', 'Яйца и творог для белка'],
    halal: ['Курица халяль вместо свинины', 'Говядина халяль', 'Рыба и морепродукты', 'Овсянка/рис/гречка для основного'],
  };

  const result: string[] = [];

  if (restriction !== 'none' && alternatives[restriction]) {
    result.push(...alternatives[restriction]);
  }

  if (allergies.includes('nuts')) {
    result.push('Семечки подсолнечника вместо орехов', 'Зерновые без добавления орехов');
  }
  if (allergies.includes('dairy')) {
    result.push('Овсяное/миндальное молоко вместо коровьего', 'Кокосовый йогурт вместо обычного');
  }
  if (allergies.includes('fish') || allergies.includes('seafood')) {
    result.push('Курица/индейка вместо рыбы', 'Бобовые для омега-3');
  }

  return result;
}

/**
 * Calculate TDEE and macros for given user data.
 */
export function calculateTDEE(
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female',
  activityLevel: string,
  goal: string
): { tdee: number; macros: { protein: number; fat: number; carbs: number } } {
  const bmr = gender === 'male'
    ? (10 * weight) + (6.25 * height) - (5 * age) + 5
    : (10 * weight) + (6.25 * height) - (5 * age) - 161;

  const multiplier: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    'very-active': 1.9,
  };

  let tdee = Math.round(bmr * (multiplier[activityLevel] || 1.55));

  if (goal === 'weight loss') tdee -= 500;
  else if (goal === 'muscle gain') tdee += 300;

  const proteinRatio = goal === 'muscle gain' ? 0.3 : goal === 'weight loss' ? 0.35 : 0.2;
  const fatRatio = 0.25;
  const carbsRatio = 1 - proteinRatio - fatRatio;

  return {
    tdee,
    macros: {
      protein: Math.round((tdee * proteinRatio) / 4),
      fat: Math.round((tdee * fatRatio) / 9),
      carbs: Math.round((tdee * carbsRatio) / 4),
    },
  };
}
