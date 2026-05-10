export interface Installment {
  number: number;
  date: Date;
  scheduledPayment: number;
  capitalPart: number;
  interestPart: number;
  overpayment: number;
  remainingBalance: number;
  laczneKoszty: number;
  realValueOfPayment?: number;
}
