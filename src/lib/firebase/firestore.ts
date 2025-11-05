
'use server';

import { doc, setDoc, getDoc, updateDoc, Firestore } from 'firebase/firestore';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import type { UserProfile } from '../definitions';
import { firebaseConfig } from '@/firebase/config';

// A more robust way to initialize Firebase on the server-side.
// This ensures we have a singleton instance.
let app: FirebaseApp;
let db: Firestore;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}
db = getFirestore(app);


export async function createUserProfile(uid: string, data: Omit<UserProfile, 'dietPlan' | 'workoutPlan'>) {
  const userRef = doc(db, 'users', uid);
  // The data object is now passed directly, which is correct.
  await setDoc(userRef, data);
}

export async function getUserProfile(uid:string): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    } else {
        return null;
    }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, data);
}
