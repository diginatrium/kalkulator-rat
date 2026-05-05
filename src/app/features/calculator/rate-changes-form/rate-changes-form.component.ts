import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { RateChange } from '../../../core/models/rate-change.model';

@Component({
  selector: 'app-rate-changes-form',
  templateUrl: './rate-changes-form.component.html',
  styleUrl: './rate-changes-form.component.scss',
  imports: [FormsModule, InputNumberModule, ButtonModule, CardModule],
})
export class RateChangesFormComponent {
  rateChanges = input.required<RateChange[]>();
  rateChangesChange = output<RateChange[]>();

  addRateChange(): void {
    const next: RateChange = {
      id: crypto.randomUUID(),
      fromInstallment: 1,
      newAnnualRatePercent: 5,
    };
    this.rateChangesChange.emit([...this.rateChanges(), next]);
  }

  removeRateChange(id: string): void {
    this.rateChangesChange.emit(this.rateChanges().filter((rc) => rc.id !== id));
  }

  update(id: string, partial: Partial<RateChange>): void {
    const updated = this.rateChanges().map((rc) => (rc.id === id ? { ...rc, ...partial } : rc));
    this.rateChangesChange.emit(updated);
  }
}
