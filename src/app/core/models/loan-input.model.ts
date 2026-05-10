export type InstallmentType = 'EQUAL' | 'DECREASING';
export type ProwizjaType = 'percent' | 'amount';

export interface LoanInput {
  amount: number;
  months: number;
  annualRatePercent: number;
  installmentType: InstallmentType;
  prowizja: number;
  prowizjaType: ProwizjaType;
  prowizjaNadplat: number;
  startDate: Date;
  inflationEnabled: boolean;
  inflationRatePercent: number;
}

export const DEFAULT_LOAN_INPUT: LoanInput = {
  amount: 400000,
  months: 360,
  annualRatePercent: 7.5,
  installmentType: 'EQUAL',
  prowizja: 0,
  prowizjaType: 'percent',
  prowizjaNadplat: 0,
  startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  inflationEnabled: false,
  inflationRatePercent: 4,
};
