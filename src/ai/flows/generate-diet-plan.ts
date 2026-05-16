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
  age: z.number().describe('The age of the user in years.'),
  gender: z.enum(['male', 'female']).describe('The gender of the user.'),
  weight: z.number().describe('The weight of the user in kilograms.'),
  height: z.number().describe('The height of the user in centimeters.'),
  goal: z.enum(['weight loss', 'muscle gain']).describe('The fitness goal of the user.'),
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
    Monday: DailyMealPlanSchema.describe("Meal plan for Monday."),
    Tuesday: DailyMealPlanSchema.describe("Meal plan for Tuesday."),
    Wednesday: DailyMealPlanSchema.describe("Meal plan for Wednesday."),
    Thursday: DailyMealPlanSchema.describe("Meal plan for Thursday."),
    Friday: DailyMealPlanSchema.describe("Meal plan for Friday."),
    Saturday: DailyMealPlanSchema.describe("Meal plan for Saturday."),
    Sunday: DailyMealPlanSchema.describe("Meal plan for Sunday."),
  }).describe('A weekly diet plan with daily meal suggestions and estimated calorie counts for all 7 days of the week.'),
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
  - Пол: {{{gender}}}
  - Вес: {{{weight}}} кг
  - Рост: {{{height}}} см
  - Цель: {{{goal}}} (weight loss = дефицит калорий, muscle gain = профицит и больше белка)

  ## Расчёт калорий
  1. Оцени базовый обмен (BMR) по формуле Миффлина — Сан Жеора.
  2. Умножь на коэффициент активности ~1.4 (умеренная активность).
  3. weight loss: −15…20% от суточной нормы; muscle gain: +10…15%.
  4. Сумма calories за день должна быть близка к суточной норме (допуск ±100 ккал).

  ## Структура каждого дня
  - Ровно 4 приёма: Завтрак, Обед, Ужин, Перекус (поле mealType).
  - meal — конкретное блюдо: продукты, способ готовки, размер порции в граммах или «1 порция».
  - calories — ккал на порцию (целое число).
   - budget — примерная цена порции в тенге для Казахстана (обычный супермаркет, без ресторанов).
  - protein — граммы белка в порции (число).

  ## Бюджет
  - Указывай реалистичный budget для каждой трапезы.
  - Варьируй блюда: не все дни одинаковые.
  - Для weight loss можно чуть экономнее; для muscle gain — больше белковых продуктов (бюджет выше).
   - Сумма budget за день — ориентир «~N ₸/день» можно упомянуть в meal только если нужно; в JSON достаточно полей budget.

  ## По цели
  - weight loss: больше овощей, клетчатки, нежирный белок; перекус лёгкий (150–250 ккал).
  - muscle gain: 1.6–2 г белка на кг веса в сутки; углеводы вокруг тренировок; перекус с белком.

  ## Разнообразие
  - 7 разных дней, без копипасты одного и того же меню.
  - Простые доступные продукты (курица, рыба, крупы, яйца, творог, овощи).
  - Избегай экзотики и дорогих деликатесов без необходимости.

  Ответ — только JSON. Ключ weeklyDietPlan, дни Monday … Sunday.

  Пример одного дня:
  {
    "weeklyDietPlan": {
      "Monday": [
        { "mealType": "Завтрак", "meal": "Овсянка на молоке 2.5% с бананом (300 г)", "calories": 380, "budget": 250, "protein": 14 },
        { "mealType": "Обед", "meal": "Индейка тушёная с рисом и салатом из огурца и помидора", "calories": 520, "budget": 1100, "protein": 45 },
        { "mealType": "Ужин", "meal": "Запечённая треска с брокколи (200 г рыбы)", "calories": 340, "budget": 1300, "protein": 38 },
        { "mealType": "Перекус", "meal": "Кефир 1% 250 мл + 2 цельнозерновых хлебца", "calories": 190, "budget": 350, "protein": 12 }
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
