import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageModule } from 'primeng/message';
import { InstallmentType, LoanInput, ProwizjaType } from '../../../core/models/loan-input.model';
import { LoanSliderInputComponent } from '../../../shared/loan-slider-input.component';
import { EducationalTooltipComponent } from '../../../shared/educational-tooltip.component';

@Component({
  selector: 'app-loan-form',
  templateUrl: './loan-form.component.html',
  styleUrl: './loan-form.component.scss',
  imports: [
    FormsModule,
    CardModule,
    RadioButtonModule,
    CheckboxModule,
    InputNumberModule,
    ButtonModule,
    DatePickerModule,
    MessageModule,
    LoanSliderInputComponent,
    EducationalTooltipComponent,
  ],
})
export class LoanFormComponent {
  loanInput = input.required<LoanInput>();
  loanInputChange = output<LoanInput>();

  readonly installmentTypes: { label: string; value: InstallmentType; tip: string }[] = [
    {
      label: 'Równe (annuitetowe)',
      value: 'EQUAL',
      tip: 'Stała rata przez cały okres kredytu - na początku przeważają odsetki, potem kapitał',
    },
    {
      label: 'Malejące',
      value: 'DECREASING',
      tip: 'Stała część kapitałowa, malejące odsetki - pierwsze raty wyższe, ostatnie niższe',
    },
  ];

  errors = computed(() => {
    const i = this.loanInput();
    const e: string[] = [];
    if (!Number.isFinite(i.amount) || i.amount <= 0) e.push('Kwota musi być dodatnia');
    if (i.amount > 100_000_000) e.push('Kwota zbyt wysoka (max 100 000 000 zł)');
    if (!Number.isFinite(i.months) || i.months < 1 || i.months > 480)
      e.push('Liczba rat musi być w zakresie 1-480');
    if (i.annualRatePercent < 0 || i.annualRatePercent > 50)
      e.push('Oprocentowanie musi być w zakresie 0-50%');
    if (i.inflationRatePercent < 0 || i.inflationRatePercent > 30)
      e.push('Inflacja musi być w zakresie 0-30%');
    return e;
  });

  onAmountChange(amount: number): void {
    this.emit({ amount });
  }

  onMonthsChange(months: number): void {
    this.emit({ months });
  }

  onRateChange(annualRatePercent: number): void {
    this.emit({ annualRatePercent });
  }

  onTypeChange(installmentType: InstallmentType): void {
    this.emit({ installmentType });
  }

  onStartDateChange(startDate: Date | null): void {
    if (startDate) this.emit({ startDate });
  }

  onInflationEnabledChange(inflationEnabled: boolean): void {
    this.emit({ inflationEnabled });
  }

  onInflationRateChange(inflationRatePercent: number | null): void {
    this.emit({ inflationRatePercent: inflationRatePercent ?? 0 });
  }

  onProwizjaChange(value: number | null): void {
    this.emit({ prowizja: value ?? 0 });
  }

  onProwizjaTypeChange(type: ProwizjaType): void {
    this.emit({ prowizjaType: type, prowizja: 0 });
  }

  private emit(partial: Partial<LoanInput>): void {
    this.loanInputChange.emit({ ...this.loanInput(), ...partial });
  }
}
