import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-financial-strip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="finance-strip" aria-label="Resumo financeiro projetado">
      <span>
        <small>RECEITA MENSAL PREVISTA</small>
        <b>R$ {{ revenue | number }}</b>
      </span>
      <span>
        <small>DESPESA OPERACIONAL MENSAL</small>
        <b>R$ {{ expenses | number }}</b>
      </span>
      <span>
        <small>SALDO PROJETADO</small>
        <b>R$ {{ balance | number }}</b>
        <small>{{ status }}</small>
      </span>
    </section>
  `,
})
export class FinancialStripComponent {
  @Input() revenue = 0;
  @Input() expenses = 0;
  @Input() balance = 0;
  @Input() status = '';
}
