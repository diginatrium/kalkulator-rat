import { Injectable } from '@angular/core';
import { LoanInput } from '../models/loan-input.model';
import { Overpayment, OverpaymentEffect } from '../models/overpayment.model';
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

    const baselineCost = baseline.totalInterest + baseline.totalCapital;
    const modifiedCost =
      modified.totalInterest + modified.totalCapital + modified.totalOverpayments;
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
        actualMonths: 0,
      };
    }

    const schedule: Installment[] = [];
    let balance = input.amount;
    let currentAnnualRate = input.annualRatePercent;
    let remainingMonths = input.months;
    let equalInstallment = this.calcEqualInstallment(balance, currentAnnualRate, remainingMonths);

    let totalCapitalRaw = 0;
    let totalInterestRaw = 0;
    let totalOverpaymentsRaw = 0;

    const sortedRateChanges = [...rateChanges].sort(
      (a, b) => a.fromInstallment - b.fromInstallment,
    );

    // KEEP_TOTAL_PAYMENT: stała łączna kwota miesięczna (rata + nadpłata).
    // Zapamiętujemy targetTotal per nadpłata przy pierwszej aktywacji.
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

      balance -= capitalPart;
      balance -= effectiveOverpayment;
      balance = Math.max(0, balance);

      totalCapitalRaw += capitalPart;
      totalInterestRaw += interestPart;
      totalOverpaymentsRaw += effectiveOverpayment;

      const installment: Installment = {
        number: installmentNumber,
        scheduledPayment: Math.round(scheduledPayment * 100) / 100,
        capitalPart: Math.round(capitalPart * 100) / 100,
        interestPart: Math.round(interestPart * 100) / 100,
        overpayment: Math.round(effectiveOverpayment * 100) / 100,
        remainingBalance: Math.round(balance * 100) / 100,
      };
      schedule.push(installment);

      if (effectiveOverpayment > 0) {
        const remainingAfter = input.months - installmentNumber;
        if (remainingAfter > 0) {
          // Zarówno REDUCE_INSTALLMENT jak i KEEP_TOTAL_PAYMENT przeliczają ratę.
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

    return {
      schedule,
      totalPaid:
        Math.round((totalCapitalRaw + totalInterestRaw + totalOverpaymentsRaw) * 100) / 100,
      totalCapital: Math.round(totalCapitalRaw * 100) / 100,
      totalInterest: Math.round(totalInterestRaw * 100) / 100,
      totalOverpayments: Math.round(totalOverpaymentsRaw * 100) / 100,
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
      if (op.effect === 'KEEP_TOTAL_PAYMENT' && op.type === 'MONTHLY') {
        // Przy pierwszej aktywacji zapamiętaj łączną docelową kwotę miesięczną.
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
        // KEEP_TOTAL_PAYMENT na ONE_TIME nie ma sensu - zachowaj się jak SHORTEN_PERIOD.
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
    return installmentNumber >= from && installmentNumber <= to;
  }
}
