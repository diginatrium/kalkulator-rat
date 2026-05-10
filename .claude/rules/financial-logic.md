---
paths:
  - "src/app/core/services/*.ts"
  - "src/app/features/**/*.ts"
---

# Financial Logic Rules

- **Service boundary:** All amortization math stays in `LoanCalculatorService`. No inline calculations in components or templates.
- **After any service change:** Run the `calc-reviewer` agent to verify math before shipping. Do not skip this step.
- **Null guards:** Use `!== null` checks — never truthiness (`if (value)`) for financial values. `0` is a valid value (e.g., zero overpayment, zero prowizja).
- **Div-by-zero:** Check every `/` and `Math.sqrt()` denominator in service methods. Guard with `if (denominator === 0) return null`.
- **Boundary precision:** Use `<` vs `<=` deliberately at installment thresholds. Off-by-one changes the loan schedule.
- **Balance floor:** `balance` must never go negative — clamp to 0 after each capital reduction.
- **Prowizja never added to balance:** Prowizja is a cost added to `totalPaid`/`totalCost`, never subtracted from the principal balance.
