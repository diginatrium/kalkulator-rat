export type OverpaymentType = 'ONE_TIME' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL';
export type OverpaymentEffect = 'SHORTEN_PERIOD' | 'REDUCE_INSTALLMENT' | 'KEEP_TOTAL_PAYMENT';

export function overpaymentStepMonths(type: OverpaymentType): number {
  switch (type) {
    case 'ONE_TIME':
      return 0;
    case 'MONTHLY':
      return 1;
    case 'QUARTERLY':
      return 3;
    case 'SEMIANNUAL':
      return 6;
    case 'ANNUAL':
      return 12;
  }
}

export interface Overpayment {
  id: string;
  type: OverpaymentType;
  amount: number;
  fromInstallment: number;
  toInstallment?: number;
  effect: OverpaymentEffect;
}
