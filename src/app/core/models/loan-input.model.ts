export type InstallmentType = 'EQUAL' | 'DECREASING';

export interface LoanInput {
  amount: number;
  months: number;
  annualRatePercent: number;
  installmentType: InstallmentType;
}
