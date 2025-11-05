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
    meal: z.string().describe('The meal suggestion.'),
    calories: z.number().describe('The estimated calorie count for the meal.'),
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
  return generateDietPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDietPlanPrompt',
  input: {schema: GenerateDietPlanInputSchema},
  output: {schema: GenerateDietPlanOutputSchema},
  prompt: `You are a personal trainer and nutritionist. You will generate a personalized weekly diet plan based on the user's age, gender, weight, height, and fitness goal.

  Age: {{{age}}}
  Gender: {{{gender}}}
  Weight: {{{weight}}} kg
  Height: {{{height}}} cm
  Goal: {{{goal}}}

  The weekly diet plan should include daily meal suggestions and estimated calorie counts. The weeklyDietPlan output should be a JSON object where keys are the days of the week (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday) and the values are arrays of meal suggestions for that day.
  Each meal suggestion object in the array should include the meal and the estimated calorie count. Ensure that the calorie count aligns with the specified fitness goal.
  Ensure you provide a full 7-day plan.

  Example:
  {
    "weeklyDietPlan": {
      "Monday": [
        { "meal": "Oatmeal with berries and nuts", "calories": 300 },
        { "meal": "Grilled chicken salad", "calories": 400 },
        { "meal": "Salmon with roasted vegetables", "calories": 500 }
      ],
      "Tuesday": [
        { "meal": "Greek yogurt with granola", "calories": 250 },
        { "meal": "Turkey sandwich on whole wheat bread", "calories": 350 },
        { "meal": "Lentil soup with a side of brown rice", "calories": 450 }
      ],
      ...and so on for all 7 days.
    }
  }
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
