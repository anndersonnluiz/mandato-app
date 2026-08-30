import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-summary-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats">
      <article><small>APROVAÇÃO</small><strong class="stat-value">{{ game.approval | number: '1.1-1' }}%</strong></article>
      <article><small>DIAS RESTANTES</small><strong class="stat-value">{{ daysRemaining() }}</strong></article>
      <article><small>POPULAÇÃO</small><strong class="stat-value">{{ game.population | number }}</strong><em class="population-trend">{{ populationTrendLabel() }}</em></article>
      <article><small>CAIXA</small><strong class="stat-value money-value">R$ {{ game.treasury | number }}</strong></article>
      <article><small>DÍVIDA</small><strong class="stat-value money-value">R$ {{ game.debt | number }}</strong></article>
      <article class="fiscal-card" [class.fiscal-warning]="fiscalStability() < 60" [class.fiscal-critical]="fiscalStability() < 30" [attr.aria-label]="'Sustentabilidade fiscal: ' + fiscalStability() + ' por cento'">
        <small>SUSTENTABILIDADE FISCAL</small><strong class="stat-value">{{ fiscalStability() }}%</strong>
      </article>
    </div>
  `,
})
export class SummaryStatsComponent {
  @Input({ required: true }) game!: any;

  daysRemaining() {
    return Math.max(0, Math.ceil((Date.parse(`${this.game.mandateEndDate}T00:00:00Z`) - Date.parse(`${this.game.currentDate}T00:00:00Z`)) / 86400000));
  }

  fiscalStability() { return Math.round(Number(this.game.fiscalStability ?? (this.game.treasury < 0 ? 0 : 100))); }

  populationTrendLabel() {
    const trend = Number(this.game.populationTrend ?? 0);
    return trend === 0 ? 'estável' : `${trend > 0 ? 'crescimento de' : 'queda de'} ${Math.abs(trend)} habitantes`;
  }
}
