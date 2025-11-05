import { signOut } from 'firebase/auth';
import { auth } from './config';
import { redirect } from 'next/navigation';

export async function handleSignOut() {
  try {
    await signOut(auth);
    // While Next.js recommends using useRouter for client-side navigation,
    // this server-action context is a bit different. A hard redirect is fine.
    // In a pure client component, you would use router.push.
    if(typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Error signing out:', error);
  }
}
