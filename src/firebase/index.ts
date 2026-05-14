
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Прямая конфигурация Firebase для стабильности
const firebaseConfig = {
  apiKey: "AIzaSyDUXLcXYk5uC6h4PNsn_4HueNrhUTvHE0g",
  authDomain: "studio-8195792708-ea343.firebaseapp.com",
  projectId: "studio-8195792708-ea343",
  storageBucket: "studio-8195792708-ea343.firebasestorage.app",
  messagingSenderId: "899873567347",
  appId: "1:899873567347:web:f1024689a0c662ac05f006",
};

export function initializeFirebase() {
  if (getApps().length) {
    return getSdks(getApp());
  }

  const firebaseApp = initializeApp(firebaseConfig);
  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
