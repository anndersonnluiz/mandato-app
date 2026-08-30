import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-ledger-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="panel ledger" *ngIf="entries.length">
      <div class="panel-heading"><h2>Livro-caixa recente</h2>
        <label class="filter-control"><span>Categoria</span><select [value]="filter" aria-label="Filtrar lançamentos do Livro-caixa" (change)="filterChange.emit(($any($event.target)).value)">
          <option value="ALL">Todas</option><option value="INCOME">Entradas</option><option value="EXPENSE">Saídas</option>
        </select></label>
      </div>
      <div class="ledger-feed">
        <article class="ledger-entry" *ngFor="let entry of entries">
          <span class="ledger-date">{{ formatDate(entry.date) }}</span>
          <span class="ledger-kind" [class.income]="entry.kind === 'INCOME'">{{ entry.kind === 'INCOME' ? 'Entrada' : 'Saída' }}</span>
          <strong [class.negative]="entry.kind !== 'INCOME'">{{ entry.kind === 'INCOME' ? '+' : '−' }} R$ {{ entry.amount | number }}</strong>
          <span class="ledger-label">{{ entry.label }}</span>
          <span class="ledger-bar"><i [style.width.%]="bar(entry)"></i></span>
        </article>
      </div>
    </section>
  `,
})
export class LedgerListComponent {
  @Input() entries: any[] = [];
  @Input() filter = 'ALL';
  @Input() formatDate: (value: string) => string = (value) => value;
  @Input() bar: (entry: any) => number = () => 0;
  @Output() filterChange = new EventEmitter<string>();
}
