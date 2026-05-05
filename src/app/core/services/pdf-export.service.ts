import { Injectable } from '@angular/core';
import { ComparisonResult } from '../models/loan-result.model';
import { LoanInput } from '../models/loan-input.model';

@Injectable({ providedIn: 'root' })
export class PdfExportService {
  async exportToPdf(input: LoanInput, comparison: ComparisonResult): Promise<void> {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pl = (n: number) =>
      n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Kalkulator rat kredytowych', 105, 20, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Kwota kredytu: ${pl(input.amount)} zł`, 14, 35);
    doc.text(`Ilość rat: ${input.months} mc`, 14, 42);
    doc.text(`Oprocentowanie: ${input.annualRatePercent.toFixed(2)} %`, 14, 49);
    doc.text(
      `Rodzaj rat: ${input.installmentType === 'EQUAL' ? 'Równe (annuitetowe)' : 'Malejące'}`,
      14,
      56,
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Podsumowanie', 14, 68);

    autoTable(doc, {
      startY: 73,
      head: [['Parametr', 'Wyjściowy', 'Zmodyfikowany']] as string[][],
      body: [
        [
          'Okres kredytowania (mc)',
          `${comparison.baseline.actualMonths}`,
          `${comparison.modified.actualMonths}`,
        ],
        [
          'Całkowita kwota spłaty (zł)',
          pl(comparison.baseline.totalPaid),
          pl(comparison.modified.totalPaid),
        ],
        [
          'Kapitał (zł)',
          pl(comparison.baseline.totalCapital),
          pl(comparison.modified.totalCapital),
        ],
        [
          'Odsetki (zł)',
          pl(comparison.baseline.totalInterest),
          pl(comparison.modified.totalInterest),
        ],
        [
          'Nadpłaty (zł)',
          pl(comparison.baseline.totalOverpayments),
          pl(comparison.modified.totalOverpayments),
        ],
        ['Skrócenie okresu (mc)', '-', `${comparison.monthsSaved}`],
        ['Oszczędność (zł)', '-', pl(comparison.costSavedAmount)],
        ['Oszczędność (%)', '-', `${comparison.costSavedPercent.toFixed(2)} %`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] as [number, number, number] },
    });

    const afterSummaryY =
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Harmonogram spłaty (zmodyfikowany)', 14, afterSummaryY);

    const scheduleRows = comparison.modified.schedule.map((inst) => [
      `${inst.number}`,
      pl(inst.scheduledPayment),
      pl(inst.capitalPart),
      pl(inst.interestPart),
      inst.overpayment > 0 ? pl(inst.overpayment) : '-',
      pl(inst.remainingBalance),
    ]);

    autoTable(doc, {
      startY: afterSummaryY + 5,
      head: [
        ['Nr raty', 'Rata (zł)', 'Kapitał (zł)', 'Odsetki (zł)', 'Nadpłata (zł)', 'Saldo (zł)'],
      ],
      body: scheduleRows,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] as [number, number, number] },
      styles: { fontSize: 7 },
      columnStyles: {
        0: { halign: 'center' as const },
        1: { halign: 'right' as const },
        2: { halign: 'right' as const },
        3: { halign: 'right' as const },
        4: { halign: 'right' as const },
        5: { halign: 'right' as const },
      },
    });

    doc.save('kalkulator-rat.pdf');
  }
}
