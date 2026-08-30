import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-area-navigation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="area-nav" aria-label="Áreas do governo">
      <a *ngFor="let area of areas" [href]="'#' + area.key" [class.active]="activeArea === area.key"
        [attr.aria-current]="activeArea === area.key ? 'page' : null" (click)="select($event, area.key)">
        {{ area.label }}
      </a>
    </nav>
    <label class="mobile-area-picker">
      <span>Seção atual</span>
      <select [value]="activeArea" (change)="selectValue($event)">
        <option *ngFor="let area of areas" [value]="area.key">{{ area.label }}</option>
      </select>
    </label>
  `,
})
export class AreaNavigationComponent {
  @Input() activeArea = 'resumo';
  @Output() areaSelected = new EventEmitter<string>();

  readonly areas = [
    { key: 'resumo', label: 'Resumo' }, { key: 'gabinete', label: 'Gabinete' },
    { key: 'cidade', label: 'Cidade' }, { key: 'financas', label: 'Finanças' },
    { key: 'memoria', label: 'Memória' }, { key: 'metas', label: 'Metas' },
    { key: 'avaliacao', label: 'Avaliação' }, { key: 'eleicoes', label: 'Eleições' },
    { key: 'configuracoes', label: 'Configurações' },
  ];

  select(event: MouseEvent, area: string) {
    event.preventDefault();
    this.areaSelected.emit(area);
    history.replaceState(null, '', '#' + area);
  }

  selectValue(event: Event) {
    const area = (event.target as HTMLSelectElement).value;
    this.areaSelected.emit(area);
    history.replaceState(null, '', '#' + area);
  }
}
