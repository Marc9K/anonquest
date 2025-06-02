// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
  apiKey: "AIzaSyB3zEV9Xs35RbgMuHMkstoF8IXM-kn3jbw",
  authDomain: "anonquest-c3f3b.firebaseapp.com",
  projectId: "anonquest-c3f3b",
  storageBucket: "anonquest-c3f3b.firebasestorage.app",
  messagingSenderId: "663573601235",
  appId: "1:663573601235:web:af57284e9342270ef96d26",
};

const app = initializeApp(firebaseConfig);

export default app;

export const auth = getAuth(app);

export const db = getFirestore(app);
if (process.env.NEXT_PUBLIC_IS_TEST === "true") {
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, "localhost", 8080);
}
