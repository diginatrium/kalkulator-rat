import { Component, input } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-edu-tip',
  imports: [TooltipModule],
  template: `<i
    class="pi pi-question-circle edu-tip"
    [pTooltip]="tip()"
    tooltipPosition="top"
    [tooltipStyleClass]="'edu-tip-tooltip'"
    role="img"
    [attr.aria-label]="tip()"
  ></i>`,
  styles: [
    `
      :host {
        display: inline-flex;
        margin-left: 0.25rem;
        line-height: 1;
      }
      .edu-tip {
        color: var(--ink-muted);
        cursor: help;
        font-size: 0.85em;
      }
      .edu-tip:hover {
        color: var(--gold-500);
      }
    `,
  ],
})
export class EducationalTooltipComponent {
  tip = input.required<string>();
}
