'use server';

/**
 * @fileOverview A workout plan generation AI agent.
 * 
 * - generateWorkoutPlan - A function that handles the workout plan generation process.
 * - GenerateWorkoutPlanInput - The input type for the generateWorkoutPlan function.
 * - GenerateWorkoutPlanOutput - The return type for the generateWorkoutPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWorkoutPlanInputSchema = z.object({
  age: z.number().describe('The age of the user.'),
  gender: z.enum(['male', 'female']).describe('The gender of the user.'),
  weight: z.number().describe('The weight of the user in kilograms.'),
  height: z.number().describe('The height of the user in centimeters.'),
  goal: z.enum(['weight loss', 'muscle gain']).describe('The fitness goal of the user.'),
});
export type GenerateWorkoutPlanInput = z.infer<typeof GenerateWorkoutPlanInputSchema>;

const DailyWorkoutPlanSchema = z.array(z.string()).describe(
  "Упражнения на день. Каждая строка — одно упражнение в формате: «Название — подходы × повторения/время, отдых N сек». Для кардио указывай длительность и интенсивность. В день отдыха — пустой массив или одна строка «Отдых»."
);

const GenerateWorkoutPlanOutputSchema = z.object({
  weeklyWorkoutPlan: z.object({
    Monday: DailyWorkoutPlanSchema.describe("Workout plan for Monday."),
    Tuesday: DailyWorkoutPlanSchema.describe("Workout plan for Tuesday."),
    Wednesday: DailyWorkoutPlanSchema.describe("Workout plan for Wednesday."),
    Thursday: DailyWorkoutPlanSchema.describe("Workout plan for Thursday."),
    Friday: DailyWorkoutPlanSchema.describe("Workout plan for Friday."),
    Saturday: DailyWorkoutPlanSchema.describe("Workout plan for Saturday."),
    Sunday: DailyWorkoutPlanSchema.describe("Workout plan for Sunday."),
  }).describe('A weekly workout plan with daily exercises for all 7 days of the week.'),
});
export type GenerateWorkoutPlanOutput = z.infer<typeof GenerateWorkoutPlanOutputSchema>;

export async function generateWorkoutPlan(input: GenerateWorkoutPlanInput): Promise<GenerateWorkoutPlanOutput> {
  try {
    return await generateWorkoutPlanFlow(input);
  } catch (error) {
    console.error('Error generating workout plan:', error);
    // Return fallback workout plan on error
    return getFallbackWorkoutPlan();
  }
}

// Fallback plan when API fails
function getFallbackWorkoutPlan(): GenerateWorkoutPlanOutput {
  return {
    weeklyWorkoutPlan: {
      Monday: [
        'Разминка — 5 мин лёгкой ходьбы на месте',
        'Приседания — 3 подхода × 15 повторений, отдых 60 сек',
        'Отжимания — 3 подхода × 10 повторений, отдых 60 сек',
        'Планка — 3 подхода × 30 сек, отдых 45 сек',
        'Заминка — 5 мин растяжки',
      ],
      Tuesday: ['Отдых — восстановление, лёгкая прогулка 20 мин по желанию'],
      Wednesday: [
        'Бег на месте / велотренажёр — 20 мин, умеренный темп',
        'Выпады — 3 подхода × 12 на каждую ногу, отдых 60 сек',
        'Скручивания — 3 подхода × 15 повторений, отдых 45 сек',
      ],
      Thursday: ['Отдых'],
      Friday: [
        'Разминка — 5 мин',
        'Приседания с выпрыгиванием — 3 × 12, отдых 60 сек',
        'Берпи — 3 × 8, отдых 90 сек',
        'Растяжка всего тела — 10 мин',
      ],
      Saturday: ['Йога или растяжка — 25 мин, спокойный темп'],
      Sunday: ['Отдых'],
    },
  };
}

const prompt = ai.definePrompt({
  name: 'generateWorkoutPlanPrompt',
  input: {schema: GenerateWorkoutPlanInputSchema},
  output: {schema: GenerateWorkoutPlanOutputSchema},
  prompt: `Ты — персональный тренер. Составь понятный недельный план тренировок на русском языке.

  Данные пользователя:
  - Возраст: {{{age}}} лет
  - Пол: {{{gender}}}
  - Вес: {{{weight}}} кг
  - Рост: {{{height}}} см
  - Цель: {{{goal}}} (weight loss = похудение, muscle gain = набор мышечной массы)

  ## Формат каждого упражнения (обязательно)
  Каждый элемент массива — одна строка. Пользователь должен сразу понимать объём нагрузки:
  - Силовые: «Название — N подходов × M повторений, отдых X сек» (при необходимости: «вес: лёгкий/средний/тяжёлый» или «с собственным весом»).
  - Кардио: «Название — N мин, темп: лёгкий/умеренный/интенсивный».
  - Изометрия: «Планка — 3 подхода × 40 сек, отдых 45 сек».
  - Разминка и заминка — отдельными строками в начале и конце тренировочного дня.

  ## Структура недели
  - Полный план на 7 дней: Monday … Sunday.
  - 2–4 тренировочных дня, 1–2 дня лёгкой активности (йога, растяжка, прогулка), остальное — отдых.
  - В день отдыха: один элемент «Отдых» или пустой массив; можно добавить «лёгкая прогулка 20–30 мин».
  - На тренировочный день: 5–8 строк (разминка + 3–5 упражнений + заминка).
  - Учитывай возраст и пол: безопасные нагрузки, без экстремальных объёмов для новичков.

  ## По цели
  - weight loss: круговые и full-body, кардио 2–3 раза в неделю, больше повторений (12–20), короткий отдых 45–60 сек.
  - muscle gain: базовые многосуставные, 3–5 подходов, 6–12 повторений, отдых 90–120 сек, меньше кардио.

  ## Дополнительно (включай в строки, где уместно)
  - Подсказка по технике в скобках, если упражнение неочевидное: «(спина прямая, колени не выходят за носки)».
  - Ориентир по длительности всей тренировки в первой или последней строке дня: «~45 мин».

  Ответ — только JSON по схеме. Ключ weeklyWorkoutPlan, внутри дни недели на английском (Monday … Sunday).

  Пример:
  {
    "weeklyWorkoutPlan": {
      "Monday": [
        "Разминка — 5 мин: суставная гимнастика, лёгкий бег на месте",
        "Приседания — 3 подхода × 15 повторений, отдых 60 сек (собственный вес)",
        "Отжимания от пола — 3 × 10, отдых 60 сек",
        "Планка — 3 × 40 сек, отдых 45 сек",
        "Заминка — 5 мин растяжки ног и спины",
        "~40 мин всего"
      ],
      "Tuesday": ["Отдых"],
      "Wednesday": [
        "Бег / эллипс — 25 мин, умеренный темп",
        "Выпады — 3 × 12 на каждую ногу, отдых 60 сек",
        "Скручивания — 3 × 20, отдых 45 сек"
      ],
      "Thursday": ["Отдых"],
      "Friday": [
        "Разминка — 5 мин",
        "Жим гантелей лёжа — 4 × 8, отдых 90 сек, вес средний",
        "Тяга в наклоне — 4 × 10, отдых 90 сек",
        "Заминка — 5 мин"
      ],
      "Saturday": ["Йога — 30 мин, спокойный темп"],
      "Sunday": ["Отдых"]
    }
  }
  `,
});

const generateWorkoutPlanFlow = ai.defineFlow(
  {
    name: 'generateWorkoutPlanFlow',
    inputSchema: GenerateWorkoutPlanInputSchema,
    outputSchema: GenerateWorkoutPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
