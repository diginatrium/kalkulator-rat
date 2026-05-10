import { Component, input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { ComparisonResult } from '../../../core/models/loan-result.model';
import { MonthsToYearsPipe } from '../../../core/pipes/months-to-years.pipe';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss',
  imports: [CommonModule, DecimalPipe, CardModule, DividerModule, TagModule, MonthsToYearsPipe],
})
export class SummaryComponent {
  comparison = input.required<ComparisonResult>();
}
