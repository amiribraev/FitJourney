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
import { generateDietPlan } from '@/ai/flows/generate-diet-plan';
import { generateWorkoutPlan } from '@/ai/flows/generate-workout-plan';

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
        language: 'ru',
        createdAt: new Date().toISOString(),
      };
      
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, userProfileData);

      toast({
        title: 'Р РµРіРёСЃС‚СЂР°С†РёСЏ Р·Р°РІРµСЂС€РµРЅР°!',
        description: 'Р’Р°С€ РїСЂРѕС„РёР»СЊ СЃРѕР·РґР°РЅ. РџРµСЂРµРЅР°РїСЂР°РІР»СЏРµРј...',
      });
      
      // 3. Redirect to profile immediately. The profile page will handle plan generation.
      router.push('/profile');

    } catch (error: any) {
      const errorMessage = error.code === 'auth/email-already-in-use'
        ? 'Р­С‚РѕС‚ email СѓР¶Рµ РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ. РџРѕР¶Р°Р»СѓР№СЃС‚Р°, РІРѕР№РґРёС‚Рµ РёР»Рё РёСЃРїРѕР»СЊР·СѓР№С‚Рµ РґСЂСѓРіРѕР№ Р°РґСЂРµСЃ.'
        : `РџСЂРѕРёР·РѕС€Р»Р° РѕС€РёР±РєР° РїСЂРё СЂРµРіРёСЃС‚СЂР°С†РёРё.`;
      
      // We don't need to log this as an error to the console, it's expected user behavior
      if (error.code !== 'auth/email-already-in-use') {
        console.error('Registration error:', error);
      }

      toast({
        variant: 'destructive',
        title: 'РћС€РёР±РєР° СЂРµРіРёСЃС‚СЂР°С†РёРё',
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
          <FormItem><FormLabel>РРјСЏ</FormLabel><FormControl><Input placeholder="Р’Р°С€Рµ РёРјСЏ" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem><FormLabel>РџРѕС‡С‚Р°</FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="password" render={({ field }) => (
          <FormItem className="md:col-span-2"><FormLabel>РџР°СЂРѕР»СЊ</FormLabel><FormControl><Input type="password" placeholder="вЂўвЂўвЂўвЂўвЂўвЂўвЂўвЂў" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="age" render={({ field }) => (
          <FormItem><FormLabel>Р’РѕР·СЂР°СЃС‚</FormLabel><FormControl><Input type="number" placeholder="25" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}/></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="gender" render={({ field }) => (
          <FormItem><FormLabel>РџРѕР»</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Р’С‹Р±РµСЂРёС‚Рµ РїРѕР»" /></SelectTrigger></FormControl>
              <SelectContent><SelectItem value="male">РњСѓР¶СЃРєРѕР№</SelectItem><SelectItem value="female">Р–РµРЅСЃРєРёР№</SelectItem></SelectContent>
            </Select><FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="weight" render={({ field }) => (
          <FormItem><FormLabel>Р’РµСЃ (РІ РєРі)</FormLabel><FormControl><Input type="number" placeholder="70" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}/></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="height" render={({ field }) => (
          <FormItem><FormLabel>Р РѕСЃС‚ (РІ СЃРј)</FormLabel><FormControl><Input type="number" placeholder="175" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}/></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="goal" render={({ field }) => (
          <FormItem className="md:col-span-2 space-y-3">
            <FormLabel>Р’Р°С€Р° С†РµР»СЊ</FormLabel>
            <FormControl>
              <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center gap-x-4">
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl><RadioGroupItem value="weight loss" /></FormControl><FormLabel className="font-normal">РџРѕС…СѓРґРµРЅРёРµ</FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl><RadioGroupItem value="muscle gain" /></FormControl><FormLabel className="font-normal">РќР°Р±РѕСЂ РјР°СЃСЃС‹</FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" className="w-full md:col-span-2 bg-accent hover:bg-accent/90" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Р—Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°С‚СЊСЃСЏ
        </Button>
      </form>
    </Form>
  );
}
