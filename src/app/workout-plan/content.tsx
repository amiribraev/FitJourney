'use client';

import { useMemo } from 'react';
import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import type { UserProfile } from '@/lib/definitions';
import { Loader2, Dumbbell, HeartPulse, Bike, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const EXERCISE_ICONS: Record<string, JSX.Element> = {
  jogging: <HeartPulse className="h-5 w-5 text-red-500" />,
  running: <HeartPulse className="h-5 w-5 text-red-500" />,
  swimming: <HeartPulse className="h-5 w-5 text-red-500" />,
  cycling: <Bike className="h-5 w-5 text-blue-500" />,
  circuit: <Zap className="h-5 w-5 text-yellow-500" />,
  default: <Dumbbell className="h-5 w-5 text-primary" />,
};

const getExerciseIcon = (exercise: string) => {
  const lowerEx = exercise.toLowerCase();
  for (const key in EXERCISE_ICONS) if (lowerEx.includes(key)) return EXERCISE_ICONS[key];
  return EXERCISE_ICONS.default;
};

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
type Lang = 'ru' | 'kk' | 'en';

const UI = {
  ru: {
    title: 'Ваш недельный план тренировок',
    descPrefix: 'Этот план тренировок составлен ИИ специально для вас, чтобы помочь в достижении цели:',
    goalLoss: 'похудение',
    goalGain: 'набор массы',
    rest: 'День отдыха',
    days: { Monday: 'Понедельник', Tuesday: 'Вторник', Wednesday: 'Среда', Thursday: 'Четверг', Friday: 'Пятница', Saturday: 'Суббота', Sunday: 'Воскресенье' },
  },
  kk: {
    title: 'Сіздің апталық жаттығу жоспарыңыз',
    descPrefix: 'Бұл жаттығу жоспары мақсатыңызға жетуге көмектесу үшін ЖИ арқылы жасалды:',
    goalLoss: 'салмақ тастау',
    goalGain: 'бұлшықет массасын арттыру',
    rest: 'Демалыс күні',
    days: { Monday: 'Дүйсенбі', Tuesday: 'Сейсенбі', Wednesday: 'Сәрсенбі', Thursday: 'Бейсенбі', Friday: 'Жұма', Saturday: 'Сенбі', Sunday: 'Жексенбі' },
  },
  en: {
    title: 'Your Weekly Workout Plan',
    descPrefix: 'This AI workout plan is tailored to help you reach your goal:',
    goalLoss: 'weight loss',
    goalGain: 'muscle gain',
    rest: 'Rest day',
    days: { Monday: 'Monday', Tuesday: 'Tuesday', Wednesday: 'Wednesday', Thursday: 'Thursday', Friday: 'Friday', Saturday: 'Saturday', Sunday: 'Sunday' },
  },
} as const;

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
  const lang: Lang = profile?.language === 'kk' || profile?.language === 'en' ? profile.language : 'ru';
  const t = UI[lang];

  if (loading) return <div className="flex h-[calc(100vh-200px)] items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  return (
    <div className="container py-8 px-4 md:px-6">
      <Card className="w-full max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center gap-2"><Dumbbell className="h-8 w-8 text-primary" />{t.title}</CardTitle>
          <CardDescription>{t.descPrefix} {profile?.goal === 'weight loss' ? t.goalLoss : t.goalGain}.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
            {DAY_ORDER.map((day, index) => (
              <AccordionItem value={`item-${index}`} key={day}>
                <AccordionTrigger className="text-lg font-semibold hover:no-underline capitalize">{t.days[day]}</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-4 pt-2">
                    {weeklyPlan && weeklyPlan[day] && (weeklyPlan[day] as string[]).length > 0 ? (
                      (weeklyPlan[day] as string[]).map((exercise, exIndex) => (
                        <li key={exIndex} className="flex items-center gap-4 p-4 rounded-lg bg-background">{getExerciseIcon(exercise)}<p className="font-medium">{exercise}</p></li>
                      ))
                    ) : weeklyPlan && ((weeklyPlan[day] as string[])?.length === 0 || !weeklyPlan[day]) ? (
                      <li className="flex items-center gap-4 p-4 rounded-lg bg-background"><p className="font-medium text-muted-foreground">{t.rest}</p></li>
                    ) : (
                      [...Array(2)].map((_, i) => (
                        <li key={i} className="flex items-center gap-4 p-4 rounded-lg bg-background"><Skeleton className="h-6 w-6 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /></div></li>
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
