import { Injectable } from '@angular/core';
import { AppState, SavedScenario } from '../models/scenario.model';

const AUTO_SAVE_KEY = 'kalkulator-rat:auto-save';
const NAMED_KEY = 'kalkulator-rat:saved-scenarios';
const SCHEMA = 1;

type SavedListEntry = SavedScenario;

@Injectable({ providedIn: 'root' })
export class ScenarioStorageService {
  saveAuto(state: AppState): void {
    this.write(AUTO_SAVE_KEY, this.serialize(state));
  }

  loadAuto(): AppState | null {
    return this.parseState(this.read(AUTO_SAVE_KEY));
  }

  saveAs(name: string, state: AppState): void {
    if (!name.trim()) throw new Error('Nazwa nie może być pusta');
    const list = this.list();
    const existing = list.findIndex((s) => s.name === name);
    const entry: SavedListEntry = {
      schemaVersion: SCHEMA,
      name: name.trim(),
      savedAt: new Date().toISOString(),
      state: this.cloneState(state),
    };
    if (existing >= 0) list[existing] = entry;
    else list.push(entry);
    this.write(NAMED_KEY, JSON.stringify(list));
  }

  list(): SavedScenario[] {
    const raw = this.read(NAMED_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as SavedListEntry[];
      return parsed
        .filter((s) => s.schemaVersion === SCHEMA)
        .map((s) => ({
          schemaVersion: SCHEMA,
          name: s.name,
          savedAt: s.savedAt,
          state: this.reviveState(s.state),
        }));
    } catch {
      return [];
    }
  }

  load(name: string): AppState | null {
    const found = this.list().find((s) => s.name === name);
    return found ? this.cloneState(found.state) : null;
  }

  rename(oldName: string, newName: string): void {
    const list = this.list();
    const entry = list.find((s) => s.name === oldName);
    if (!entry) return;
    if (list.some((s) => s.name === newName.trim())) {
      throw new Error('Scenariusz o tej nazwie już istnieje');
    }
    entry.name = newName.trim();
    entry.savedAt = new Date().toISOString();
    this.write(
      NAMED_KEY,
      JSON.stringify(
        list.map((s) => ({
          schemaVersion: SCHEMA,
          name: s.name,
          savedAt: s.savedAt,
          state: s.state,
        })),
      ),
    );
  }

  delete(name: string): void {
    const list = this.list().filter((s) => s.name !== name);
    this.write(
      NAMED_KEY,
      JSON.stringify(
        list.map((s) => ({
          schemaVersion: SCHEMA,
          name: s.name,
          savedAt: s.savedAt,
          state: s.state,
        })),
      ),
    );
  }

  clearAuto(): void {
    try {
      localStorage.removeItem(AUTO_SAVE_KEY);
    } catch {
      // ignore
    }
  }

  private serialize(state: AppState): string {
    return JSON.stringify({ schemaVersion: SCHEMA, state: this.cloneState(state) });
  }

  private parseState(raw: string | null): AppState | null {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as { schemaVersion: number; state: AppState };
      if (parsed.schemaVersion !== SCHEMA) return null;
      return this.reviveState(parsed.state);
    } catch {
      return null;
    }
  }

  private cloneState(state: AppState): AppState {
    return {
      loanInput: { ...state.loanInput, startDate: new Date(state.loanInput.startDate) },
      overpayments: state.overpayments.map((o) => ({ ...o })),
      rateChanges: state.rateChanges.map((r) => ({ ...r })),
      budget: { ...state.budget },
    };
  }

  private reviveState(state: AppState): AppState {
    return {
      ...state,
      loanInput: { ...state.loanInput, startDate: new Date(state.loanInput.startDate) },
      overpayments: state.overpayments.map((o) => ({ ...o })),
      rateChanges: state.rateChanges.map((r) => ({ ...r })),
      budget: { ...state.budget },
    };
  }

  private read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore quota errors
    }
  }
}
