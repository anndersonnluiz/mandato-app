import { createInitialSimulationState } from './simulation-state-factory';

describe('createInitialSimulationState', () => {
  it('produces the deterministic first-day state used by the game', () => {
    const state = createInitialSimulationState(' Ana ', ' Aurora ');
    expect(state.mayorName).toBe('Ana');
    expect(state.cityName).toBe('Aurora');
    expect(state.currentDate).toBe('2025-01-01');
    expect(state.population).toBe(180000);
    expect(state.treasury).toBe(40000000);
    expect(state.indicators.map((item) => item.key)).toEqual([
      'health', 'education', 'infrastructure', 'transport', 'security',
    ]);
    expect(state.decisions[0].id).toBe('hospital-overload');
    expect(state.decisions[0].status).toBe('PENDING');
    expect((state.objectives ?? []).length).toBe(3);
  });
});
