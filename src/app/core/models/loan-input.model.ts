export type InstallmentType = 'EQUAL' | 'DECREASING';

export interface LoanInput {
  amount: number;
  months: number;
  annualRatePercent: number;
  installmentType: InstallmentType;
  startDate: Date;
  inflationEnabled: boolean;
  inflationRatePercent: number;
}

export const DEFAULT_LOAN_INPUT: LoanInput = {
  amount: 400000,
  months: 360,
  annualRatePercent: 7.5,
  installmentType: 'EQUAL',
  startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  inflationEnabled: false,
  inflationRatePercent: 4,
};
