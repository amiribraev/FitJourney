'use client';

import { useMemo } from 'react';
import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import type { UserProfile } from '@/lib/definitions';
import { Loader2, UtensilsCrossed, Salad, Fish, Soup, Utensils } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { doc } from 'firebase/firestore';

const mealIcons: Record<string, JSX.Element> = {
  salad: <Salad className="h-5 w-5 text-green-500" />,
  salmon: <Fish className="h-5 w-5 text-pink-500" />,
  fish: <Fish className="h-5 w-5 text-pink-500" />,
  soup: <Soup className="h-5 w-5 text-orange-500" />,
  default: <Utensils className="h-5 w-5 text-primary" />,
};

const getMealIcon = (meal: string) => {
  const lowerMeal = meal.toLowerCase();
  for (const key in mealIcons) {
    if (lowerMeal.includes(key)) {
      return mealIcons[key];
    }
  }
  return mealIcons.default;
};

const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
  
  const sortedDays = useMemo(() => {
    if (!weeklyPlan) return [];
    return Object.keys(weeklyPlan).sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
  }, [weeklyPlan]);


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
            Ваш недельный рацион питания
          </CardTitle>
          <CardDescription>
            Этот план питания составлен ИИ специально для вас, чтобы помочь в достижении цели: {profile?.goal === 'weight loss' ? 'похудение' : 'набор массы'}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {weeklyPlan && sortedDays.length > 0 ? (
            <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
              {sortedDays.map((day, index) => (
                <AccordionItem value={`item-${index}`} key={day}>
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline capitalize">
                    {day}
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-4 pt-2">
                      {weeklyPlan[day].map((meal, mealIndex) => (
                        <li key={mealIndex} className="flex items-start gap-4 p-4 rounded-lg bg-background">
                          <div>{getMealIcon(meal.meal)}</div>
                          <div className="flex-1">
                            <p className="font-medium">{meal.meal}</p>
                            <p className="text-sm text-muted-foreground">{meal.calories} калорий</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
             <div className="text-center text-muted-foreground py-8">
                <p>План питания еще не создан.</p>
                <p className="text-sm">Пожалуйста, заполните свой профиль или подождите, пока AI сгенерирует ваш план.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
