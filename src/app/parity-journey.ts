import { SimulationState } from './simulation-engine';
import { createInitialGameState, MandatoEngine } from '@mandato/engine';

export type ParityProjection = {
  currentDate: string;
  treasury: number;
  population: number;
  approval: number;
  indicators: Record<string, number>;
  pendingDecisionCount: number;
  historyCount: number;
  newsCount: number;
  ledgerCount: number;
  snapshotCount: number;
};

export function projectParityState(state: SimulationState & { population?: number }): ParityProjection {
  return {
    currentDate: state.currentDate,
    treasury: state.treasury,
    population: state.population ?? 0,
    approval: Number(state.approval.toFixed(6)),
    indicators: Object.fromEntries(state.indicators.map((item) => [item.key, Number(item.value.toFixed(6))])),
    pendingDecisionCount: state.decisions.filter((item) => item.status === 'PENDING').length,
    historyCount: state.history.length,
    newsCount: state.news.length,
    ledgerCount: state.ledger?.length ?? 0,
    snapshotCount: state.snapshots?.length ?? 0,
  };
}

/** Jornada canônica: sempre resolve as decisões pendentes pela primeira alternativa e avança 14 dias. */
export function runDeterministicParityJourney(): ParityProjection {
  const state = createInitialGameState('parity-local', 'Parity', 'Cidade Teste') as unknown as SimulationState & { id: string };
  const engine = new MandatoEngine();
  for (let day = 0; day < 14; day += 1) {
    for (const decision of state.decisions.filter((item) => item.status === 'PENDING')) {
      engine.execute(state as any, { type: 'RESOLVE_DECISION', decisionId: decision.id, optionId: decision.options[0]?.id ?? '' });
    }
    engine.execute(state as any, { type: 'ADVANCE_DAY' });
  }
  return projectParityState(state);
}
