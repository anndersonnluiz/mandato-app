import { Injectable } from '@angular/core';

export type GovernmentArea = 'resumo' | 'gabinete' | 'cidade' | 'financas' | 'memoria' | 'metas' | 'avaliacao' | 'eleicoes' | 'configuracoes';

const AREAS: GovernmentArea[] = ['resumo', 'gabinete', 'cidade', 'financas', 'memoria', 'metas', 'avaliacao', 'eleicoes', 'configuracoes'];

@Injectable({ providedIn: 'root' })
export class AreaNavigationService {
  private current: GovernmentArea = 'resumo';

  get activeArea(): GovernmentArea { return this.current; }

  select(value: string): GovernmentArea {
    if (AREAS.includes(value as GovernmentArea)) this.current = value as GovernmentArea;
    return this.current;
  }

  fromHash(hash: string): GovernmentArea {
    return this.select(hash.replace(/^#/, ''));
  }
}
