import { Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { SliderModule } from 'primeng/slider';
import { InputNumberModule } from 'primeng/inputnumber';
import { LoanInput } from '../../../core/models/loan-input.model';
import { Overpayment } from '../../../core/models/overpayment.model';
import { LoanCalculatorService } from '../../../core/services/loan-calculator.service';
import { MonthsToYearsPipe } from '../../../core/pipes/months-to-years.pipe';
import { EducationalTooltipComponent } from '../../../shared/educational-tooltip.component';

interface WhatIfRow {
  amount: number;
  months: number;
  monthsSaved: number;
  costSavedAmount: number;
  costSavedPercent: number;
  isCustom?: boolean;
}

@Component({
  selector: 'app-what-if-table',
  templateUrl: './what-if-table.component.html',
  styleUrl: './what-if-table.component.scss',
  imports: [
    CommonModule,
    DecimalPipe,
    FormsModule,
    CardModule,
    TableModule,
    SliderModule,
    InputNumberModule,
    MonthsToYearsPipe,
    EducationalTooltipComponent,
  ],
})
export class WhatIfTableComponent {
  private readonly calc = inject(LoanCalculatorService);

  loanInput = input.required<LoanInput>();

  readonly fixedAmounts = [200, 500, 1000, 2000, 5000];
  customAmount = signal<number>(750);

  rows = computed<WhatIfRow[]>(() => {
    const input = this.loanInput();
    const baseline = this.calc.calculateSchedule(input, [], []);
    const baselineCost = baseline.totalInterest + baseline.totalCapital;

    const compute = (amount: number, isCustom = false): WhatIfRow => {
      if (amount <= 0) {
        return {
          amount,
          months: baseline.actualMonths,
          monthsSaved: 0,
          costSavedAmount: 0,
          costSavedPercent: 0,
          isCustom,
        };
      }
      const overpayments: Overpayment[] = [
        {
          id: 'whatif',
          type: 'MONTHLY',
          amountMode: 'surplus',
          amount,
          fromInstallment: 1,
          effect: 'KEEP_TOTAL_PAYMENT',
        },
      ];
      const result = this.calc.calculateSchedule(input, overpayments, []);
      const planCost = result.totalInterest + result.totalCapital + result.totalOverpayments;
      const costSavedAmount = baselineCost - planCost;
      const costSavedPercent = baselineCost > 0 ? (costSavedAmount / baselineCost) * 100 : 0;
      return {
        amount,
        months: result.actualMonths,
        monthsSaved: baseline.actualMonths - result.actualMonths,
        costSavedAmount,
        costSavedPercent,
        isCustom,
      };
    };

    return [...this.fixedAmounts.map((a) => compute(a)), compute(this.customAmount(), true)];
  });

  onCustomChange(v: number | null): void {
    if (v == null) return;
    this.customAmount.set(Math.max(0, Math.min(20000, v)));
  }
}
