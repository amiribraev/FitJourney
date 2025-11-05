'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase';
import { RegistrationSchema, type RegistrationData } from '@/lib/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { UserProfile } from '@/lib/definitions';
import { doc, setDoc } from 'firebase/firestore';

export function RegisterForm() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegistrationData>({
    resolver: zodResolver(RegistrationSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      age: '' as any,
      weight: '' as any,
      height: '' as any,
      goal: 'weight loss',
    },
  });

  async function onSubmit(data: RegistrationData) {
    setIsSubmitting(true);
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // Update Firebase Auth profile with name
      await updateProfile(user, { displayName: data.name });

      // 2. Create profile object to save to Firestore, WITHOUT plans
      const userProfileData: Omit<UserProfile, 'dietPlan' | 'workoutPlan'> = {
        uid: user.uid,
        email: data.email,
        name: data.name,
        age: data.age,
        gender: data.gender,
        weight: data.weight,
        height: data.height,
        goal: data.goal,
        createdAt: new Date().toISOString(),
      };
      
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, userProfileData);

      toast({
        title: 'Регистрация завершена!',
        description: 'Ваш профиль создан. Перенаправляем...',
      });
      
      // 3. Redirect to profile immediately. The profile page will handle plan generation.
      router.push('/profile');

    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.code === 'auth/email-already-in-use'
        ? 'Этот email уже используется.'
        : `Произошла ошибка при регистрации: ${error.message}`;
      toast({
        variant: 'destructive',
        title: 'Ошибка регистрации',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Имя</FormLabel><FormControl><Input placeholder="Ваше имя" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem><FormLabel>Почта</FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="password" render={({ field }) => (
          <FormItem className="md:col-span-2"><FormLabel>Пароль</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="age" render={({ field }) => (
          <FormItem><FormLabel>Возраст</FormLabel><FormControl><Input type="number" placeholder="25" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}/></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="gender" render={({ field }) => (
          <FormItem><FormLabel>Пол</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Выберите пол" /></SelectTrigger></FormControl>
              <SelectContent><SelectItem value="male">Мужской</SelectItem><SelectItem value="female">Женский</SelectItem></SelectContent>
            </Select><FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="weight" render={({ field }) => (
          <FormItem><FormLabel>Вес (в кг)</FormLabel><FormControl><Input type="number" placeholder="70" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}/></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="height" render={({ field }) => (
          <FormItem><FormLabel>Рост (в см)</FormLabel><FormControl><Input type="number" placeholder="175" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}/></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="goal" render={({ field }) => (
          <FormItem className="md:col-span-2 space-y-3">
            <FormLabel>Ваша цель</FormLabel>
            <FormControl>
              <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center gap-x-4">
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl><RadioGroupItem value="weight loss" /></FormControl><FormLabel className="font-normal">Похудение</FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl><RadioGroupItem value="muscle gain" /></FormControl><FormLabel className="font-normal">Набор массы</FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" className="w-full md:col-span-2 bg-accent hover:bg-accent/90" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Зарегистрироваться
        </Button>
      </form>
    </Form>
  );
}
