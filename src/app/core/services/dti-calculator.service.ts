import { Injectable } from '@angular/core';
import { Budget, DtiIndicators, DtiLevel } from '../models/budget.model';

@Injectable({ providedIn: 'root' })
export class DtiCalculatorService {
  calculate(monthlyPayment: number, budget: Budget): DtiIndicators {
    const income = budget.monthlyIncome;
    if (income <= 0) {
      return {
        dti: 0,
        rddUokik: 0,
        level: 'unknown',
        remainingMonthly: 0,
        remainingPerPerson: 0,
      };
    }

    const totalDebts = monthlyPayment + budget.otherDebtsMonthly;
    const dti = (totalDebts / income) * 100;
    const rddUokik = (monthlyPayment / income) * 100;
    const level: DtiLevel = dti < 30 ? 'safe' : dti <= 50 ? 'warning' : 'danger';

    const remainingMonthly = income - totalDebts;
    const householdSize = Math.max(1, budget.householdSize);
    const remainingPerPerson = remainingMonthly / householdSize;

    return {
      dti: round2(dti),
      rddUokik: round2(rddUokik),
      level,
      remainingMonthly: round2(remainingMonthly),
      remainingPerPerson: round2(remainingPerPerson),
    };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
