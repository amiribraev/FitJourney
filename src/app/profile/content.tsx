'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, User, Weight, Ruler, Target, Edit, LogOut } from 'lucide-react';
import { useUser, useAuth as useFirebaseAuth, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import type { UserProfile } from '@/lib/definitions';
import { ProfileUpdateSchema, type ProfileUpdateData } from '@/lib/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { generatePlansForUser } from '@/app/actions/plans';


export default function ProfileContent() {
  const { user, isUserLoading } = useUser();
  const auth = useFirebaseAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: profile, isLoading: isProfileLoading, error } = useDoc<UserProfile>(userProfileRef);

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileUpdateData>({
    resolver: zodResolver(ProfileUpdateSchema),
    values: {
      weight: profile?.weight ?? 0,
      height: profile?.height ?? 0,
      goal: profile?.goal ?? 'weight loss',
    }
  });

  const { reset } = form;
  React.useEffect(() => {
    if (profile) {
      reset({
        weight: profile.weight,
        height: profile.height,
        goal: profile.goal,
      });
    }
  }, [profile, reset]);


  async function handleSignOut() {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({ variant: "destructive", title: "Ошибка выхода", description: "Не удалось выйти из системы." });
    }
  }
  
  async function onSubmit(data: ProfileUpdateData) {
    if (!user || !profile) return;
    setIsSubmitting(true);
    
    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, data);
      
      toast({ title: 'Профиль обновлен', description: 'Ваши данные сохранены. Начинаем генерацию новых планов...' });
      setIsEditing(false);

      // Fire-and-forget plan generation
      generatePlansForUser(user.uid, {
        ...profile, // spread existing profile data
        ...data,    // overwrite with new form data
      });

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Ошибка обновления', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLoading = isUserLoading || isProfileLoading;
  
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center py-10">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
     return (
      <div className="container py-8 text-center">
        <p className="text-red-500">Не удалось загрузить профиль. Пожалуйста, попробуйте перезагрузить страницу.</p>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="container py-8 text-center">
        <p>Не удалось загрузить профиль. Пожалуйста, войдите в систему или зарегистрируйтесь.</p>
      </div>
    );
  }

  const plansExist = profile.dietPlan && profile.workoutPlan;

  return (
    <div className="container py-8 px-4 md:px-6">
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center justify-between">
            <span>Профиль</span>
            {!isEditing && <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4" /></Button>}
          </CardTitle>
          <CardDescription>
            {plansExist ? 'Просмотр и редактирование ваших данных.' : 'Ваши планы генерируются. Это может занять до минуты.'}
            </CardDescription>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="space-y-4">
              <InfoItem icon={User} label="Имя" value={profile.name} />
              <InfoItem icon={User} label="Возраст" value={`${profile.age} лет`} />
              <InfoItem icon={Weight} label="Вес" value={`${profile.weight} кг`} />
              <InfoItem icon={Ruler} label="Рост" value={`${profile.height} см`} />
              <InfoItem icon={User} label="Пол" value={profile.gender === 'male' ? 'Мужской' : 'Женский'} />
              <InfoItem icon={Target} label="Цель" value={profile.goal === 'weight loss' ? 'Похудение' : 'Набор массы'} />
              <Button onClick={handleSignOut} variant="destructive" className="w-full mt-4">
                  <LogOut className="mr-2 h-4 w-4" />
                  Выйти
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="weight" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Вес (в кг)</FormLabel>
                    <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="height" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Рост (в см)</FormLabel>
                    <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="goal" render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Ваша цель</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl><RadioGroupItem value="weight loss" /></FormControl>
                          <FormLabel className="font-normal">Похудение</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl><RadioGroupItem value="muscle gain" /></FormControl>
                          <FormLabel className="font-normal">Набор массы</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="w-full">Отмена</Button>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Сохранить и перегенерировать планы
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number }) {
  return (
    <div className="flex items-center space-x-4 p-3 bg-background rounded-lg">
      <Icon className="h-6 w-6 text-primary" />
      <div className="flex-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
}
