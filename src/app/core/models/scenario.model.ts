import { LoanInput } from './loan-input.model';
import { Overpayment } from './overpayment.model';
import { RateChange } from './rate-change.model';
import { Budget } from './budget.model';

export interface AppState {
  loanInput: LoanInput;
  overpayments: Overpayment[];
  rateChanges: RateChange[];
  budget: Budget;
}

export interface SavedScenario {
  schemaVersion: 1;
  name: string;
  savedAt: string;
  state: AppState;
}
