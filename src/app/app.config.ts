import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp({ 
      apiKey: "AIzaSyDzmpmu4RHt80CiJqQReQEvnXP6i3Hb-pM",
  authDomain: "epikemplatinum.firebaseapp.com",
  databaseURL: "https://epikemplatinum.firebaseio.com",
  projectId: "epikemplatinum",
  storageBucket: "epikemplatinum.firebasestorage.app",
  messagingSenderId: "962836937466",
  appId: "1:962836937466:web:020cd40f5a08c39ce72743",
  measurementId: "G-FVNKZG9H68"
    })), 
    provideAuth(() => getAuth()), 
    provideFirestore(() => {
      const firestore = getFirestore();
      // Suppress the injection context warning
      (firestore as any)._firestoreClient = (firestore as any)._firestoreClient;
      return firestore;
    })
  ]
};
