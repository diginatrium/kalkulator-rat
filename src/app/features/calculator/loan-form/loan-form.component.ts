import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InstallmentType, LoanInput } from '../../../core/models/loan-input.model';

@Component({
  selector: 'app-loan-form',
  templateUrl: './loan-form.component.html',
  styleUrl: './loan-form.component.scss',
  imports: [FormsModule, InputNumberModule, RadioButtonModule, CardModule, DividerModule],
})
export class LoanFormComponent {
  loanInput = input.required<LoanInput>();
  loanInputChange = output<LoanInput>();

  readonly installmentTypes: { label: string; value: InstallmentType }[] = [
    { label: 'Równe (annuitetowe)', value: 'EQUAL' },
    { label: 'Malejące', value: 'DECREASING' },
  ];

  onAmountChange(value: number | null): void {
    this.emit({ amount: value ?? 0 });
  }

  onMonthsChange(value: number | null): void {
    this.emit({ months: value ?? 0 });
  }

  onRateChange(value: number | null): void {
    this.emit({ annualRatePercent: value ?? 0 });
  }

  onTypeChange(value: InstallmentType): void {
    this.emit({ installmentType: value });
  }

  private emit(partial: Partial<LoanInput>): void {
    this.loanInputChange.emit({ ...this.loanInput(), ...partial });
  }
}
