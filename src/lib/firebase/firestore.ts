'use server';

import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import type { UserProfile } from '../definitions';
import { firebaseConfig } from '@/firebase/config';

// Function to initialize Firebase on the server-side if not already done.
function initializeFirebaseAdmin() {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

const app = initializeFirebaseAdmin();
const db = getFirestore(app);

export async function createUserProfile(uid: string, data: Omit<UserProfile, 'createdAt' | 'dietPlan' | 'workoutPlan'>) {
  const userRef = doc(db, 'users', uid);
  // Use a server-side timestamp for reliability
  const profileData = {
    ...data,
    createdAt: new Date().toISOString(),
  };
  return await setDoc(userRef, profileData);
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
    // When updating, we don't need to worry about the creation timestamp.
    return await updateDoc(userRef, data);
}
