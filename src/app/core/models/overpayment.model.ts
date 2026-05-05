export type OverpaymentType = 'ONE_TIME' | 'MONTHLY';
export type OverpaymentEffect = 'SHORTEN_PERIOD' | 'REDUCE_INSTALLMENT' | 'KEEP_TOTAL_PAYMENT';

export interface Overpayment {
  id: string;
  type: OverpaymentType;
  amount: number;
  fromInstallment: number;
  toInstallment?: number;
  effect: OverpaymentEffect;
}
