---
name: angular-testing
description: >
  Use this skill when writing, improving, or reviewing tests for Angular components, services, or pipes.
  Trigger on: "write tests for this component", "test this calculator", "how do I test signals",
  "write a spec for", "TDD for Angular", "this component has no tests",
  "add test coverage", "how to test computed()", "test this service", "write unit tests", "write specs",
  "my tests are failing", "improve test coverage", "write a failing test first". Also use when the user
  is starting a new feature and wants to do TDD — guide RED-GREEN-REFACTOR before they write any code.
  This project uses Vitest with zoneless change detection.
---

# Angular Testing

## When to use

- Writing tests for a new or existing Angular component, service, or pipe
- Following TDD — write the failing test before the implementation
- Fixing a bug — write a test that reproduces it first, then fix
- Reviewing test coverage gaps

## TDD Cycle — the WHEN

Always follow RED → GREEN → REFACTOR. The test is the spec; if you can't write a test, you don't understand the requirement.

```
🔴 RED   — Write a failing test that describes the desired behavior
🟢 GREEN  — Write the minimum code to make it pass (no more)
🔵 REFACTOR — Clean up while keeping all tests green; commit
```

**Three laws:**
1. Don't write production code until you have a failing test
2. Don't write more test than is sufficient to fail
3. Don't write more code than is sufficient to pass

**Test priority:** happy path → error cases → edge cases (nulls, boundary values) → performance

**Anti-patterns:**

| ❌ Don't | ✅ Do |
|----------|-------|
| Skip the RED phase | Watch the test fail first |
| Assert implementation details (private methods, internal signals) | Assert observable behavior (public state, outputs) |
| One huge test per component | One behavior per `it()` |
| Duplicate test data inline | Use factory functions |
| Forget `vi.clearAllMocks()` in `beforeEach` | Clear mocks between tests |

---

## Setup — Service Tests with Vitest

This project uses **Vitest** and **zoneless change detection**. Service tests run in isolation — no TestBed needed for pure services.

### Standard service test

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { LoanCalculatorService } from './loan-calculator.service';
import type { LoanInput } from '../models/loan-input.model';

const makeInput = (overrides?: Partial<LoanInput>): LoanInput => ({
  amount: 300000,
  months: 360,
  annualRatePercent: 7.5,
  installmentType: 'annuity',
  prowizja: 0,
  prowizjaType: 'percent',
  prowizjaNadplat: 0,
  ...overrides,
});

describe('LoanCalculatorService', () => {
  let service: LoanCalculatorService;

  beforeEach(() => {
    service = new LoanCalculatorService();
    vi.clearAllMocks();
  });

  it('calculates annuity installment correctly', () => {
    const result = service.calculate(makeInput());
    expect(result.schedule[0].scheduledPayment).toBeCloseTo(2097.64, 1);
  });

  it('returns null schedule when amount is 0', () => {
    const result = service.calculate(makeInput({ amount: 0 }));
    expect(result.schedule).toHaveLength(0);
  });
});
```

### Testing computed() signals in injection context

```typescript
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { signal, computed } from '@angular/core';

it('computed signal returns correct derived value', () => {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
  TestBed.runInInjectionContext(() => {
    const amount = signal(300000);
    const months = signal(360);
    const monthly = computed(() => amount() / months());
    expect(monthly()).toBeCloseTo(833.33, 1);

    amount.set(600000);
    expect(monthly()).toBeCloseTo(1666.67, 1);
  });
});
```

---

## Factory Functions

Always use factories for test data — never inline duplicated objects.

```typescript
const makeLoanInput = (overrides?: Partial<LoanInput>): LoanInput => ({
  amount: 300000,
  months: 360,
  annualRatePercent: 7.5,
  installmentType: 'annuity',
  prowizja: 0,
  prowizjaType: 'percent',
  prowizjaNadplat: 0,
  ...overrides,
});

const makeOverpayment = (overrides?: Partial<Overpayment>): Overpayment => ({
  id: 'ovp-1',
  type: 'ONE_TIME',
  amountMode: 'surplus',
  amount: 10000,
  fromInstallment: 12,
  toInstallment: null,
  effect: 'SHORTEN_PERIOD',
  ...overrides,
});
```

---

## Mocking with vi

```typescript
import { vi } from 'vitest';

// Spy on a method
const service = new LoanCalculatorService();
vi.spyOn(service, 'calculate').mockReturnValue({ schedule: [], totalPaid: 0 } as any);

// Verify it was called
expect(service.calculate).toHaveBeenCalledWith(expect.objectContaining({ amount: 300000 }));

// Reset between tests
beforeEach(() => vi.clearAllMocks());
```

---

## Null-Init Guards — Test Explicitly

Financial values should use `!== null` guards. `0` is a valid value:

```typescript
it('returns null result when amount is null', () => {
  const result = service.calculate(makeInput({ amount: null as any }));
  expect(result).toBeNull();
});

it('processes zero overpayment correctly (0 ≠ null)', () => {
  const result = service.calculate(makeInput({ prowizja: 0 }));
  expect(result.schedule[0].scheduledPayment).toBeGreaterThan(0);
});
```

---

## Test Structure

```typescript
describe('LoanCalculatorService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('annuity formula', () => {
    it('calculates monthly payment for standard loan', () => {});
    it('returns empty schedule for zero amount', () => {});
    it('terminates when balance reaches 0', () => {});
  });

  describe('overpayments', () => {
    it('shortens period with SHORTEN_PERIOD effect', () => {});
    it('reduces installment with REDUCE_INSTALLMENT effect', () => {});
    it('caps overpayment at remaining balance', () => {});
  });

  describe('prowizja', () => {
    it('adds percent prowizja to total cost', () => {});
    it('adds zl prowizja to total cost', () => {});
    it('never adds prowizja to balance', () => {});
  });
});
```

---

## Running Tests

```bash
# All tests
npm test

# Single file (run mode, no watch)
npx vitest run src/app/core/services/loan-calculator.service.spec.ts

# With verbose output
npx vitest run --reporter=verbose

# Watch mode
npx vitest
```
