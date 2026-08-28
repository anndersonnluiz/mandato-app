import { SimulationEngine, SimulationState } from './simulation-engine';

describe('SimulationEngine', () => {
  it('abre a contingência de infraestrutura no segundo ciclo', () => {
    const state = {
      currentDate: '2025-01-21', evaluationDate: '2025-12-31', treasury: 40000000,
      population: 180000, approval: 52,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 54, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
        { key: 'security', label: 'Segurança urbana', value: 53, trend: 0 },
      ], effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 }, decisions: [],
      history: [], news: [], projects: [], budget: [],
    } as SimulationState;
    new SimulationEngine().advanceDay(state);
    expect(state.currentDate).toBe('2025-01-22');
    expect(state.decisions.some((decision) => decision.id === 'infrastructure-contingency' && decision.urgency === 'ALTA')).toBeTrue();
    expect(state.news[0]).toContain('plano preventivo');
    const decision = state.decisions.find((item) => item.id === 'infrastructure-contingency')!;
    expect(decision.options.find((option) => option.id === 'prevent-infrastructure')?.groupEffects?.['residents']).toBe(1.2);
  });
  it('sustenta uma jornada jogável completa de quatorze dias', () => {
    const state: SimulationState = {
      currentDate: '2025-01-01',
      evaluationDate: '2025-01-14',
      treasury: 40000000,
      population: 180000,
      approval: 52,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
        { key: 'security', label: 'Segurança urbana', value: 53, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [
        {
          id: 'hospital-overload',
          title: 'Hospital',
          context: 'Contexto',
          status: 'PENDING',
          options: [
            { id: 'hire', label: 'Autorizar', description: '' },
            { id: 'deny', label: 'Negar', description: '' },
          ],
        },
      ],
      history: [],
      news: [],
      objectives: [
        {
          id: 'health',
          label: 'Saúde',
          description: 'Meta',
          type: 'INDICATOR',
          target: 60,
          current: 58,
          status: 'IN_PROGRESS',
        },
      ],
    };
    const engine = new SimulationEngine();
    for (let day = 0; day < 13; day++) {
      const pending = state.decisions.find(
        (decision) => decision.status === 'PENDING',
      );
      if (pending) {
        pending.status = 'RESOLVED';
        pending.chosenOptionId = pending.options[0]?.id;
        pending.resolvedDate = state.currentDate;
      }
      engine.advanceDay(state);
    }
    expect(state.currentDate).toBe('2025-01-14');
    expect(state.evaluation).toBeDefined();
    expect(state.snapshots?.length).toBe(13);
    expect(state.treasury).toBeGreaterThan(0);
    expect(state.decisions.length).toBeGreaterThan(3);
    expect(state.news.length).toBeGreaterThan(10);
  });

  it('consome a recuperação gradual e registra sua conclusão', () => {
    const state = {
      currentDate: '2025-03-01', treasury: 1000000, population: 1000, approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 50, trend: 0 },
        { key: 'education', label: 'Educação', value: 50, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 50, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 50, trend: 0 },
        { key: 'security', label: 'Segurança', value: 50, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 }, decisions: [], history: [], news: [],
      secretaries: [{ key: 'health', label: 'Saúde', efficiency: 70, pressure: 50 }],
      secretaryRecoveryDays: { health: 1 }, budget: [], projects: [],
    } as SimulationState;
    new SimulationEngine().advanceDay(state);
    expect(state.secretaryRecoveryDays?.['health']).toBe(0);
    expect(state.secretaries?.[0].pressure).toBeCloseTo(49.4);
    expect(state.news.some((item) => item.includes('concluiu a recuperação operacional'))).toBeTrue();
  });
  it('applies daily cost and creates the drainage decision on day four', () => {
    const state: SimulationState = {
      currentDate: '2025-01-03',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [],
      history: [],
      news: [],
    };
    const result = new SimulationEngine().advanceDay(state);
    expect(result.state.currentDate).toBe('2025-01-04');
    expect(result.state.treasury).toBe(982000);
    expect(result.state.decisions[0].id).toBe('hospital-access');
  });

  it('credits monthly revenue on the first day of a month', () => {
    const state: SimulationState = {
      currentDate: '2025-01-31',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [],
      history: [],
      news: [],
    };
    const result = new SimulationEngine().advanceDay(state);
    expect(result.state.currentDate).toBe('2025-02-01');
    expect(result.state.treasury).toBe(8899850);
    expect(
      result.state.news.some((item) => item.includes('Fechamento mensal')),
    ).toBeTrue();
    expect(result.state.revenueSources).toBeDefined();
    expect(
      Object.values(result.state.revenueSources ?? {}).reduce(
        (sum, value) => sum + value,
        0,
      ),
    ).toBe(
      result.state.ledger!.find((entry) => entry.kind === 'INCOME')!.amount,
    );
  });

  it('unlocks the economic program at the start of the extended cycle', () => {
    const state: SimulationState = {
      currentDate: '2025-01-14',
      treasury: 40000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [],
      history: [],
      news: [],
    };
    const result = new SimulationEngine().advanceDay(state).state;
    const decision = result.decisions.find(
      (item) => item.id === 'economic-program',
    );
    expect(decision?.status).toBe('PENDING');
    expect(decision?.options.map((item) => item.id)).toEqual([
      'commerce-incentive',
      'tax-modernization',
      'defer-economic',
    ]);
  });

  it('calculates administrative capacity from secretary pressure and efficiency', () => {
    const state: SimulationState = {
      currentDate: '2025-01-01',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 50, trend: 0 },
        { key: 'education', label: 'Educação', value: 50, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 50, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 50, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [],
      history: [],
      news: [],
      secretaries: [
        { key: 'health', label: 'Saúde', efficiency: 80, pressure: 20 },
      ],
    };
    const result = new SimulationEngine().advanceDay(state).state;
    expect(result.administrativeCapacity).toBe(75);
    expect(result.administrativeCapacity).toBeGreaterThanOrEqual(0);
    expect(result.administrativeCapacity).toBeLessThanOrEqual(100);
  });

  it('opens debt renegotiation when the extended journey reaches February', () => {
    const state: SimulationState = {
      currentDate: '2025-01-31',
      treasury: 40000000,
      debt: 120000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [],
      history: [],
      news: [],
    };
    new SimulationEngine().advanceDay(state);
    expect(
      state.decisions.find((item) => item.id === 'debt-renegotiation'),
    ).toEqual(jasmine.objectContaining({ status: 'PENDING' }));
  });

  it('advances public projects according to secretary efficiency', () => {
    const state: SimulationState = {
      currentDate: '2025-01-10',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [],
      history: [],
      news: [],
      projects: [
        {
          id: 'p1',
          name: 'Drenagem',
          area: 'Infraestrutura',
          totalCost: 100,
          daysTotal: 5,
          daysCompleted: 0,
          status: 'IN_PROGRESS',
        },
      ],
      secretaries: [
        {
          key: 'infrastructure',
          label: 'Infraestrutura',
          efficiency: 70,
          pressure: 50,
        },
      ],
    };
    const result = new SimulationEngine().advanceDay(state);
    expect(result.state.projects![0].daysCompleted).toBe(1);
    expect(result.state.secretaries![0].pressure).toBe(51.4);
  });

  it('derives approval from population groups after a daily simulation', () => {
    const state: SimulationState = {
      currentDate: '2025-01-01',
      treasury: 1000000,
      approval: 99,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: {
        health: 0.25,
        approval: 0.05,
        infrastructure: 0,
        transport: 0,
      },
      decisions: [],
      history: [],
      news: [],
      groups: [
        {
          key: 'residents',
          label: 'Moradores',
          satisfaction: 50,
          concern: 'serviços',
        },
        {
          key: 'business',
          label: 'Comerciantes',
          satisfaction: 54,
          concern: 'mobilidade',
        },
      ],
    };
    const result = new SimulationEngine().advanceDay(state);
    expect(result.state.approval).toBeCloseTo(52.08);
    expect(result.state.groups![0].satisfaction).toBeCloseTo(50.03);
  });

  it('unlocks the first-cycle events progressively through day ten', () => {
    const state: SimulationState = {
      currentDate: '2025-01-01',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [],
      history: [],
      news: [],
    };
    const engine = new SimulationEngine();
    for (let day = 0; day < 9; day++) engine.advanceDay(state);
    expect(state.currentDate).toBe('2025-01-10');
    expect(state.decisions.map((decision) => decision.id)).toEqual([
      'hospital-access',
      'fiscal-containment',
      'school-meals',
      'bus-line',
      'street-lighting',
    ]);
  });

  it('considera a dívida explicitamente na sustentabilidade fiscal', () => {
    const base = {
      currentDate: '2025-01-01',
      treasury: 40000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [],
      history: [],
      news: [],
    } satisfies Omit<SimulationState, 'debt'>;
    const lowDebt: SimulationState = { ...base, debt: 10000000 };
    const highDebt: SimulationState = { ...base, debt: 300000000 };
    new SimulationEngine().advanceDay(lowDebt);
    new SimulationEngine().advanceDay(highDebt);
    expect(highDebt.fiscalStability).toBeLessThan(lowDebt.fiscalStability!);
  });

  it('closes the first cycle with a scored evaluation on day fourteen', () => {
    const state: SimulationState = {
      currentDate: '2025-01-13',
      treasury: 1000000,
      approval: 60,
      indicators: [
        { key: 'health', label: 'Saúde', value: 65, trend: 0 },
        { key: 'education', label: 'Educação', value: 60, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [],
      history: [],
      news: [],
      objectives: [
        {
          id: 'health',
          label: 'Saúde',
          description: 'Meta',
          type: 'INDICATOR',
          target: 65,
          current: 65,
          status: 'COMPLETED',
        },
      ],
    };
    const result = new SimulationEngine().advanceDay(state);
    expect(result.state.currentDate).toBe('2025-01-14');
    expect(result.state.evaluation?.completedObjectives).toBe(1);
    expect(result.state.evaluation?.score).toBe(81);
    expect(result.state.evaluation?.recommendedIndicatorKey).toBe('infrastructure');
    expect(result.state.evaluation?.recommendedIndicatorLabel).toBe('Infraestrutura');
    expect(result.state.legacy?.[0]).toContain('Prioridade deixada para o próximo ciclo: Infraestrutura');
  });

  it('creates a recovery decision for a delayed project', () => {
    const state = { currentDate: '2025-01-20', treasury: 1000000, approval: 50,
      indicators: [], effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [], history: [], news: [], projects: [{ id: 'obra-teste', name: 'Obra teste', area: 'Infraestrutura', totalCost: 100, daysTotal: 5, daysCompleted: 1, status: 'IN_PROGRESS', risk: 'DELAYED' as const }] } as any;
    (new SimulationEngine() as any).createDelayedProjectDecisions(state);
    expect(state.decisions[0]).toEqual(jasmine.objectContaining({ id: 'project-recovery-obra-teste', category: 'ADMINISTRATIVA' }));
  });

  it('creates a legacy decision after a project is completed', () => {
    const state = { currentDate: '2025-01-20', treasury: 1000000, approval: 50,
      indicators: [], effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [], history: [], news: [], projects: [{ id: 'obra-entregue', name: 'Obra entregue', area: 'Infraestrutura', totalCost: 100, daysTotal: 5, daysCompleted: 5, status: 'COMPLETED' as const, risk: 'NORMAL' as const }] } as any;
    (new SimulationEngine() as any).createCompletedProjectDecisions(state);
    expect(state.decisions[0].id).toBe('project-legacy-obra-entregue');
  });

  it('unlocks a hospital crisis only after the initial denial', () => {
    const state: SimulationState = {
      currentDate: '2025-01-07',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [
        {
          id: 'hospital-overload',
          title: 'Hospital',
          context: 'contexto',
          status: 'RESOLVED',
          chosenOptionId: 'deny',
          options: [],
        },
      ],
      history: [],
      news: [],
    };
    const result = new SimulationEngine().advanceDay(state);
    expect(
      result.state.decisions.some(
        (decision) => decision.id === 'hospital-crisis',
      ),
    ).toBeTrue();
  });

  it('creates a transport consequence from the chosen bus policy', () => {
    const state: SimulationState = {
      currentDate: '2025-01-10',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [
        {
          id: 'bus-line',
          title: 'Ônibus',
          context: 'contexto',
          status: 'RESOLVED',
          chosenOptionId: 'bus',
          options: [],
        },
      ],
      history: [],
      news: [],
    };
    const result = new SimulationEngine().advanceDay(state);
    expect(
      result.state.decisions.some(
        (decision) => decision.id === 'transport-stable',
      ),
    ).toBeTrue();
  });

  it('sustains a second 30-day cycle with periodic decisions and bounded state', () => {
    const state: SimulationState = {
      currentDate: '2025-01-14',
      treasury: 40000000,
      initialTreasury: 40000000,
      approval: 52,
      indicators: [
        { key: 'health', label: 'Saúde', value: 60, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
        { key: 'security', label: 'Segurança urbana', value: 53, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [],
      history: [],
      news: [],
      evaluationDate: '2025-02-13',
      groups: [
        {
          key: 'residents',
          label: 'Moradores',
          satisfaction: 52,
          concern: 'serviços',
          populationWeight: 0.4,
        },
        {
          key: 'workers',
          label: 'Servidores públicos',
          satisfaction: 49,
          concern: 'trabalho',
          populationWeight: 0.2,
        },
        {
          key: 'business',
          label: 'Comerciantes',
          satisfaction: 54,
          concern: 'mobilidade',
          populationWeight: 0.15,
        },
        {
          key: 'families',
          label: 'Famílias',
          satisfaction: 53,
          concern: 'saúde',
          populationWeight: 0.25,
        },
      ],
      secretaries: [
        'health',
        'education',
        'infrastructure',
        'transport',
        'security',
      ].map((key) => ({ key, label: key, efficiency: 70, pressure: 50 })),
      budget: [
        { key: 'health', label: 'Saúde', dailyCost: 6000 },
        { key: 'education', label: 'Educação', dailyCost: 5000 },
        { key: 'infrastructure', label: 'Infraestrutura', dailyCost: 3000 },
        { key: 'transport', label: 'Transporte', dailyCost: 2500 },
        { key: 'security', label: 'Segurança', dailyCost: 1500 },
      ],
      objectives: [
        {
          id: 'cycle',
          label: 'Meta',
          description: 'Meta',
          type: 'APPROVAL',
          target: 99,
          current: 52,
          status: 'IN_PROGRESS',
        },
      ],
    };
    const engine = new SimulationEngine();
    for (let day = 0; day < 30; day++) engine.advanceDay(state);
    expect(state.currentDate).toBe('2025-02-13');
    expect(state.evaluation).toBeDefined();
    expect(
      state.decisions.some(
        (decision) => decision.id === 'operational-review-2025-01-20',
      ),
    ).toBeTrue();
    expect(
      state.decisions.some(
        (decision) => decision.id === 'strategic-agenda-2025-01-15',
      ),
    ).toBeTrue();
    expect(state.snapshots?.length).toBeGreaterThan(20);
    expect(
      state.indicators.every(
        (indicator) =>
          Number.isFinite(indicator.value) &&
          indicator.value >= 0 &&
          indicator.value <= 100,
      ),
    ).toBeTrue();
    expect(
      state.groups?.every(
        (group) =>
          Number.isFinite(group.satisfaction) &&
          group.satisfaction >= 0 &&
          group.satisfaction <= 100,
      ),
    ).toBeTrue();
    expect(
      state.secretaries?.every(
        (secretary) =>
          Number.isFinite(secretary.efficiency) &&
          Number.isFinite(secretary.pressure),
      ),
    ).toBeTrue();
  });

  it('applies the strategic investment only once on the following day', () => {
    const state: SimulationState = {
      currentDate: '2025-01-15',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
        { key: 'security', label: 'Segurança', value: 53, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [
        {
          id: 'strategic-agenda-2025-01-15',
          title: 'Agenda',
          context: 'Contexto',
          status: 'RESOLVED',
          chosenOptionId: 'invest-infrastructure',
          options: [],
        },
      ],
      history: [],
      news: [],
      secretaries: [
        {
          key: 'infrastructure',
          label: 'Infraestrutura',
          efficiency: 70,
          pressure: 50,
        },
      ],
    };
    const engine = new SimulationEngine();
    engine.advanceDay(state);
    expect(state.treasury).toBe(682000);
    expect(state.indicators[2].value).toBeCloseTo(56.2);
    expect(state.decisions[0].applied).toBeTrue();
    engine.advanceDay(state);
    expect(state.treasury).toBe(664000);
    expect(state.indicators[2].value).toBeCloseTo(56.2);
  });

  it('raises a fiscal alert when daily operation pushes the treasury below zero', () => {
    const state: SimulationState = {
      currentDate: '2025-01-01',
      treasury: 1000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [],
      history: [],
      news: [],
      dailyOperatingCost: 18000,
    };
    const result = new SimulationEngine().advanceDay(state);
    expect(result.state.treasury).toBe(-17000);
    expect(result.state.fiscalAlert).toContain('caixa está negativo');
  });

  it('makes a budget cut increase pressure in the affected secretary', () => {
    const state: SimulationState = {
      currentDate: '2025-01-01',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [],
      history: [],
      news: [],
      budget: [{ key: 'health', label: 'Saúde', dailyCost: 3000 }],
      secretaries: [
        { key: 'health', label: 'Saúde', efficiency: 72, pressure: 50 },
      ],
    };
    const result = new SimulationEngine().advanceDay(state);
    expect(result.state.secretaries![0].pressure).toBeCloseTo(50.15);
    expect(result.state.secretaries![0].efficiency).toBeCloseTo(71.925);
  });

  it('marks a project delayed when its secretary has low efficiency', () => {
    const state: SimulationState = {
      currentDate: '2025-01-01',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [],
      history: [],
      news: [],
      projects: [
        {
          id: 'p1',
          name: 'Obra lenta',
          area: 'Infraestrutura',
          totalCost: 1,
          daysTotal: 5,
          daysCompleted: 0,
          status: 'IN_PROGRESS',
        },
      ],
      secretaries: [
        {
          key: 'infrastructure',
          label: 'Infraestrutura',
          efficiency: 50,
          pressure: 60,
        },
      ],
    };
    const result = new SimulationEngine().advanceDay(state);
    expect(result.state.projects![0].risk).toBe('DELAYED');
    expect(result.state.administrativeAlerts?.[0]).toContain('Obra lenta');
  });

  it('charges recurring project execution costs and delay surcharge', () => {
    const state: SimulationState = {
      currentDate: '2025-01-01',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [],
      history: [],
      news: [],
      projects: [
        {
          id: 'p1',
          name: 'Obra cara',
          area: 'Infraestrutura',
          totalCost: 100,
          dailyExecutionCost: 10000,
          daysTotal: 5,
          daysCompleted: 0,
          status: 'IN_PROGRESS',
        },
      ],
      secretaries: [
        {
          key: 'infrastructure',
          label: 'Infraestrutura',
          efficiency: 50,
          pressure: 60,
        },
      ],
    };
    const result = new SimulationEngine().advanceDay(state);
    expect(result.state.treasury).toBe(969500);
    expect(
      result.state.ledger?.find((entry) => entry.category === 'PROJECT')
        ?.amount,
    ).toBe(12500);
  });

  it('charges maintenance after a project is completed', () => {
    const state: SimulationState = {
      currentDate: '2025-01-01',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [],
      history: [],
      news: [],
      projects: [
        {
          id: 'p1',
          name: 'Praça entregue',
          area: 'Infraestrutura',
          totalCost: 100,
          maintenanceCost: 4000,
          daysTotal: 1,
          daysCompleted: 1,
          status: 'COMPLETED',
        },
      ],
    };
    const result = new SimulationEngine().advanceDay(state);
    expect(result.state.treasury).toBe(978000);
    expect(
      result.state.ledger?.find((entry) => entry.label.includes('Manutenção'))
        ?.amount,
    ).toBe(4000);
    expect(
      result.state.decisions.some(
        (decision) => decision.id === 'maintenance-p1',
      ),
    ).toBeTrue();
    const maintenanceDecision = result.state.decisions.find(
      (decision) => decision.id === 'maintenance-p1',
    );
    expect(maintenanceDecision?.options.map((option) => option.id)).toContain(
      'reduce-maintenance-p1',
    );
  });

  it('applies recurring public benefits from a completed project', () => {
    const state: SimulationState = {
      currentDate: '2025-01-01',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [],
      history: [],
      news: [],
      groups: [
        {
          key: 'residents',
          label: 'Moradores',
          satisfaction: 50,
          concern: 'serviços',
        },
      ],
      projects: [
        {
          id: 'p1',
          name: 'Praça entregue',
          area: 'Infraestrutura',
          totalCost: 100,
          daysTotal: 1,
          daysCompleted: 1,
          status: 'COMPLETED',
          dailyIndicatorEffects: { infrastructure: 0.1 },
          dailyGroupEffects: { residents: 0.5 },
        },
      ],
    };
    const result = new SimulationEngine().advanceDay(state);
    expect(result.state.indicators[2].value).toBeCloseTo(55.1);
    expect(result.state.groups![0].satisfaction).toBeCloseTo(50.5);
  });

  it('does not charge and deteriorates a project with deferred maintenance', () => {
    const state: SimulationState = {
      currentDate: '2025-01-01',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [],
      history: [],
      news: [],
      groups: [
        {
          key: 'residents',
          label: 'Moradores',
          satisfaction: 50,
          concern: 'serviços',
        },
      ],
      projects: [
        {
          id: 'p1',
          name: 'Praça entregue',
          area: 'Infraestrutura',
          totalCost: 100,
          maintenanceCost: 4000,
          daysTotal: 1,
          daysCompleted: 1,
          status: 'COMPLETED',
          maintenanceMode: 'ADIADA',
          dailyIndicatorEffects: { infrastructure: 0.1 },
          dailyGroupEffects: { residents: 0.5 },
        },
      ],
    };
    const result = new SimulationEngine().advanceDay(state);
    expect(result.state.treasury).toBe(982000);
    expect(result.state.indicators[2].value).toBeCloseTo(54.98);
    expect(result.state.groups![0].satisfaction).toBeCloseTo(49.97);
    expect(
      result.state.news.some((item) => item.includes('Manutenção adiada')),
    ).toBeTrue();
  });

  it('updates population gradually from public approval', () => {
    const state: SimulationState = {
      currentDate: '2025-01-01',
      treasury: 1000000,
      population: 100000,
      approval: 55,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [],
      history: [],
      news: [],
      groups: [
        {
          key: 'residents',
          label: 'Moradores',
          satisfaction: 55,
          concern: 'serviços',
        },
      ],
    };
    const result = new SimulationEngine().advanceDay(state);
    expect(result.state.population).toBe(100011);
    expect(result.state.populationTrend).toBe(11);
  });

  it('marks unfinished objectives as failed at cycle evaluation', () => {
    const state: SimulationState = {
      currentDate: '2025-01-13',
      treasury: 1000000,
      approval: 40,
      indicators: [
        { key: 'health', label: 'Saúde', value: 40, trend: 0 },
        { key: 'education', label: 'Educação', value: 40, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 40, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 40, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [],
      history: [],
      news: [],
      objectives: [
        {
          id: 'health',
          label: 'Saúde',
          description: 'Meta',
          type: 'INDICATOR',
          target: 65,
          current: 40,
          status: 'IN_PROGRESS',
        },
      ],
    };
    const result = new SimulationEngine().advanceDay(state);
    expect(result.state.objectives![0].status).toBe('FAILED');
    expect(result.state.evaluation?.completedObjectives).toBe(0);
  });

  it('reduces population growth when service quality is poor', () => {
    const state: SimulationState = {
      currentDate: '2025-01-01',
      treasury: 1000000,
      population: 100000,
      approval: 55,
      indicators: [
        { key: 'health', label: 'Saúde', value: 20, trend: 0 },
        { key: 'education', label: 'Educação', value: 20, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 20, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 20, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [],
      history: [],
      news: [],
    };
    const result = new SimulationEngine().advanceDay(state);
    expect(result.state.populationTrend).toBe(-3);
    expect(result.state.population).toBe(99997);
  });

  it('uses configured demographic weights in overall approval', () => {
    const state: SimulationState = {
      currentDate: '2025-01-01',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [],
      history: [],
      news: [],
      groups: [
        {
          key: 'residents',
          label: 'Moradores',
          satisfaction: 80,
          concern: 'serviços',
          populationWeight: 0.75,
        },
        {
          key: 'business',
          label: 'Comerciantes',
          satisfaction: 40,
          concern: 'mobilidade',
          populationWeight: 0.25,
        },
      ],
    };
    const result = new SimulationEngine().advanceDay(state);
    expect(result.state.approval).toBeCloseTo(70);
  });

  it('creates public pressure when a weighted group falls below the satisfaction threshold', () => {
    const state: SimulationState = {
      currentDate: '2025-01-04',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [],
      history: [],
      news: [],
      groups: [
        {
          key: 'residents',
          label: 'Moradores',
          satisfaction: 40,
          concern: 'serviços',
          populationWeight: 0.8,
        },
        {
          key: 'business',
          label: 'Comerciantes',
          satisfaction: 49,
          concern: 'mobilidade',
          populationWeight: 0.2,
        },
      ],
    };
    const result = new SimulationEngine().advanceDay(state);
    expect(
      result.state.decisions.some(
        (decision) => decision.id === 'public-pressure',
      ),
    ).toBeTrue();
  });

  it('waits three days before recreating a resolved public pressure', () => {
    const state: SimulationState = {
      currentDate: '2025-01-05', treasury: 1000000, approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 }, decisions: [], history: [], news: [],
      groups: [{ key: 'residents', label: 'Moradores', satisfaction: 40, concern: 'serviços', populationWeight: 1 }],
    };
    const engine = new SimulationEngine();
    const first = engine.advanceDay(state).state;
    first.decisions[0].status = 'RESOLVED'; first.decisions[0].resolvedDate = '2025-01-06';
    first.groups![0].satisfaction = 40;
    engine.advanceDay(first); engine.advanceDay(first);
    const result = engine.advanceDay(first).state;
    expect(result.decisions.some((item) => item.id.startsWith('public-pressure-'))).toBeTrue();
  });

  it('produces a city bulletin based on the weakest indicator', () => {
    const state: SimulationState = {
      currentDate: '2025-01-01',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 42, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [],
      history: [],
      news: [],
    };
    const result = new SimulationEngine().advanceDay(state);
    expect(result.report).toContain('saúde');
    expect(result.state.news[0]).toContain('indicador mais pressionado');
  });

  it('reduces the related group and raises an administrative alert for a critical service', () => {
    const state: SimulationState = {
      currentDate: '2025-01-01',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 38, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [],
      history: [],
      news: [],
      groups: [
        {
          key: 'families',
          label: 'Famílias',
          satisfaction: 60,
          concern: 'saúde e educação',
        },
      ],
    };
    const result = new SimulationEngine().advanceDay(state);
    expect(result.state.groups![0].satisfaction).toBeLessThan(60);
    expect(result.state.administrativeAlerts![0]).toContain('saúde');
    expect(
      result.state.decisions.some(
        (decision) => decision.id === 'critical-health',
      ),
    ).toBeTrue();
  });

  it('increases pressure and reduces efficiency in the affected secretary', () => {
    const state: SimulationState = {
      currentDate: '2025-01-01',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 38, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [],
      history: [],
      news: [],
      secretaries: [
        { key: 'health', label: 'Saúde', efficiency: 70, pressure: 50 },
      ],
      groups: [
        {
          key: 'families',
          label: 'Famílias',
          satisfaction: 60,
          concern: 'saúde',
        },
      ],
    };
    new SimulationEngine().advanceDay(state);
    expect(state.secretaries![0].pressure).toBeGreaterThan(50);
    expect(state.secretaries![0].efficiency).toBeLessThan(70);
  });

  it('applies an emergency response once and records its cost', () => {
    const state: SimulationState = {
      currentDate: '2025-01-01',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 30, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [
        {
          id: 'critical-health',
          title: 'Plano',
          context: 'contexto',
          status: 'RESOLVED',
          chosenOptionId: 'act-health',
          options: [],
        },
      ],
      history: [],
      news: [],
      groups: [
        {
          key: 'families',
          label: 'Famílias',
          satisfaction: 40,
          concern: 'saúde',
        },
      ],
    };
    const engine = new SimulationEngine();
    const first = engine.advanceDay(state);
    const firstTreasury = first.state.treasury;
    const second = engine.advanceDay(state);
    expect(first.state.indicators[0].value).toBe(34);
    expect(firstTreasury).toBe(782000);
    expect(second.state.treasury).toBe(764000);
    expect(state.decisions[0].applied).toBeTrue();
  });

  it('recovers secretary capacity after an acted emergency response', () => {
    const state: SimulationState = {
      currentDate: '2025-01-01',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 30, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [
        {
          id: 'critical-health',
          title: 'Plano',
          context: 'contexto',
          status: 'RESOLVED',
          chosenOptionId: 'act-health',
          options: [],
        },
      ],
      history: [],
      news: [],
      secretaries: [
        { key: 'health', label: 'Saúde', efficiency: 60, pressure: 80 },
      ],
      groups: [
        {
          key: 'families',
          label: 'Famílias',
          satisfaction: 40,
          concern: 'saúde',
        },
      ],
    };
    new SimulationEngine().advanceDay(state);
    expect(state.secretaries![0].efficiency).toBe(62);
    expect(state.secretaries![0].pressure).toBeCloseTo(77.9);
    expect(state.decisions[0].recovered).toBeTrue();
  });

  it('records a compact daily snapshot for historical trends', () => {
    const state: SimulationState = {
      currentDate: '2025-01-01',
      treasury: 1000000,
      approval: 50,
      population: 100000,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [],
      history: [],
      news: [],
    };
    const result = new SimulationEngine().advanceDay(state);
    expect(result.state.snapshots?.[0]).toEqual(
      jasmine.objectContaining({
        date: '2025-01-02',
        treasury: 982000,
        population: jasmine.any(Number),
        serviceQuality: jasmine.any(Number),
      }),
    );
  });

  it('applies and gradually decays temporary policy effects', () => {
    const state: SimulationState = {
      currentDate: '2025-01-01',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
        { key: 'security', label: 'Segurança urbana', value: 53, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      activeEffects: { security: 2, approval: 1 },
      decisions: [],
      history: [],
      news: [],
    };
    const engine = new SimulationEngine();
    engine.advanceDay(state);
    expect(
      state.indicators.find((item) => item.key === 'security')?.value,
    ).toBe(55);
    expect(state.approval).toBeGreaterThan(50);
    expect(state.activeEffects?.security).toBeCloseTo(1.5);
  });

  it('derives a temporary education benefit from a resolved policy', () => {
    const state: SimulationState = {
      currentDate: '2025-01-01',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
        { key: 'security', label: 'Segurança urbana', value: 53, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [
        {
          id: 'school-meals',
          title: 'Merenda',
          context: 'contexto',
          status: 'RESOLVED',
          chosenOptionId: 'meals',
          resolvedDate: '2025-01-01',
          options: [],
        },
      ],
      history: [],
      news: [],
    };
    new SimulationEngine().advanceDay(state);
    expect(
      state.indicators.find((item) => item.key === 'education')?.value,
    ).toBeCloseTo(62.2);
  });

  it('creates and applies a management decision when a secretary is overloaded', () => {
    const state: SimulationState = {
      currentDate: '2025-01-01',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [],
      history: [],
      news: [],
      secretaries: [
        { key: 'health', label: 'Saúde', efficiency: 60, pressure: 82 },
      ],
      projects: [{ id: 'obra-atrasada', name: 'Obra atrasada', area: 'Saúde', totalCost: 100000, daysTotal: 5, daysCompleted: 1, status: 'IN_PROGRESS', risk: 'DELAYED' }],
    };
    const engine = new SimulationEngine();
    engine.advanceDay(state);
    const decision = state.decisions.find(
      (item) => item.id === 'capacity-health',
    )!;
    expect(decision.category).toBe('ADMINISTRATIVA');
    decision.status = 'RESOLVED';
    decision.chosenOptionId = 'reorganize-health';
    engine.advanceDay(state);
    expect(state.secretaries![0].pressure).toBeLessThan(82);
    expect(decision.applied).toBeTrue();
    expect(state.projects![0].risk).toBe('NORMAL');
    expect(
      state.ledger?.some(
        (entry) =>
          entry.label === 'Reorganização: Saúde' && entry.amount === 50000,
      ),
    ).toBeTrue();
  });

  it('translates budget priority into gradual service quality change', () => {
    const state: SimulationState = {
      currentDate: '2025-01-01',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      budget: [{ key: 'health', label: 'Saúde', dailyCost: 3000 }],
      decisions: [],
      history: [],
      news: [],
    };
    new SimulationEngine().advanceDay(state);
    expect(
      state.indicators.find((item) => item.key === 'health')?.value,
    ).toBeCloseTo(57.94);
    expect(
      state.indicators.find((item) => item.key === 'health')?.trend,
    ).toBeCloseTo(-0.06);
  });

  it('makes the affected social group react to a budget cut', () => {
    const state: SimulationState = {
      currentDate: '2025-01-01',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      budget: [{ key: 'health', label: 'Saúde', dailyCost: 3000 }],
      groups: [
        {
          key: 'families',
          label: 'Famílias',
          satisfaction: 60,
          concern: 'saúde',
        },
        {
          key: 'business',
          label: 'Comerciantes',
          satisfaction: 60,
          concern: 'mobilidade',
        },
      ],
      decisions: [],
      history: [],
      news: [],
    };
    new SimulationEngine().advanceDay(state);
    expect(state.groups![0].satisfaction).toBeCloseTo(59.925);
    expect(state.groups![0].satisfaction).toBeLessThan(
      state.groups![1].satisfaction,
    );
  });

  it('creates a contextual public reaction when a group becomes dissatisfied', () => {
    const state: SimulationState = {
      currentDate: '2025-01-01',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      groups: [
        {
          key: 'families',
          label: 'Famílias',
          satisfaction: 43,
          concern: 'saúde e educação',
        },
      ],
      decisions: [],
      history: [],
      news: [],
    };
    new SimulationEngine().advanceDay(state);
    expect(state.decisions[0].id).toBe('social-reaction-2025-01-02');
    expect(state.decisions[0].context).toContain('famílias');
    expect(state.news.some((item) => item.includes('manifestação'))).toBeTrue();
  });

  it('maintains slower social reputation memory apart from daily satisfaction', () => {
    const state: SimulationState = {
      currentDate: '2025-01-01',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      groups: [
        {
          key: 'families',
          label: 'Famílias',
          satisfaction: 40,
          reputation: 70,
          concern: 'saúde',
        },
      ],
      decisions: [],
      history: [],
      news: [],
    };
    new SimulationEngine().advanceDay(state);
    expect(state.groups![0].satisfaction).toBeLessThan(45);
    expect(state.groups![0].reputation).toBeGreaterThan(
      state.groups![0].satisfaction,
    );
    expect(state.groups![0].reputation).toBeCloseTo(66.4);
  });

  it('blends accumulated reputation into overall approval', () => {
    const state: SimulationState = {
      currentDate: '2025-01-01',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      groups: [
        {
          key: 'families',
          label: 'Famílias',
          satisfaction: 40,
          reputation: 70,
          concern: 'saúde',
        },
      ],
      decisions: [],
      history: [],
      news: [],
    };
    new SimulationEngine().advanceDay(state);
    expect(state.approval).toBeCloseTo(47.92);
  });

  it('scales public pressure by the group historical reputation', () => {
    const state: SimulationState = {
      currentDate: '2025-01-01',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      groups: [
        {
          key: 'families',
          label: 'Famílias',
          satisfaction: 43,
          reputation: 30,
          concern: 'saúde',
        },
      ],
      decisions: [],
      history: [],
      news: [],
    };
    new SimulationEngine().advanceDay(state);
    expect(state.decisions[0].context).toContain('mais intensa');
    expect(state.decisions[0].options[0].groupEffects?.['families']).toBe(3);
  });

  it('scales public support by a group reputation', () => {
    const state: SimulationState = {
      currentDate: '2025-01-04',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      groups: [
        {
          key: 'families',
          label: 'Famílias',
          satisfaction: 80,
          reputation: 80,
          concern: 'educação',
        },
      ],
      decisions: [],
      history: [],
      news: [],
    };
    new SimulationEngine().advanceDay(state);
    const decision = state.decisions.find(
      (item) => item.id === 'public-support-2025-01-05',
    )!;
    expect(decision.options[0].groupEffects?.['families']).toBeCloseTo(1.2);
  });

  it('opens periodic operational reviews only in the continued mandate', () => {
    const state: SimulationState = {
      currentDate: '2025-01-19',
      evaluationDate: '2025-02-13',
      treasury: 1000000,
      approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      secretaries: [
        { key: 'health', label: 'Saúde', efficiency: 60, pressure: 72 },
      ],
      decisions: [],
      history: [],
      news: [],
    };
    new SimulationEngine().advanceDay(state);
    expect(state.currentDate).toBe('2025-01-20');
    const review = state.decisions.find(
      (item) => item.id === 'operational-review-2025-01-20',
    )!;
    expect(review).toBeTruthy();
    review.status = 'RESOLVED';
    review.chosenOptionId = 'invest-review-health';
    new SimulationEngine().advanceDay(state);
    expect(state.secretaries![0].pressure).toBeLessThan(77);
    expect(review.applied).toBeTrue();
  });

  it('keeps a continued mandate numerically stable across thirty days', () => {
    const state: SimulationState = {
      currentDate: '2025-02-01',
      evaluationDate: '2025-03-10',
      treasury: 40000000,
      population: 180000,
      approval: 52,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 55, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 57, trend: 0 },
        { key: 'security', label: 'Segurança urbana', value: 53, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [],
      history: [],
      news: [],
    };
    const engine = new SimulationEngine();
    for (let day = 0; day < 30; day++) engine.advanceDay(state);
    expect(state.currentDate).toBe('2025-03-03');
    expect(
      state.indicators.every(
        (item) =>
          Number.isFinite(item.value) && item.value >= 0 && item.value <= 100,
      ),
    ).toBeTrue();
    expect(Number.isFinite(state.approval)).toBeTrue();
    expect(state.approval).toBeGreaterThanOrEqual(0);
    expect(state.approval).toBeLessThanOrEqual(100);
    expect(Number.isFinite(state.treasury)).toBeTrue();
    expect(Number.isFinite(state.population!)).toBeTrue();
    expect(state.snapshots?.length).toBe(30);
  });

  it('creates conditional city-life events only after their state and timing gates', () => {
    const state: SimulationState = {
      currentDate: '2025-01-15',
      evaluationDate: '2025-02-13',
      treasury: 1000000,
      population: 180000,
      approval: 52,
      indicators: [
        { key: 'health', label: 'Saúde', value: 58, trend: 0 },
        { key: 'education', label: 'Educação', value: 61, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 50, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 54, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [], history: [], news: [],
    };
    const engine = new SimulationEngine();
    for (let day = 0; day < 3; day += 1) {
      engine.advanceDay(state);
      for (const decision of state.decisions.filter((item) => item.status === 'PENDING')) decision.status = 'RESOLVED';
    }
    expect(state.decisions.some((item) => item.id.startsWith('weather-disruption-'))).toBeTrue();
    expect(state.decisions.some((item) => item.id.startsWith('transit-disruption-'))).toBeTrue();
  });

  it('creates the commerce follow-up after supported city programming', () => {
    const state: SimulationState = {
      currentDate: '2025-01-10', evaluationDate: '2025-02-13', treasury: 1000000,
      population: 180000, approval: 52, indicators: [], effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [{ id: 'city-pulse-2025-01-07', createdDate: '2025-01-07', resolvedDate: '2025-01-07', chosenOptionId: 'support-city-pulse-2025-01-07', title: 'programação', context: '', category: 'ESTRATÉGICA', urgency: 'MÉDIA', status: 'RESOLVED', options: [] }], history: [], news: [],
    };
    const engine = new SimulationEngine();
    (engine as any).createCityPulseFollowUp(state);
    const followUp = state.decisions.find((item) => item.id === 'city-pulse-followup-2025-01-07');
    expect(followUp?.parentDecisionId).toBe('city-pulse-2025-01-07');
    (engine as any).createCityPulseFollowUp(state);
    expect(state.decisions.filter((item) => item.id === 'city-pulse-followup-2025-01-07')).toHaveSize(1);
  });

  it('creates the weather follow-up only after an explicit delay', () => {
    const state: SimulationState = {
      currentDate: '2025-01-17', evaluationDate: '2025-02-13', treasury: 1000000,
      population: 180000, approval: 52, indicators: [], effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
      decisions: [{ id: 'weather-disruption-2025-01-15', createdDate: '2025-01-15', resolvedDate: '2025-01-15', chosenOptionId: 'wait-weather-disruption-2025-01-15', title: 'chuva', context: '', category: 'URGENTE', urgency: 'ALTA', status: 'RESOLVED', options: [] }], history: [], news: [],
    };
    const engine = new SimulationEngine();
    (engine as any).createWeatherFollowUp(state);
    const followUp = state.decisions.find((item) => item.id === 'weather-followup-2025-01-15');
    expect(followUp?.parentDecisionId).toBe('weather-disruption-2025-01-15');
    (engine as any).createWeatherFollowUp(state);
    expect(state.decisions.filter((item) => item.id === 'weather-followup-2025-01-15')).toHaveSize(1);
  });

  it('explains portfolio load in the critical capacity decision', () => {
    const state: SimulationState = {
      currentDate: '2025-01-20', treasury: 1000000, approval: 50,
      indicators: [], effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 }, decisions: [], history: [], news: [],
      secretaries: [{ key: 'health', label: 'Saúde', efficiency: 40, pressure: 90 }],
      projects: [{ id: 'obra', name: 'Obra', area: 'Saúde', totalCost: 100000, dailyExecutionCost: 9000, daysTotal: 5, daysCompleted: 1, status: 'IN_PROGRESS' }],
    };
    const engine = new SimulationEngine();
    (engine as any).createSecretaryDecisions(state);
    expect(state.decisions[0].context).toContain('1 obra(s)');
    expect(state.decisions[0].context).toContain('R$ 9.000');
  });

  it('recalculates social group concern from the weakest related indicator', () => {
    const state: SimulationState = {
      currentDate: '2025-01-02', treasury: 1000000, population: 180000, approval: 50,
      indicators: [
        { key: 'health', label: 'Saúde', value: 70, trend: 0 },
        { key: 'education', label: 'Educação', value: 65, trend: 0 },
        { key: 'infrastructure', label: 'Infraestrutura', value: 49, trend: 0 },
        { key: 'transport', label: 'Transporte', value: 60, trend: 0 },
        { key: 'safety', label: 'Segurança urbana', value: 64, trend: 0 },
      ],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 }, decisions: [], history: [], news: [],
      groups: [{ key: 'residents', label: 'Moradores', satisfaction: 50, concern: 'qualidade dos serviços' }],
    };
    const engine = new SimulationEngine();
    (engine as any).updateGroupConcerns(state);
    expect(state.groups?.[0].concern).toBe('infraestrutura');
  });

  it('records a weekly milestone only once for the same date', () => {
    const state: SimulationState = {
      currentDate: '2025-01-07', treasury: 900000, population: 180000, approval: 52,
      indicators: [{ key: 'health', label: 'Saúde', value: 60, trend: 0 }],
      effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 }, decisions: [], history: [], news: [],
      groups: [{ key: 'residents', label: 'Moradores', satisfaction: 55, concern: 'saúde' }], projects: [],
    };
    const engine = new SimulationEngine();
    (engine as any).createWeeklyMilestone(state);
    (engine as any).createWeeklyMilestone(state);
    expect(state.history.filter((item) => item.includes('Relatório de marco: 2025-01-07'))).toHaveSize(1);
  });
});
