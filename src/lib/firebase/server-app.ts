
import { initializeApp, getApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { SERVICE_ACCOUNT } from './service-account';


export function getAuthenticatedAppForUser() {
    const appName = "firebase-frameworks-server-app";
    // This pattern prevents reinitializing the app on every call
    if (getApps().some((app) => app.name === appName)) {
      const app = getApp(appName);
      return {
          app,
          auth: getAuth(app),
          firestore: getFirestore(app),
          storage: getStorage(app),
      };
    }

    const app = initializeApp({
        credential: cert(SERVICE_ACCOUNT),
        storageBucket: SERVICE_ACCOUNT.project_id + ".appspot.com",
    }, appName);

    const auth = getAuth(app);
    const firestore = getFirestore(app);
    const storage = getStorage(app);

    return { app, auth, firestore, storage };
}
