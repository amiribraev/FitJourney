// src/lib/firebase/service-account.ts

import type { ServiceAccount } from 'firebase-admin/app';

// This function now reads a single environment variable that holds the entire JSON
// configuration. This is a more robust way to handle service account credentials,
// especially in environments where newline characters in private keys can be problematic.

function getServiceAccount(): ServiceAccount {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    throw new Error(
      'The FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. ' +
      'It should contain the JSON credentials for your Firebase service account.'
    );
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    return serviceAccount;
  } catch (error: any) {
    throw new Error(
      `Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON. Make sure it's a valid JSON string. Error: ${error.message}`
    );
  }
}

export const SERVICE_ACCOUNT = getServiceAccount();
