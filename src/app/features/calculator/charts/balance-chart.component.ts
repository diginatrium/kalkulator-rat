import { Component, computed, input } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { LoanResult } from '../../../core/models/loan-result.model';

@Component({
  selector: 'app-balance-chart',
  templateUrl: './balance-chart.component.html',
  styleUrl: './balance-chart.component.scss',
  imports: [ChartModule, CardModule],
})
export class BalanceChartComponent {
  baseline = input.required<LoanResult>();
  modified = input.required<LoanResult>();

  chartData = computed(() => {
    const base = this.baseline();
    const mod = this.modified();
    const maxLen = Math.max(base.schedule.length, mod.schedule.length);
    const step = Math.ceil(maxLen / 120);

    const labels: string[] = [];
    const baseData: number[] = [];
    const modData: number[] = [];

    for (let i = 0; i < maxLen; i += step) {
      labels.push(`${i + 1}`);
      baseData.push(base.schedule[i]?.remainingBalance ?? 0);
      modData.push(mod.schedule[i]?.remainingBalance ?? 0);
    }

    if (base.schedule.length > 0) {
      labels.push(`${base.schedule.length}`);
      baseData.push(0);
      modData.push(0);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Saldo wyjściowe',
          data: baseData,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
        },
        {
          label: 'Saldo zmodyfikowane',
          data: modData,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
        },
      ],
    };
  });

  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: (ctx: { dataset: { label: string }; raw: number }) =>
            `${ctx.dataset.label}: ${ctx.raw.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}`,
        },
      },
    },
    scales: {
      x: { title: { display: true, text: 'Nr raty' } },
      y: {
        title: { display: true, text: 'Saldo (zł)' },
        ticks: {
          callback: (v: number) => v.toLocaleString('pl-PL', { maximumFractionDigits: 0 }) + ' zł',
        },
      },
    },
  };
}
