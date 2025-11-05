'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import type { ProgressLog } from '@/lib/definitions';
import { doc, setDoc } from 'firebase/firestore';
import { format, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProgressContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(startOfDay(new Date()));
  const [calories, setCalories] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const logId = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;

  const progressLogRef = useMemoFirebase(() => {
    if (!user || !logId) return null;
    return doc(firestore, `users/${user.uid}/progressLogs/${logId}`);
  }, [user, logId, firestore]);

  const { data: progressLog, isLoading: isLogLoading, error } = useDoc<ProgressLog>(progressLogRef);

  useEffect(() => {
    if (progressLog) {
      setCalories(String(progressLog.caloriesConsumed));
    } else {
      setCalories('');
    }
  }, [progressLog, selectedDate]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date ? startOfDay(date) : undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedDate || !logId || !progressLogRef) return;

    const consumedCalories = parseInt(calories, 10);
    if (isNaN(consumedCalories) || consumedCalories < 0) {
      toast({
        variant: 'destructive',
        title: 'Неверное значение',
        description: 'Пожалуйста, введите корректное число калорий.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const logData: ProgressLog = {
        id: logId,
        userId: user.uid,
        date: selectedDate.toISOString(),
        caloriesConsumed: consumedCalories,
      };
      await setDoc(progressLogRef, logData, { merge: true });
      toast({
        title: 'Прогресс сохранен!',
        description: `Запись за ${format(selectedDate, 'PPP', { locale: ru })} обновлена.`,
      });
    } catch (error: any) {
      console.error('Failed to save progress:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка сохранения',
        description: 'Не удалось сохранить ваш прогресс. Попробуйте снова.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isLoading = isUserLoading || isLogLoading;

  return (
    <div className="container py-8 px-4 md:px-6">
      <Card className="w-full max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            Мой прогресс
          </CardTitle>
          <CardDescription>
            Выберите дату и запишите свой дневной прогресс.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
          <div className="flex justify-center">
             <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              locale={ru}
              className="rounded-md border"
              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
              initialFocus
            />
          </div>
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">
              Запись за: {selectedDate ? format(selectedDate, 'PPP', { locale: ru }) : '...'}
            </h3>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="calories" className="text-base">Потребленные калории</Label>
                <Input
                  id="calories"
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="Например: 2500"
                  className="mt-2 text-base"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {progressLog ? 'Обновить запись' : 'Сохранить запись'}
              </Button>
            </form>
            )}
            {error && <p className="text-sm text-destructive">Ошибка загрузки данных: {error.message}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}