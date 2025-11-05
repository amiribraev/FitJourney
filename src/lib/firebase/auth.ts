'use client';

import { signOut } from 'firebase/auth';
import { auth } from './config';

export async function handleSignOut() {
  try {
    await signOut(auth);
    // This is a client-side function, so we can safely use window.location
    window.location.href = '/login';
  } catch (error) {
    console.error('Error signing out:', error);
  }
}
