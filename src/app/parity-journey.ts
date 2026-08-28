import { SimulationEngine, SimulationState } from './simulation-engine';
import { createInitialSimulationState } from './simulation-state-factory';

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
      const cost: Record<string, number> = {
        hire: 120000, drainage: 350000, bus: 180000, meals: 90000,
        lighting: 140000, 'emergency-health': 250000, 'expand-health': 80000,
        'negotiate-bus': 220000, 'emergency-meals': 160000,
        'commerce-incentive': 450000, 'tax-modernization': 600000,
        'reorganize-secretariat': 250000, 'authorize-mobility-project': 280000,
        'support-city-pulse': 80000, 'extend-city-pulse': 100000,
        'repair-weather-disruption': 120000, 'authorize-social-recovery': 240000,
      };
      const selectedOptionId = optionId ?? '';
      const resolvedCost = selectedOptionId.startsWith('mobilize-weather-disruption-')
        ? 60000
        : selectedOptionId.startsWith('reroute-transit-disruption-')
          ? 45000
          : selectedOptionId === 'restore-transit-service'
            ? 90000
            : selectedOptionId.startsWith('support-city-pulse-')
              ? 80000
              : selectedOptionId.startsWith('expand-project-')
                ? 120000
                : cost[selectedOptionId] ?? 0;
      state.treasury -= resolvedCost;
      const effects: Record<string, Partial<Record<string, number>>> = {
        hire: { health: 0.25, approval: 0.05 }, deny: { health: -0.15, approval: -0.08 },
        bus: { transport: 0.3, approval: 0.03 }, meals: { education: 0.25, approval: 0.02 }, lighting: { security: 0.2, approval: 0.03 },
        'emergency-health': { health: 0.35, approval: 0.04 }, 'negotiate-bus': { transport: 0.25, approval: 0.03 },
        'manage-crisis': { health: -0.25, approval: -0.06 }, 'accept-bus': { transport: -0.35, approval: -0.06 },
        'extend-city-pulse': { approval: 0.04 }, 'close-city-pulse': { approval: -0.05 },
        'repair-weather-disruption': { infrastructure: 0.3, approval: 0.02 },
        'accept-weather-delay': { infrastructure: -0.15, approval: -0.05 },
        'review-meals': { education: -0.15, approval: -0.02 }, 'keep-review': { education: -0.2, approval: -0.03 },
      };
      state.effects = {
        health: effects[optionId ?? '']?.['health'] ?? 0,
        approval: effects[optionId ?? '']?.['approval'] ?? 0,
        infrastructure: effects[optionId ?? '']?.['infrastructure'] ?? 0,
        transport: effects[optionId ?? '']?.['transport'] ?? 0,
      };
      const selectedEffects = effects[optionId ?? ''] ?? {};
      if (selectedOptionId.startsWith('support-city-pulse-')) selectedEffects['approval'] = 0.03;
      if (selectedOptionId.startsWith('preserve-city-pulse-')) selectedEffects['approval'] = -0.04;
      if (selectedOptionId.startsWith('wait-weather-disruption-')) selectedEffects['infrastructure'] = -0.25;
      if (selectedOptionId.startsWith('monitor-transit-disruption-')) selectedEffects['transport'] = -0.2;
      if (selectedOptionId.startsWith('expand-project-')) { selectedEffects['infrastructure'] = 0.3; selectedEffects['approval'] = 0.05; }
      if (selectedOptionId.startsWith('consolidate-project-')) selectedEffects['approval'] = 0.03;
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
