# Kalkulator Rat — Features & Visual Themes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add prowizja za udzielenie, prowizja od nadpłat, cumulative cost column, and XLSX export to kalkulator-rat, then create two themed folder copies for side-by-side comparison.

**Architecture:** Extend models first (Task 1), then update the calculation service with tests (Task 2), then update each UI component that consumes the new data (Tasks 3–6), then update/add export services (Tasks 7–8), wire into the page (Task 9), and finally duplicate + retheme (Tasks 10–11). Each task is self-contained and builds on the previous.

**Tech Stack:** Angular v21, PrimeNG v21, TypeScript 5.9, Vitest 4, xlsx (SheetJS), jsPDF + jspdf-autotable (existing)

---

## File Map

| File | Action | What changes |
|------|--------|--------------|
| `src/app/core/models/loan-input.model.ts` | Modify | Add `prowizja`, `prowizjaType`, `prowizjaNadplat` |
| `src/app/core/models/installment.model.ts` | Modify | Add `laczneKoszty` |
| `src/app/core/models/loan-result.model.ts` | Modify | Add `totalProwizja`, `totalOvpCommission` |
| `src/app/core/services/loan-calculator.service.ts` | Modify | Compute new fields in calculation loop |
| `src/app/core/services/loan-calculator.service.spec.ts` | Create | Vitest tests for new calculation logic |
| `src/app/core/services/xlsx-export.service.ts` | Create | XLSX export (3 worksheets) |
| `src/app/core/services/pdf-export.service.ts` | Modify | Include prowizja rows + Łączne koszty column |
| `src/app/features/calculator/loan-form/loan-form.component.ts` | Modify | Add prowizja handlers |
| `src/app/features/calculator/loan-form/loan-form.component.html` | Modify | Prowizja field with % / zł toggle |
| `src/app/features/calculator/overpayments-form/overpayments-form.component.ts` | Modify | Add prowizjaNadplat input/output |
| `src/app/features/calculator/overpayments-form/overpayments-form.component.html` | Modify | Prowizja od nadpłat field |
| `src/app/features/calculator/schedule-table/schedule-table.component.html` | Modify | Add Łączne koszty column |
| `src/app/features/calculator/summary/summary.component.html` | Modify | Add prowizja rows |
| `src/app/features/calculator/calculator.page.ts` | Modify | Inject XlsxExportService, add exportXlsx(), update default input |
| `src/app/features/calculator/calculator.page.html` | Modify | Add XLSX button |

---

## Task 1: Model Extensions

**Files:**
- Modify: `src/app/core/models/loan-input.model.ts`
- Modify: `src/app/core/models/installment.model.ts`
- Modify: `src/app/core/models/loan-result.model.ts`

- [ ] **Step 1: Update `loan-input.model.ts`**

Replace the entire file:

```typescript
export type InstallmentType = 'EQUAL' | 'DECREASING';
export type ProwizjaType = 'percent' | 'amount';

export interface LoanInput {
  amount: number;
  months: number;
  annualRatePercent: number;
  installmentType: InstallmentType;
  prowizja: number;
  prowizjaType: ProwizjaType;
  prowizjaNadplat: number;
}
```

- [ ] **Step 2: Update `installment.model.ts`**

Replace the entire file:

```typescript
export interface Installment {
  number: number;
  scheduledPayment: number;
  capitalPart: number;
  interestPart: number;
  overpayment: number;
  remainingBalance: number;
  laczneKoszty: number;
}
```

- [ ] **Step 3: Update `loan-result.model.ts`**

Replace the entire file:

```typescript
import { Installment } from './installment.model';

export interface LoanResult {
  schedule: Installment[];
  totalPaid: number;
  totalCapital: number;
  totalInterest: number;
  totalOverpayments: number;
  totalProwizja: number;
  totalOvpCommission: number;
  actualMonths: number;
}

export interface ComparisonResult {
  baseline: LoanResult;
  modified: LoanResult;
  monthsSaved: number;
  costSavedAmount: number;
  costSavedPercent: number;
}
```

- [ ] **Step 4: Fix TypeScript compile errors**

Run: `npx tsc --noEmit`

You will see errors in `calculator.page.ts` (default `loanInput` signal missing new fields) and `loan-calculator.service.ts` (return objects missing new fields). These are fixed in Tasks 2 and 9 respectively. Fix the `calculator.page.ts` default now only:

In `src/app/features/calculator/calculator.page.ts`, update the signal default:
```typescript
loanInput = signal<LoanInput>({
  amount: 400000,
  months: 360,
  annualRatePercent: 7.5,
  installmentType: 'EQUAL',
  prowizja: 0,
  prowizjaType: 'percent',
  prowizjaNadplat: 0,
});
```

- [ ] **Step 5: Commit**

```bash
git add src/app/core/models/ src/app/features/calculator/calculator.page.ts
git commit -m "feat: extend models with prowizja and laczneKoszty fields"
```

---

## Task 2: Calculator Service — Tests + Implementation

**Files:**
- Modify: `src/app/core/services/loan-calculator.service.ts`
- Create: `src/app/core/services/loan-calculator.service.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `src/app/core/services/loan-calculator.service.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { LoanCalculatorService } from './loan-calculator.service';
import { LoanInput } from '../models/loan-input.model';

const svc = new LoanCalculatorService();

const baseInput: LoanInput = {
  amount: 100000,
  months: 12,
  annualRatePercent: 12,
  installmentType: 'EQUAL',
  prowizja: 0,
  prowizjaType: 'percent',
  prowizjaNadplat: 0,
};

