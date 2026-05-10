import { Injectable } from '@angular/core';
import { LoanInput } from '../models/loan-input.model';
import { ThreePlanComparison } from '../models/loan-result.model';
import { Budget, DtiIndicators } from '../models/budget.model';

/**
 * Roboto Regular w wariancie Latin-Extended (obsługuje ą, ć, ę, ł, ń, ó, ś, ź, ż).
 * Ładujemy TTF z jsDelivr CDN (cached przez przeglądarkę), konwertujemy do base64
 * i rejestrujemy w jsPDF. Bez tego natywne fonty (helvetica) renderują polskie
 * znaki jako tofu/krzaczki.
 */
const FONT_URL =
  'https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.13/files/roboto-latin-ext-400-normal.ttf';
let fontCache: string | null = null;

async function loadRobotoBase64(): Promise<string | null> {
  if (fontCache) return fontCache;
  try {
    const resp = await fetch(FONT_URL);
    if (!resp.ok) return null;
    const buf = await resp.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
    }
    fontCache = btoa(binary);
    return fontCache;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class PdfExportService {
  async exportToPdf(
    input: LoanInput,
    comparison: ThreePlanComparison,
    budget?: Budget,
    dti?: DtiIndicators,
  ): Promise<void> {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pl = (n: number) =>
      n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Register Roboto with Polish glyph support; fallback to helvetica if CDN fails.
    const fontBase64 = await loadRobotoBase64();
    let fontName = 'helvetica';
    if (fontBase64) {
      doc.addFileToVFS('Roboto-Regular.ttf', fontBase64);
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'bold');
      fontName = 'Roboto';
    }

    doc.setFont(fontName, 'bold');
    doc.setFontSize(18);
    doc.text('Kalkulator rat kredytowych', 105, 20, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont(fontName, 'normal');
    let y = 32;
    doc.text(`Kwota kredytu: ${pl(input.amount)} zł`, 14, y);
    y += 6;
    doc.text(`Ilość rat: ${input.months} mc`, 14, y);
    y += 6;
    doc.text(`Oprocentowanie: ${input.annualRatePercent.toFixed(2)} %`, 14, y);
    y += 6;
    doc.text(
      `Rodzaj rat: ${input.installmentType === 'EQUAL' ? 'Równe (annuitetowe)' : 'Malejące'}`,
      14,
      y,
    );
    y += 6;
    const startDate = new Date(input.startDate);
    doc.text(
      `Data startu: ${(startDate.getMonth() + 1).toString().padStart(2, '0')}.${startDate.getFullYear()}`,
      14,
      y,
    );
    y += 6;
    if (input.inflationEnabled) {
      doc.text(`Inflacja: ${input.inflationRatePercent.toFixed(2)} %`, 14, y);
      y += 6;
    }

    doc.setFont(fontName, 'bold');
    doc.setFontSize(13);
    doc.text('Podsumowanie - 3 scenariusze', 14, y + 4);

    autoTable(doc, {
      startY: y + 8,
      head: [['Parametr', 'Bez nadpłat', 'Twój plan', 'Najszybsza spłata']],
      body: [
        [
          'Okres kredytowania (mc)',
          `${comparison.baseline.result.actualMonths}`,
          `${comparison.planA.result.actualMonths}`,
          `${comparison.planB.result.actualMonths}`,
        ],
        [
          'Łącznie do spłaty (zł)',
          pl(comparison.baseline.result.totalPaid),
          pl(comparison.planA.result.totalPaid),
          pl(comparison.planB.result.totalPaid),
        ],
        [
          'Kapitał (zł)',
          pl(comparison.baseline.result.totalCapital),
          pl(comparison.planA.result.totalCapital),
          pl(comparison.planB.result.totalCapital),
        ],
        [
          'Odsetki (zł)',
          pl(comparison.baseline.result.totalInterest),
          pl(comparison.planA.result.totalInterest),
          pl(comparison.planB.result.totalInterest),
        ],
        [
          'Nadpłaty (zł)',
          pl(comparison.baseline.result.totalOverpayments),
          pl(comparison.planA.result.totalOverpayments),
          pl(comparison.planB.result.totalOverpayments),
        ],
        [
          'Skrócenie okresu (mc)',
          '-',
          `${comparison.planA.monthsSavedFromBaseline}`,
          `${comparison.planB.monthsSavedFromBaseline}`,
        ],
        [
          'Oszczędność (zł)',
          '-',
          pl(comparison.planA.costSavedAmount),
          pl(comparison.planB.costSavedAmount),
        ],
        [
          'Oszczędność (%)',
          '-',
          `${comparison.planA.costSavedPercent.toFixed(2)} %`,
          `${comparison.planB.costSavedPercent.toFixed(2)} %`,
        ],
      ],
      theme: 'striped',
      styles: { font: fontName },
      headStyles: { fillColor: [59, 130, 246] as [number, number, number], font: fontName },
    });

    const afterY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

    if (budget && dti && dti.level !== 'unknown') {
      doc.setFont(fontName, 'bold');
      doc.setFontSize(13);
      doc.text('Twój budżet', 14, afterY + 10);

      autoTable(doc, {
        startY: afterY + 14,
        head: [['Wskaźnik', 'Wartość']],
        body: [
          ['Dochód miesięczny', `${pl(budget.monthlyIncome)} zł`],
          ['Inne raty miesięczne', `${pl(budget.otherDebtsMonthly)} zł`],
          ['Liczba osób', `${budget.householdSize}`],
          ['DTI (Debt-to-Income)', `${dti.dti.toFixed(2)} %`],
          ['RdD UOKiK', `${dti.rddUokik.toFixed(2)} %`],
          ['Pozostaje miesięcznie', `${pl(dti.remainingMonthly)} zł`],
          ['Pozostaje na osobę', `${pl(dti.remainingPerPerson)} zł`],
        ],
        theme: 'striped',
        styles: { font: fontName },
        headStyles: { fillColor: [34, 197, 94] as [number, number, number], font: fontName },
      });
    }

    doc.addPage();
    doc.setFont(fontName, 'bold');
    doc.setFontSize(13);
    doc.text('Harmonogram spłaty - Twój plan', 14, 15);

    const scheduleRows = comparison.planA.result.schedule.map((inst) => {
      const m = (inst.date.getMonth() + 1).toString().padStart(2, '0');
      return [
        `${inst.number}`,
        `${m}.${inst.date.getFullYear()}`,
        pl(inst.scheduledPayment),
        pl(inst.capitalPart),
        pl(inst.interestPart),
        inst.overpayment > 0 ? pl(inst.overpayment) : '-',
        pl(inst.remainingBalance),
      ];
    });

    autoTable(doc, {
      startY: 20,
      head: [
        ['Nr', 'Data', 'Rata (zł)', 'Kapitał (zł)', 'Odsetki (zł)', 'Nadpłata (zł)', 'Saldo (zł)'],
      ],
      body: scheduleRows,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] as [number, number, number], font: fontName },
      styles: { fontSize: 7, font: fontName },
      columnStyles: {
        0: { halign: 'center' as const },
        1: { halign: 'center' as const },
        2: { halign: 'right' as const },
        3: { halign: 'right' as const },
        4: { halign: 'right' as const },
        5: { halign: 'right' as const },
        6: { halign: 'right' as const },
      },
    });

    doc.save('kalkulator-rat.pdf');
  }
}
