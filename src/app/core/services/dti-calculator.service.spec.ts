import { TestBed } from '@angular/core/testing';
import { DtiCalculatorService } from './dti-calculator.service';
import { Budget } from '../models/budget.model';

describe('DtiCalculatorService', () => {
  let service: DtiCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DtiCalculatorService);
  });

  function budget(partial: Partial<Budget>): Budget {
    return { monthlyIncome: 0, otherDebtsMonthly: 0, householdSize: 1, ...partial };
  }

  it('zwraca level=unknown gdy dochód = 0', () => {
    const ind = service.calculate(2000, budget({}));
    expect(ind.level).toBe('unknown');
    expect(ind.dti).toBe(0);
  });

  it('rata 2000 + dochód 10000 → DTI = 20% (safe)', () => {
    const ind = service.calculate(2000, budget({ monthlyIncome: 10000 }));
    expect(ind.dti).toBe(20);
    expect(ind.level).toBe('safe');
  });

  it('rata 4000 + dochód 10000 → DTI = 40% (warning)', () => {
    const ind = service.calculate(4000, budget({ monthlyIncome: 10000 }));
    expect(ind.dti).toBe(40);
    expect(ind.level).toBe('warning');
  });

  it('rata 6000 + dochód 10000 → DTI = 60% (danger)', () => {
    const ind = service.calculate(6000, budget({ monthlyIncome: 10000 }));
    expect(ind.dti).toBe(60);
    expect(ind.level).toBe('danger');
  });

  it('uwzględnia inne raty: 2000 rata + 1000 inne / 10000 dochód = 30% DTI (warning)', () => {
    const ind = service.calculate(2000, budget({ monthlyIncome: 10000, otherDebtsMonthly: 1000 }));
    expect(ind.dti).toBe(30);
    expect(ind.level).toBe('warning');
  });

  it('RdD UOKiK = tylko rata / dochód (bez innych)', () => {
    const ind = service.calculate(3000, budget({ monthlyIncome: 10000, otherDebtsMonthly: 1000 }));
    expect(ind.rddUokik).toBe(30);
    expect(ind.dti).toBe(40);
  });

  it('remainingPerPerson uwzględnia liczbę osób', () => {
    const ind = service.calculate(
      2000,
      budget({ monthlyIncome: 10000, otherDebtsMonthly: 0, householdSize: 4 }),
    );
    expect(ind.remainingMonthly).toBe(8000);
    expect(ind.remainingPerPerson).toBe(2000);
  });
});