describe('prowizja za udzielenie', () => {
  it('adds percent-based fee to totalProwizja', () => {
    const result = svc.calculateSchedule(
      { ...baseInput, prowizja: 2, prowizjaType: 'percent' },
      [], []
    );
    expect(result.totalProwizja).toBeCloseTo(2000, 0);
  });

  it('adds fixed-amount fee to totalProwizja', () => {
    const result = svc.calculateSchedule(
      { ...baseInput, prowizja: 1500, prowizjaType: 'amount' },
      [], []
    );
    expect(result.totalProwizja).toBeCloseTo(1500, 0);
  });

  it('totalProwizja is 0 when prowizja is 0', () => {
    const result = svc.calculateSchedule(baseInput, [], []);
    expect(result.totalProwizja).toBe(0);
  });
});

describe('prowizja od nadplat', () => {
  it('charges commission on each overpayment', () => {
    const op = {
      id: '1', type: 'ONE_TIME' as const, amount: 10000,
      fromInstallment: 1, effect: 'SHORTEN_PERIOD' as const,
    };
    const result = svc.calculateSchedule(
      { ...baseInput, prowizjaNadplat: 2 },
      [op], []
    );
    expect(result.totalOvpCommission).toBeCloseTo(200, 0);
  });

  it('totalOvpCommission is 0 when prowizjaNadplat is 0', () => {
    const op = {
      id: '1', type: 'ONE_TIME' as const, amount: 10000,
      fromInstallment: 1, effect: 'SHORTEN_PERIOD' as const,
    };
    const result = svc.calculateSchedule(baseInput, [op], []);
    expect(result.totalOvpCommission).toBe(0);
  });
});

