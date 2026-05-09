import { TestBed } from '@angular/core/testing';
import { LoanCalculatorService } from './loan-calculator.service';
import { DEFAULT_LOAN_INPUT, LoanInput } from '../models/loan-input.model';
import { Overpayment } from '../models/overpayment.model';
import { RateChange } from '../models/rate-change.model';

function makeInput(partial: Partial<LoanInput>): LoanInput {
  return { ...DEFAULT_LOAN_INPUT, ...partial };
}

describe('LoanCalculatorService', () => {
  let service: LoanCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoanCalculatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('raty równe bez nadpłat', () => {
    const input: LoanInput = makeInput({
      amount: 400000,
      months: 360,
      annualRatePercent: 7.5,
      installmentType: 'EQUAL',
    });

    it('powinna wyliczyć ratę ~2796.86 zł', () => {
      const result = service.calculateSchedule(input, [], []);
      const firstInstallment = result.schedule[0];
      expect(firstInstallment.scheduledPayment).toBeCloseTo(2796.86, 0);
    });

    it('powinna mieć 360 rat', () => {
      const result = service.calculateSchedule(input, [], []);
      expect(result.actualMonths).toBe(360);
    });

    it('całkowite odsetki ~606 868 zł', () => {
      const result = service.calculateSchedule(input, [], []);
      expect(result.totalInterest).toBeCloseTo(606868, -2);
    });

    it('saldo po ostatniej racie = 0', () => {
      const result = service.calculateSchedule(input, [], []);
      const last = result.schedule[result.schedule.length - 1];
      expect(last.remainingBalance).toBeCloseTo(0, 1);
    });

    it('totalCapital == kwota kredytu (bez błędu zaokrąglania)', () => {
      const result = service.calculateSchedule(input, [], []);
      expect(result.totalCapital).toBe(400000);
    });
  });

  describe('błąd zaokrąglania - totalCapital dla różnych kwot', () => {
    it('570 000 zł / 360 mc / 7.5% raty równe → totalCapital = 570 000', () => {
      const result = service.calculateSchedule(
        makeInput({
          amount: 570000,
          months: 360,
          annualRatePercent: 7.5,
          installmentType: 'EQUAL',
        }),
        [],
        [],
      );
      expect(result.totalCapital).toBe(570000);
    });

    it('123 456,78 zł / 240 mc / 5.25% raty malejące → totalCapital = kwota', () => {
      const result = service.calculateSchedule(
        makeInput({
          amount: 123456.78,
          months: 240,
          annualRatePercent: 5.25,
          installmentType: 'DECREASING',
        }),
        [],
        [],
      );
      expect(result.totalCapital).toBeCloseTo(123456.78, 2);
    });
  });

  describe('raty malejące bez nadpłat', () => {
    const input: LoanInput = makeInput({
      amount: 400000,
      months: 360,
      annualRatePercent: 7.5,
      installmentType: 'DECREASING',
    });

    it('stała część kapitałowa ~1111.11 zł', () => {
      const result = service.calculateSchedule(input, [], []);
      expect(result.schedule[0].capitalPart).toBeCloseTo(1111.11, 0);
    });

    it('pierwsza rata większa od ostatniej', () => {
      const result = service.calculateSchedule(input, [], []);
      const first = result.schedule[0].scheduledPayment;
      const last = result.schedule[result.schedule.length - 1].scheduledPayment;
      expect(first).toBeGreaterThan(last);
    });

    it('musi mieć 360 rat', () => {
      const result = service.calculateSchedule(input, [], []);
      expect(result.actualMonths).toBe(360);
    });
  });

  describe('oprocentowanie 0%', () => {
    it('rata = kwota / liczba rat', () => {
      const input: LoanInput = makeInput({
        amount: 120000,
        months: 12,
        annualRatePercent: 0,
        installmentType: 'EQUAL',
      });
      const result = service.calculateSchedule(input, [], []);
      expect(result.schedule[0].scheduledPayment).toBeCloseTo(10000, 1);
      expect(result.totalInterest).toBeCloseTo(0, 1);
    });
  });

  describe('nadpłata jednorazowa SHORTEN_PERIOD', () => {
    it('powinna skrócić okres kredytu', () => {
      const input: LoanInput = makeInput({
        amount: 400000,
        months: 360,
        annualRatePercent: 7.5,
        installmentType: 'EQUAL',
      });
      const overpayments: Overpayment[] = [
        {
          id: '1',
          type: 'ONE_TIME',
          amount: 100000,
          fromInstallment: 12,
          effect: 'SHORTEN_PERIOD',
        },
      ];
      const result = service.calculateSchedule(input, overpayments, []);
      expect(result.actualMonths).toBeLessThan(360);
      expect(result.totalInterest).toBeLessThan(606868);
    });

    it('saldo nie może być ujemne', () => {
      const input: LoanInput = makeInput({
        amount: 400000,
        months: 360,
        annualRatePercent: 7.5,
        installmentType: 'EQUAL',
      });
      const overpayments: Overpayment[] = [
        {
          id: '1',
          type: 'ONE_TIME',
          amount: 100000,
          fromInstallment: 12,
          effect: 'SHORTEN_PERIOD',
        },
      ];
      const result = service.calculateSchedule(input, overpayments, []);
      result.schedule.forEach((inst) => {
        expect(inst.remainingBalance).toBeGreaterThanOrEqual(-0.01);
      });
    });
  });

  describe('nadpłata jednorazowa REDUCE_INSTALLMENT', () => {
    it('powinna zmniejszyć ratę, ale nie skrócić okresu', () => {
      const input: LoanInput = makeInput({
        amount: 400000,
        months: 360,
        annualRatePercent: 7.5,
        installmentType: 'EQUAL',
      });
      const overpayments: Overpayment[] = [
        {
          id: '1',
          type: 'ONE_TIME',
          amount: 100000,
          fromInstallment: 12,
          effect: 'REDUCE_INSTALLMENT',
        },
      ];
      const result = service.calculateSchedule(input, overpayments, []);
      expect(result.actualMonths).toBe(360);
      const installmentAfter = result.schedule[12].scheduledPayment;
      const installmentBefore = result.schedule[0].scheduledPayment;
      expect(installmentAfter).toBeLessThan(installmentBefore);
    });
  });

  describe('nadpłata cykliczna miesięczna SHORTEN_PERIOD', () => {
    it('powinna skrócić okres gdy 1000 zł/mc od raty 1 do 60', () => {
      const input: LoanInput = makeInput({
        amount: 400000,
        months: 360,
        annualRatePercent: 7.5,
        installmentType: 'EQUAL',
      });
      const overpayments: Overpayment[] = [
        {
          id: '1',
          type: 'MONTHLY',
          amount: 1000,
          fromInstallment: 1,
          toInstallment: 60,
          effect: 'SHORTEN_PERIOD',
        },
      ];
      const result = service.calculateSchedule(input, overpayments, []);
      expect(result.actualMonths).toBeLessThan(360);
    });
  });

  describe('nadpłata KEEP_TOTAL_PAYMENT (stała łączna kwota miesięczna)', () => {
    it('łączna kwota (rata + nadpłata) pozostaje stała w każdej racie', () => {
      const input: LoanInput = makeInput({
        amount: 400000,
        months: 360,
        annualRatePercent: 7.5,
        installmentType: 'EQUAL',
      });
      const overpayments: Overpayment[] = [
        {
          id: '1',
          type: 'MONTHLY',
          amount: 1000,
          fromInstallment: 1,
          effect: 'KEEP_TOTAL_PAYMENT',
        },
      ];
      const result = service.calculateSchedule(input, overpayments, []);

      const firstTotal = result.schedule[0].scheduledPayment + result.schedule[0].overpayment;
      const tenthTotal = result.schedule[9].scheduledPayment + result.schedule[9].overpayment;
      const fiftiethTotal = result.schedule[49].scheduledPayment + result.schedule[49].overpayment;

      expect(tenthTotal).toBeCloseTo(firstTotal, 0);
      expect(fiftiethTotal).toBeCloseTo(firstTotal, 0);
    });

    it('rata maleje, a nadpłata rośnie z biegiem czasu', () => {
      const input: LoanInput = makeInput({
        amount: 400000,
        months: 360,
        annualRatePercent: 7.5,
        installmentType: 'EQUAL',
      });
      const overpayments: Overpayment[] = [
        {
          id: '1',
          type: 'MONTHLY',
          amount: 1000,
          fromInstallment: 1,
          effect: 'KEEP_TOTAL_PAYMENT',
        },
      ];
      const result = service.calculateSchedule(input, overpayments, []);

      // Po 50 ratach: rata mniejsza, nadpłata większa niż na początku.
      expect(result.schedule[49].scheduledPayment).toBeLessThan(
        result.schedule[0].scheduledPayment,
      );
      expect(result.schedule[49].overpayment).toBeGreaterThan(result.schedule[0].overpayment);
    });

    it('powinno skrócić okres mocniej niż REDUCE_INSTALLMENT przy tej samej startowej nadpłacie', () => {
      const input: LoanInput = makeInput({
        amount: 400000,
        months: 360,
        annualRatePercent: 7.5,
        installmentType: 'EQUAL',
      });
      const reduce = service.calculateSchedule(
        input,
        [
          {
            id: '1',
            type: 'MONTHLY',
            amount: 1000,
            fromInstallment: 1,
            effect: 'REDUCE_INSTALLMENT',
          },
        ],
        [],
      );
      const keepTotal = service.calculateSchedule(
        input,
        [
          {
            id: '1',
            type: 'MONTHLY',
            amount: 1000,
            fromInstallment: 1,
            effect: 'KEEP_TOTAL_PAYMENT',
          },
        ],
        [],
      );
      // KEEP_TOTAL z czasem nadpłaca więcej, więc krótszy okres
      expect(keepTotal.actualMonths).toBeLessThan(reduce.actualMonths);
    });
  });

  describe('nadpłata cykliczna - inne częstotliwości', () => {
    const input: LoanInput = makeInput({
      amount: 400000,
      months: 360,
      annualRatePercent: 7.5,
      installmentType: 'EQUAL',
    });

    it('co kwartał - nadpłata aktywna w ratach 1, 4, 7, 10...', () => {
      const overpayments: Overpayment[] = [
        { id: '1', type: 'QUARTERLY', amount: 5000, fromInstallment: 1, effect: 'SHORTEN_PERIOD' },
      ];
      const result = service.calculateSchedule(input, overpayments, []);
      expect(result.schedule[0].overpayment).toBeCloseTo(5000, 1);
      expect(result.schedule[1].overpayment).toBe(0);
      expect(result.schedule[2].overpayment).toBe(0);
      expect(result.schedule[3].overpayment).toBeCloseTo(5000, 1);
      expect(result.schedule[6].overpayment).toBeCloseTo(5000, 1);
    });

    it('co pół roku - nadpłata co 6 rat', () => {
      const overpayments: Overpayment[] = [
        {
          id: '1',
          type: 'SEMIANNUAL',
          amount: 10000,
          fromInstallment: 1,
          effect: 'SHORTEN_PERIOD',
        },
      ];
      const result = service.calculateSchedule(input, overpayments, []);
      expect(result.schedule[0].overpayment).toBeCloseTo(10000, 1);
      expect(result.schedule[5].overpayment).toBe(0);
      expect(result.schedule[6].overpayment).toBeCloseTo(10000, 1);
      expect(result.schedule[12].overpayment).toBeCloseTo(10000, 1);
    });

    it('co rok - nadpłata co 12 rat skraca okres', () => {
      const overpayments: Overpayment[] = [
        { id: '1', type: 'ANNUAL', amount: 20000, fromInstallment: 12, effect: 'SHORTEN_PERIOD' },
      ];
      const result = service.calculateSchedule(input, overpayments, []);
      expect(result.actualMonths).toBeLessThan(360);
      expect(result.schedule[10].overpayment).toBe(0);
      expect(result.schedule[11].overpayment).toBeCloseTo(20000, 1);
      expect(result.schedule[23].overpayment).toBeCloseTo(20000, 1);
    });

    it('toInstallment ogranicza zakres', () => {
      const overpayments: Overpayment[] = [
        {
          id: '1',
          type: 'QUARTERLY',
          amount: 5000,
          fromInstallment: 1,
          toInstallment: 12,
          effect: 'SHORTEN_PERIOD',
        },
      ];
      const result = service.calculateSchedule(input, overpayments, []);
      // raty 1, 4, 7, 10 (rata 13 już poza zakresem)
      expect(result.schedule[0].overpayment).toBeCloseTo(5000, 1);
      expect(result.schedule[3].overpayment).toBeCloseTo(5000, 1);
      expect(result.schedule[6].overpayment).toBeCloseTo(5000, 1);
      expect(result.schedule[9].overpayment).toBeCloseTo(5000, 1);
      expect(result.schedule[12].overpayment).toBe(0);
      expect(result.schedule[15].overpayment).toBe(0);
    });
  });

  describe('zmiana oprocentowania', () => {
    it('rata powinna zmaleć po zmianie z 7.5% na 5% od raty 60', () => {
      const input: LoanInput = makeInput({
        amount: 400000,
        months: 360,
        annualRatePercent: 7.5,
        installmentType: 'EQUAL',
      });
      const rateChanges: RateChange[] = [{ id: '1', fromInstallment: 60, newAnnualRatePercent: 5 }];
      const result = service.calculateSchedule(input, [], rateChanges);
      const rateBefore = result.schedule[58].scheduledPayment;
      const rateAfter = result.schedule[60].scheduledPayment;
      expect(rateAfter).toBeLessThan(rateBefore);
    });
  });

  describe('edge cases', () => {
    it('nadpłata większa niż saldo - saldo = 0', () => {
      const input: LoanInput = makeInput({
        amount: 50000,
        months: 12,
        annualRatePercent: 5,
        installmentType: 'EQUAL',
      });
      const overpayments: Overpayment[] = [
        {
          id: '1',
          type: 'ONE_TIME',
          amount: 1000000,
          fromInstallment: 1,
          effect: 'SHORTEN_PERIOD',
        },
      ];
      const result = service.calculateSchedule(input, overpayments, []);
      const last = result.schedule[result.schedule.length - 1];
      expect(last.remainingBalance).toBeCloseTo(0, 1);
      expect(result.actualMonths).toBeLessThanOrEqual(1);
    });

    it('calculateComparison zwraca baseline i modified', () => {
      const input: LoanInput = makeInput({
        amount: 400000,
        months: 360,
        annualRatePercent: 7.5,
        installmentType: 'EQUAL',
      });
      const comparison = service.calculateComparison(input, [], []);
      expect(comparison.baseline).toBeDefined();
      expect(comparison.modified).toBeDefined();
      expect(comparison.monthsSaved).toBe(0);
      expect(comparison.costSavedAmount).toBeCloseTo(0, 1);
    });
  });

  describe('daty rat', () => {
    it('pierwsza rata ma datę startu kredytu, kolejne kolejnymi miesiącami', () => {
      const input = makeInput({
        amount: 100000,
        months: 12,
        annualRatePercent: 5,
        installmentType: 'EQUAL',
        startDate: new Date(2026, 0, 1),
      });
      const result = service.calculateSchedule(input, [], []);
      expect(result.schedule[0].date.getFullYear()).toBe(2026);
      expect(result.schedule[0].date.getMonth()).toBe(0);
      expect(result.schedule[11].date.getFullYear()).toBe(2026);
      expect(result.schedule[11].date.getMonth()).toBe(11);
    });

    it('rata #13 wpada w kolejny rok', () => {
      const input = makeInput({
        amount: 100000,
        months: 24,
        annualRatePercent: 5,
        installmentType: 'EQUAL',
        startDate: new Date(2026, 5, 1),
      });
      const result = service.calculateSchedule(input, [], []);
      expect(result.schedule[12].date.getFullYear()).toBe(2027);
      expect(result.schedule[12].date.getMonth()).toBe(5);
    });
  });

  describe('korekta o inflację', () => {
    const baseInput = {
      amount: 400000,
      months: 360,
      annualRatePercent: 7.5,
      installmentType: 'EQUAL' as const,
    };

    it('gdy inflationEnabled=false, totalPaidReal jest undefined', () => {
      const result = service.calculateSchedule(makeInput(baseInput), [], []);
      expect(result.totalPaidReal).toBeUndefined();
    });

    it('gdy inflationEnabled=true z 4%, totalPaidReal < totalPaid (siła nabywcza)', () => {
      const result = service.calculateSchedule(
        makeInput({ ...baseInput, inflationEnabled: true, inflationRatePercent: 4 }),
        [],
        [],
      );
      expect(result.totalPaidReal).toBeDefined();
      expect(result.totalPaidReal!).toBeLessThan(result.totalPaid);
    });

    it('przy inflacji 0% (włączone) totalPaidReal ≈ totalPaid', () => {
      const result = service.calculateSchedule(
        makeInput({ ...baseInput, inflationEnabled: true, inflationRatePercent: 0 }),
        [],
        [],
      );
      expect(result.totalPaidReal).toBeCloseTo(result.totalPaid, 0);
    });

    it('realValueOfPayment maleje w czasie (jest mniejszy w racie 100 niż 1)', () => {
      const result = service.calculateSchedule(
        makeInput({ ...baseInput, inflationEnabled: true, inflationRatePercent: 4 }),
        [],
        [],
      );
      expect(result.schedule[99].realValueOfPayment!).toBeLessThan(
        result.schedule[0].realValueOfPayment!,
      );
    });
  });

  describe('calculateThreePlans (3-kolumnowe porównanie)', () => {
    const input = () =>
      makeInput({
        amount: 400000,
        months: 360,
        annualRatePercent: 7.5,
        installmentType: 'EQUAL',
      });

    it('bez nadpłat - wszystkie 3 plany identyczne', () => {
      const cmp = service.calculateThreePlans(input(), [], []);
      expect(cmp.baseline.result.actualMonths).toBe(360);
      expect(cmp.planA.result.actualMonths).toBe(360);
      expect(cmp.planB.result.actualMonths).toBe(360);
      expect(cmp.planA.monthsSavedFromBaseline).toBe(0);
      expect(cmp.planB.monthsSavedFromBaseline).toBe(0);
    });

    it('z nadpłatą cykliczną REDUCE_INSTALLMENT - Plan B (KEEP_TOTAL) skraca okres bardziej niż Plan A', () => {
      const overpayments: Overpayment[] = [
        {
          id: '1',
          type: 'MONTHLY',
          amount: 1000,
          fromInstallment: 1,
          effect: 'REDUCE_INSTALLMENT',
        },
      ];
      const cmp = service.calculateThreePlans(input(), overpayments, []);
      // Plan A skróci się trochę (nadpłaty w sumie zmniejszają saldo wcześniej)
      // ale Plan B (KEEP_TOTAL) skróci się bardziej, bo nadpłaty rosną w czasie.
      expect(cmp.planA.result.actualMonths).toBeLessThan(360);
      expect(cmp.planB.result.actualMonths).toBeLessThan(cmp.planA.result.actualMonths);
      expect(cmp.planB.monthsSavedFromBaseline).toBeGreaterThan(cmp.planA.monthsSavedFromBaseline);
    });

    it('Plan B nie zmienia ONE_TIME nadpłat', () => {
      const overpayments: Overpayment[] = [
        {
          id: '1',
          type: 'ONE_TIME',
          amount: 50000,
          fromInstallment: 12,
          effect: 'SHORTEN_PERIOD',
        },
      ];
      const cmp = service.calculateThreePlans(input(), overpayments, []);
      expect(cmp.planA.result.actualMonths).toBe(cmp.planB.result.actualMonths);
    });

    it('displayName jest po polsku', () => {
      const cmp = service.calculateThreePlans(input(), [], []);
      expect(cmp.baseline.displayName).toBe('Bez nadpłat');
      expect(cmp.planA.displayName).toBe('Plan A');
      expect(cmp.planB.displayName).toBe('Plan B');
    });
  });

  describe('averageMonthlyPayment', () => {
    it('= rata dla raty równej bez nadpłat', () => {
      const result = service.calculateSchedule(
        makeInput({
          amount: 400000,
          months: 360,
          annualRatePercent: 7.5,
          installmentType: 'EQUAL',
        }),
        [],
        [],
      );
      expect(result.averageMonthlyPayment).toBeCloseTo(result.schedule[0].scheduledPayment, 0);
    });
  });
});
