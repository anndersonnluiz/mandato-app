import { normalizeForParity } from './parity-normalizer';

describe('normalizeForParity', () => {
  it('ignora ids gerados e campos derivados sem perder o conteúdo do jogo', () => {
    const local = {
      id: 'local-id', currentDate: '2025-01-02', treasury: 39862000,
      decisions: [{ id: 'local-decision', title: 'Hospital', status: 'RESOLVED', chosenOptionId: 'hire' }],
    };
    const online = {
      id: 'api-id', currentDate: '2025-01-02', daysRemaining: 1459, treasury: 39862000,
      decisions: [{ id: 'api-decision', title: 'Hospital', status: 'RESOLVED', chosenOptionId: 'hire' }],
    };
    expect(normalizeForParity(local)).toEqual(normalizeForParity(online));
  });

  it('preserva divergências funcionais de caixa e indicadores', () => {
    expect(normalizeForParity({ treasury: 100, indicators: [{ key: 'health', value: 50 }] }))
      .not.toEqual(normalizeForParity({ treasury: 90, indicators: [{ key: 'health', value: 50 }] }));
  });
});
