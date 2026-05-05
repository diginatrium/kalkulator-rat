import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import {
  Overpayment,
  OverpaymentEffect,
  OverpaymentType,
} from '../../../core/models/overpayment.model';

@Component({
  selector: 'app-overpayments-form',
  templateUrl: './overpayments-form.component.html',
  styleUrl: './overpayments-form.component.scss',
  imports: [FormsModule, InputNumberModule, SelectModule, ButtonModule, CardModule, TooltipModule],
})
export class OverpaymentsFormComponent {
  overpayments = input.required<Overpayment[]>();
  overpaymentsChange = output<Overpayment[]>();

  readonly typeOptions: { label: string; value: OverpaymentType }[] = [
    { label: 'Jednorazowo', value: 'ONE_TIME' },
    { label: 'Co miesiąc', value: 'MONTHLY' },
    { label: 'Co kwartał', value: 'QUARTERLY' },
    { label: 'Co pół roku', value: 'SEMIANNUAL' },
    { label: 'Co rok', value: 'ANNUAL' },
  ];

  readonly effectOptions: { label: string; value: OverpaymentEffect }[] = [
    { label: 'Skróć okres kredytu', value: 'SHORTEN_PERIOD' },
    { label: 'Zmniejsz ratę', value: 'REDUCE_INSTALLMENT' },
    { label: 'Stała łączna kwota miesięczna (rata + nadpłata)', value: 'KEEP_TOTAL_PAYMENT' },
  ];

  addOverpayment(): void {
    const next: Overpayment = {
      id: crypto.randomUUID(),
      type: 'ONE_TIME',
      amount: 10000,
      fromInstallment: 1,
      toInstallment: undefined,
      effect: 'SHORTEN_PERIOD',
    };
    this.overpaymentsChange.emit([...this.overpayments(), next]);
  }

  removeOverpayment(id: string): void {
    this.overpaymentsChange.emit(this.overpayments().filter((op) => op.id !== id));
  }

  update(id: string, partial: Partial<Overpayment>): void {
    const updated = this.overpayments().map((op) => {
      if (op.id !== id) return op;
      const merged = { ...op, ...partial };
      if (merged.type === 'ONE_TIME') {
        merged.toInstallment = undefined;
      }
      // KEEP_TOTAL_PAYMENT wymaga cyklicznej nadpłaty - jeżeli typ jest ONE_TIME,
      // automatycznie przełącz na "Co miesiąc" żeby opcja działała zgodnie z oczekiwaniem.
      if (merged.effect === 'KEEP_TOTAL_PAYMENT' && merged.type === 'ONE_TIME') {
        merged.type = 'MONTHLY';
      }
      return merged;
    });
    this.overpaymentsChange.emit(updated);
  }
}