describe('laczneKoszty', () => {
  it('first installment laczneKoszty equals its interest', () => {
    const result = svc.calculateSchedule(baseInput, [], []);
    const first = result.schedule[0];
    expect(first.laczneKoszty).toBeCloseTo(first.interestPart, 2);
  });

  it('laczneKoszty is monotonically increasing', () => {
    const result = svc.calculateSchedule(baseInput, [], []);
    for (let i = 1; i < result.schedule.length; i++) {
      expect(result.schedule[i].laczneKoszty).toBeGreaterThan(result.schedule[i - 1].laczneKoszty);
    }
  });

  it('last laczneKoszty equals totalInterest when no overpayments', () => {
    const result = svc.calculateSchedule(baseInput, [], []);
    const last = result.schedule[result.schedule.length - 1];
    expect(last.laczneKoszty).toBeCloseTo(result.totalInterest, 1);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `npx vitest run src/app/core/services/loan-calculator.service.spec.ts`

Expected: FAIL — `totalProwizja`, `totalOvpCommission`, `laczneKoszty` are `undefined`.

- [ ] **Step 3: Update `loan-calculator.service.ts`**

Replace the entire file:

```typescript
import { Injectable } from '@angular/core';
import { LoanInput } from '../models/loan-input.model';
import { Overpayment, OverpaymentEffect, overpaymentStepMonths } from '../models/overpayment.model';
import { RateChange } from '../models/rate-change.model';
import { Installment } from '../models/installment.model';
import { ComparisonResult, LoanResult } from '../models/loan-result.model';

interface OverpaymentsBreakdown {
  totalAmount: number;
  primaryEffect: OverpaymentEffect;
}

@Injectable({ providedIn: 'root' })
export class LoanCalculatorService {
  calculateComparison(
    input: LoanInput,
    overpayments: Overpayment[],
    rateChanges: RateChange[],
  ): ComparisonResult {
    const baseline = this.calculateSchedule(input, [], []);
    const modified = this.calculateSchedule(input, overpayments, rateChanges);

    const baselineCost = baseline.totalInterest + baseline.totalCapital + baseline.totalProwizja;
    const modifiedCost =
      modified.totalInterest +
      modified.totalCapital +
      modified.totalOverpayments +
      modified.totalProwizja +
      modified.totalOvpCommission;
    const costSavedAmount = baselineCost - modifiedCost;
    const costSavedPercent = baselineCost > 0 ? (costSavedAmount / baselineCost) * 100 : 0;

    return {
      baseline,
      modified,
      monthsSaved: baseline.actualMonths - modified.actualMonths,
      costSavedAmount,
      costSavedPercent,
    };
  }

  calculateSchedule(
    input: LoanInput,
    overpayments: Overpayment[],
    rateChanges: RateChange[],
  ): LoanResult {
    if (input.amount <= 0 || input.months <= 0) {
      return {
        schedule: [],
        totalPaid: 0,
        totalCapital: 0,
        totalInterest: 0,
        totalOverpayments: 0,
        totalProwizja: 0,
        totalOvpCommission: 0,
        actualMonths: 0,
      };
    }

    const prowizjaZl =
      input.prowizjaType === 'percent'
        ? (input.amount * input.prowizja) / 100
        : input.prowizja;

    const schedule: Installment[] = [];
    let balance = input.amount;
    let currentAnnualRate = input.annualRatePercent;
    let remainingMonths = input.months;
    let equalInstallment = this.calcEqualInstallment(balance, currentAnnualRate, remainingMonths);

    let totalCapitalRaw = 0;
    let totalInterestRaw = 0;
    let totalOverpaymentsRaw = 0;
    let totalOvpCommissionRaw = 0;
    let cumulativeCost = 0;

    const sortedRateChanges = [...rateChanges].sort(
      (a, b) => a.fromInstallment - b.fromInstallment,
    );

    const keepTotalTargets = new Map<string, number>();

    let installmentNumber = 1;
    const maxIterations = input.months * 2 + 100;

    while (balance > 0.005 && installmentNumber <= maxIterations) {
      const rateChange = sortedRateChanges.find((rc) => rc.fromInstallment === installmentNumber);
      if (rateChange) {
        currentAnnualRate = rateChange.newAnnualRatePercent;
        remainingMonths = input.months - installmentNumber + 1;
        equalInstallment = this.calcEqualInstallment(balance, currentAnnualRate, remainingMonths);
      }

      const monthlyRate = currentAnnualRate / 100 / 12;
      const interestPart = balance * monthlyRate;

      let capitalPart: number;
      let scheduledPayment: number;

      if (input.installmentType === 'EQUAL') {
        scheduledPayment = Math.min(equalInstallment, balance + interestPart);
        capitalPart = scheduledPayment - interestPart;
      } else {
        const constCapital = input.amount / input.months;
        capitalPart = Math.min(constCapital, balance);
        scheduledPayment = capitalPart + interestPart;
      }

      capitalPart = Math.max(0, capitalPart);

      const { totalAmount: overpaymentAmount, primaryEffect } =
        this.computeOverpaymentsForInstallment(
          overpayments,
          installmentNumber,
          scheduledPayment,
          keepTotalTargets,
        );
      const effectiveOverpayment = Math.min(overpaymentAmount, Math.max(0, balance - capitalPart));
      const ovpCommission = Math.round((effectiveOverpayment * input.prowizjaNadplat) / 100 * 100) / 100;

      balance -= capitalPart;
      balance -= effectiveOverpayment;
      balance = Math.max(0, balance);

      totalCapitalRaw += capitalPart;
      totalInterestRaw += interestPart;
      totalOverpaymentsRaw += effectiveOverpayment;
      totalOvpCommissionRaw += ovpCommission;
      cumulativeCost += interestPart + ovpCommission;

      const installment: Installment = {
        number: installmentNumber,
        scheduledPayment: Math.round(scheduledPayment * 100) / 100,
        capitalPart: Math.round(capitalPart * 100) / 100,
        interestPart: Math.round(interestPart * 100) / 100,
        overpayment: Math.round(effectiveOverpayment * 100) / 100,
        remainingBalance: Math.round(balance * 100) / 100,
        laczneKoszty: Math.round(cumulativeCost * 100) / 100,
      };
      schedule.push(installment);

      if (effectiveOverpayment > 0) {
        const remainingAfter = input.months - installmentNumber;
        if (remainingAfter > 0) {
          if (primaryEffect === 'REDUCE_INSTALLMENT' || primaryEffect === 'KEEP_TOTAL_PAYMENT') {
            equalInstallment = this.calcEqualInstallment(
              balance,
              currentAnnualRate,
              remainingAfter,
            );
          }
        }
      }

      installmentNumber++;
    }

    const totalProwizja = Math.round(prowizjaZl * 100) / 100;
    const totalOvpCommission = Math.round(totalOvpCommissionRaw * 100) / 100;

    return {
      schedule,
      totalPaid: Math.round(
        (totalCapitalRaw + totalInterestRaw + totalOverpaymentsRaw + totalProwizja + totalOvpCommission) * 100
      ) / 100,
      totalCapital: Math.round(totalCapitalRaw * 100) / 100,
      totalInterest: Math.round(totalInterestRaw * 100) / 100,
      totalOverpayments: Math.round(totalOverpaymentsRaw * 100) / 100,
      totalProwizja,
      totalOvpCommission,
      actualMonths: schedule.length,
    };
  }

  private calcEqualInstallment(balance: number, annualRatePercent: number, months: number): number {
    if (months <= 0) return balance;
    const r = annualRatePercent / 100 / 12;
    if (r === 0) return balance / months;
    const factor = Math.pow(1 + r, months);
    return (balance * r * factor) / (factor - 1);
  }

  private computeOverpaymentsForInstallment(
    overpayments: Overpayment[],
    installmentNumber: number,
    scheduledPayment: number,
    keepTotalTargets: Map<string, number>,
  ): OverpaymentsBreakdown {
    let totalAmount = 0;
    let primaryEffect: OverpaymentEffect = 'SHORTEN_PERIOD';
    let foundPrimary = false;

    for (const op of overpayments) {
      if (!this.isOverpaymentActive(op, installmentNumber)) continue;

      let amount: number;
      if (op.effect === 'KEEP_TOTAL_PAYMENT' && op.type !== 'ONE_TIME') {
        if (!keepTotalTargets.has(op.id)) {
          keepTotalTargets.set(op.id, scheduledPayment + op.amount);
        }
        const target = keepTotalTargets.get(op.id) as number;
        amount = Math.max(0, target - scheduledPayment);
      } else {
        amount = op.amount;
      }

      totalAmount += amount;
      if (!foundPrimary) {
        primaryEffect =
          op.effect === 'KEEP_TOTAL_PAYMENT' && op.type === 'ONE_TIME'
            ? 'SHORTEN_PERIOD'
            : op.effect;
        foundPrimary = true;
      }
    }

    return { totalAmount, primaryEffect };
  }

  private isOverpaymentActive(op: Overpayment, installmentNumber: number): boolean {
    if (op.type === 'ONE_TIME') {
      return op.fromInstallment === installmentNumber;
    }
    const from = op.fromInstallment;
    const to = op.toInstallment ?? Infinity;
    if (installmentNumber < from || installmentNumber > to) return false;

    const step = overpaymentStepMonths(op.type);
    return step > 0 && (installmentNumber - from) % step === 0;
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npx vitest run src/app/core/services/loan-calculator.service.spec.ts`

Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/core/services/
git commit -m "feat: implement prowizja and laczneKoszty calculation"
```

---

## Task 3: Loan Form — Prowizja Field

**Files:**
- Modify: `src/app/features/calculator/loan-form/loan-form.component.ts`
- Modify: `src/app/features/calculator/loan-form/loan-form.component.html`

- [ ] **Step 1: Update `loan-form.component.ts`**

Replace the entire file:

```typescript
import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InstallmentType, LoanInput, ProwizjaType } from '../../../core/models/loan-input.model';

@Component({
  selector: 'app-loan-form',
  templateUrl: './loan-form.component.html',
  styleUrl: './loan-form.component.scss',
  imports: [FormsModule, InputNumberModule, RadioButtonModule, ButtonModule, CardModule, DividerModule],
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
```

- [ ] **Step 2: Update `loan-form.component.html`**

Add the prowizja field after the `Rodzaj rat` field (before `</div>` of the outer flex):

```html
<p-card header="Parametry kredytu">
  <div class="flex flex-column gap-4">
    <div class="field">
      <label for="amount" class="block font-semibold mb-2">Kwota kredytu</label>
      <p-inputNumber
        inputId="amount"
        [ngModel]="loanInput().amount"
        (ngModelChange)="onAmountChange($event)"
        suffix=" zł"
        [min]="0"
        [maxFractionDigits]="0"
        [useGrouping]="true"
        locale="pl-PL"
        styleClass="w-full"
      />
    </div>

    <div class="field">
      <label for="months" class="block font-semibold mb-2">Liczba rat</label>
      <p-inputNumber
        inputId="months"
        [ngModel]="loanInput().months"
        (ngModelChange)="onMonthsChange($event)"
        suffix=" mc"
        [min]="1"
        [max]="480"
        [maxFractionDigits]="0"
        styleClass="w-full"
      />
    </div>

    <div class="field">
      <label for="rate" class="block font-semibold mb-2">Oprocentowanie roczne</label>
      <p-inputNumber
        inputId="rate"
        [ngModel]="loanInput().annualRatePercent"
        (ngModelChange)="onRateChange($event)"
        suffix=" %"
        [min]="0"
        [max]="100"
        [minFractionDigits]="2"
        [maxFractionDigits]="2"
        styleClass="w-full"
      />
    </div>

    <div class="field">
      <label class="block font-semibold mb-2">Rodzaj rat</label>
      <div class="flex gap-4">
        @for (type of installmentTypes; track type.value) {
          <div class="flex align-items-center gap-2">
            <p-radioButton
              [inputId]="'type_' + type.value"
              [value]="type.value"
              [ngModel]="loanInput().installmentType"
              (ngModelChange)="onTypeChange($event)"
              name="installmentType"
            />
            <label [for]="'type_' + type.value">{{ type.label }}</label>
          </div>
        }
      </div>
    </div>

    <div class="field">
      <label for="prowizja" class="block font-semibold mb-2">Prowizja za udzielenie</label>
      <div class="flex gap-2">
        <p-inputNumber
          inputId="prowizja"
          [ngModel]="loanInput().prowizja"
          (ngModelChange)="onProwizjaChange($event)"
          [min]="0"
          [minFractionDigits]="2"
          [maxFractionDigits]="2"
          styleClass="flex-1"
        />
        <p-button
          label="%"
          [outlined]="loanInput().prowizjaType !== 'percent'"
          (onClick)="onProwizjaTypeChange('percent')"
        />
        <p-button
          label="zł"
          [outlined]="loanInput().prowizjaType !== 'amount'"
          (onClick)="onProwizjaTypeChange('amount')"
        />
      </div>
    </div>
  </div>
</p-card>
```

- [ ] **Step 3: Verify in browser**

Run: `npm start`

Open `http://localhost:4200`. Check that the prowizja field appears below "Rodzaj rat" with `%` and `zł` toggle buttons. Clicking `zł` should visually toggle the active button. Setting prowizja to 2% on a 400 000 zł loan should add 8 000 zł to total cost in the summary.

- [ ] **Step 4: Commit**

```bash
git add src/app/features/calculator/loan-form/
git commit -m "feat: add prowizja za udzielenie field with % / zł toggle"
```

---

## Task 4: Overpayments Form — Prowizja od Nadpłat

**Files:**
- Modify: `src/app/features/calculator/overpayments-form/overpayments-form.component.ts`
- Modify: `src/app/features/calculator/overpayments-form/overpayments-form.component.html`

- [ ] **Step 1: Update `overpayments-form.component.ts`**

Add `prowizjaNadplat` input/output alongside the existing overpayments input/output. Add at the top of the class body (after existing inputs):

```typescript
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

  prowizjaNadplat = input.required<number>();
  prowizjaNadplatChange = output<number>();

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
      if (merged.effect === 'KEEP_TOTAL_PAYMENT' && merged.type === 'ONE_TIME') {
        merged.type = 'MONTHLY';
      }
      return merged;
    });
    this.overpaymentsChange.emit(updated);
  }
}
```

- [ ] **Step 2: Update `calculator.page.ts` to pass `prowizjaNadplat`**

The overpayments-form now requires `prowizjaNadplat` and `prowizjaNadplatChange`. Update `calculator.page.ts`:

Add a signal for prowizjaNadplat (derived from loanInput) — no separate signal needed; it's already in `loanInput()`. Update the `loanInputChange` handler to propagate prowizjaNadplat changes from the form.

In `calculator.page.html`, update the `app-overpayments-form` binding (done in Task 9). For now, to fix the compile error, read the note in Task 9 Step 1 and do only the binding update:

In `calculator.page.html`, change:
```html
<app-overpayments-form
  [overpayments]="overpayments()"
  (overpaymentsChange)="overpayments.set($event)"
/>
```
to:
```html
<app-overpayments-form
  [overpayments]="overpayments()"
  (overpaymentsChange)="overpayments.set($event)"
  [prowizjaNadplat]="loanInput().prowizjaNadplat"
  (prowizjaNadplatChange)="loanInput.set({ ...loanInput(), prowizjaNadplat: $event })"
/>
```

- [ ] **Step 3: Add prowizjaNadplat field to `overpayments-form.component.html`**

Read the existing HTML file first. Add the prowizjaNadplat field as the FIRST item inside the card, before the list of overpayments entries. Open the file and add after `<p-card header="Nadpłaty kredytu">`:

```html
<div class="field mb-4">
  <label for="prowizja-nadplat" class="block font-semibold mb-2">
    Prowizja od nadpłat
  </label>
  <p-inputNumber
    inputId="prowizja-nadplat"
    [ngModel]="prowizjaNadplat()"
    (ngModelChange)="prowizjaNadplatChange.emit($event ?? 0)"
    suffix=" %"
    [min]="0"
    [max]="10"
    [minFractionDigits]="2"
    [maxFractionDigits]="2"
    styleClass="w-full"
  />
</div>
```

- [ ] **Step 4: Verify in browser**

Run: `npm start`

Open `http://localhost:4200`. In the Nadpłaty section, the first field should be "Prowizja od nadpłat". Set it to 2%, add a 10 000 zł one-time overpayment, and verify the summary's total cost increases by 200 zł (2% of 10 000).

- [ ] **Step 5: Commit**

```bash
git add src/app/features/calculator/overpayments-form/ src/app/features/calculator/calculator.page.html
git commit -m "feat: add prowizja od nadplat field to overpayments form"
```

---

## Task 5: Schedule Table — Łączne Koszty Column

**Files:**
- Modify: `src/app/features/calculator/schedule-table/schedule-table.component.html`

- [ ] **Step 1: Add column header**

In `schedule-table.component.html`, in the `<ng-template #header>` block, add after the last `<th>` (Saldo):

```html
<th class="text-right" pSortableColumn="laczneKoszty">
  Łączne koszty (zł) <p-sortIcon field="laczneKoszty" />
</th>
```

- [ ] **Step 2: Add column body cell**

In the `<ng-template #body let-inst>` block, add after the last `<td>` (remainingBalance):

```html
<td class="text-right">{{ inst.laczneKoszty | number: '1.2-2' : 'pl' }}</td>
```

- [ ] **Step 3: Update `emptymessage` colspan**

Change `colspan="6"` to `colspan="7"`.

- [ ] **Step 4: Verify in browser**

Run: `npm start`. The schedule table should have 7 columns, with "Łączne koszty" as the last one, showing increasing values per row.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/calculator/schedule-table/
git commit -m "feat: add laczne koszty column to schedule table"
```

---

## Task 6: Summary — Prowizja Rows

**Files:**
- Modify: `src/app/features/calculator/summary/summary.component.html`

- [ ] **Step 1: Add prowizja rows to both columns**

In `summary.component.html`, in the `summary-col` for "Kredyt wyjściowy", add after the "Nadpłaty" row:

```html
<div class="summary-row">
  <span class="label">Prowizja za udzielenie</span>
  <span class="value">{{ comparison().baseline.totalProwizja | number: '1.2-2' : 'pl' }} zł</span>
</div>
<div class="summary-row">
  <span class="label">Prowizja od nadpłat</span>
  <span class="value">{{ comparison().baseline.totalOvpCommission | number: '1.2-2' : 'pl' }} zł</span>
</div>
```

In the `summary-col` for "Kredyt zmodyfikowany", add the same after its "Nadpłaty" row:

```html
<div class="summary-row">
  <span class="label">Prowizja za udzielenie</span>
  <span class="value">{{ comparison().modified.totalProwizja | number: '1.2-2' : 'pl' }} zł</span>
</div>
<div class="summary-row">
  <span class="label">Prowizja od nadpłat</span>
  <span class="value">{{ comparison().modified.totalOvpCommission | number: '1.2-2' : 'pl' }} zł</span>
</div>
```

- [ ] **Step 2: Verify in browser**

Run: `npm start`. Summary should show two new rows in each column. With no prowizja set, both show 0,00 zł.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/calculator/summary/
git commit -m "feat: show prowizja rows in summary"
```

---

## Task 7: PDF Export — Include New Fields

**Files:**
- Modify: `src/app/core/services/pdf-export.service.ts`

- [ ] **Step 1: Add prowizja params line and rows to summary table**

Replace the entire file:

```typescript
import { Injectable } from '@angular/core';
import { ComparisonResult } from '../models/loan-result.model';
import { LoanInput } from '../models/loan-input.model';

@Injectable({ providedIn: 'root' })
export class PdfExportService {
  async exportToPdf(input: LoanInput, comparison: ComparisonResult): Promise<void> {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pl = (n: number) =>
      n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Kalkulator rat kredytowych', 105, 20, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Kwota kredytu: ${pl(input.amount)} zł`, 14, 35);
    doc.text(`Ilość rat: ${input.months} mc`, 14, 42);
    doc.text(`Oprocentowanie: ${input.annualRatePercent.toFixed(2)} %`, 14, 49);
    doc.text(
      `Rodzaj rat: ${input.installmentType === 'EQUAL' ? 'Równe (annuitetowe)' : 'Malejące'}`,
      14,
      56,
    );
    const prowizjaLabel =
      input.prowizjaType === 'percent'
        ? `${input.prowizja.toFixed(2)} %`
        : `${pl(input.prowizja)} zł`;
    doc.text(`Prowizja za udzielenie: ${prowizjaLabel}`, 14, 63);
    if (input.prowizjaNadplat > 0) {
      doc.text(`Prowizja od nadpłat: ${input.prowizjaNadplat.toFixed(2)} %`, 14, 70);
    }

    const summaryStartY = input.prowizjaNadplat > 0 ? 80 : 73;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Podsumowanie', 14, summaryStartY);

    autoTable(doc, {
      startY: summaryStartY + 5,
      head: [['Parametr', 'Wyjściowy', 'Zmodyfikowany']] as string[][],
      body: [
        ['Okres kredytowania (mc)', `${comparison.baseline.actualMonths}`, `${comparison.modified.actualMonths}`],
        ['Całkowita kwota spłaty (zł)', pl(comparison.baseline.totalPaid), pl(comparison.modified.totalPaid)],
        ['Kapitał (zł)', pl(comparison.baseline.totalCapital), pl(comparison.modified.totalCapital)],
        ['Odsetki (zł)', pl(comparison.baseline.totalInterest), pl(comparison.modified.totalInterest)],
        ['Nadpłaty (zł)', pl(comparison.baseline.totalOverpayments), pl(comparison.modified.totalOverpayments)],
        ['Prowizja za udzielenie (zł)', pl(comparison.baseline.totalProwizja), pl(comparison.modified.totalProwizja)],
        ['Prowizja od nadpłat (zł)', pl(comparison.baseline.totalOvpCommission), pl(comparison.modified.totalOvpCommission)],
        ['Skrócenie okresu (mc)', '-', `${comparison.monthsSaved}`],
        ['Oszczędność (zł)', '-', pl(comparison.costSavedAmount)],
        ['Oszczędność (%)', '-', `${comparison.costSavedPercent.toFixed(2)} %`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] as [number, number, number] },
    });

    const afterSummaryY =
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Harmonogram spłaty (zmodyfikowany)', 14, afterSummaryY);

    const scheduleRows = comparison.modified.schedule.map((inst) => [
      `${inst.number}`,
      pl(inst.scheduledPayment),
      pl(inst.capitalPart),
      pl(inst.interestPart),
      inst.overpayment > 0 ? pl(inst.overpayment) : '-',
      pl(inst.remainingBalance),
      pl(inst.laczneKoszty),
    ]);

    autoTable(doc, {
      startY: afterSummaryY + 5,
      head: [['Nr raty', 'Rata (zł)', 'Kapitał (zł)', 'Odsetki (zł)', 'Nadpłata (zł)', 'Saldo (zł)', 'Łączne koszty (zł)']],
      body: scheduleRows,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] as [number, number, number] },
      styles: { fontSize: 7 },
      columnStyles: {
        0: { halign: 'center' as const },
        1: { halign: 'right' as const },
        2: { halign: 'right' as const },
        3: { halign: 'right' as const },
        4: { halign: 'right' as const },
        5: { halign: 'right' as const },
        6: { halign: 'right' as const },
      },
    });

    doc.save('kalkulator-rat.pdf');
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/core/services/pdf-export.service.ts
git commit -m "feat: include prowizja and laczne koszty in PDF export"
```

---

## Task 8: XLSX Export Service (New)

**Files:**
- Create: `src/app/core/services/xlsx-export.service.ts`

- [ ] **Step 1: Install xlsx library**

Run: `npm install xlsx`

Verify it appears in `package.json` dependencies.

- [ ] **Step 2: Create `xlsx-export.service.ts`**

Create `src/app/core/services/xlsx-export.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { ComparisonResult } from '../models/loan-result.model';
import { LoanInput } from '../models/loan-input.model';

@Injectable({ providedIn: 'root' })
export class XlsxExportService {
  async exportToXlsx(input: LoanInput, comparison: ComparisonResult): Promise<void> {
    const XLSX = await import('xlsx');

    const pl = (n: number) =>
      n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const prowizjaLabel =
      input.prowizjaType === 'percent'
        ? `${input.prowizja.toFixed(2)} %`
        : `${pl(input.prowizja)} zł`;

    // Sheet 1: Parametry
    const parametryData = [
      ['Parametr', 'Wartość'],
      ['Kwota kredytu (zł)', input.amount],
      ['Liczba rat (mc)', input.months],
      ['Oprocentowanie roczne (%)', input.annualRatePercent],
      ['Rodzaj rat', input.installmentType === 'EQUAL' ? 'Równe (annuitetowe)' : 'Malejące'],
      ['Prowizja za udzielenie', prowizjaLabel],
      ['Prowizja od nadpłat (%)', input.prowizjaNadplat],
    ];
    const wsParametry = XLSX.utils.aoa_to_sheet(parametryData);

    // Sheet 2: Podsumowanie
    const podsumowanieData = [
      ['Parametr', 'Wyjściowy', 'Zmodyfikowany'],
      ['Okres kredytowania (mc)', comparison.baseline.actualMonths, comparison.modified.actualMonths],
      ['Całkowita kwota spłaty (zł)', comparison.baseline.totalPaid, comparison.modified.totalPaid],
      ['Kapitał (zł)', comparison.baseline.totalCapital, comparison.modified.totalCapital],
      ['Odsetki (zł)', comparison.baseline.totalInterest, comparison.modified.totalInterest],
      ['Nadpłaty (zł)', comparison.baseline.totalOverpayments, comparison.modified.totalOverpayments],
      ['Prowizja za udzielenie (zł)', comparison.baseline.totalProwizja, comparison.modified.totalProwizja],
      ['Prowizja od nadpłat (zł)', comparison.baseline.totalOvpCommission, comparison.modified.totalOvpCommission],
      ['Skrócenie okresu (mc)', '-', comparison.monthsSaved],
      ['Oszczędność (zł)', '-', comparison.costSavedAmount],
      ['Oszczędność (%)', '-', comparison.costSavedPercent],
    ];
    const wsPodsumowanie = XLSX.utils.aoa_to_sheet(podsumowanieData);

    // Sheet 3: Harmonogram (modified)
    const harmonogramHeaders = [
      'Nr raty', 'Rata (zł)', 'Kapitał (zł)', 'Odsetki (zł)',
      'Nadpłata (zł)', 'Saldo (zł)', 'Łączne koszty (zł)',
    ];
    const harmonogramRows = comparison.modified.schedule.map((inst) => [
      inst.number,
      inst.scheduledPayment,
      inst.capitalPart,
      inst.interestPart,
      inst.overpayment,
      inst.remainingBalance,
      inst.laczneKoszty,
    ]);
    const wsHarmonogram = XLSX.utils.aoa_to_sheet([harmonogramHeaders, ...harmonogramRows]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsParametry, 'Parametry');
    XLSX.utils.book_append_sheet(wb, wsPodsumowanie, 'Podsumowanie');
    XLSX.utils.book_append_sheet(wb, wsHarmonogram, 'Harmonogram');

    XLSX.writeFile(wb, 'kalkulator-rat.xlsx');
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/core/services/xlsx-export.service.ts package.json package-lock.json
git commit -m "feat: add XLSX export service"
```

---

## Task 9: Calculator Page — Wire XLSX Button

**Files:**
- Modify: `src/app/features/calculator/calculator.page.ts`
- Modify: `src/app/features/calculator/calculator.page.html`

- [ ] **Step 1: Update `calculator.page.ts`**

Replace the entire file:

```typescript
import { Component, computed, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LoanInput } from '../../core/models/loan-input.model';
import { Overpayment } from '../../core/models/overpayment.model';
import { RateChange } from '../../core/models/rate-change.model';
import { LoanCalculatorService } from '../../core/services/loan-calculator.service';
import { PdfExportService } from '../../core/services/pdf-export.service';
import { XlsxExportService } from '../../core/services/xlsx-export.service';
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
  private readonly xlsxService = inject(XlsxExportService);
  private readonly messageService = inject(MessageService);

  loanInput = signal<LoanInput>({
    amount: 400000,
    months: 360,
    annualRatePercent: 7.5,
    installmentType: 'EQUAL',
    prowizja: 0,
    prowizjaType: 'percent',
    prowizjaNadplat: 0,
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
  exportingXlsx = signal(false);

  async exportPdf(): Promise<void> {
    this.exportingPdf.set(true);
    try {
      await this.pdfService.exportToPdf(this.loanInput(), this.comparison());
      this.messageService.add({ severity: 'success', summary: 'PDF wygenerowany', detail: 'Plik został pobrany.' });
    } catch {
      this.messageService.add({ severity: 'error', summary: 'Błąd', detail: 'Nie udało się wygenerować PDF.' });
    } finally {
      this.exportingPdf.set(false);
    }
  }

  async exportXlsx(): Promise<void> {
    this.exportingXlsx.set(true);
    try {
      await this.xlsxService.exportToXlsx(this.loanInput(), this.comparison());
      this.messageService.add({ severity: 'success', summary: 'XLSX wygenerowany', detail: 'Plik został pobrany.' });
    } catch {
      this.messageService.add({ severity: 'error', summary: 'Błąd', detail: 'Nie udało się wygenerować XLSX.' });
    } finally {
      this.exportingXlsx.set(false);
    }
  }
}
```

- [ ] **Step 2: Update `calculator.page.html`**

Replace the entire file:

```html
<p-toast />

<div class="page-container">
  <header class="page-header">
    <h1>Kalkulator rat kredytowych</h1>
    <p class="subtitle">Oblicz harmonogram spłaty i sprawdź wpływ nadpłat na Twój kredyt</p>
  </header>

  <div class="main-grid">
    <aside class="forms-column">
      <app-loan-form [loanInput]="loanInput()" (loanInputChange)="loanInput.set($event)" />

      <app-overpayments-form
        [overpayments]="overpayments()"
        (overpaymentsChange)="overpayments.set($event)"
        [prowizjaNadplat]="loanInput().prowizjaNadplat"
        (prowizjaNadplatChange)="loanInput.set({ ...loanInput(), prowizjaNadplat: $event })"
      />

      <app-rate-changes-form
        [rateChanges]="rateChanges()"
        (rateChangesChange)="rateChanges.set($event)"
      />
    </aside>

    <section class="results-column">
      <app-summary [comparison]="comparison()" />

      <app-balance-chart [baseline]="comparison().baseline" [modified]="comparison().modified" />

      <app-structure-chart [result]="comparison().modified" />

      <div class="export-section">
        <p-button
          label="Eksportuj do PDF"
          icon="pi pi-file-pdf"
          severity="help"
          [loading]="exportingPdf()"
          (onClick)="exportPdf()"
        />
        <p-button
          label="Eksportuj do XLSX"
          icon="pi pi-file-excel"
          severity="success"
          [loading]="exportingXlsx()"
          (onClick)="exportXlsx()"
        />
      </div>
    </section>
  </div>

  <app-schedule-table
    [baselineSchedule]="comparison().baseline.schedule"
    [modifiedSchedule]="comparison().modified.schedule"
  />
</div>
```

- [ ] **Step 3: Verify full feature set in browser**

Run: `npm start`

Check all of the following:
1. Prowizja za udzielenie: set to 2% on 400 000 zł → summary shows 8 000,00 zł prowizja in both columns
2. Prowizja od nadpłat: add a 10 000 zł one-time overpayment with 2% commission → totalOvpCommission shows 200,00 zł
3. Schedule table has 7 columns, "Łączne koszty" is the last one
4. "Eksportuj do XLSX" button appears next to PDF button
5. Clicking XLSX downloads `kalkulator-rat.xlsx` with 3 sheets

- [ ] **Step 4: Run type check**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 5: Run all tests**

Run: `npx vitest run`

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/features/calculator/calculator.page.ts src/app/features/calculator/calculator.page.html
git commit -m "feat: wire XLSX export button and finalize feature integration"
```

---

## Task 10: Banking Light Theme Copy

**Files:**
- Create: `C:\Users\Wiktor\Desktop\Claude\kalkulator-rat-banking\` (folder copy)
- Modify: `src/app/app.config.ts` (in the copy)
- Modify: `src/styles.scss` (in the copy)

- [ ] **Step 1: Copy the folder**

Run (PowerShell):
```powershell
Copy-Item -Path "C:\Users\Wiktor\Desktop\Claude\kalkulator-rat" -Destination "C:\Users\Wiktor\Desktop\Claude\kalkulator-rat-banking" -Recurse
Remove-Item -Recurse -Force "C:\Users\Wiktor\Desktop\Claude\kalkulator-rat-banking\node_modules"
Remove-Item -Recurse -Force "C:\Users\Wiktor\Desktop\Claude\kalkulator-rat-banking\.git"
Remove-Item -Recurse -Force "C:\Users\Wiktor\Desktop\Claude\kalkulator-rat-banking\dist"
```

- [ ] **Step 2: Install dependencies**

```bash
cd C:/Users/Wiktor/Desktop/Claude/kalkulator-rat-banking
npm install
```

- [ ] **Step 3: Update `src/app/app.config.ts`**

Replace the entire file:

```typescript
import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import { registerLocaleData } from '@angular/common';
import localePl from '@angular/common/locales/pl';

registerLocaleData(localePl);

const BankingPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#e8f0fd',
      100: '#c5d4f7',
      200: '#9fb7f0',
      300: '#779ae9',
      400: '#5683e4',
      500: '#1a3c6e',
      600: '#163466',
      700: '#112a5b',
      800: '#0c2150',
      900: '#061237',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#f4f7fb',
          100: '#e8f0fd',
          200: '#d0ddef',
          300: '#b0c4de',
          400: '#8aa8c8',
          500: '#6b82a0',
          600: '#4a5e7a',
          700: '#2e3f57',
          800: '#1a2a3a',
          900: '#0d1520',
          950: '#060b10',
        },
      },
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideAnimationsAsync(),
    { provide: LOCALE_ID, useValue: 'pl' },
    providePrimeNG({
      theme: {
        preset: BankingPreset,
        options: {
          prefix: 'p',
          darkModeSelector: '.dark-mode',
          cssLayer: false,
        },
      },
      ripple: true,
    }),
  ],
};
```

- [ ] **Step 4: Update `src/styles.scss`**

Replace the entire file:

```scss
@use 'primeicons/primeicons.css';
@use 'primeflex/primeflex.css';

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--font-family, 'Segoe UI', Arial, sans-serif);
  background: #f4f7fb;
  color: #1a2332;
}

