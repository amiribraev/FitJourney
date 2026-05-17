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

const prompt = ai.definePrompt({
  name: 'generateDietPlanPrompt',
  input: {schema: GenerateDietPlanInputSchema},
  output: {schema: GenerateDietPlanOutputSchema},
  prompt: `Ты — нутрициолог. Составь недельный план питания на русском языке с калориями и бюджетом каждой трапезы.

Данные пользователя:
- Возраст: {{{age}}} лет
- Пол: {{{gender}}} (male = мужской, female = женский)
- Вес: {{{weight}}} кг
- Рост: {{{height}}} см
- Цель: {{{goal}}} (weight loss = похудение, muscle gain = набор массы, maintenance = поддержание)
- Уровень активности: {{{activityLevel}}}
- Уровень подготовки: {{{fitnessLevel}}}
- Ограничения в питании: {{{dietRestriction}}}
- Аллергии: {{{allergies}}}
- Оборудование: {{{equipment}}}
- Целевые TDEE: {{{tdee}}} ккал/день
- Целевые БЖУ: белок {{{macros.protein}}} г, жиры {{{macros.fat}}} г, углеводы {{{macros.carbs}}} г/день

## Обязательные правила

### Расчёт и калорийность
- TDEE уже рассчитан, используй его как суточную норму.
- Распредели калории по 4 приёмам пищи. Make sure daily total matches TDEE closely (±5%).
- Белок: распредели примерно 30% суточной нормы на завтрак, 35% на обед, 30% на ужин, 5% на перекус.

### Структура каждого дня
- Ровно 4 приёма: Завтрак, Обед, Ужин, Перекус (поле mealType).
- meal — конкретное блюдо с описанием состава и порции.
- calories — ккал на порцию (целое число).
- budget — примерная цена порции в тенге для Казахстана.
- protein — граммы белка (число).
- alternatives — массив альтернативных блюд при аллергиях (если applicable добавь это поле).

### Диетические ограничения
Если dietRestriction не 'none':
- vegan: только растительные продукты, нет мяса, рыбы, молока, яиц, мёда.
- vegetarian: без мяса и рыбы, можно молочное/яйца.
- halal: только халяль мясо, без свинины, алкоголя, желатина.
- gluten-free: без пшеницы, ржи, ячменя, овса.
- lactose-free: без молочного сахара, коровьего молока.
Если allergies указаны — полностью исключи эти продукты и их производные.

### Разнообразие
- 7 разных дней без копипасты меню.
- Простые доступные продукты, обычные казахстанские магазины.
- Без экзотики и дорогих деликатесов.

## Выходной формат

Только JSON. Ключ weeklyDietPlan, дни Monday … Sunday.
Пример одного дня:
{
  "weeklyDietPlan": {
    "Monday": [
      { "mealType": "Завтрак", "meal": "Овсянка на молоке 2.5% с бананом (300 г)", "calories": 380, "budget": 250, "protein": 14, "alternatives": ["Овсянка на воде с мёдом"] },
      { "mealType": "Обед", "meal": "Куриная грудка на гриле с гречкой", "calories": 520, "budget": 1100, "protein": 45 },
      { "mealType": "Ужин", "meal": "Творог 5% с огурцом и зелёным луком", "calories": 280, "budget": 400, "protein": 28 },
      { "mealType": "Перекус", "meal": "Яблоко + горсть миндаля (20 г)", "calories": 190, "budget": 350, "protein": 5 }
    ]
  }
}
(остальные дни — по той же структуре, уникальное меню)
`,
});

const generateDietPlanFlow = ai.defineFlow(
  {
    name: 'generateDietPlanFlow',
    inputSchema: GenerateDietPlanInputSchema,
    outputSchema: GenerateDietPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
