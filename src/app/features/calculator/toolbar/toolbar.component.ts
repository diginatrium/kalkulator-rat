import { Component, inject, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
  imports: [ButtonModule, TooltipModule],
})
export class ToolbarComponent {
  private readonly themeService = inject(ThemeService);
  private readonly messageService = inject(MessageService);

  exportingPdf = input<boolean>(false);
  formInvalid = input<boolean>(false);
  shareUrl = input.required<string>();

  openSaveDialog = output<void>();
  exportPdf = output<void>();
  exportCsv = output<void>();

  isDark = this.themeService.isDark;

  toggleTheme(): void {
    this.themeService.toggle();
  }

  async copyShareLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.shareUrl());
      this.messageService.add({
        severity: 'success',
        summary: 'Link skopiowany',
        detail: 'Wklej go aby udostępnić scenariusz',
        life: 3000,
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Błąd',
        detail: 'Nie udało się skopiować linku',
      });
    }
  }

  print(): void {
    window.print();
  }
}
