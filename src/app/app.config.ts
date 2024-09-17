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
  apiKey: "AIzaSyDCyZIHdlBrxc7_7ZPgIYRz_U45y_Q1rDc",
  authDomain: "shopcaferesp.firebaseapp.com",
  projectId: "shopcaferesp",
  storageBucket: "shopcaferesp.appspot.com",
  messagingSenderId: "871789942990",
  appId: "1:871789942990:web:4030dad53a0d85c94e989f"
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
      // provideFirestore(() =>initializeFirestore(getApp("primaria"), {localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})})
      provideFirestore(() =>initializeFirestore(getApp("primaria"), {})
      ), 
      provideAuth(() => getAuth(getApp('primaria')))  ,
    ]),
  ]
};
