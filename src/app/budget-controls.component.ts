import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-budget-controls',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="panel budget-controls">
      <h2>Ajuste de orçamento</h2>
      <p>Altere a verba diária e observe o impacto no saldo projetado.</p>
      <div *ngFor="let line of budget" class="budget-line">
        <span class="budget-label">{{ line.label }} <small>{{ impact(line.key) }}</small><small class="budget-preview">− {{ preview(line.key, -500) }} · + {{ preview(line.key, 500) }}</small></span>
        <button [attr.aria-label]="'Reduzir verba de ' + line.label" (click)="adjust.emit({ key: line.key, amount: -500 })">−</button>
        <b>R$ {{ line.dailyCost | number }}</b>
        <button [attr.aria-label]="'Aumentar verba de ' + line.label" (click)="adjust.emit({ key: line.key, amount: 500 })">+</button>
      </div>
    </section>
  `,
})
export class BudgetControlsComponent {
  @Input() budget: any[] = [];
  @Input() impact: (key: string) => string = () => '';
  @Input() preview: (key: string, amount: number) => string = () => '';
  @Output() adjust = new EventEmitter<{ key: string; amount: number }>();
}
