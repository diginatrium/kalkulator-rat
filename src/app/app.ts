import { Component } from '@angular/core';
import { CalculatorPage } from './features/calculator/calculator.page';

@Component({
  selector: 'app-root',
  imports: [CalculatorPage],
  template: '<app-calculator-page />',
  styles: [],
})
export class App {}
