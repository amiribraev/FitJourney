'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getUserProfile } from '@/lib/firebase/firestore';
import type { UserProfile } from '@/lib/definitions';
import { Loader2, Dumbbell, HeartPulse, Bike, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const exerciseIcons = {
  default: <Dumbbell className="h-5 w-5 text-primary" />,
  cardio: <HeartPulse className="h-5 w-5 text-red-500" />,
  cycling: <Bike className="h-5 w-5 text-blue-500" />,
  circuit: <Zap className="h-5 w-5 text-yellow-500" />,
};

const getExerciseIcon = (exercise: string) => {
  const lowerEx = exercise.toLowerCase();
  if (lowerEx.includes('бег') || lowerEx.includes('jogging') || lowerEx.includes('swimming') || lowerEx.includes('плавание')) return exerciseIcons.cardio;
  if (lowerEx.includes('cycling') || lowerEx.includes('велосипед')) return exerciseIcons.cycling;
  if (lowerEx.includes('circuit') || lowerEx.includes('круговая')) return exerciseIcons.circuit;
  return exerciseIcons.default;
};

const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];


export default function WorkoutPlanContent() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getUserProfile(user.uid)
        .then(data => {
          setProfile(data);
          setLoading(false);
        })
        .catch(error => {
          console.error("Failed to fetch profile:", error);
          setLoading(false);
        });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const weeklyPlan = profile?.workoutPlan?.weeklyWorkoutPlan;
  const sortedDays = weeklyPlan ? Object.keys(weeklyPlan).sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b)) : [];


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
          {weeklyPlan && sortedDays.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {sortedDays.map((day, index) => (
                <AccordionItem value={`item-${index}`} key={day}>
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                    {day}
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-4 pt-2">
                      {weeklyPlan[day].length > 0 ? weeklyPlan[day].map((exercise, exIndex) => (
                        <li key={exIndex} className="flex items-center gap-4 p-4 rounded-lg bg-background">
                          {getExerciseIcon(exercise)}
                          <p className="font-medium">{exercise}</p>
                        </li>
                      )) : (
                        <li className="flex items-center gap-4 p-4 rounded-lg bg-background">
                            <p className="font-medium text-muted-foreground">День отдыха</p>
                        </li>
                      )}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              План тренировок еще не создан. Пожалуйста, заполните свой профиль.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