.page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
}

.section-card {
  border-radius: 0.5rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.positive-value {
  color: #1a7a3c;
  font-weight: 600;
}

.currency-cell {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.table-header-bg {
  background: #e8f0fd;
}

:root {
  --font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
```

- [ ] **Step 5: Init git and verify**

```bash
cd C:/Users/Wiktor/Desktop/Claude/kalkulator-rat-banking
git init
git add -A
git commit -m "feat: initial Banking Light theme"
npm start -- --port 4201
```

Open `http://localhost:4201`. Verify the app has a navy/white professional look.

---

## Task 11: Green Wealth Theme Copy

**Files:**
- Create: `C:\Users\Wiktor\Desktop\Claude\kalkulator-rat-green\` (folder copy)
- Modify: `src/app/app.config.ts` (in the copy)
- Modify: `src/styles.scss` (in the copy)

- [ ] **Step 1: Copy the folder**

Run (PowerShell):
```powershell
Copy-Item -Path "C:\Users\Wiktor\Desktop\Claude\kalkulator-rat" -Destination "C:\Users\Wiktor\Desktop\Claude\kalkulator-rat-green" -Recurse
Remove-Item -Recurse -Force "C:\Users\Wiktor\Desktop\Claude\kalkulator-rat-green\node_modules"
Remove-Item -Recurse -Force "C:\Users\Wiktor\Desktop\Claude\kalkulator-rat-green\.git"
Remove-Item -Recurse -Force "C:\Users\Wiktor\Desktop\Claude\kalkulator-rat-green\dist"
```

- [ ] **Step 2: Install dependencies**

```bash
cd C:/Users/Wiktor/Desktop/Claude/kalkulator-rat-green
npm install
```

- [ ] **Step 3: Update `src/app/app.config.ts`**

Replace the entire file:

```typescript
import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import { registerLocaleData } from '@angular/common';
import localePl from '@angular/common/locales/pl';

registerLocaleData(localePl);

const GreenPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f0faf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#16a34a',
      600: '#15803d',
      700: '#166534',
      800: '#14532d',
      900: '#052e16',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#f0faf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
      },
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideAnimationsAsync(),
    { provide: LOCALE_ID, useValue: 'pl' },
    providePrimeNG({
      theme: {
        preset: GreenPreset,
        options: {
          prefix: 'p',
          darkModeSelector: '.dark-mode',
          cssLayer: false,
        },
      },
      ripple: true,
    }),
  ],
};
```

- [ ] **Step 4: Update `src/styles.scss`**

Replace the entire file:

```scss
@use 'primeicons/primeicons.css';
@use 'primeflex/primeflex.css';

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--font-family, 'Segoe UI', Arial, sans-serif);
  background: #f0faf4;
  color: #111827;
}

.page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
}

.section-card {
  border-radius: 0.75rem;
  box-shadow: 0 2px 8px rgba(22, 163, 74, 0.08);
}

.positive-value {
  color: #16a34a;
  font-weight: 600;
}

.currency-cell {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.table-header-bg {
  background: #dcfce7;
}

:root {
  --font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
```

- [ ] **Step 5: Init git and verify**

```bash
cd C:/Users/Wiktor/Desktop/Claude/kalkulator-rat-green
git init
git add -A
git commit -m "feat: initial Green Wealth theme"
npm start -- --port 4202
```

Open `http://localhost:4202`. Verify the app has a green/light fintech look.

---

## Side-by-Side Comparison

With all three apps running:

| App | Port | Theme |
|-----|------|-------|
| `kalkulator-rat` | 4200 | Original (Aura default) |
| `kalkulator-rat-banking` | 4201 | Banking Light |
| `kalkulator-rat-green` | 4202 | Green Wealth |

Open three browser windows at `localhost:4200`, `localhost:4201`, `localhost:4202` side by side to compare.
