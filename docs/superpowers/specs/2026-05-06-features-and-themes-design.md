# Kalkulator Rat — Features & Visual Themes Design

**Date:** 2026-05-06  
**Status:** Approved  
**Scope:** Add missing features from reference apps + create two visual theme variants

---

## Overview

Extend the existing Angular v21 + PrimeNG loan calculator with four features identified from competitor analysis (jakubstaszkiewicz.pl, hipotekabeztajemnic.pl), then produce two themed copies for side-by-side visual comparison.

---

## Part 1 — New Features (in `kalkulator-rat`)

### 1.1 Prowizja za udzielenie kredytu (Origination Fee)

**Where:** `loan-form` component + `LoanInput` model + `LoanCalculatorService`

**UI:** New field below Oprocentowanie with toggle button `%` / `zł` (two `p-button` styled as toggle group beside `p-inputNumber`). Default: 0%.

**Model changes (`loan-input.model.ts`):**
```typescript
prowizja: number;           // default 0
prowizjaType: 'percent' | 'amount';  // default 'percent'
```

**Calculation (`loan-calculator.service.ts`):**
```
prowizja_zł = prowizjaType === 'percent' ? kwota * prowizja / 100 : prowizja
```
Added to total cost. Displayed as a separate line in summary ("Prowizja za udzielenie").

**Affected outputs:** summary component, PDF export, XLSX export.

### 1.2 Prowizja od nadpłat (Overpayment Commission)

**Where:** `overpayments-form` component + `LoanInput` model + `LoanCalculatorService`

**UI:** Single `p-inputNumber` field (suffix `%`) at the top of the overpayments section. Default: 0%.

**Model changes (`loan-input.model.ts`):**
```typescript
prowizjaNadplat: number;   // default 0
```

**Calculation:** For each installment with an overpayment:
```
prowizja_nadplata = overpayment.amount * prowizjaNadplat / 100
```
Added to that installment's cost, included in cumulative `laczneKoszty`.

### 1.3 Kolumna "Łączne koszty" w harmonogramie (Cumulative Cost Column)

**Where:** `installment.model.ts` + `LoanCalculatorService` + `schedule-table` component

**Model changes (`installment.model.ts`):**
```typescript
laczneKoszty: number;  // cumulative sum of (odsetki + prowizja) from installment 1 to N
```

**Calculation:** Running total computed in the service loop:
```
laczneKoszty[n] = laczneKoszty[n-1] + interest[n] + overpaymentCommission[n]
```

**UI:** New last column in `schedule-table`, header "Łączne koszty", right-aligned, formatted as Polish currency.

### 1.4 Eksport XLSX (Excel Export)

**New file:** `src/app/core/services/xlsx-export.service.ts`

**Library:** `xlsx` (SheetJS) — `npm install xlsx`

**Three worksheets:**
1. `Parametry` — loan input parameters (kwota, okres, oprocentowanie, prowizja, prowizjaNadplat)
2. `Podsumowanie` — summary comparison table (original vs modified, result metrics)
3. `Harmonogram` — full installment schedule (both original and modified, all columns including Łączne koszty)

**UI:** New `p-button` "Eksportuj XLSX" placed alongside existing "Eksportuj PDF" button in `calculator.page`. Polish locale formatting throughout.

---

## Part 2 — Visual Theme Variants

After implementing Part 1, create two folder copies with different visual themes. The original `kalkulator-rat` stays as the canonical source.

### Theme B — Banking Light (`kalkulator-rat-banking`)

**Palette:** White background `#ffffff`, primary navy `#1a3c6e`, secondary light blue `#e8f0fd`, text dark `#1a2332`

**Changes from original:**
- `app.config.ts`: `definePreset(Aura, { semantic: { primary: { 50: '#e8f0fd', ..., 500: '#1a3c6e', ... } } })`
- `styles.scss`: body background `#f4f7fb`, cards white with `box-shadow: 0 1px 4px rgba(0,0,0,0.08)`, buttons solid navy
- Persona: classic Polish bank (PKO BP / mBank aesthetic)

### Theme C — Green Wealth (`kalkulator-rat-green`)

**Palette:** Background `#f0faf4`, primary green `#16a34a`, accent `#22c55e`, text `#111827`

**Changes from original:**
- `app.config.ts`: `definePreset(Aura, { semantic: { primary: { 50: '#f0faf4', ..., 500: '#16a34a', ... } } })`
- `styles.scss`: body background `#f0faf4`, primary button gradient `linear-gradient(135deg, #16a34a, #22c55e)`, card borders `#bbf7d0`
- Persona: modern fintech (Revolut / N26 aesthetic)

---

## Folder Structure

```
C:\Users\Wiktor\Desktop\Claude\
  kalkulator-rat\           ← canonical source with all new features
  kalkulator-rat-banking\   ← copy of above + Banking Light theme applied
  kalkulator-rat-green\     ← copy of above + Green Wealth theme applied
```

Each folder is a standalone Angular app. Run on different ports for side-by-side comparison:
```
kalkulator-rat:         ng serve --port 4200
kalkulator-rat-banking: ng serve --port 4201
kalkulator-rat-green:   ng serve --port 4202
```

---

## Implementation Order

1. Add `prowizja` + `prowizjaType` + `prowizjaNadplat` to `LoanInput` model
2. Add `laczneKoszty` to `Installment` model
3. Update `LoanCalculatorService` — calculation logic for all new fields
4. Update `loan-form` — prowizja UI with toggle
5. Update `overpayments-form` — prowizja od nadpłat field
6. Update `schedule-table` — Łączne koszty column
7. Update `summary` — prowizja line items in both columns
8. Update `pdf-export.service.ts` — include new fields
9. Create `xlsx-export.service.ts` + install `xlsx`
10. Update `calculator.page` — XLSX export button
11. Manual test: verify calculations match reference scenarios
12. Copy folder → `kalkulator-rat-banking`, apply theme B
13. Copy folder → `kalkulator-rat-green`, apply theme C

---

## Out of Scope

- Range sliders for inputs (considered, skipped — number fields are more precise for mortgage amounts)
- Dark mode toggle (considered, skipped — two separate theme folders serve this purpose)
- Comparison of multiple bank offers (future feature)
- WIBOR API integration (future feature)
