import { Component, computed, input } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { LoanResult } from '../../../core/models/loan-result.model';

@Component({
  selector: 'app-structure-chart',
  templateUrl: './structure-chart.component.html',
  styleUrl: './structure-chart.component.scss',
  imports: [ChartModule, CardModule],
})
export class StructureChartComponent {
  result = input.required<LoanResult>();

  chartData = computed(() => {
    const schedule = this.result().schedule;
    const step = Math.max(1, Math.ceil(schedule.length / 60));

    const labels: string[] = [];
    const capitalData: number[] = [];
    const interestData: number[] = [];

    for (let i = 0; i < schedule.length; i += step) {
      const inst = schedule[i];
      labels.push(`${inst.number}`);
      capitalData.push(inst.capitalPart);
      interestData.push(inst.interestPart);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Kapitał',
          data: capitalData,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          stack: 'rata',
        },
        {
          label: 'Odsetki',
          data: interestData,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          stack: 'rata',
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
      x: { stacked: true, title: { display: true, text: 'Nr raty' } },
      y: {
        stacked: true,
        title: { display: true, text: 'Kwota (zł)' },
        ticks: {
          callback: (v: number) => v.toLocaleString('pl-PL', { maximumFractionDigits: 0 }) + ' zł',
        },
      },
    },
  };
}
