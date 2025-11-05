
import { initializeApp, getApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { SERVICE_ACCOUNT } from './service-account';


export async function getAuthenticatedAppForUser() {
    const appName = "firebase-frameworks";
    const existingApp = getApps().find(app => app.name === appName);
    if (existingApp) {
        return {
            app: existingApp,
            auth: getAuth(existingApp),
            firestore: getFirestore(existingApp),
            storage: getStorage(existingApp),
        };
    }

    const app = initializeApp({
        credential: cert(SERVICE_ACCOUNT),
        storageBucket: SERVICE_ACCOUNT.project_id + ".appspot.com",
    }, appName);

    return {
        app,
        auth: getAuth(app),
        firestore: getFirestore(app),
        storage: getStorage(app),
    };
}
