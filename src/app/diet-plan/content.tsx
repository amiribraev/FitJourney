'use client';

import { useMemo } from 'react';
import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import type { UserProfile } from '@/lib/definitions';
import { Loader2, UtensilsCrossed, Salad, Fish, Soup, Utensils } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

// Memoized meal icons (static data outside component)
const MEAL_ICONS: Record<string, JSX.Element> = {
  salad: <Salad className="h-5 w-5 text-green-500" />,
  salmon: <Fish className="h-5 w-5 text-pink-500" />,
  fish: <Fish className="h-5 w-5 text-pink-500" />,
  soup: <Soup className="h-5 w-5 text-orange-500" />,
  default: <Utensils className="h-5 w-5 text-primary" />,
};

// Memoized day translations (static data outside component)
const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_TRANSLATIONS: Record<string, string> = {
  Monday: 'Понедельник',
  Tuesday: 'Вторник',
  Wednesday: 'Среда',
  Thursday: 'Четверг',
  Friday: 'Пятница',
  Saturday: 'Суббота',
  Sunday: 'Воскресенье',
};

// Memoized function to get meal icon
const getMealIcon = (meal: string) => {
  const lowerMeal = meal.toLowerCase();
  for (const key in MEAL_ICONS) {
    if (lowerMeal.includes(key)) {
      return MEAL_ICONS[key];
    }
  }
  return MEAL_ICONS.default;
};

export default function DietPlanContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const loading = isUserLoading || isProfileLoading;

  const weeklyPlan = profile?.dietPlan?.weeklyDietPlan;

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8 px-4 md:px-6">
      <Card className="w-full max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center gap-2">
            <UtensilsCrossed className="h-8 w-8 text-primary" />
            Ваш недельный рацион
          </CardTitle>
          <CardDescription>
            Этот план питания составлен ИИ специально для вас, чтобы помочь в достижении цели: {profile?.goal === 'weight loss' ? 'похудение' : 'набор массы'}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
            {DAY_ORDER.map((day, index) => (
              <AccordionItem value={`item-${index}`} key={day}>
                <AccordionTrigger className="text-lg font-semibold hover:no-underline capitalize">
                  {DAY_TRANSLATIONS[day]}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-4 pt-2">
                    {weeklyPlan && weeklyPlan[day as keyof typeof weeklyPlan] ? (() => {
                      const dayMeals = weeklyPlan[day as keyof typeof weeklyPlan] as {
                        meal: string;
                        calories: number;
                        mealType?: string;
                        budget?: number;
                        protein?: number;
                      }[];
                      const dayCalories = dayMeals.reduce((sum, m) => sum + (m.calories ?? 0), 0);
                      const dayBudget = dayMeals.reduce((sum, m) => sum + (m.budget ?? 0), 0);
                      const dayProtein = dayMeals.reduce((sum, m) => sum + (m.protein ?? 0), 0);
                      return (
                      <>
                      {dayMeals.map((meal, mealIndex) => (
                        <li key={mealIndex} className="flex items-start gap-4 p-4 rounded-lg bg-background">
                          <div>{getMealIcon(meal.meal)}</div>
                          <div className="flex-1">
                            {meal.mealType && (
                              <p className="text-xs font-medium uppercase tracking-wide text-primary mb-1">
                                {meal.mealType}
                              </p>
                            )}
                            <p className="font-medium">{meal.meal}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {meal.calories} ккал
                              {meal.protein != null && ` · белок ~${meal.protein} г`}
                              {meal.budget != null && ` · ~${meal.budget} ₽`}
                            </p>
                          </div>
                        </li>
                      ))}
                      <li className="pt-2 border-t text-sm font-medium text-muted-foreground">
                        Итого за день: {dayCalories} ккал
                        {dayProtein > 0 && ` · белок ~${dayProtein} г`}
                        {dayBudget > 0 && ` · бюджет ~${dayBudget} ₽`}
                      </li>
                      </>
                      );
                    })() : (
                      // Skeleton loader for meals
                      [...Array(3)].map((_, i) => (
                        <li key={i} className="flex items-start gap-4 p-4 rounded-lg bg-background">
                          <Skeleton className="h-6 w-6 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
