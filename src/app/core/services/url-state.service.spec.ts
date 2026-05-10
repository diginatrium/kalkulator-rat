import { TestBed } from '@angular/core/testing';
import { UrlStateService } from './url-state.service';
import { AppState } from '../models/scenario.model';
import { DEFAULT_LOAN_INPUT } from '../models/loan-input.model';
import { DEFAULT_BUDGET } from '../models/budget.model';

describe('UrlStateService', () => {
  let service: UrlStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UrlStateService);
  });

  function sampleState(): AppState {
    return {
      loanInput: { ...DEFAULT_LOAN_INPUT, amount: 570000, months: 360 },
      overpayments: [
        {
          id: 'a',
          type: 'MONTHLY',
          amountMode: 'surplus',
          amount: 1000,
          fromInstallment: 1,
          effect: 'KEEP_TOTAL_PAYMENT',
        },
      ],
      rateChanges: [{ id: 'r1', fromInstallment: 60, newAnnualRatePercent: 5 }],
      budget: { ...DEFAULT_BUDGET, monthlyIncome: 8000, otherDebtsMonthly: 500 },
    };
  }

  it('encode/decode round-trip zachowuje wszystkie pola', () => {
    const original = sampleState();
    const encoded = service.encode(original);
    const decoded = service.decode(encoded);
    expect(decoded).toBeTruthy();
    expect(decoded!.loanInput.amount).toBe(570000);
    expect(decoded!.loanInput.startDate instanceof Date).toBe(true);
    expect(decoded!.overpayments.length).toBe(1);
    expect(decoded!.overpayments[0].effect).toBe('KEEP_TOTAL_PAYMENT');
    expect(decoded!.rateChanges[0].newAnnualRatePercent).toBe(5);
    expect(decoded!.budget.monthlyIncome).toBe(8000);
  });

  it('decode pustego/niepoprawnego hash zwraca null', () => {
    expect(service.decode('')).toBeNull();
    expect(service.decode('zzzz-not-valid-base64')).toBeNull();
  });

  it('encoded length is reasonable (LZ compression works)', () => {
    const encoded = service.encode(sampleState());
    // Threshold raised from 500 → 700 after merging master's fields into
    // LoanInput (prowizja, prowizjaType, prowizjaNadplat) and Overpayment
    // (amountMode). LZ-compressed JSON of the merged AppState is ~550 chars.
    expect(encoded.length).toBeLessThan(700);
  });
});
