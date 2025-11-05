import { doc, setDoc, getDoc, serverTimestamp, updateDoc, getFirestore } from 'firebase/firestore';
import type { UserProfile } from '../definitions';

// Note: It's generally better to get the db instance from a provider/context
// if you are working in a client component, to ensure it's initialized.
// For server actions or server components, this approach is fine.

export async function createUserProfile(uid: string, data: Omit<UserProfile, 'createdAt'>) {
  const db = getFirestore();
  const userRef = doc(db, 'users', uid);
  return await setDoc(userRef, {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function getUserProfile(uid:string): Promise<UserProfile | null> {
    const db = getFirestore();
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    } else {
        return null;
    }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
    const db = getFirestore();
    const userRef = doc(db, 'users', uid);
    return await updateDoc(userRef, data);
}
