import { Installment } from './installment.model';

export interface LoanResult {
  schedule: Installment[];
  totalPaid: number;
  totalCapital: number;
  totalInterest: number;
  totalOverpayments: number;
  actualMonths: number;
  averageMonthlyPayment: number;
  totalPaidReal?: number;
  totalInterestReal?: number;
}

export interface ComparisonResult {
  baseline: LoanResult;
  modified: LoanResult;
  monthsSaved: number;
  costSavedAmount: number;
  costSavedPercent: number;
}

export type PlanLabel = 'baseline' | 'planA' | 'planB';

export interface PlanResult {
  planLabel: PlanLabel;
  displayName: string;
  result: LoanResult;
  monthsSavedFromBaseline: number;
  costSavedAmount: number;
  costSavedPercent: number;
}

export interface ThreePlanComparison {
  baseline: PlanResult;
  planA: PlanResult;
  planB: PlanResult;
}
