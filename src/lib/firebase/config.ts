import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  projectId: "studio-8195792708-ea343",
  appId: "1:899873567347:web:f1024689a0c662ac05f006",
  apiKey: "AIzaSyDUXLcXYk5uC6h4PNsn_4HueNrhUTvHE0g",
  authDomain: "studio-8195792708-ea343.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "899873567347",
  storageBucket: "studio-8195792708-ea343.appspot.com"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
