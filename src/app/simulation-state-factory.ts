import { SimulationState } from './simulation-engine';
import { createInitialGameState } from '@mandato/engine';

export type InitialSimulationState = SimulationState & {
  mayorName: string;
  cityName: string;
  mandateEndDate: string;
  population: number;
  debt: number;
};

/** Estado inicial único usado pela UI e pelos cenários determinísticos. */
export function createInitialSimulationState(mayorName: string, cityName: string): InitialSimulationState {
  const shared = createInitialGameState(crypto.randomUUID(), mayorName.trim(), cityName.trim());
  return {
    ...shared,
    mayorName: shared.mayorName, cityName: shared.cityName,
    currentDate: shared.currentDate, mandateEndDate: shared.mandateEndDate,
    population: shared.population, treasury: shared.treasury, debt: shared.debt, approval: shared.approval,
    indicators: shared.indicators,
    objectives: [
      { id: 'health', label: 'Elevar a saúde municipal', description: 'Leve o indicador de saúde a pelo menos 65.', type: 'INDICATOR', target: 65, current: 58, status: 'IN_PROGRESS' },
      { id: 'approval', label: 'Conquistar confiança da cidade', description: 'Alcance 60% de aprovação.', type: 'APPROVAL', target: 60, current: 52, status: 'IN_PROGRESS' },
      { id: 'treasury', label: 'Preservar o caixa', description: 'Termine o primeiro ciclo com pelo menos R$ 38 milhões.', type: 'TREASURY', target: 38000000, current: 40000000, status: 'IN_PROGRESS' },
    ],
    decisions: shared.decisions,
    effects: shared.effects,
    history: [], causalLinks: [], activeGroupEffects: {},
    news: shared.news,
  } as unknown as InitialSimulationState;
}
