import { Component, computed, input } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { ThreePlanComparison } from '../../../core/models/loan-result.model';

@Component({
  selector: 'app-balance-chart',
  templateUrl: './balance-chart.component.html',
  styleUrl: './balance-chart.component.scss',
  imports: [ChartModule, CardModule],
})
export class BalanceChartComponent {
  comparison = input.required<ThreePlanComparison>();

  chartData = computed(() => {
    const c = this.comparison();
    const series = [
      { plan: c.baseline, color: '#9ca3af', fill: 'rgba(156, 163, 175, 0.1)' },
      { plan: c.planA, color: '#3b82f6', fill: 'rgba(59, 130, 246, 0.1)' },
      { plan: c.planB, color: '#22c55e', fill: 'rgba(34, 197, 94, 0.1)' },
    ];

    const maxLen = Math.max(...series.map((s) => s.plan.result.schedule.length));
    const step = Math.max(1, Math.ceil(maxLen / 120));

    const labels: string[] = [];
    for (let i = 0; i < maxLen; i += step) labels.push(`${i + 1}`);
    if (maxLen > 0) labels.push(`${maxLen}`);

    return {
      labels,
      datasets: series.map(({ plan, color, fill }) => {
        const data: number[] = [];
        for (let i = 0; i < maxLen; i += step) {
          data.push(plan.result.schedule[i]?.remainingBalance ?? 0);
        }
        if (maxLen > 0) data.push(0);
        return {
          label: plan.displayName,
          data,
          borderColor: color,
          backgroundColor: fill,
          fill: false,
          tension: 0.3,
          pointRadius: 0,
        };
      }),
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
