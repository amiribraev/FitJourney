import { initializeApp, getApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getServiceAccount() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error(
      'The FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set.'
    );
  }
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    // The private key needs to be correctly formatted for firebase-admin
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    return serviceAccount;
  } catch (error: any) {
    throw new Error(
      `Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON. Error: ${error.message}`
    );
  }
}

const SERVICE_ACCOUNT = getServiceAccount();

const appName = 'firebase-admin-app-server-actions';

// This pattern prevents reinitializing the app on every server action call
if (!getApps().some((app) => app.name === appName)) {
  initializeApp(
    {
      credential: cert(SERVICE_ACCOUNT),
    },
    appName
  );
}

export const firestore = getFirestore(getApp(appName));
