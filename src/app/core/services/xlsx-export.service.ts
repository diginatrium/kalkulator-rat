import { Injectable } from '@angular/core';
import { ComparisonResult } from '../models/loan-result.model';
import { LoanInput } from '../models/loan-input.model';

@Injectable({ providedIn: 'root' })
export class XlsxExportService {
  async exportToXlsx(input: LoanInput, comparison: ComparisonResult): Promise<void> {
    const XLSX = await import('xlsx');

    const pl = (n: number) =>
      n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const prowizjaLabel =
      input.prowizjaType === 'percent'
        ? `${input.prowizja.toFixed(2)} %`
        : `${pl(input.prowizja)} zł`;

    // Sheet 1: Parametry
    const parametryData = [
      ['Parametr', 'Wartość'],
      ['Kwota kredytu (zł)', input.amount],
      ['Liczba rat (mc)', input.months],
      ['Oprocentowanie roczne (%)', input.annualRatePercent],
      ['Rodzaj rat', input.installmentType === 'EQUAL' ? 'Równe (annuitetowe)' : 'Malejące'],
      ['Prowizja za udzielenie', prowizjaLabel],
      ['Prowizja od nadpłat (%)', input.prowizjaNadplat],
    ];
    const wsParametry = XLSX.utils.aoa_to_sheet(parametryData);

    // Sheet 2: Podsumowanie
    const podsumowanieData = [
      ['Parametr', 'Wyjściowy', 'Zmodyfikowany'],
      [
        'Okres kredytowania (mc)',
        comparison.baseline.actualMonths,
        comparison.modified.actualMonths,
      ],
      ['Całkowita kwota spłaty (zł)', comparison.baseline.totalPaid, comparison.modified.totalPaid],
      ['Kapitał (zł)', comparison.baseline.totalCapital, comparison.modified.totalCapital],
      ['Odsetki (zł)', comparison.baseline.totalInterest, comparison.modified.totalInterest],
      [
        'Nadpłaty (zł)',
        comparison.baseline.totalOverpayments,
        comparison.modified.totalOverpayments,
      ],
      [
        'Prowizja za udzielenie (zł)',
        comparison.baseline.totalProwizja,
        comparison.modified.totalProwizja,
      ],
      [
        'Prowizja od nadpłat (zł)',
        comparison.baseline.totalOvpCommission,
        comparison.modified.totalOvpCommission,
      ],
      ['Skrócenie okresu (mc)', '-', comparison.monthsSaved],
      ['Oszczędność (zł)', '-', comparison.costSavedAmount],
      ['Oszczędność (%)', '-', comparison.costSavedPercent],
    ];
    const wsPodsumowanie = XLSX.utils.aoa_to_sheet(podsumowanieData);

    // Sheet 3: Harmonogram (modified)
    const harmonogramHeaders = [
      'Nr raty',
      'Rata (zł)',
      'Kapitał (zł)',
      'Odsetki (zł)',
      'Nadpłata (zł)',
      'Saldo (zł)',
      'Łączne koszty (zł)',
    ];
    const harmonogramRows = comparison.modified.schedule.map((inst) => [
      inst.number,
      inst.scheduledPayment,
      inst.capitalPart,
      inst.interestPart,
      inst.overpayment,
      inst.remainingBalance,
      inst.laczneKoszty,
    ]);
    const wsHarmonogram = XLSX.utils.aoa_to_sheet([harmonogramHeaders, ...harmonogramRows]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsParametry, 'Parametry');
    XLSX.utils.book_append_sheet(wb, wsPodsumowanie, 'Podsumowanie');
    XLSX.utils.book_append_sheet(wb, wsHarmonogram, 'Harmonogram');

    XLSX.writeFile(wb, 'kalkulator-rat.xlsx');
  }
}
