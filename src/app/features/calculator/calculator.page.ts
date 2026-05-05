import { Component, computed, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LoanInput } from '../../core/models/loan-input.model';
import { Overpayment } from '../../core/models/overpayment.model';
import { RateChange } from '../../core/models/rate-change.model';
import { LoanCalculatorService } from '../../core/services/loan-calculator.service';
import { PdfExportService } from '../../core/services/pdf-export.service';
import { LoanFormComponent } from './loan-form/loan-form.component';
import { OverpaymentsFormComponent } from './overpayments-form/overpayments-form.component';
import { RateChangesFormComponent } from './rate-changes-form/rate-changes-form.component';
import { SummaryComponent } from './summary/summary.component';
import { ScheduleTableComponent } from './schedule-table/schedule-table.component';
import { BalanceChartComponent } from './charts/balance-chart.component';
import { StructureChartComponent } from './charts/structure-chart.component';

@Component({
  selector: 'app-calculator-page',
  templateUrl: './calculator.page.html',
  styleUrl: './calculator.page.scss',
  providers: [MessageService],
  imports: [
    ButtonModule,
    ToastModule,
    LoanFormComponent,
    OverpaymentsFormComponent,
    RateChangesFormComponent,
    SummaryComponent,
    ScheduleTableComponent,
    BalanceChartComponent,
    StructureChartComponent,
  ],
})
export class CalculatorPage {
  private readonly calculatorService = inject(LoanCalculatorService);
  private readonly pdfService = inject(PdfExportService);
  private readonly messageService = inject(MessageService);

  loanInput = signal<LoanInput>({
    amount: 400000,
    months: 360,
    annualRatePercent: 7.5,
    installmentType: 'EQUAL',
  });

  overpayments = signal<Overpayment[]>([]);
  rateChanges = signal<RateChange[]>([]);

  comparison = computed(() =>
    this.calculatorService.calculateComparison(
      this.loanInput(),
      this.overpayments(),
      this.rateChanges(),
    ),
  );

  exportingPdf = signal(false);

  async exportPdf(): Promise<void> {
    this.exportingPdf.set(true);
    try {
      await this.pdfService.exportToPdf(this.loanInput(), this.comparison());
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
}
