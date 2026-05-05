import { Component, input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { Installment } from '../../../core/models/installment.model';

@Component({
  selector: 'app-schedule-table',
  templateUrl: './schedule-table.component.html',
  styleUrl: './schedule-table.component.scss',
  imports: [CommonModule, DecimalPipe, TableModule, CardModule, TabsModule],
})
export class ScheduleTableComponent {
  baselineSchedule = input.required<Installment[]>();
  modifiedSchedule = input.required<Installment[]>();

  readonly rowsPerPage = 50;
  readonly rowsPerPageOptions = [25, 50, 100, 500];
}
