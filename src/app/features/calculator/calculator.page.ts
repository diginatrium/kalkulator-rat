import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DEFAULT_LOAN_INPUT, LoanInput } from '../../core/models/loan-input.model';
import { Overpayment } from '../../core/models/overpayment.model';
import { RateChange } from '../../core/models/rate-change.model';
import { Budget, DEFAULT_BUDGET } from '../../core/models/budget.model';
import { AppState } from '../../core/models/scenario.model';
import { LoanCalculatorService } from '../../core/services/loan-calculator.service';
import { PdfExportService } from '../../core/services/pdf-export.service';
import { CsvExportService } from '../../core/services/csv-export.service';
import { ScenarioStorageService } from '../../core/services/scenario-storage.service';
import { UrlStateService } from '../../core/services/url-state.service';
import { ThemeService } from '../../core/services/theme.service';
import { DtiCalculatorService } from '../../core/services/dti-calculator.service';
import { LoanFormComponent } from './loan-form/loan-form.component';
import { OverpaymentsFormComponent } from './overpayments-form/overpayments-form.component';
import { RateChangesFormComponent } from './rate-changes-form/rate-changes-form.component';
import { BudgetFormComponent } from './budget-form/budget-form.component';
import { ThreeColumnSummaryComponent } from './three-column-summary/three-column-summary.component';
import { ScheduleTableComponent } from './schedule-table/schedule-table.component';
import { BalanceChartComponent } from './charts/balance-chart.component';
import { StructureChartComponent } from './charts/structure-chart.component';
import { WhatIfTableComponent } from './what-if/what-if-table.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { SaveScenarioDialogComponent } from './save-scenario-dialog/save-scenario-dialog.component';

@Component({
  selector: 'app-calculator-page',
  templateUrl: './calculator.page.html',
  styleUrl: './calculator.page.scss',
  providers: [MessageService],
  imports: [
    ToastModule,
    LoanFormComponent,
    OverpaymentsFormComponent,
    RateChangesFormComponent,
    BudgetFormComponent,
    ThreeColumnSummaryComponent,
    ScheduleTableComponent,
    BalanceChartComponent,
    StructureChartComponent,
    WhatIfTableComponent,
    ToolbarComponent,
    SaveScenarioDialogComponent,
  ],
})
export class CalculatorPage implements OnInit {
  private readonly calculatorService = inject(LoanCalculatorService);
  private readonly pdfService = inject(PdfExportService);
  private readonly csvService = inject(CsvExportService);
  private readonly storage = inject(ScenarioStorageService);
  private readonly urlState = inject(UrlStateService);
  private readonly theme = inject(ThemeService);
  private readonly dtiService = inject(DtiCalculatorService);
  private readonly messageService = inject(MessageService);

  loanInput = signal<LoanInput>({ ...DEFAULT_LOAN_INPUT });
  overpayments = signal<Overpayment[]>([]);
  rateChanges = signal<RateChange[]>([]);
  budget = signal<Budget>({ ...DEFAULT_BUDGET });

  comparison = computed(() =>
    this.calculatorService.calculateThreePlans(
      this.loanInput(),
      this.overpayments(),
      this.rateChanges(),
    ),
  );

  dtiIndicators = computed(() =>
    this.dtiService.calculate(this.comparison().planA.result.averageMonthlyPayment, this.budget()),
  );

  shareUrl = computed(() => this.urlState.buildShareUrl(this.appState()));

  appState = computed<AppState>(() => ({
    loanInput: this.loanInput(),
    overpayments: this.overpayments(),
    rateChanges: this.rateChanges(),
    budget: this.budget(),
  }));

  isFormInvalid = computed(() => {
    const i = this.loanInput();
    return i.amount <= 0 || i.months <= 0 || i.annualRatePercent < 0;
  });

  exportingPdf = signal(false);
  saveDialogVisible = signal(false);

  private autoSaveScheduled = false;

  constructor() {
    // Auto-save + URL hash update on every state change (debounced via micro-tasks).
    effect(() => {
      const state = this.appState();
      this.scheduleAutoSave(state);
    });
  }

  ngOnInit(): void {
    this.theme.init();

    // Priority: URL hash > auto-save > defaults.
    const fromUrl = this.urlState.readFromCurrentHash();
    if (fromUrl) {
      this.applyState(fromUrl);
      this.messageService.add({
        severity: 'info',
        summary: 'Wczytano z linku',
        detail: 'Scenariusz został odtworzony z URL.',
        life: 4000,
      });
      return;
    }

    const fromAuto = this.storage.loadAuto();
    if (fromAuto) {
      this.applyState(fromAuto);
    }
  }

  applyState(state: AppState): void {
    this.loanInput.set(state.loanInput);
    this.overpayments.set(state.overpayments);
    this.rateChanges.set(state.rateChanges);
    this.budget.set(state.budget);
  }

  onProwizjaNadplatChange(value: number): void {
    this.loanInput.set({ ...this.loanInput(), prowizjaNadplat: value });
  }

  openSaveDialog(): void {
    this.saveDialogVisible.set(true);
  }

  async exportPdf(): Promise<void> {
    this.exportingPdf.set(true);
    try {
      const dti = this.dtiIndicators();
      await this.pdfService.exportToPdf(
        this.loanInput(),
        this.comparison(),
        this.budget(),
        dti.level !== 'unknown' ? dti : undefined,
      );
      this.messageService.add({
        severity: 'success',
        summary: 'PDF wygenerowany',
        detail: 'Plik został pobrany.',
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Błąd',
        detail: 'Nie udało się wygenerować PDF.',
      });
    } finally {
      this.exportingPdf.set(false);
    }
  }

  exportCsv(): void {
    this.csvService.exportSchedule(
      'kalkulator-rat_plan-a.csv',
      this.comparison().planA.result.schedule,
    );
    this.messageService.add({
      severity: 'success',
      summary: 'CSV wygenerowany',
      detail: 'Plik został pobrany (otwórz w Excelu).',
    });
  }

  private scheduleAutoSave(state: AppState): void {
    if (this.autoSaveScheduled) return;
    this.autoSaveScheduled = true;
    queueMicrotask(() => {
      this.autoSaveScheduled = false;
      try {
        this.storage.saveAuto(state);
        this.urlState.updateHash(state);
      } catch {
        // ignore
      }
    });
  }
}
