import { SimulationEngine, SimulationState } from './simulation-engine';
import { createInitialSimulationState } from './simulation-state-factory';
import { decisionCost, decisionEffects } from '@mandato/engine';

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
  const state = createInitialSimulationState('Parity', 'Cidade Teste');
  const engine = new SimulationEngine();
  for (let day = 0; day < 14; day += 1) {
    for (const decision of state.decisions.filter((item) => item.status === 'PENDING')) {
      decision.status = 'RESOLVED';
      decision.chosenOptionId = decision.options[0]?.id;
      decision.resolvedDate = state.currentDate;
      const optionId = decision.options[0]?.id;
      const selectedOptionId = optionId ?? '';
      const resolvedCost = decisionCost(selectedOptionId);
      state.treasury -= resolvedCost;
      const effects = decisionEffects(selectedOptionId);
      state.effects = {
        health: effects['health'] ?? 0,
        approval: effects['approval'] ?? 0,
        infrastructure: effects['infrastructure'] ?? 0,
        transport: effects['transport'] ?? 0,
      };
      const selectedEffects = effects;
      for (const group of state.groups ?? []) {
        const groupEffect = decision.options[0]?.groupEffects?.[group.key] ?? 0;
        group.satisfaction = Math.max(0, Math.min(100, group.satisfaction + groupEffect));
      }
      const education = state.indicators.find((item) => item.key === 'education');
      const security = state.indicators.find((item) => item.key === 'security');
      if (education) education.value = Math.max(0, Math.min(100, education.value + (selectedEffects['education'] ?? 0)));
      if (security) security.value = Math.max(0, Math.min(100, security.value + (selectedEffects['security'] ?? 0)));
      state.history.unshift(`${state.currentDate}: Decisão registrada: ${decision.options[0]?.label}.`);
    }
    engine.advanceDay(state);
  }
  return projectParityState(state);
}
