'use server';

import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import type { UserProfile } from '../definitions';
import { firebaseConfig } from '@/firebase/config';

// Function to initialize Firebase on the server-side if not already done.
// This is crucial for server actions and other server-side code.
function initializeFirebaseAdmin() {
  if (!getApps().length) {
    // We are on the server, so we initialize the app with the config.
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

const app = initializeFirebaseAdmin();
const db = getFirestore(app);


export async function createUserProfile(uid: string, data: Omit<UserProfile, 'createdAt'>) {
  const userRef = doc(db, 'users', uid);
  // Using new Date().toISOString() for server-side timestamp generation for reliability
  return await setDoc(userRef, {
    ...data,
    createdAt: new Date().toISOString(),
  });
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
    return await updateDoc(userRef, data);
}
