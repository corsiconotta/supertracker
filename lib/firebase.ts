import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCRdECalGsKBZf-_PStvo-kodH_QNs3mtU",
    authDomain: "supertracker-8b0aa.firebaseapp.com",
    projectId: "supertracker-8b0aa",
    storageBucket: "supertracker-8b0aa.firebasestorage.app",
    messagingSenderId: "810146196511",
    appId: "1:810146196511:web:5f63f0e294e8ad2dab792a",
    measurementId: "G-EW0RGSCYRS"
  };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);