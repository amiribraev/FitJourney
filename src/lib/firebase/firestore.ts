
'use server';

import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuthenticatedAppForUser } from '@/lib/firebase/server-app';
import type { UserProfile } from '../definitions';

export async function createUserProfile(uid: string, data: Omit<UserProfile, 'dietPlan' | 'workoutPlan'>) {
    const { firestore } = await getAuthenticatedAppForUser();
    const userRef = doc(firestore, 'users', uid);
    await setDoc(userRef, data);
}

// This function now uses the server-side admin SDK for reliability
export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
    const { firestore } = await getAuthenticatedAppForUser();
    const userRef = doc(firestore, 'users', uid);
    await updateDoc(userRef, data);
}

// This function is for server-side fetches
export async function getUserProfile(uid:string): Promise<UserProfile | null> {
    const { firestore } = await getAuthenticatedAppForUser();
    const userRef = doc(firestore, 'users', uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    } else {
        return null;
    }
}

