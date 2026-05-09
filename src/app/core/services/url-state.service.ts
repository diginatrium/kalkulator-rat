import { Injectable } from '@angular/core';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { AppState } from '../models/scenario.model';

@Injectable({ providedIn: 'root' })
export class UrlStateService {
  /** Encode app state to compressed URL hash fragment. */
  encode(state: AppState): string {
    const json = JSON.stringify(this.normalize(state));
    return compressToEncodedURIComponent(json);
  }

  /** Decode app state from URL hash fragment, or null if invalid. */
  decode(hash: string): AppState | null {
    const raw = hash.startsWith('#') ? hash.slice(1) : hash;
    if (!raw) return null;
    try {
      const json = decompressFromEncodedURIComponent(raw);
      if (!json) return null;
      const parsed = JSON.parse(json) as AppState;
      return this.revive(parsed);
    } catch {
      return null;
    }
  }

  /** Build full shareable URL for the current page with the encoded state. */
  buildShareUrl(state: AppState): string {
    const encoded = this.encode(state);
    const base = location.href.split('#')[0];
    return `${base}#${encoded}`;
  }

  /** Update current URL hash without scrolling/navigation. */
  updateHash(state: AppState): void {
    const encoded = this.encode(state);
    history.replaceState(null, '', `#${encoded}`);
  }

  /** Read state from current URL hash, returning null if not present. */
  readFromCurrentHash(): AppState | null {
    return this.decode(location.hash);
  }

  private normalize(state: AppState): AppState {
    return {
      ...state,
      loanInput: {
        ...state.loanInput,
        startDate:
          state.loanInput.startDate instanceof Date
            ? (state.loanInput.startDate.toISOString() as unknown as Date)
            : state.loanInput.startDate,
      },
    };
  }

  private revive(state: AppState): AppState {
    return {
      ...state,
      loanInput: { ...state.loanInput, startDate: new Date(state.loanInput.startDate) },
      overpayments: state.overpayments?.map((o) => ({ ...o })) ?? [],
      rateChanges: state.rateChanges?.map((r) => ({ ...r })) ?? [],
      budget: state.budget ?? { monthlyIncome: 0, otherDebtsMonthly: 0, householdSize: 1 },
    };
  }
}
