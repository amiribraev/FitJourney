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
  age: z.number().describe('Возраст пользователя в годах.'),
  gender: z.enum(['male', 'female']).describe('Пол пользователя.'),
  weight: z.number().describe('Вес в кг.'),
  height: z.number().describe('Рост в см.'),
  goal: z.enum(['weight loss', 'muscle gain', 'maintenance']).describe('Цель: похудение, набор массы или поддержание.'),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).describe('Уровень подготовки beginner / intermediate / advanced.'),
  equipment: z.enum(['gym', 'home', 'no-equipment']).describe('Доступное оборудование.'),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very-active']).describe('Общий уровень активности.'),
  injuries: z.array(z.string()).default([]).describe('Список травм/заболеваний, чтобы их избегать в плане.'),
});
export type GenerateWorkoutPlanInput = z.infer<typeof GenerateWorkoutPlanInputSchema>;

const DailyWorkoutPlanSchema = z.array(z.string()).describe(
  "Упражнения на день. Каждая строка — одно упражнение в формате: «Название — подходы × повторения/время, отдых N сек». Для кардио указывай длительность и интенсивность. В день отдыха — пустой массив или одна строка «Отдых». При injuries избегай упражнений, затрагивающих травмированные зоны."
);

const GenerateWorkoutPlanOutputSchema = z.object({
  weeklyWorkoutPlan: z.object({
    Monday: DailyWorkoutPlanSchema.describe("План тренировок на понедельник."),
    Tuesday: DailyWorkoutPlanSchema.describe("План тренировок на вторник."),
    Wednesday: DailyWorkoutPlanSchema.describe("План тренировок на среду."),
    Thursday: DailyWorkoutPlanSchema.describe("План тренировок на четверг."),
    Friday: DailyWorkoutPlanSchema.describe("План тренировок на пятницу."),
    Saturday: DailyWorkoutPlanSchema.describe("План тренировок на субботу."),
    Sunday: DailyWorkoutPlanSchema.describe("План тренировок на воскресенье."),
  }).describe('Недельный план тренировок с ежедневными упражнениями на все 7 дней.'),
  equipment: z.string().describe('Оборудование использованное в плане.'),
  fitnessLevel: z.string().describe('Уровень подготовки плана.'),
});
export type GenerateWorkoutPlanOutput = z.infer<typeof GenerateWorkoutPlanOutputSchema> & {
  equipment: Equipment;
  fitnessLevel: FitnessLevel;
};

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
- Цель: {{{goal}}} (weight loss = похудение, muscle gain = набор массы, maintenance = поддержание)
- Уровень подготовки: {{{fitnessLevel}}} (beginner = новичок, intermediate = средний, advanced = продвинутый)
- Оборудование: {{{equipment}}} (gym = зал, home = дома, no-equipment = без оборудования)
- Уровень активности: {{{activityLevel}}}
- Травмы/ограничения: {{{injuries}}} (абсолютно избегай упражнений, затрагивающих эти зоны)

## Формат каждого упражнения (обязательно)
Каждый элемент массива — одна строка. Пользователь должен сразу понимать объём нагрузки:
- Силовые: «Название — N подходов × M повторений, отдых X сек» (при необходимости: «с собственным весом» или вес гантелей/штанги).
- Кардио: «Название — N мин, темп: лёгкий/умеренный/интенсивный».
- Изометрия: «Планка — 3 подхода × 40 сек, отдых 45 сек».
- Разминка и заминка — отдельными строками в начале и конце тренировочного дня.

## Учёт травм и ограничений
Если injuries не пустой массив — категорически исключи упражнения, которые могут травмировать указанные зоны. Например: при боли в коленях избегай глубоких приседаний и выпадов; при проблемах с поясницей избегай наклонов с тяжестью и подъёмов ног.

## Учёт оборудования
- gym: используй тренажёры, штангу, гантели, скамью.
- home: используй собственный вес, гантели, резиновые ленты.
- no-equipment: только bodyweight упражнения, без дополнительного оборудования.

## Учёт уровня подготовки
- beginner: простые базовые упражнения, меньше подходов, больше отдыха. Без сложных элементов.
- intermediate: можно добавить комбинированные упражнения и сусеты, умеренный объём.
- advanced: сложные упражнения, больший объём, тренировки до отказа.

## Структура недели
- Полный план на 7 дней: Monday … Sunday.
- 3–5 тренировочных дней, 1–2 дня лёгкой активности, остальное — отдых.
- На тренировочный день: 5–8 строк (разминка + 3–6 упражнений + заминка).
- orientation: ≈45 мин для novice/intermediate, ≈60 мин для advanced.

## По цели
- weight loss: кардио 3–4 раза/неделя, высокие повторения (12–20), короткий отдых 30–45 сек, круговые тренировки.
- muscle gain: базовые многосуставные, 3–5 подходов, 6–12 повторений, отдых 90 сек, меньше кардио.
- maintenance: баланс силовых и кардио, умеренные объёмы.

## Дополнительно
- Подсказка по технике в скобках для сложных упражнений.
- Ориентир по длительности всей тренировки можно указать последней строкой: «~45 мин».

Ответ — только JSON по схеме. Ключ weeklyWorkoutPlan, внутри дни недели на английском (Monday … Sunday).

Пример:
{
  "weeklyWorkoutPlan": {
    "Monday": [
      "Разминка — 5 мин: суставная гимнастика, ходьба на месте",
      "Приседания — 3 подхода × 15 повторений, отдых 60 сек (собственный вес, спина прямая)",
      "Отжимания от пола — 3 × 10, отдых 60 сек",
      "Планка — 3 × 40 сек, отдых 45 сек",
      "Заминка — 5 мин растяжки ног и спины",
      "~40 мин всего"
    ],
    "Tuesday": ["Отдых"],
    "Wednesday": [
      "Разминка — 5 мин",
      "Выпады назад — 3 × 10 на каждую ногу, отдых 60 сек",
      "Скручивания — 3 × 15, отдых 45 сек",
      "Бёрпи — 3 × 6, отдых 90 сек",
      "Заминка — 5 мин",
      "~35 мин всего"
    ],
    "Thursday": ["Отдых"],
    "Friday": [
      "Разминка — 5 мин",
      "Прыжки на месте / скакалка — 3 × 1 мин, отдых 30 сек",
      "Приседания с выпрыгиванием — 3 × 10, отдых 60 сек",
      "Планка боковая — 2 × 30 сек на каждую сторону, отдых 45 сек",
      "Заминка — 5 мин",
      "~30 мин всего"
    ],
    "Saturday": ["Йога или растяжка — 25 мин, спокойный темп"],
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
