import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'monthsToYears' })
export class MonthsToYearsPipe implements PipeTransform {
  transform(months: number | null | undefined): string {
    if (months == null || !Number.isFinite(months) || months < 0) return '';
    const total = Math.floor(months);
    if (total < 12) return '';

    const years = Math.floor(total / 12);
    const remainingMonths = total % 12;

    const yearLabel = polishYearLabel(years);
    if (remainingMonths === 0) return `${years} ${yearLabel}`;
    return `${years} ${yearLabel} ${remainingMonths} mc`;
  }
}

function polishYearLabel(n: number): string {
  if (n === 1) return 'rok';
  const lastTwo = n % 100;
  const last = n % 10;
  if (lastTwo >= 12 && lastTwo <= 14) return 'lat';
  if (last >= 2 && last <= 4) return 'lata';
  return 'lat';
}
