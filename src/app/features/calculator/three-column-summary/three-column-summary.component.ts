import { Component, computed, input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ThreePlanComparison, PlanResult } from '../../../core/models/loan-result.model';
import { MonthsToYearsPipe } from '../../../core/pipes/months-to-years.pipe';
import { EducationalTooltipComponent } from '../../../shared/educational-tooltip.component';

@Component({
  selector: 'app-three-column-summary',
  templateUrl: './three-column-summary.component.html',
  styleUrl: './three-column-summary.component.scss',
  imports: [
    CommonModule,
    DecimalPipe,
    CardModule,
    DividerModule,
    MonthsToYearsPipe,
    EducationalTooltipComponent,
  ],
})
export class ThreeColumnSummaryComponent {
  comparison = input.required<ThreePlanComparison>();
  inflationEnabled = input<boolean>(false);

  plans = computed<PlanResult[]>(() => {
    const c = this.comparison();
    return [c.baseline, c.planA, c.planB];
  });

  planTooltip(label: string): string {
    if (label === 'baseline') return 'Kredyt bez nadpłat - dla porównania';
    if (label === 'planA')
      return 'Twoje nadpłaty z wybranym przez Ciebie skutkiem (skróć okres / zmniejsz ratę / stała kwota)';
    return 'Te same nadpłaty ale z wymuszonym skutkiem "Stała łączna kwota miesięczna" - najszybsza spłata';
  }
}
