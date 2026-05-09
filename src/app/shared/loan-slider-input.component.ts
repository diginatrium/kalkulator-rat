import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { SliderModule } from 'primeng/slider';
import { EducationalTooltipComponent } from './educational-tooltip.component';

@Component({
  selector: 'app-loan-slider-input',
  imports: [FormsModule, InputNumberModule, SliderModule, EducationalTooltipComponent],
  template: `
    <div class="slider-input">
      <div class="label-row">
        <label [for]="inputId()">{{ label() }}</label>
        @if (tooltip()) {
          <app-edu-tip [tip]="tooltip()!" />
        }
      </div>
      <p-inputNumber
        [inputId]="inputId()"
        [ngModel]="value()"
        (ngModelChange)="onValueChange($event)"
        [suffix]="suffix() ? ' ' + suffix() : ''"
        [min]="min()"
        [max]="max()"
        [minFractionDigits]="fractionDigits()"
        [maxFractionDigits]="fractionDigits()"
        [useGrouping]="useGrouping()"
        locale="pl-PL"
        styleClass="w-full"
      />
      <p-slider
        [ngModel]="clampedValue()"
        (ngModelChange)="onValueChange($event)"
        [min]="min()"
        [max]="max()"
        [step]="step()"
        styleClass="mt-2"
      />
      <div class="range-row">
        <span>{{ formatRange(min()) }}</span>
        <span>{{ formatRange(max()) }}</span>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .slider-input {
        display: flex;
        flex-direction: column;
      }
      .label-row {
        display: flex;
        align-items: center;
        margin-bottom: 0.35rem;

        label {
          font-weight: 600;
          font-size: 0.9rem;
        }
      }
      .range-row {
        display: flex;
        justify-content: space-between;
        margin-top: 0.25rem;
        color: var(--p-text-muted-color, #6b7280);
        font-size: 0.75rem;
      }
      :host ::ng-deep .p-slider {
        margin: 0.5rem 0 0.25rem;
      }
    `,
  ],
})
export class LoanSliderInputComponent {
  value = input.required<number>();
  valueChange = output<number>();

  label = input.required<string>();
  inputId = input<string>('input-' + Math.random().toString(36).slice(2, 8));
  suffix = input<string | undefined>(undefined);
  tooltip = input<string | undefined>(undefined);
  min = input<number>(0);
  max = input<number>(100);
  step = input<number>(1);
  fractionDigits = input<number>(0);
  useGrouping = input<boolean>(true);

  clampedValue = computed(() => {
    const v = this.value();
    return Math.min(this.max(), Math.max(this.min(), v));
  });

  onValueChange(v: number | null): void {
    if (v == null) return;
    const clamped = Math.min(this.max(), Math.max(this.min(), v));
    this.valueChange.emit(clamped);
  }

  formatRange(v: number): string {
    return v.toLocaleString('pl-PL', {
      maximumFractionDigits: this.fractionDigits(),
    });
  }
}
