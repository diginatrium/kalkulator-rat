import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import { registerLocaleData } from '@angular/common';
import localePl from '@angular/common/locales/pl';

registerLocaleData(localePl);

const BankingPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#e8f0fd',
      100: '#c5d4f7',
      200: '#9fb7f0',
      300: '#779ae9',
      400: '#5683e4',
      500: '#1a3c6e',
      600: '#163466',
      700: '#112a5b',
      800: '#0c2150',
      900: '#061237',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#f4f7fb',
          100: '#e8f0fd',
          200: '#d0ddef',
          300: '#b0c4de',
          400: '#8aa8c8',
          500: '#6b82a0',
          600: '#4a5e7a',
          700: '#2e3f57',
          800: '#1a2a3a',
          900: '#0d1520',
          950: '#060b10',
        },
      },
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideAnimationsAsync(),
    { provide: LOCALE_ID, useValue: 'pl' },
    providePrimeNG({
      theme: {
        preset: BankingPreset,
        options: {
          prefix: 'p',
          darkModeSelector: '.dark-mode',
          cssLayer: false,
        },
      },
      ripple: true,
    }),
  ],
};
