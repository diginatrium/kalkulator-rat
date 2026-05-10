import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ScenarioStorageService } from '../../../core/services/scenario-storage.service';
import { SavedScenario, AppState } from '../../../core/models/scenario.model';

@Component({
  selector: 'app-save-scenario-dialog',
  templateUrl: './save-scenario-dialog.component.html',
  styleUrl: './save-scenario-dialog.component.scss',
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    MessageModule,
  ],
})
export class SaveScenarioDialogComponent {
  private readonly storage = inject(ScenarioStorageService);

  visible = input.required<boolean>();
  visibleChange = output<boolean>();
  currentState = input.required<AppState>();
  loadScenario = output<AppState>();

  newName = signal('');
  errorMsg = signal<string | null>(null);
  refreshTick = signal(0);

  scenarios = computed<SavedScenario[]>(() => {
    this.refreshTick();
    return this.storage.list().sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  });

  close(): void {
    this.visibleChange.emit(false);
    this.errorMsg.set(null);
    this.newName.set('');
  }

  saveAs(): void {
    const name = this.newName().trim();
    if (!name) {
      this.errorMsg.set('Wpisz nazwę scenariusza');
      return;
    }
    try {
      this.storage.saveAs(name, this.currentState());
      this.newName.set('');
      this.errorMsg.set(null);
      this.refreshTick.update((v) => v + 1);
    } catch (e) {
      this.errorMsg.set(e instanceof Error ? e.message : 'Błąd zapisu');
    }
  }

  load(name: string): void {
    const state = this.storage.load(name);
    if (state) {
      this.loadScenario.emit(state);
      this.close();
    }
  }

  remove(name: string): void {
    if (!confirm(`Usunąć scenariusz "${name}"?`)) return;
    this.storage.delete(name);
    this.refreshTick.update((v) => v + 1);
  }

  rename(oldName: string): void {
    const newName = prompt(`Nowa nazwa dla "${oldName}":`, oldName);
    if (!newName || newName === oldName) return;
    try {
      this.storage.rename(oldName, newName);
      this.refreshTick.update((v) => v + 1);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Błąd zmiany nazwy');
    }
  }
}
