import { createInitialGameState } from '@mandato/engine';
import { LocalEngineSession } from './local-engine-session';

describe('LocalEngineSession', () => {
  it('executa comandos pelo motor compartilhado sem persistência', () => {
    const session = new LocalEngineSession();
    const state = createInitialGameState('contract-test', 'Anderson', 'Aurora');

    const result = session.execute(state as any, {
      type: 'ADOPT_FOCUS',
      label: 'Recuperar serviços essenciais',
      metric: 'service',
    });

    expect(result.activeFocus).toBe('Recuperar serviços essenciais');
    expect(result.focusDaysRemaining).toBe(7);
  });
});
