import { ElectionEngine } from './election-engine';

describe('ElectionEngine', () => {
  const snapshot = { approval: 60, socialSatisfaction: 62, completedProjects: 4, delayedProjects: 1, fiscalStability: 70 };

  it('inicia com oposição e apoio derivado do mandato', () => {
    const state = new ElectionEngine().start(snapshot, 'Ana');
    expect(state.phase).toBe('PRE_CAMPAIGN');
    expect(state.candidates.length).toBe(3);
    expect(state.candidates[0].support).toBeGreaterThan(state.candidates[1].support);
    expect(state.debateQuestion).toContain('atrasos');
  });

  it('avança três semanas e abre o debate', () => {
    const engine = new ElectionEngine();
    let state = engine.beginCampaign(engine.start(snapshot, 'Ana'));
    state = engine.campaign(state, 'VISIT_PROJECT', snapshot);
    state = engine.campaign(state, 'MEET_GROUPS', snapshot);
    state = engine.campaign(state, 'CRISIS_COMMUNICATION', snapshot);
    expect(state.phase).toBe('DEBATE');
    expect(state.week).toBe(3);
    expect(state.pollHistory.map((poll) => poll.period)).toEqual(['Semana 1', 'Semana 2', 'Semana 3']);
  });

  it('redistribui o movimento de apoio entre governo e oposição', () => {
    const engine = new ElectionEngine();
    let state = engine.beginCampaign(engine.start(snapshot, 'Ana'));
    const before = state.candidates.filter((candidate) => !candidate.isIncumbent).map((candidate) => candidate.support);
    state = engine.campaign(state, 'MEET_GROUPS', snapshot);
    const after = state.candidates.filter((candidate) => !candidate.isIncumbent).map((candidate) => candidate.support);
    expect(after[0]).toBeLessThan(before[0]);
    expect(after[1]).toBeLessThan(before[1]);
  });

  it('consome verba de campanha e recusa ação sem saldo', () => {
    const engine = new ElectionEngine();
    let state = engine.beginCampaign(engine.start(snapshot, 'Ana'));
    state = engine.campaign(state, 'NEW_PROMISE', snapshot);
    expect(state.campaignFunds).toBe(70);
    state = { ...state, campaignFunds: 0 };
    expect(engine.campaign(state, 'MEET_GROUPS', snapshot)).toEqual(state);
  });

  it('registra promessas na agenda eleitoral sem permitir excesso de compromissos', () => {
    const engine = new ElectionEngine();
    let state = engine.beginCampaign(engine.start(snapshot, 'Ana'));
    state = engine.campaign(state, 'NEW_PROMISE', snapshot);
    expect(state.incumbentAgenda).toContain('Compromisso de saúde');
    expect(state.promises[0]).toEqual(jasmine.objectContaining({ area: 'saúde', estimatedCost: 12, deadlineWeeks: 8, groupEffects: { residents: 1.2, families: 1 } }));
  });

  it('aplica pressão de custo e credibilidade das promessas no resultado', () => {
    const engine = new ElectionEngine();
    let state = engine.beginCampaign(engine.start(snapshot, 'Ana'));
    state = engine.campaign(state, 'NEW_PROMISE', snapshot);
    state = engine.campaign(state, 'NEW_PROMISE', snapshot);
    state = engine.campaign(state, 'NEW_PROMISE', snapshot);
    const before = state.candidates.find((candidate) => candidate.isIncumbent)!.support;
    const result = engine.result(engine.debate(state, 'ACCOUNTABILITY', snapshot));
    expect(result.candidates.find((candidate) => candidate.isIncumbent)!.support).toBeLessThan(before + 3);
  });

  it('produz pesquisa e resultado determinísticos após o debate', () => {
    const engine = new ElectionEngine();
    let state = engine.beginCampaign(engine.start(snapshot, 'Ana'));
    for (const action of ['VISIT_PROJECT', 'MEET_GROUPS', 'CRISIS_COMMUNICATION'] as const) state = engine.campaign(state, action, snapshot);
    const result = engine.result(engine.debate(state, 'ACCOUNTABILITY', snapshot));
    expect(result.winnerId).toBeDefined();
    expect(result.explanation).toContain('venceu');
    expect(result.pollHistory.map((poll) => poll.period)).toEqual(['Semana 1', 'Semana 2', 'Semana 3', 'Debate', 'Resultado']);
    expect(engine.result(result)).toEqual(result);
  });

  it('expõe pesquisa com indecisos sem alterar o estado', () => {
    const engine = new ElectionEngine();
    const state = engine.start(snapshot, 'Ana');
    const before = JSON.stringify(state);
    const poll = engine.poll(state);
    expect(poll.candidates.length).toBe(3);
    expect(poll.undecided).toBeGreaterThanOrEqual(0);
    expect(JSON.stringify(state)).toBe(before);
  });
});
