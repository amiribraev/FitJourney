'use server';

/**
 * @fileOverview A workout plan generation AI agent.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {
  buildWorkoutPrompt,
  getSafeLanguage,
  logGeminiResult,
  parseAndValidateGeminiJson,
} from '@/ai/gemini';

const GenerateWorkoutPlanInputSchema = z.object({
  age: z.number().describe('Возраст пользователя в годах.'),
  gender: z.enum(['male', 'female']).describe('Пол пользователя.'),
  weight: z.number().describe('Вес в кг.'),
  height: z.number().describe('Рост в см.'),
  goal: z.enum(['weight loss', 'muscle gain', 'maintenance']).describe('Цель: похудение, набор массы или поддержание.'),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).describe('Уровень подготовки beginner / intermediate / advanced.'),
  equipment: z.enum(['gym', 'home', 'no-equipment']).describe('Доступное оборудование.'),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very-active']).describe('Общий уровень активности.'),
  injuries: z.array(z.string()).default([]).describe('Список травм/заболеваний, чтобы их избегать в плане.'),
  language: z.string().optional().default('ru').describe('Язык ответа: ru, kk или en.'),
});
export type GenerateWorkoutPlanInput = z.infer<typeof GenerateWorkoutPlanInputSchema>;

const DailyWorkoutPlanSchema = z.array(z.string()).describe(
  'Упражнения на день. Каждая строка — одно упражнение в формате: «Название — подходы × повторения/время, отдых N сек».'
);

const GenerateWorkoutPlanOutputSchema = z.object({
  weeklyWorkoutPlan: z.object({
    Monday: DailyWorkoutPlanSchema,
    Tuesday: DailyWorkoutPlanSchema,
    Wednesday: DailyWorkoutPlanSchema,
    Thursday: DailyWorkoutPlanSchema,
    Friday: DailyWorkoutPlanSchema,
    Saturday: DailyWorkoutPlanSchema,
    Sunday: DailyWorkoutPlanSchema,
  }),
  equipment: z.string().optional().default(''),
  fitnessLevel: z.string().optional().default(''),
});
export type GenerateWorkoutPlanOutput = z.infer<typeof GenerateWorkoutPlanOutputSchema>;

export async function generateWorkoutPlan(input: GenerateWorkoutPlanInput): Promise<GenerateWorkoutPlanOutput> {
  try {
    return await generateWorkoutPlanFlow(input);
  } catch (error) {
    console.error('Error generating workout plan:', error);
    return getFallbackWorkoutPlan();
  }
}

function getFallbackWorkoutPlan(): GenerateWorkoutPlanOutput {
  return {
    equipment: 'no-equipment',
    fitnessLevel: 'beginner',
    weeklyWorkoutPlan: {
      Monday: ['Разминка — 5 мин', 'Приседания — 3×15, отдых 60 сек', 'Планка — 3×30 сек'],
      Tuesday: ['Отдых'],
      Wednesday: ['Кардио — 20 мин, умеренный темп', 'Отжимания — 3×10'],
      Thursday: ['Отдых'],
      Friday: ['Разминка — 5 мин', 'Выпады — 3×12', 'Заминка — 5 мин'],
      Saturday: ['Йога или растяжка — 20 мин'],
      Sunday: ['Отдых'],
    },
    equipment: '',
    fitnessLevel: '',
  };
}

const generateWorkoutPlanFlow = ai.defineFlow(
  {
    name: 'generateWorkoutPlanFlow',
    inputSchema: GenerateWorkoutPlanInputSchema,
    outputSchema: GenerateWorkoutPlanOutputSchema,
  },
  async input => {
    const language = getSafeLanguage(input.language);
    const model = 'googleai/gemini-3.1-flash-lite';
    const maxAttempts = 2;
    let lastError: 'parse' | 'validation' | 'mojibake' | 'model' | 'unknown' = 'unknown';

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await ai.generate({
          model,
          prompt: buildWorkoutPrompt(input),
          config: {temperature: 0.4},
        });
        const parsed = parseAndValidateGeminiJson(response.text, GenerateWorkoutPlanOutputSchema);
        logGeminiResult({scenario: 'workout', language, model, success: true});
        return parsed;
      } catch (error) {
        const code = error instanceof Error ? error.message : 'unknown';
        lastError =
          code === 'GEMINI_PARSE_ERROR'
            ? 'parse'
            : code === 'GEMINI_VALIDATION_ERROR'
              ? 'validation'
              : code === 'GEMINI_MOJIBAKE_ERROR'
                ? 'mojibake'
                : 'model';
        logGeminiResult({scenario: 'workout', language, model, success: false, reason: lastError});
      }
    }

    throw new Error(`GEMINI_WORKOUT_GENERATION_FAILED:${lastError}`);
  }
);
