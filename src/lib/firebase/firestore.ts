'use server';

import { doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { getAuthenticatedAppForUser } from '@/lib/firebase/server-app';
import type { UserProfile } from '../definitions';

// This function now uses the server-side admin SDK for reliability
export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
    const { firestore } = await getAuthenticatedAppForUser();
    const userRef = doc(firestore, 'users', uid);
    // Using updateDoc is correct here as we are only updating parts of the profile
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
