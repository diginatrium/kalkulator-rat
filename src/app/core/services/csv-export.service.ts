import { Injectable } from '@angular/core';
import { Installment } from '../models/installment.model';

@Injectable({ providedIn: 'root' })
export class CsvExportService {
  /**
   * Eksportuje harmonogram do CSV w formacie zgodnym z polskim Excelem:
   * separator `;`, przecinek dziesiętny, kodowanie UTF-8 z BOM.
   */
  exportSchedule(filename: string, schedule: Installment[]): void {
    const header = [
      'Nr',
      'Data',
      'Rata (zł)',
      'Kapitał (zł)',
      'Odsetki (zł)',
      'Nadpłata (zł)',
      'Saldo (zł)',
      'Realna wartość (zł)',
    ];

    const rows = schedule.map((inst) => [
      inst.number.toString(),
      formatDate(inst.date),
      formatNumber(inst.scheduledPayment),
      formatNumber(inst.capitalPart),
      formatNumber(inst.interestPart),
      formatNumber(inst.overpayment),
      formatNumber(inst.remainingBalance),
      inst.realValueOfPayment !== undefined ? formatNumber(inst.realValueOfPayment) : '',
    ]);

    const csv = '﻿' + [header, ...rows].map((row) => row.map(escapeCell).join(';')).join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}

function formatDate(d: Date): string {
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${m}.${d.getFullYear()}`;
}

function formatNumber(n: number): string {
  return n.toFixed(2).replace('.', ',');
}

function escapeCell(value: string): string {
  if (value.includes(';') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
