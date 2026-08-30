import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({ selector: 'app-city-indicators', standalone: true, imports: [CommonModule], template: `
  <section class="panel">
    <h2>Indicadores da cidade</h2>
    <div *ngFor="let indicator of indicators" class="indicator">
      <span>{{ indicator.label }}</span>
      <b>{{ indicator.value | number: '1.1-1' }} <em>{{ indicator.trend > 0 ? '▲' : indicator.trend < 0 ? '▼' : '—' }}</em></b>
      <div class="bar" role="progressbar" [attr.aria-label]="indicator.label" [attr.aria-valuenow]="indicator.value" aria-valuemin="0" aria-valuemax="100"><i [style.width.%]="indicator.value"></i></div>
    </div>
  </section>
` })
export class CityIndicatorsComponent {
  @Input({ required: true }) indicators: any[] = [];
}
