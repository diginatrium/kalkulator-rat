export interface Budget {
  monthlyIncome: number;
  otherDebtsMonthly: number;
  householdSize: number;
}

export const DEFAULT_BUDGET: Budget = {
  monthlyIncome: 0,
  otherDebtsMonthly: 0,
  householdSize: 1,
};

export type DtiLevel = 'safe' | 'warning' | 'danger' | 'unknown';

export interface DtiIndicators {
  /** (rata + inne raty) / dochód × 100 */
  dti: number;
  /** rata / dochód × 100 (UOKiK metoda do wakacji kredytowych) */
  rddUokik: number;
  level: DtiLevel;
  /** dochód po pokryciu wszystkich rat (rata + inne raty) */
  remainingMonthly: number;
  /** dochód po pokryciu rat na osobę */
  remainingPerPerson: number;
}
