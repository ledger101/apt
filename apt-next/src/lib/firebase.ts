import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCu39OYwk5rk-wiK_L8V3GU49j4nNbGDBQ",
    authDomain: "smartapp-aa.firebaseapp.com",
    projectId: "smartapp-aa",
    storageBucket: "smartapp-aa.firebasestorage.app",
    messagingSenderId: "645406211517",
    appId: "1:645406211517:web:9675923f9c4f024b7326d4",
    measurementId: "G-5CVMGC385K"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
