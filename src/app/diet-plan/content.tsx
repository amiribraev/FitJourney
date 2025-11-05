'use client';

import { useMemo } from 'react';
import { useUser, useDoc } from '@/firebase';
import type { UserProfile } from '@/lib/definitions';
import { Loader2, UtensilsCrossed, Salad, Fish, Soup } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { doc, getFirestore } from 'firebase/firestore';

const mealIcons = {
  default: <UtensilsCrossed className="h-5 w-5 text-primary" />,
  salad: <Salad className="h-5 w-5 text-green-500" />,
  salmon: <Fish className="h-5 w-5 text-pink-500" />,
  soup: <Soup className="h-5 w-5 text-orange-500" />,
};

const getMealIcon = (meal: string) => {
  const lowerMeal = meal.toLowerCase();
  if (lowerMeal.includes('салат')) return mealIcons.salad;
  if (lowerMeal.includes('лосось') || lowerMeal.includes('рыба')) return mealIcons.salmon;
  if (lowerMeal.includes('суп')) return mealIcons.soup;
  return mealIcons.default;
};

const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function DietPlanContent() {
  const { user, isUserLoading } = useUser();
  const firestore = getFirestore();

  const userProfileRef = useMemo(() => {
    if (!user) return undefined;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const loading = isUserLoading || isProfileLoading;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const weeklyPlan = profile?.dietPlan?.weeklyDietPlan;
  
  const sortedDays = weeklyPlan ? Object.keys(weeklyPlan).sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b)) : [];


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
            <Accordion type="single" collapsible className="w-full">
              {sortedDays.map((day, index) => (
                <AccordionItem value={`item-${index}`} key={day}>
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">
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
            <p className="text-center text-muted-foreground py-8">
              План питания еще не создан. Пожалуйста, заполните свой профиль.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
