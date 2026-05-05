export interface Installment {
  number: number;
  scheduledPayment: number;
  capitalPart: number;
  interestPart: number;
  overpayment: number;
  remainingBalance: number;
}
