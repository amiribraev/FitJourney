'use client';

import { useMemo } from 'react';
import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import type { UserProfile } from '@/lib/definitions';
import { Loader2, UtensilsCrossed, Salad, Fish, Soup, Utensils } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const MEAL_ICONS: Record<string, JSX.Element> = {
  salad: <Salad className="h-5 w-5 text-green-500" />,
  salmon: <Fish className="h-5 w-5 text-pink-500" />,
  fish: <Fish className="h-5 w-5 text-pink-500" />,
  soup: <Soup className="h-5 w-5 text-orange-500" />,
  default: <Utensils className="h-5 w-5 text-primary" />,
};

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

type Lang = 'ru' | 'kk' | 'en';

const UI = {
  ru: {
    title: 'Ваш недельный рацион',
    descPrefix: 'Этот план питания составлен ИИ специально для вас, чтобы помочь в достижении цели:',
    goalLoss: 'похудение',
    goalGain: 'набор массы',
    calories: 'ккал',
    protein: 'белок',
    budget: 'бюджет',
    total: 'Итого за день',
    currency: '₸',
    days: {
      Monday: 'Понедельник', Tuesday: 'Вторник', Wednesday: 'Среда', Thursday: 'Четверг', Friday: 'Пятница', Saturday: 'Суббота', Sunday: 'Воскресенье',
    },
  },
  kk: {
    title: 'Сіздің апталық тамақтану жоспарыңыз',
    descPrefix: 'Бұл тамақтану жоспары мақсатыңызға жетуге көмектесу үшін ЖИ арқылы жасалды:',
    goalLoss: 'салмақ тастау',
    goalGain: 'бұлшықет массасын арттыру',
    calories: 'ккал',
    protein: 'ақуыз',
    budget: 'бюджет',
    total: 'Күндік қорытынды',
    currency: '₸',
    days: {
      Monday: 'Дүйсенбі', Tuesday: 'Сейсенбі', Wednesday: 'Сәрсенбі', Thursday: 'Бейсенбі', Friday: 'Жұма', Saturday: 'Сенбі', Sunday: 'Жексенбі',
    },
  },
  en: {
    title: 'Your Weekly Diet Plan',
    descPrefix: 'This AI plan is tailored to help you reach your goal:',
    goalLoss: 'weight loss',
    goalGain: 'muscle gain',
    calories: 'kcal',
    protein: 'protein',
    budget: 'budget',
    total: 'Daily total',
    currency: '₸',
    days: {
      Monday: 'Monday', Tuesday: 'Tuesday', Wednesday: 'Wednesday', Thursday: 'Thursday', Friday: 'Friday', Saturday: 'Saturday', Sunday: 'Sunday',
    },
  },
} as const;

const getMealIcon = (meal: string) => {
  const lowerMeal = meal.toLowerCase();
  for (const key in MEAL_ICONS) {
    if (lowerMeal.includes(key)) return MEAL_ICONS[key];
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
  const lang: Lang = profile?.language === 'kk' || profile?.language === 'en' ? profile.language : 'ru';
  const t = UI[lang];

  if (loading) {
    return <div className="flex h-[calc(100vh-200px)] items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container py-8 px-4 md:px-6">
      <Card className="w-full max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center gap-2">
            <UtensilsCrossed className="h-8 w-8 text-primary" />
            {t.title}
          </CardTitle>
          <CardDescription>
            {t.descPrefix} {profile?.goal === 'weight loss' ? t.goalLoss : t.goalGain}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
            {DAY_ORDER.map((day, index) => (
              <AccordionItem value={`item-${index}`} key={day}>
                <AccordionTrigger className="text-lg font-semibold hover:no-underline capitalize">{t.days[day]}</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-4 pt-2">
                    {weeklyPlan && weeklyPlan[day] ? (() => {
                      const dayMeals = weeklyPlan[day] as { meal: string; calories: number; mealType?: string; budget?: number; protein?: number; }[];
                      const dayCalories = dayMeals.reduce((sum, m) => sum + (m.calories ?? 0), 0);
                      const dayBudget = dayMeals.reduce((sum, m) => sum + (m.budget ?? 0), 0);
                      const dayProtein = dayMeals.reduce((sum, m) => sum + (m.protein ?? 0), 0);
                      return (<>
                        {dayMeals.map((meal, mealIndex) => (
                          <li key={mealIndex} className="flex items-start gap-4 p-4 rounded-lg bg-background">
                            <div>{getMealIcon(meal.meal)}</div>
                            <div className="flex-1">
                              {meal.mealType && <p className="text-xs font-medium uppercase tracking-wide text-primary mb-1">{meal.mealType}</p>}
                              <p className="font-medium">{meal.meal}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {meal.calories} {t.calories}
                                {meal.protein != null && ` · ${t.protein} ~${meal.protein} g`}
                                {meal.budget != null && ` · ~${meal.budget} ${t.currency}`}
                              </p>
                            </div>
                          </li>
                        ))}
                        <li className="pt-2 border-t text-sm font-medium text-muted-foreground">
                          {t.total}: {dayCalories} {t.calories}
                          {dayProtein > 0 && ` · ${t.protein} ~${dayProtein} g`}
                          {dayBudget > 0 && ` · ${t.budget} ~${dayBudget} ${t.currency}`}
                        </li>
                      </>);
                    })() : [...Array(3)].map((_, i) => (
                      <li key={i} className="flex items-start gap-4 p-4 rounded-lg bg-background">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>
                      </li>
                    ))}
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
