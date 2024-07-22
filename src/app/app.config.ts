import { ApplicationConfig,importProvidersFrom, isDevMode } from '@angular/core';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';
import { provideFirebaseApp, initializeApp, FirebaseApp, getApp } from "@angular/fire/app";
import { provideAuth, getAuth } from "@angular/fire/auth";
import { provideFirestore, persistentLocalCache, initializeFirestore, persistentSingleTabManager, enableIndexedDbPersistence, persistentMultipleTabManager } from "@angular/fire/firestore";
import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { CrudService } from './core/services/crud.service';
import {provideHttpClient } from '@angular/common/http';

const firebaseConfig = {
  apiKey: "AIzaSyCFTgjTqfk5xl0IxynyJG423zR38vephzA",
  authDomain: "shopcafe-a72f8.firebaseapp.com",
  projectId: "shopcafe-a72f8",
  storageBucket: "shopcafe-a72f8.appspot.com",
  messagingSenderId: "12019644909",
  appId: "1:12019644909:web:faf367513789256a1e0fe4",
  measurementId: "G-NT4VNH2TRS",
};

export const appConfig: ApplicationConfig = {
  providers: [
    CrudService,
    provideRouter(routes, withComponentInputBinding(), withRouterConfig({paramsInheritanceStrategy:'always'})),
    provideHttpClient(), 
    provideServiceWorker('ngsw-worker.js', {
        enabled: !isDevMode(),
        registrationStrategy: 'registerWhenStable:30000'
    }),
    importProvidersFrom([
      provideFirebaseApp(() => initializeApp(firebaseConfig, "primaria")),
      // provideFirestore(() =>initializeFirestore(getApp(), {localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})})
      provideFirestore(() =>initializeFirestore(getApp("primaria"), {})
      ), 
      provideAuth(() => getAuth(getApp('primaria')))  ,
    ]),
  ]
};
