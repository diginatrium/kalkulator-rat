# Kalkulator Rat

Polish mortgage & loan calculator — annuity (equal) and decreasing installments, nadpłaty (overpayments), prowizja, rate changes mid-schedule, PDF/XLSX export, amortization charts.

## Warm Start

```bash
ls -t .agents/handoffs/ | head -1
```
Read the file it returns, then continue from there.

## Tech Stack

- **Angular 21** — standalone components, signals, computed, zoneless change detection
- **PrimeNG 21** — Aura preset, Banking Light theme (navy `#1a3c6e`, bg `#f4f7fb`, gold `#c49a3c`)
- **Fonts** — Cormorant Garamond (display), IBM Plex Mono (numbers), Outfit (body/labels) — loaded via Google Fonts
- **Chart.js 4** — via `p-chart`; canvas height forced via global CSS with `!important` (Chart.js sets inline style at init)
- **jsPDF 4** + **SheetJS 0.18.5** — PDF and XLSX export
- **Vitest 4** — unit tests
- **Husky + lint-staged** — pre-commit hooks

## Dev Workflow

```bash
npm start          # dev server at http://localhost:4201
npm test           # Vitest unit tests
npm run build      # production build
ng deploy          # deploy (if configured)
```

## Architecture

```
src/app/
  core/
    models/         # LoanInput, Overpayment, Installment, LoanResult, RateChange
    services/       # LoanCalculatorService (all financial math lives here)
  features/
    calculator/
      loan-form/
      overpayments-form/
      rate-changes-form/
      summary/
      schedule-table/
      charts/         # balance-chart, structure-chart
```

## Key Types

| Type | Notes |
|------|-------|
| `LoanInput` | amount, months, annualRatePercent, installmentType, prowizja, prowizjaNadplat |
| `Overpayment` | id, type (ONE_TIME/MONTHLY/…), `amountMode: 'surplus' \| 'total'`, amount, fromInstallment, toInstallment, effect |
| `Installment` | number, scheduledPayment, capitalPart, interestPart, overpayment, remainingBalance, laczneKoszty |
| `LoanResult` | schedule, totalPaid, totalCapital, totalInterest, totalOverpayments, totalProwizja, totalOvpCommission, actualMonths |
| `ComparisonResult` | baseline, modified, monthsSaved, costSavedAmount, costSavedPercent |
| `RateChange` | id, fromInstallment, newAnnualRatePercent |

## AI Rules

1. **Financial logic stays in `LoanCalculatorService`** — no inline math in components or templates.
2. **Run `calc-reviewer` after any service change** before shipping a feature.
3. **Warm start every session** — read latest handoff before touching code.
4. **Windows shell:** use `;` not `&&` for command chaining.
5. **Surgical edits** — targeted replacements, not full rewrites.
6. **Bail after 2 failures** — start fresh with a rewritten approach.
7. **Session handoffs** — use `/handoff` on wrap-up.

Agent dispatch rules, effort levels, and full workflow rules are in `.claude/rules/ai-dispatch.md` — auto-injected each session.  
Financial logic rules (null guards, div-by-zero, balance floor) are in `.claude/rules/financial-logic.md` — auto-active on service/feature file edits.

## Commit Discipline

- **Commit Early:** Propose a commit after every self-contained design or functionality change.
- **One Concern per Commit:** Keep structural changes separate from visual redesigns.
- **Split source from derived docs:** When a session produces both source changes AND updates to CLAUDE.md/handoffs, commit them in two passes — source first, docs second.
- **Document Changes:** For complex tasks, document **what** changed and **why** in the commit body.
- Always commit before starting the next distinct change.
- **Surface unexpected state changes — don't absorb them.** If a file you're about to edit has shifted between reads, or a feature you expected is missing, STOP and present the discovery with 2–3 options before proceeding.

## Design Workflow

- **Enumerate options — don't ask open-ended.** When the user asks for a refinement or direction pick, present 2–3 concrete options with trade-offs. The user picks decisively when choices are laid out.
- **Screenshot self-check:** After any UI change, screenshot the running app at `http://localhost:4201` and verify layout before handing back. Use the **Playwright plugin** for screenshots. Run three passes (implement → screenshot → fix) before presenting V1.

## Angular Template Gotchas

- **Signal type narrowing — prefer `!` over `@if` guards:** `@if (x() !== null)` does NOT narrow `x()` for the compiler — signal calls are functions. Use `!` non-null assertions on strictly-typed pipes (e.g., `x()!`). Adding `@if` guards for type narrowing causes build failures in strict mode.
- **Zoneless + Vitest:** `button.click()` in unit tests does not reliably trigger change detection for signal updates. For UI interaction tests, prefer Playwright `browser_click` over programmatic clicks in Vitest specs.

## Agents

| Agent | Trigger |
|-------|---------|
| `calc-reviewer` | After any change to `LoanCalculatorService` or its models — verifies math, runs tests |
| `code-reviewer` | Pre-commit review of changed files — Angular v21 patterns, naming, Polish UI strings |
| `pr-description-writer` | Generate PR description with financial context from git diff |
| `docs-integrity-checker` | After editing CLAUDE.md — verifies accuracy and alignment with codebase |
| `web-researcher` | Research financial regulations, Angular/PrimeNG docs, or technical topics |

## Commands

| Command | Purpose |
|---------|---------|
| `/add-feature` | Guided feature brainstorm → implementation checklist |
| `/handoff` (global) | Write session handoff to `.agents/handoffs/YYYY-MM-DD.md` |

## GitHub

`https://github.com/diginatrium/kalkulator-rat`

## Known Gotchas

- **Chart.js inline height**: Chart.js sets `height: 150px` as inline style on `<canvas>` at init. Override only works from `styles.scss` with `!important` — `::ng-deep` in component SCSS is too late.
- **`amountMode=total` for KEEP_TOTAL_PAYMENT**: the entered amount IS the target total (not surplus on top of installment). Logic in `computeOverpaymentsForInstallment`.
- **NTFS junctions**: `.claude/agents`, `.claude/skills`, `.claude/handoffs` are junctions → `.agents/`. Remove with `cmd //c rmdir "<path>"` (no `/S`).
