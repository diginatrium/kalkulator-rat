import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import {
  Overpayment,
  OverpaymentEffect,
  OverpaymentType,
} from '../../../core/models/overpayment.model';

@Component({
  selector: 'app-overpayments-form',
  templateUrl: './overpayments-form.component.html',
  styleUrl: './overpayments-form.component.scss',
  imports: [FormsModule, InputNumberModule, SelectModule, ButtonModule, CardModule],
})
export class OverpaymentsFormComponent {
  overpayments = input.required<Overpayment[]>();
  overpaymentsChange = output<Overpayment[]>();

  readonly typeOptions: { label: string; value: OverpaymentType }[] = [
    { label: 'Jednorazowa', value: 'ONE_TIME' },
    { label: 'Miesięczna (cykliczna)', value: 'MONTHLY' },
  ];

  readonly effectOptions: { label: string; value: OverpaymentEffect; monthlyOnly?: boolean }[] = [
    { label: 'Skróć okres kredytu', value: 'SHORTEN_PERIOD' },
    { label: 'Zmniejsz ratę', value: 'REDUCE_INSTALLMENT' },
    {
      label: 'Stała łączna kwota miesięczna (rata + nadpłata)',
      value: 'KEEP_TOTAL_PAYMENT',
      monthlyOnly: true,
    },
  ];

  effectOptionsFor(type: OverpaymentType): { label: string; value: OverpaymentEffect }[] {
    return this.effectOptions
      .filter((o) => !o.monthlyOnly || type === 'MONTHLY')
      .map(({ label, value }) => ({ label, value }));
  }

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
        // KEEP_TOTAL_PAYMENT nie ma sensu dla jednorazowej.
        if (merged.effect === 'KEEP_TOTAL_PAYMENT') merged.effect = 'SHORTEN_PERIOD';
      }
      return merged;
    });
    this.overpaymentsChange.emit(updated);
  }
}
