import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './config';
import type { UserProfile } from '../definitions';

export async function createUserProfile(uid: string, data: Omit<UserProfile, 'createdAt'>) {
  const userRef = doc(db, 'users', uid);
  return await setDoc(userRef, {
    ...data,
    createdAt: serverTimestamp(),
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
