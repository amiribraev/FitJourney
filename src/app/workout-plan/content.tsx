'use client';

import { useMemo } from 'react';
import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import type { UserProfile } from '@/lib/definitions';
import { Loader2, Dumbbell, HeartPulse, Bike, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const exerciseIcons: Record<string, JSX.Element> = {
  jogging: <HeartPulse className="h-5 w-5 text-red-500" />,
  running: <HeartPulse className="h-5 w-5 text-red-500" />,
  swimming: <HeartPulse className="h-5 w-5 text-red-500" />,
  cycling: <Bike className="h-5 w-5 text-blue-500" />,
  circuit: <Zap className="h-5 w-5 text-yellow-500" />,
  default: <Dumbbell className="h-5 w-5 text-primary" />,
};

const getExerciseIcon = (exercise: string) => {
  const lowerEx = exercise.toLowerCase();
    for (const key in exerciseIcons) {
    if (lowerEx.includes(key)) {
      return exerciseIcons[key];
    }
  }
  return exerciseIcons.default;
};

const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const dayTranslations: Record<string, string> = {
  Monday: 'Понедельник',
  Tuesday: 'Вторник',
  Wednesday: 'Среда',
  Thursday: 'Четверг',
  Friday: 'Пятница',
  Saturday: 'Суббота',
  Sunday: 'Воскресенье',
};


export default function WorkoutPlanContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  
  const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const loading = isUserLoading || isProfileLoading;

  const weeklyPlan = profile?.workoutPlan?.weeklyWorkoutPlan;

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
            <Dumbbell className="h-8 w-8 text-primary" />
            Ваш недельный план тренировок
          </CardTitle>
          <CardDescription>
            Этот план тренировок составлен ИИ специально для вас, чтобы помочь в достижении цели: {profile?.goal === 'weight loss' ? 'похудение' : 'набор массы'}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
            {dayOrder.map((day, index) => (
              <AccordionItem value={`item-${index}`} key={day}>
                <AccordionTrigger className="text-lg font-semibold hover:no-underline capitalize">
                  {dayTranslations[day]}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-4 pt-2">
                    {weeklyPlan && weeklyPlan[day] && weeklyPlan[day].length > 0 ? (
                      weeklyPlan[day].map((exercise, exIndex) => (
                        <li key={exIndex} className="flex items-center gap-4 p-4 rounded-lg bg-background">
                          {getExerciseIcon(exercise)}
                          <p className="font-medium">{exercise}</p>
                        </li>
                      ))
                    ) : weeklyPlan && (weeklyPlan[day]?.length === 0 || !weeklyPlan[day]) ? (
                       <li className="flex items-center gap-4 p-4 rounded-lg bg-background">
                            <p className="font-medium text-muted-foreground">День отдыха</p>
                        </li>
                    ) : (
                      // Skeleton loader for exercises
                      [...Array(2)].map((_, i) => (
                         <li key={i} className="flex items-center gap-4 p-4 rounded-lg bg-background">
                          <Skeleton className="h-6 w-6 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
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
