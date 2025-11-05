import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCVAk2vj-I2qCac2G80n2j2k8h5sY-vjY8",
  authDomain: "dev-firebase-studio-project.firebaseapp.com",
  projectId: "dev-firebase-studio-project",
  storageBucket: "dev-firebase-studio-project.appspot.com",
  messagingSenderId: "558774167384",
  appId: "1:558774167384:web:865c367469a21a815a77f9",
  measurementId: "G-L0W5M6L69B"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
