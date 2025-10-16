// src/main.ts

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { App } from './app/app';
import { AuthInterceptor } from './app/interceptors/auth.interceptor'; 

bootstrapApplication(App, {
  providers: [
    provideHttpClient(
        withInterceptorsFromDi() 
    ),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true, 
    },
    ...appConfig.providers,
  ],
}).catch((err) => console.error(err));