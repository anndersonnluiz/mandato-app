import { projectParityState, runDeterministicParityJourney } from './parity-journey';
import { createInitialSimulationState } from './simulation-state-factory';

describe('parity journey', () => {
  it('produces a stable projection for the canonical 14-day journey', () => {
    const first = runDeterministicParityJourney();
    const second = runDeterministicParityJourney();
    expect(first).toEqual(second);
    expect(first.currentDate).toBe('2025-01-15');
    expect(first.indicators).toEqual(jasmine.objectContaining({ health: jasmine.any(Number), transport: jasmine.any(Number) }));
    expect(first.snapshotCount).toBe(14);
    expect(first.historyCount).toBeGreaterThan(0);
    expect(first.newsCount).toBeGreaterThan(0);
  });

  it('keeps the projection focused on behavioral fields and excludes generated identity', () => {
    const state = createInitialSimulationState('Parity', 'Cidade Teste');
    state.decisions[0].id = 'generated-a';
    const projection = projectParityState(state);
    state.decisions[0].id = 'generated-b';
    expect(projectParityState(state)).toEqual(projection);
  });
});
