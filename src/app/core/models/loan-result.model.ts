import { Installment } from './installment.model';

export interface LoanResult {
  schedule: Installment[];
  totalPaid: number;
  totalCapital: number;
  totalInterest: number;
  totalOverpayments: number;
  actualMonths: number;
}

export interface ComparisonResult {
  baseline: LoanResult;
  modified: LoanResult;
  monthsSaved: number;
  costSavedAmount: number;
  costSavedPercent: number;
}
