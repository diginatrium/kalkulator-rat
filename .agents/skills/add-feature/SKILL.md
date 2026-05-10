---
name: add-feature
description: >
  Use this skill when the user wants to add a new feature to the loan calculator.
  Triggers: "I want to add", "new feature idea", "plan a feature", "should we add",
  "let's build", "can we support", "what if we added", "I'm thinking about adding".
  Guides brainstorm → implementation checklist. Always invoked before writing any code
  for a new feature.
---

# Add Feature Skill

Guides new feature work from idea to implementation checklist. Prevents half-baked features by forcing upfront clarity.

## Step 1 — Clarify

Ask (one question at a time, stop when 95% confident):

1. **What** — what does the feature do? Who uses it?
2. **Scope** — is it a calc change (new math in `LoanCalculatorService`), a UI change (new form field or display), or both?
3. **Edge cases** — what happens at boundaries (zero amount, last installment, rate=0)?

## Step 2 — Generate options

Produce 3–5 implementation approaches. For each:
- Which model fields change (new fields on `LoanInput`, `Overpayment`, `Installment`, etc.)
- Which service methods change or are added
- Which components change
- Complexity: S (< 2h) / M (half day) / L (multi-day)
- Key trade-off vs other options

Recommend one and explain why.

## Step 3 — Implementation checklist

After user picks an option, generate a checklist in this order:

```markdown
## Feature: <name>

### Model changes
- [ ] Add field `X` to `src/app/core/models/<model>.model.ts`
- [ ] Update default value in component that creates the object

### Service changes
- [ ] Update `LoanCalculatorService.<method>` to handle `X`
- [ ] Write unit test for the new branch in `loan-calculator.service.spec.ts`
- [ ] Run `calc-reviewer` to verify math

### Component changes
- [ ] Add input control for `X` to `<component>.html`
- [ ] Wire `(ngModelChange)` to emit updated object
- [ ] Update display in `summary` / `schedule-table` if `X` affects output

### Verification
- [ ] `npm test` — all tests pass
- [ ] `npm start` — golden path works in browser at http://localhost:4201
- [ ] Edge case: <specific edge case from Step 1>
- [ ] Run `calc-reviewer` — VERDICT: PASS
```

Do not write any code yet. Hand the checklist to the user and ask: "Ready to start implementation?"
