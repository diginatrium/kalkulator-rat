import { DOCUMENT, inject, Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'kalkulator-rat:theme';
const DARK_CLASS = 'dark-mode';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  readonly isDark = signal(false);

  init(): void {
    let preferDark: boolean;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark') preferDark = true;
      else if (stored === 'light') preferDark = false;
      else preferDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    } catch {
      preferDark = false;
    }
    this.set(preferDark);
  }

  toggle(): void {
    this.set(!this.isDark());
  }

  set(dark: boolean): void {
    this.isDark.set(dark);
    const html = this.document.documentElement;
    if (dark) html.classList.add(DARK_CLASS);
    else html.classList.remove(DARK_CLASS);
    try {
      localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
    } catch {
      // ignore storage errors
    }
  }
}
