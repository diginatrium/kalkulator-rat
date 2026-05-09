import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageModule } from 'primeng/message';
import { Budget } from '../../../core/models/budget.model';
import { DtiCalculatorService } from '../../../core/services/dti-calculator.service';
import { EducationalTooltipComponent } from '../../../shared/educational-tooltip.component';

@Component({
  selector: 'app-budget-form',
  templateUrl: './budget-form.component.html',
  styleUrl: './budget-form.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputNumberModule,
    ProgressBarModule,
    MessageModule,
    EducationalTooltipComponent,
  ],
})
export class BudgetFormComponent {
  private readonly dtiService = inject(DtiCalculatorService);

  budget = input.required<Budget>();
  budgetChange = output<Budget>();

  averageMonthlyPayment = input<number>(0);

  indicators = computed(() =>
    this.dtiService.calculate(this.averageMonthlyPayment(), this.budget()),
  );

  /** % progress fill (0-100, capped at 100 for display) */
  dtiBarValue = computed(() => Math.min(100, this.indicators().dti));

  errors = computed(() => {
    const b = this.budget();
    const e: string[] = [];
    if (b.monthlyIncome < 0) e.push('Dochód nie może być ujemny');
    if (b.otherDebtsMonthly < 0) e.push('Inne raty nie mogą być ujemne');
    if (b.householdSize < 1 || b.householdSize > 20) e.push('Liczba osób 1-20');
    return e;
  });

  onIncomeChange(v: number | null): void {
    this.emit({ monthlyIncome: v ?? 0 });
  }

  onOtherDebtsChange(v: number | null): void {
    this.emit({ otherDebtsMonthly: v ?? 0 });
  }

  onHouseholdSizeChange(v: number | null): void {
    this.emit({ householdSize: Math.max(1, v ?? 1) });
  }

  private emit(partial: Partial<Budget>): void {
    this.budgetChange.emit({ ...this.budget(), ...partial });
  }
}
