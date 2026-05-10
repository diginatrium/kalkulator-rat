import { Injectable } from '@angular/core';
import { LoanInput } from '../models/loan-input.model';
import { Overpayment, OverpaymentEffect, overpaymentStepMonths } from '../models/overpayment.model';
import { RateChange } from '../models/rate-change.model';
import { Installment } from '../models/installment.model';
import {
  ComparisonResult,
  LoanResult,
  PlanResult,
  ThreePlanComparison,
} from '../models/loan-result.model';

interface OverpaymentsBreakdown {
  totalAmount: number;
  primaryEffect: OverpaymentEffect;
}

@Injectable({ providedIn: 'root' })
export class LoanCalculatorService {
  /**
   * Trzy-planowe porównanie: bez nadpłat / Plan A (skutek wybrany przez użytkownika)
   * / Plan B (KEEP_TOTAL_PAYMENT na nadpłatach cyklicznych - najbardziej agresywny).
   */
  calculateThreePlans(
    input: LoanInput,
    overpayments: Overpayment[],
    rateChanges: RateChange[],
  ): ThreePlanComparison {
    const baseline = this.calculateSchedule(input, [], []);

    const planAOverpayments = overpayments;
    const planA = this.calculateSchedule(input, planAOverpayments, rateChanges);

    const planBOverpayments: Overpayment[] = overpayments.map((op) =>
      op.type === 'ONE_TIME' ? op : { ...op, effect: 'KEEP_TOTAL_PAYMENT' as OverpaymentEffect },
    );
    const planB = this.calculateSchedule(input, planBOverpayments, rateChanges);

    return {
      baseline: this.toPlanResult('baseline', 'Bez nadpłat', baseline, baseline),
      planA: this.toPlanResult('planA', 'Plan A', planA, baseline),
      planB: this.toPlanResult('planB', 'Plan B', planB, baseline),
    };
  }

  /**
   * Zachowane dla kompatybilności starszych testów: 2-kolumnowe porównanie.
   */
  calculateComparison(
    input: LoanInput,
    overpayments: Overpayment[],
    rateChanges: RateChange[],
  ): ComparisonResult {
    const baseline = this.calculateSchedule(input, [], []);
    const modified = this.calculateSchedule(input, overpayments, rateChanges);

    const baselineCost =
      baseline.totalInterest + baseline.totalCapital + baseline.totalOvpCommission;
    const modifiedCost =
      modified.totalInterest +
      modified.totalCapital +
      modified.totalOverpayments +
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
        averageMonthlyPayment: 0,
        totalPaidReal: input.inflationEnabled ? 0 : undefined,
        totalInterestReal: input.inflationEnabled ? 0 : undefined,
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
    let totalPaidRealRaw = 0;
    let totalInterestRealRaw = 0;
    let laczneKosztyRunning = prowizjaZl;

    const sortedRateChanges = [...rateChanges].sort(
      (a, b) => a.fromInstallment - b.fromInstallment,
    );

    const keepTotalTargets = new Map<string, number>();

    let installmentNumber = 1;
    const maxIterations = input.months * 2 + 100;

    const inflationMonthlyFactor = input.inflationEnabled
      ? 1 + input.inflationRatePercent / 100 / 12
      : 1;

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

      const ovpCommission =
        input.prowizjaNadplat > 0
          ? (effectiveOverpayment * input.prowizjaNadplat) / 100
          : 0;

      totalCapitalRaw += capitalPart;
      totalInterestRaw += interestPart;
      totalOverpaymentsRaw += effectiveOverpayment;
      totalOvpCommissionRaw += ovpCommission;
      laczneKosztyRunning += interestPart + ovpCommission;

      const totalThisInstallment = scheduledPayment + effectiveOverpayment + ovpCommission;
      let realValueOfPayment: number | undefined;
      if (input.inflationEnabled) {
        const discount = Math.pow(inflationMonthlyFactor, installmentNumber);
        realValueOfPayment = totalThisInstallment / discount;
        totalPaidRealRaw += realValueOfPayment;
        totalInterestRealRaw += interestPart / discount;
      }

      const installment: Installment = {
        number: installmentNumber,
        date: addMonths(input.startDate, installmentNumber - 1),
        scheduledPayment: round2(scheduledPayment),
        capitalPart: round2(capitalPart),
        interestPart: round2(interestPart),
        overpayment: round2(effectiveOverpayment),
        remainingBalance: round2(balance),
        laczneKoszty: round2(laczneKosztyRunning),
        realValueOfPayment:
          realValueOfPayment !== undefined ? round2(realValueOfPayment) : undefined,
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

    const totalPaid =
      totalCapitalRaw +
      totalInterestRaw +
      totalOverpaymentsRaw +
      prowizjaZl +
      totalOvpCommissionRaw;
    const averageMonthlyPayment =
      schedule.length > 0
        ? schedule.reduce((s, i) => s + i.scheduledPayment + i.overpayment, 0) / schedule.length
        : 0;

    return {
      schedule,
      totalPaid: round2(totalPaid),
      totalCapital: round2(totalCapitalRaw),
      totalInterest: round2(totalInterestRaw),
      totalOverpayments: round2(totalOverpaymentsRaw),
      totalProwizja: round2(prowizjaZl),
      totalOvpCommission: round2(totalOvpCommissionRaw),
      actualMonths: schedule.length,
      averageMonthlyPayment: round2(averageMonthlyPayment),
      totalPaidReal: input.inflationEnabled ? round2(totalPaidRealRaw) : undefined,
      totalInterestReal: input.inflationEnabled ? round2(totalInterestRealRaw) : undefined,
    };
  }

  private toPlanResult(
    planLabel: PlanResult['planLabel'],
    displayName: string,
    result: LoanResult,
    baseline: LoanResult,
  ): PlanResult {
    const baselineCost =
      baseline.totalInterest + baseline.totalCapital + baseline.totalOvpCommission;
    const planCost =
      result.totalInterest +
      result.totalCapital +
      result.totalOverpayments +
      result.totalOvpCommission;
    const costSavedAmount = baselineCost - planCost;
    const costSavedPercent = baselineCost > 0 ? (costSavedAmount / baselineCost) * 100 : 0;

    return {
      planLabel,
      displayName,
      result,
      monthsSavedFromBaseline: baseline.actualMonths - result.actualMonths,
      costSavedAmount: round2(costSavedAmount),
      costSavedPercent: round2(costSavedPercent),
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

      const amountMode = op.amountMode ?? 'surplus';
      let amount: number;
      if (op.effect === 'KEEP_TOTAL_PAYMENT' && op.type !== 'ONE_TIME') {
        if (!keepTotalTargets.has(op.id)) {
          const target = amountMode === 'total' ? op.amount : scheduledPayment + op.amount;
          keepTotalTargets.set(op.id, target);
        }
        const target = keepTotalTargets.get(op.id) as number;
        amount = Math.max(0, target - scheduledPayment);
      } else {
        amount =
          amountMode === 'total' ? Math.max(0, op.amount - scheduledPayment) : op.amount;
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

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
  return d;
}
