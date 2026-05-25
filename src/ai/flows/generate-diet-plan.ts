'use server';

/**
 * @fileOverview A diet plan generation AI agent.
 *
 * - generateDietPlan - A function that handles the diet plan generation process.
 * - GenerateDietPlanInput - The input type for the generateDietPlan function.
 * - GenerateDietPlanOutput - The return type for the generateDietPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {
  buildDietPrompt,
  getSafeLanguage,
  logGeminiResult,
  parseAndValidateGeminiJson,
} from '@/ai/gemini';

const GenerateDietPlanInputSchema = z.object({
  age: z.number().describe('Возраст пользователя в годах.'),
  gender: z.enum(['male', 'female']).describe('Пол пользователя.'),
  weight: z.number().describe('Вес в кг.'),
  height: z.number().describe('Рост в см.'),
  goal: z.enum(['weight loss', 'muscle gain', 'maintenance']).describe('Цель: похудение, набор массы или поддержание.'),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very-active']).describe('Уровень активности по шкале 1–5.'),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).describe('Уровень подготовки.'),
  dietRestriction: z.enum(['none', 'vegan', 'vegetarian', 'halal', 'gluten-free', 'lactose-free']).describe('Ограничения в питании.'),
  allergies: z.array(z.string()).default([]).describe('Список аллергенов, которых следует избегать.'),
  equipment: z.enum(['gym', 'home', 'no-equipment']).describe('Доступное оборудование.'),
  language: z.string().optional().default('ru').describe('Язык ответа: ru, kk или en.'),
  tdee: z.number().describe('Рассчитанная суточная норма калорий (TDEE) с учётом цели.'),
  macros: z.object({
    protein: z.number().describe('Норма белка в граммах в сутки.'),
    fat: z.number().describe('Норма жиров в граммах в сутки.'),
    carbs: z.number().describe('Норма углеводов в граммах в сутки.'),
  }),
});
export type GenerateDietPlanInput = z.infer<typeof GenerateDietPlanInputSchema>;

const DailyMealPlanSchema = z.array(
  z.object({
    mealType: z.enum(['Завтрак', 'Обед', 'Ужин', 'Перекус']).describe('Тип приёма пищи.'),
    meal: z.string().describe('Название блюда с кратким составом или порцией.'),
    calories: z.number().describe('Калорийность порции в ккал.'),
    budget: z.number().describe('Примерная стоимость одной порции в тенге (Казахстан, обычные магазины).'),
    protein: z.number().optional().describe('Белки в граммах (приблизительно).'),
  })
);

const GenerateDietPlanOutputSchema = z.object({
  weeklyDietPlan: z.object({
    Monday: DailyMealPlanSchema.describe("План питания на понедельник."),
    Tuesday: DailyMealPlanSchema.describe("План питания на вторник."),
    Wednesday: DailyMealPlanSchema.describe("План питания на среду."),
    Thursday: DailyMealPlanSchema.describe("План питания на четверг."),
    Friday: DailyMealPlanSchema.describe("План питания на пятницу."),
    Saturday: DailyMealPlanSchema.describe("План питания на субботу."),
    Sunday: DailyMealPlanSchema.describe("План питания на воскресенье."),
  }).describe('Недельный план питания с ежедневными вариантами блюд и примерной стоимостью.'),
});
export type GenerateDietPlanOutput = z.infer<typeof GenerateDietPlanOutputSchema>;

export async function generateDietPlan(input: GenerateDietPlanInput): Promise<GenerateDietPlanOutput> {
  try {
    return await generateDietPlanFlow(input);
  } catch (error) {
    console.error('Error generating diet plan:', error);
    // Return fallback diet plan on error
    return getFallbackDietPlan();
  }
}

// Fallback plan when API fails
function getFallbackDietPlan(): GenerateDietPlanOutput {
  const dayMeals = [
    { mealType: 'Завтрак' as const, meal: 'Овсянка на воде с яблоком (порция 250 г)', calories: 320, budget: 200, protein: 10 },
    { mealType: 'Обед' as const, meal: 'Куриная грудка с гречкой и овощами', calories: 480, budget: 850, protein: 42 },
    { mealType: 'Ужин' as const, meal: 'Творог 5% с огурцом', calories: 280, budget: 400, protein: 28 },
    { mealType: 'Перекус' as const, meal: 'Яблоко и горсть миндаля (20 г)', calories: 180, budget: 250, protein: 5 },
  ];
  return {
    weeklyDietPlan: {
      Monday: dayMeals,
      Tuesday: dayMeals,
      Wednesday: dayMeals,
      Thursday: dayMeals,
      Friday: dayMeals,
      Saturday: dayMeals,
      Sunday: dayMeals,
    },
  };
}

const generateDietPlanFlow = ai.defineFlow(
  {
    name: 'generateDietPlanFlow',
    inputSchema: GenerateDietPlanInputSchema,
    outputSchema: GenerateDietPlanOutputSchema,
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
          prompt: buildDietPrompt(input),
          config: { temperature: 0.4 },
        });
        const parsed = parseAndValidateGeminiJson(response.text, GenerateDietPlanOutputSchema);
        logGeminiResult({ scenario: 'diet', language, model, success: true });
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
        logGeminiResult({ scenario: 'diet', language, model, success: false, reason: lastError });
      }
    }

    throw new Error(`GEMINI_DIET_GENERATION_FAILED:${lastError}`);
  }
);
