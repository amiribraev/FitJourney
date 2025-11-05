
import { initializeApp, getApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { SERVICE_ACCOUNT } from './service-account';

const appName = "firebase-admin-app";
// This pattern prevents reinitializing the app on every call
if (!getApps().some((app) => app.name === appName)) {
    initializeApp({
        credential: cert(SERVICE_ACCOUNT)
    }, appName);
}

export const adminDb = getFirestore(getApp(appName));
