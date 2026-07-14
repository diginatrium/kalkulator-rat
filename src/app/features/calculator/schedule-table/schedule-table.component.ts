import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { Installment } from '../../../core/models/installment.model';
import { ThreePlanComparison } from '../../../core/models/loan-result.model';

@Component({
  selector: 'app-schedule-table',
  templateUrl: './schedule-table.component.html',
  styleUrl: './schedule-table.component.scss',
  imports: [CommonModule, DecimalPipe, DatePipe, TableModule, CardModule, TabsModule],
})
export class ScheduleTableComponent {
  comparison = input.required<ThreePlanComparison>();
  inflationEnabled = input<boolean>(false);

  readonly rowsPerPage = 50;
  readonly rowsPerPageOptions = [25, 50, 100, 500];

  /**
   * True while the browser is rendering for print. Used to disable pagination
   * and the fixed scroll viewport so the entire schedule renders into the PDF.
   */
  isPrinting = signal(false);

  baselineSchedule = (): Installment[] => this.comparison().baseline.result.schedule;
  planASchedule = (): Installment[] => this.comparison().planA.result.schedule;
  planBSchedule = (): Installment[] => this.comparison().planB.result.schedule;

  constructor() {
    if (typeof window === 'undefined') return;
    const destroyRef = inject(DestroyRef);
    const onBefore = (): void => this.isPrinting.set(true);
    const onAfter = (): void => this.isPrinting.set(false);
    window.addEventListener('beforeprint', onBefore);
    window.addEventListener('afterprint', onAfter);
    destroyRef.onDestroy(() => {
      window.removeEventListener('beforeprint', onBefore);
      window.removeEventListener('afterprint', onAfter);
    });
  }
}
