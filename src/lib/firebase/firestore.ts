
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, getFirestore } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
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

// Note: It's generally better to get the db instance from a provider/context
// if you are working in a client component, to ensure it's initialized.
// For server actions or server components, this approach is fine.

export async function createUserProfile(uid: string, data: Omit<UserProfile, 'createdAt'>) {
  const app = initializeFirebaseAdmin();
  const db = getFirestore(app);
  const userRef = doc(db, 'users', uid);
  // Pass the entire data object to be saved.
  return await setDoc(userRef, {
    ...data,
    createdAt: serverTimestamp(),
  });
}


export async function getUserProfile(uid:string): Promise<UserProfile | null> {
    const app = initializeFirebaseAdmin();
    const db = getFirestore(app);
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    } else {
        return null;
    }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
    const app = initializeFirebaseAdmin();
    const db = getFirestore(app);
    const userRef = doc(db, 'users', uid);
    return await updateDoc(userRef, data);
}
