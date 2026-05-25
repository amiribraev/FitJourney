import { z } from 'genkit';

export type SafeLanguage = 'ru' | 'kk' | 'en';

const MOJIBAKE_MARKERS = ['РÐ', 'Р–', 'Рё', 'PSC', 'Ð', 'Ñ'];

export function getSafeLanguage(language?: string): SafeLanguage {
  if (language === 'kk' || language === 'en' || language === 'ru') return language;
  return 'ru';
}

export function getGeminiLanguageInstruction(language?: string): string {
  const safeLanguage = getSafeLanguage(language);
  const common = 'If output is JSON, keep JSON keys in English and translate only text values.';

  if (safeLanguage === 'kk') {
    return 'Жауапты тек қазақ тілінде бер. Тілдерді араластырма. Қазақ әріптерін (ә, ғ, қ, ң, ө, ұ, ү, і, һ) дұрыс қолдан. ' + common;
  }

  if (safeLanguage === 'en') {
    return 'Respond only in English. ' + common;
  }

  return 'Отвечай только на русском языке. ' + common;
}

function asCsv(arr?: string[]): string {
  return arr && arr.length ? arr.join(', ') : 'none';
}

export function buildDietPrompt(input: {
  language?: string;
  age: number;
  gender: string;
  weight: number;
  height: number;
  goal: string;
  activityLevel: string;
  fitnessLevel: string;
  dietRestriction: string;
  allergies: string[];
  intolerances?: string[];
  foodPreferences?: string[];
  tdee: number;
  macros: { protein: number; fat: number; carbs: number };
}): string {
  const languageInstruction = getGeminiLanguageInstruction(input.language);

  return `${languageInstruction}\n\nYou are a nutrition expert. Create a 7-day meal plan.\n\nUser profile:\n- age: ${input.age}\n- gender: ${input.gender}\n- weight: ${input.weight}\n- height: ${input.height}\n- goal: ${input.goal}\n- activityLevel: ${input.activityLevel}\n- fitnessLevel: ${input.fitnessLevel}\n- tdee: ${input.tdee}\n- macros: protein ${input.macros.protein}, fat ${input.macros.fat}, carbs ${input.macros.carbs}\n\nStrict filters:\n- dietRestriction: ${input.dietRestriction}\n- allergies: ${asCsv(input.allergies)}\n- intolerances: ${asCsv(input.intolerances)}\n- foodPreferences: ${asCsv(input.foodPreferences)}\n\nOutput requirements:\n- Return valid JSON only, no markdown, no comments.\n- Keep all JSON keys in English exactly as requested.\n- weeklyDietPlan must include Monday..Sunday.\n- Each day must include 4 meals with mealType, meal, calories, budget, protein.`;
}

export function buildWorkoutPrompt(input: {
  language?: string;
  age: number;
  gender: string;
  weight: number;
  height: number;
  goal: string;
  activityLevel: string;
  fitnessLevel: string;
  equipment: string;
  injuries: string[];
  loadRestrictions?: string[];
  workoutGoals?: string[];
}): string {
  const languageInstruction = getGeminiLanguageInstruction(input.language);

  return `${languageInstruction}\n\nYou are a personal trainer. Create a clear 7-day workout plan.\n\nUser profile:\n- age: ${input.age}\n- gender: ${input.gender}\n- weight: ${input.weight}\n- height: ${input.height}\n- goal: ${input.goal}\n- activityLevel: ${input.activityLevel}\n- fitnessLevel: ${input.fitnessLevel}\n- equipment: ${input.equipment}\n\nStrict filters:\n- injuries: ${asCsv(input.injuries)}\n- loadRestrictions: ${asCsv(input.loadRestrictions)}\n- workoutGoals: ${asCsv(input.workoutGoals)}\n\nOutput requirements:\n- Return valid JSON only, no markdown, no comments.\n- Keep all JSON keys in English exactly as requested.\n- weeklyWorkoutPlan must include Monday..Sunday.\n- Each day value is an array of exercise strings.`;
}

export function containsMojibake(text: string): boolean {
  return MOJIBAKE_MARKERS.some((m) => text.includes(m));
}

function hasMojibakeDeep(value: unknown): boolean {
  if (typeof value === 'string') return containsMojibake(value);
  if (Array.isArray(value)) return value.some(hasMojibakeDeep);
  if (value && typeof value === 'object') return Object.values(value as Record<string, unknown>).some(hasMojibakeDeep);
  return false;
}

function extractJson(raw: string): string {
  const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  return cleaned;
}

export function logGeminiResult(params: {
  scenario: string;
  language: SafeLanguage;
  model: string;
  success: boolean;
  reason?: 'parse' | 'validation' | 'mojibake' | 'model' | 'unknown';
}): void {
  const { scenario, language, model, success, reason } = params;
  const payload = { scenario, language, model, success, reason: reason || null };
  if (success) {
    console.info('[gemini]', payload);
  } else {
    console.warn('[gemini]', payload);
  }
}

export function parseAndValidateGeminiJson<T>(rawText: string, schema: z.ZodSchema<T>): T {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(rawText));
  } catch {
    throw new Error('GEMINI_PARSE_ERROR');
  }

  const validated = schema.safeParse(parsed);
  if (!validated.success) {
    throw new Error('GEMINI_VALIDATION_ERROR');
  }

  if (hasMojibakeDeep(validated.data)) {
    throw new Error('GEMINI_MOJIBAKE_ERROR');
  }

  return validated.data;
}
