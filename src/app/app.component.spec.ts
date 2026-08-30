import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('mantém todas as datas narrativas no padrão brasileiro', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    expect(app.formatDate('2025-01-07')).toBe('07/01/2025');
    expect(app.formatDate('2025-01-07T14:30:00.000Z')).toBe('07/01/2025');
   expect(app.formatNarrative('Boletim de 2025-01-07: serviços atualizados.')).toBe('Boletim do dia: serviços atualizados.');
    expect(app.formatNarrative('Boletim de 2025-01-07: Boletim de 2025-01-07: serviços atualizados.')).toBe('Boletim do dia: serviços atualizados.');
   expect(app.formatNarrative('Relatório de marco: 2025-01-07: caixa estável.')).toBe('Relatório de marco: caixa estável.');
   expect(app.formatNarrative('Decisão de 2025-01-07: Hospital municipal.')).toBe('Decisão de 07/01/2025: Hospital municipal.');
   expect(app.formatNarrative('saúde 52.251999999999995 · aprovação 52.296459999999996')).toBe('saúde 52,3 · aprovação 52,3');
    expect(app.formatNarrative('2025-01-04: Boletim de 2025-01-04: os serviços públicos avançaram.')).toBe('04/01/2025: Boletim do dia: os serviços públicos avançaram.');
    expect(app.optionTone('stabilize-health-demand')).toBe('AGIR / INVESTIR');
    expect(app.optionTone('defer-health-demand')).toBe('PRESERVAR / ADIAR');
    expect(app.optionTone('custom-choice')).toBe('ESCOLHA DO GABINETE');
 });

  it('cria a partida com dados iniciais previsíveis', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana';
    app.cityName = 'Aurora';
    app.create();
    fixture.detectChanges();
    expect(app.game?.population).toBe(180000);
    expect(app.game?.decisions[0].status).toBe('PENDING');
    expect(fixture.nativeElement.textContent).toContain('POPULAÇÃO');
    expect(fixture.nativeElement.textContent).toContain('estável');
  });

  it('expõe navegação por áreas com destinos únicos após iniciar a partida', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana';
    app.cityName = 'Aurora';
    app.create();
    fixture.detectChanges();

    const links = Array.from(
      fixture.nativeElement.querySelectorAll('.area-nav a') as NodeListOf<HTMLAnchorElement>,
    );
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '#resumo',
      '#gabinete',
      '#cidade',
      '#financas',
      '#memoria',
      '#metas',
      '#avaliacao',
      '#eleicoes',
      '#configuracoes',
    ]);
    expect(new Set(links.map((link) => link.getAttribute('href'))).size).toBe(
      links.length,
    );
    expect(fixture.nativeElement.querySelector('#gabinete')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#cidade')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#financas')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#configuracoes')).not.toBeNull();
    const skipLink = fixture.nativeElement.querySelector('.skip-link') as HTMLAnchorElement;
    expect(skipLink).not.toBeNull();
    expect(skipLink.getAttribute('href')).toBe('#conteudo-principal');
    expect(fixture.nativeElement.querySelector('#conteudo-principal')).not.toBeNull();
  });

  it('destaca a área selecionada e expõe sua posição para acessibilidade', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana';
    app.cityName = 'Aurora';
    app.create();
    fixture.detectChanges();

    const links = fixture.nativeElement.querySelectorAll('.area-nav a') as NodeListOf<HTMLAnchorElement>;
    expect(links[0].classList.contains('active')).toBeTrue();
    expect(links[0].getAttribute('aria-current')).toBe('page');

    app.selectArea('financas');
    fixture.detectChanges();
    expect(app.activeArea).toBe('financas');
    expect(links[3].classList.contains('active')).toBeTrue();
    expect(links[3].getAttribute('aria-current')).toBe('page');
    expect(links[0].classList.contains('active')).toBeFalse();
    expect(links[0].getAttribute('aria-current')).toBeNull();
  });

  it('sincroniza a área ativa quando a URL muda por histórico do navegador', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.activeArea = 'gabinete';
    history.replaceState({}, '', '#memoria');
    app.syncAreaFromHash();
    expect(app.activeArea).toBe('memoria');
    history.replaceState({}, '', window.location.pathname);
  });

  it('inicia na área indicada por um hash já presente na URL', () => {
    history.replaceState({}, '', '#financas');
    const app = TestBed.createComponent(AppComponent).componentInstance;
    expect(app.activeArea).toBe('financas');
    history.replaceState({}, '', window.location.pathname);
  });

  it('persiste a escolha do modo online na tela inicial', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    const http = TestBed.inject(HttpTestingController);
    app.setOnlineMode(true);
    http.expectOne('http://localhost:3000/api/health').flush({ status: 'ok', asyncProvider: 'file' });
    expect(app.onlineMode).toBeTrue();
    expect(localStorage.getItem('mandato-api-mode')).toBe('API');
    app.setOnlineMode(false);
    expect(localStorage.getItem('mandato-api-mode')).toBe('LOCAL');
  });

  it('normaliza respostas online antigas antes de entregá-las à interface', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    const normalized = (app as any).fromApiGame({
      id: 'game-1', mayorName: 'Ana', cityName: 'Aurora',
      currentDate: '2025-01-01', mandateEndDate: '2025-02-13', daysRemaining: 1460,
      population: 180000, treasury: 40000000, debt: 120000000, approval: 52,
      indicators: [], decisions: [], effects: {},
    });
    expect(normalized.effects).toEqual({ health: 0, approval: 0, infrastructure: 0, transport: 0 });
    expect(normalized.history).toEqual([]);
    expect(normalized.news).toEqual([]);
    expect(normalized.ledger).toEqual([]);
    expect(normalized.snapshots).toEqual([]);
    expect(normalized.objectives).toEqual([]);
  });

  it('persiste decisão e consequência ao avançar o dia', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana';
    app.cityName = 'Aurora';
    app.create();
    const decision = app.game!.decisions[0];
    app.resolve(decision, 'hire');
    expect(
      app.game!.secretaries?.find((item) => item.key === 'health')?.efficiency,
    ).toBe(72.4);
    app.advance();
    expect(app.game!.treasury).toBe(39862000);
    expect(app.game!.indicators[0].value).toBe(58.25);
    expect(app.game!.history.length).toBe(5);
  });

  it('migra uma partida antiga preenchendo os novos sistemas sem apagar o progresso', () => {
    localStorage.setItem(
      'mandato-save',
      JSON.stringify({
        mayorName: 'Bia',
        cityName: 'Aurora',
        currentDate: '2025-01-05',
        mandateEndDate: '2028-12-31',
        population: 180000,
        treasury: 39000000,
        debt: 120000000,
        approval: 51,
        indicators: [{ key: 'health', label: 'Saúde', value: 59, trend: 0 }],
        decisions: [],
        effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
        history: ['registro antigo'],
        news: [],
      }),
    );
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.game?.currentDate).toBe('2025-01-05');
    expect(app.game?.treasury).toBe(39000000);
    expect(app.game?.groups?.length).toBe(4);
    expect(app.game?.objectives?.length).toBe(3);
    expect(app.game?.causalLinks).toEqual([]);
    expect(JSON.parse(localStorage.getItem('mandato-save')!).treasury).toBe(
      39000000,
    );
    expect(JSON.parse(localStorage.getItem('mandato-save')!).saveVersion).toBe(
      2,
    );
  });

  it('conta somente as decisões que ainda exigem ação', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana';
    app.cityName = 'Aurora';
    app.create();
    expect(app.pendingDecisions()).toBe(1);
    app.resolve(app.game!.decisions[0], 'hire');
    expect(app.pendingDecisions()).toBe(0);
  });

  it('prioriza decisões pendentes e urgentes no gabinete', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana';
    app.cityName = 'Aurora';
    app.create();
    app.game!.decisions = [
      {
        id: 'resolved',
        title: 'Resolvida',
        context: '',
        status: 'RESOLVED',
        options: [],
      },
      {
        id: 'low',
        title: 'Baixa',
        context: '',
        status: 'PENDING',
        urgency: 'BAIXA',
        options: [],
      },
      {
        id: 'high',
        title: 'Alta',
        context: '',
        status: 'PENDING',
        urgency: 'ALTA',
        options: [],
      },
    ];
    expect(app.cabinetDecisions().map((item) => item.id)).toEqual([
      'high',
      'low',
      'resolved',
    ]);
  });

  it('resume as principais variações do último dia', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.game = {
      snapshots: [
        {
          date: '2025-01-01',
          approval: 52,
          treasury: 1000000,
          serviceQuality: 55,
          population: 1000,
          socialTrust: 50,
          administrativeEfficiency: 70,
          fiscalStability: 100,
        },
        {
          date: '2025-01-02',
          approval: 52.5,
          treasury: 982000,
          serviceQuality: 56,
          population: 1004,
          socialTrust: 51,
          administrativeEfficiency: 69,
          fiscalStability: 100,
        },
      ],
    } as any;
    expect(app.dailySummary().map((item) => item.value)).toEqual([
      '+0,5',
      '+1',
      'R$ -18.000',
      '+4',
      '+1',
      '-1',
      '0',
    ]);
  });

  it('monta o diário contextual com decisão, despesa e projeto do dia', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.game = {
      currentDate: '2025-01-02',
      decisions: [
        {
          id: 'd',
          title: 'Hospital',
          context: '',
          status: 'RESOLVED',
          resolvedDate: '2025-01-02',
          options: [],
        },
      ],
      ledger: [
        {
          date: '2025-01-02',
          label: 'Operação diária',
          amount: 18000,
          kind: 'EXPENSE',
          category: 'OPERATION',
        },
      ],
      projects: [
        {
          id: 'p',
          name: 'Obra teste',
          area: 'Infraestrutura',
          totalCost: 1,
          daysTotal: 4,
          daysCompleted: 1,
          status: 'IN_PROGRESS',
        },
      ],
      indicators: [],
    } as any;
    expect(app.dailyEvents().map((event) => event.type)).toEqual([
      'Decisão',
      'Despesa',
      'Projeto',
    ]);
    expect(app.dailyEvents()[1].text).toContain('18.000');
    app.dailyEventFilter = 'Despesa';
    expect(app.filteredDailyEvents().map((event) => event.type)).toEqual([
      'Despesa',
    ]);
  });

  it('pagina o diário sem perder o filtro selecionado', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.game = {
      currentDate: '2025-01-02',
      history: Array.from({ length: 12 }, (_, index) => `2025-01-02: Registro ${index + 1}`),
      decisions: [],
      ledger: [],
      projects: [],
      administrativeAlerts: [],
    } as any;
    expect(app.filteredDailyEvents().length).toBe(5);
    expect(app.dailyEventPageCount()).toBe(3);
    app.nextDiaryPage();
    expect(app.filteredDailyEvents().length).toBe(5);
    expect(app.filteredDailyEvents()[0].text).toBe('Registro 6');
    app.dailyEventFilter = 'Despesa';
    expect(app.filteredDailyEvents()).toEqual([]);
    expect(app.diaryPage).toBe(0);
  });

  it('reinicia a página do diário ao trocar data ou filtro', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.diaryPage = 3;
    app.changeDiaryDate('2025-01-01');
    expect(app.diaryPage).toBe(0);
    app.diaryPage = 2;
    app.changeDailyEventFilter('Alerta');
    expect(app.diaryPage).toBe(0);
    expect(app.dailyEventFilter).toBe('Alerta');
  });

  it('lista somente datas de decisões resolvidas', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.game = { decisions: [
      { id: 'pending', title: 'Pendente', status: 'PENDING' },
      { id: 'resolved', title: 'Resolvida', status: 'RESOLVED', resolvedDate: '2025-01-02' },
    ] } as any;
    expect(app.resolvedDecisionDates().map((item) => item.title)).toEqual(['Resolvida']);
  });

  it('abre a pré-campanha a partir da avaliação do ciclo', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.mayorName = 'Ana';
    app.game = { mayorName: 'Ana', approval: 60, groups: [{ satisfaction: 62 }], projects: [], evaluation: { score: 70, socialTrust: 62, fiscalStability: 70 } } as any;
    app.beginElection();
    expect(app.electionState?.phase).toBe('PRE_CAMPAIGN');
    expect(app.electionState?.candidates.length).toBe(3);
  });

  it('permite iniciar campanha, atravessar semanas e responder ao debate', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.game = { mayorName: 'Ana', approval: 60, groups: [{ satisfaction: 62 }], projects: [], fiscalStability: 70, evaluation: { score: 70, socialTrust: 62 } } as any;
    app.beginElection(); app.startCampaign();
    app.runCampaignAction('MEET_GROUPS'); app.runCampaignAction('VISIT_PROJECT'); app.runCampaignAction('CRISIS_COMMUNICATION');
    expect(app.electionState?.phase).toBe('DEBATE');
    app.answerElectionDebate('ACCOUNTABILITY');
    expect(app.electionState?.phase).toBe('RESULT');
    expect(app.electionState?.winnerId).toBeDefined();
  });

  it('formata efeitos sociais da agenda em português', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    expect(app.promiseEffects({ residents: 1.2, families: 1 })).toBe('moradores +1,2 · famílias +1,0');
  });

  it('pagina o registro completo do gabinete', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.game = { decisions: Array.from({ length: 13 }, (_, index) => ({ id: `d-${index}`, title: `Decisão ${index}`, status: 'RESOLVED' })) } as any;
    expect(app.decisionHistoryPageItems().length).toBe(6);
    expect(app.decisionHistoryPageCount()).toBe(3);
    app.nextDecisionHistoryPage();
    expect(app.decisionHistoryPageItems()[0].title).toBe('Decisão 6');
    app.decisionHistoryPage = 9;
    expect(app.decisionHistoryPageItems().length).toBe(1);
    expect(app.decisionHistoryPage).toBe(2);
  });

  it('produz trajetórias diferentes entre investimento e contenção', () => {
    const run = (denyHospital: boolean) => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      app.mayorName = 'Ana';
      app.cityName = denyHospital ? 'Contenção' : 'Investimento';
      app.create();
      app.resolve(app.game!.decisions[0], denyHospital ? 'deny' : 'hire');
      for (let day = 0; day < 13; day++) {
        const pending = app.game!.decisions.find(
          (decision) => decision.status === 'PENDING',
        );
        if (pending) app.resolve(pending, pending.options[0].id);
        app.advance();
      }
      return app.game!;
    };
    const investment = run(false);
    const containment = run(true);
    expect(investment.treasury).not.toBe(containment.treasury);
    expect(investment.approval).not.toBe(containment.approval);
    expect(
      investment.indicators.find((item) => item.key === 'health')!.value,
    ).not.toBe(
      containment.indicators.find((item) => item.key === 'health')!.value,
    );
  });

  it('classifica estilos de governo sem impor uma estratégia vencedora', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.game = {
      ledger: [
        {
          date: '2025-01-01',
          label: 'Resposta',
          amount: 600000,
          kind: 'EXPENSE',
          category: 'DECISION',
        },
      ],
    } as any;
    expect(app.governanceStyle().title).toBe('Governo de resposta');
    app.game!.ledger = [];
    expect(app.governanceStyle().title).toBe('Governo prudente');
  });

  it('consolida pendências, projetos e riscos na atenção imediata', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana';
    app.cityName = 'Aurora';
    app.create();
    app.game!.fiscalAlert = 'O caixa está negativo.';
    app.game!.projects = [
      {
        id: 'p',
        name: 'Obra teste',
        area: 'Infraestrutura',
        totalCost: 1,
        daysTotal: 4,
        daysCompleted: 1,
        status: 'IN_PROGRESS',
      },
      {
        id: 'p-delayed',
        name: 'Praça sem manutenção',
        area: 'Infraestrutura',
        totalCost: 1,
        daysTotal: 1,
        daysCompleted: 1,
        status: 'COMPLETED',
        risk: 'DELAYED',
      },
    ];
    app.game!.indicators[0].trend = -1;
    expect(app.attentionItems()).toEqual(
      jasmine.arrayContaining([
        'Decisão pendente: Hospital municipal sobrecarregado',
        'Finanças: O caixa está negativo.',
        'Projeto em execução: Obra teste (25%)',
        'Manutenção pendente: Praça sem manutenção está em risco',
        'Indicador em queda: Saúde',
      ]),
    );
  });

  it('renderiza risco e custo diário de um projeto atrasado', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana';
    app.cityName = 'Aurora';
    app.create();
    app.game!.projects = [
      {
        id: 'delayed-project',
        name: 'Drenagem emergencial',
        area: 'Infraestrutura',
        totalCost: 350000,
        dailyExecutionCost: 10000,
        daysTotal: 5,
        daysCompleted: 2,
        status: 'IN_PROGRESS',
        risk: 'DELAYED',
      },
    ];
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Projeto atrasado por pressão administrativa',
    );
    expect(fixture.nativeElement.textContent).toContain('Custo diário: R$');
  });

  it('resume o custo e o prazo das frentes simultâneas', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana'; app.cityName = 'Aurora'; app.create();
    app.game!.projects = [
      { id: 'a', name: 'A', area: 'Infraestrutura', totalCost: 1, dailyExecutionCost: 10000, daysTotal: 5, daysCompleted: 2, status: 'IN_PROGRESS', priorityMode: 'PRIORITARIA' },
      { id: 'b', name: 'B', area: 'Transporte', totalCost: 1, dailyExecutionCost: 9000, daysTotal: 8, daysCompleted: 3, status: 'IN_PROGRESS' },
    ];
    expect(app.activeProjectDailyCost()).toBe(24000);
    expect(app.projectDaysRemaining(app.game!.projects[0])).toBe(3);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('2 frentes no portfólio');
    expect(fixture.nativeElement.textContent).toContain('Prazo estimado: 3 dias restantes');
    expect(fixture.nativeElement.textContent).toContain('Ritmo atual:');
  });

  it('calcula projeções explícitas para escolhas de projeto', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.projectOptionProjection('authorize-mobility-project')).toContain('8 dias');
    expect(app.projectOptionProjection('prioritize-p1')).toContain('35% mais rápida');
    expect(app.projectOptionProjection('normal-p1')).toContain('prazo original');
    expect(app.projectOptionProjection('hire')).toBe('');
  });

  it('projeta caixa, prazo e indicador para projetos', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana'; app.cityName = 'Aurora'; app.create();
    app.game!.projects = [{ id: 'p1', name: 'Obra', area: 'Infraestrutura', totalCost: 1, dailyExecutionCost: 10000, daysTotal: 5, daysCompleted: 1, status: 'IN_PROGRESS' }];
    expect(app.projectOptionForecast('authorize-mobility-project')).toContain('Transporte 57.0 → 57.3');
    expect(app.projectOptionForecast('authorize-mobility-project')).toContain('caixa R$ 39.648.000');
    expect(app.projectOptionForecast('normal-p1')).toContain('4 dias');
    expect(app.projectOptionForecast('normal-p1')).toContain('caixa R$ 39.960.000');
    expect(app.projectOptionForecast('prioritize-p1')).toContain('3 dias');
  });

  it('renderiza alternativas como cartões comparáveis e acessíveis', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana'; app.cityName = 'Aurora'; app.create();
    fixture.detectChanges();
    const choices = fixture.nativeElement.querySelectorAll('.choice');
    expect(choices.length).toBeGreaterThanOrEqual(2);
    expect(choices[0].getAttribute('aria-label')).toContain('Alternativa:');
  });

  it('filtra e ordena o portfólio por risco e prazo', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana'; app.cityName = 'Aurora'; app.create();
    app.game!.projects = [
      { id: 'a', name: 'Risco', area: 'Infraestrutura', totalCost: 1, dailyExecutionCost: 5000, daysTotal: 8, daysCompleted: 1, status: 'IN_PROGRESS', risk: 'DELAYED' },
      { id: 'b', name: 'Normal', area: 'Transporte', totalCost: 1, dailyExecutionCost: 12000, daysTotal: 5, daysCompleted: 4, status: 'IN_PROGRESS' },
    ];
    app.projectView = 'RISK';
    expect(app.visibleProjects().map((project) => project.id)).toEqual(['a']);
    app.projectView = 'ALL'; app.projectSort = 'COST';
    expect(app.visibleProjects().map((project) => project.id)).toEqual(['b', 'a']);
    app.projectSort = 'DEADLINE';
    expect(app.visibleProjects().map((project) => project.id)).toEqual(['b', 'a']);
  });

  it('resume o cenário de trinta dias de uma frente', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana'; app.cityName = 'Aurora'; app.create();
    const project = { id: 'p', name: 'Corredor', area: 'Transporte', totalCost: 1, dailyExecutionCost: 9000, dailyIndicatorEffects: { transport: 0.04 }, dailyGroupEffects: { residents: 0.03, business: 0.05 }, daysTotal: 8, daysCompleted: 1, status: 'IN_PROGRESS' as const, priorityMode: 'PRIORITARIA' as const };
    const scenario = app.projectScenario(project);
    expect(scenario).toContain('caixa −R$ 420.000');
    expect(scenario).toContain('Transporte +1.2');
    expect(scenario).toContain('satisfação social +2.4');
    expect(scenario).toContain('capacidade -3.0');
  });

  it('compara no máximo duas frentes ativas e prioriza a acelerada', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana'; app.cityName = 'Aurora'; app.create();
    app.game!.projects = [
      { id: 'normal', name: 'Normal', area: 'Transporte', totalCost: 1, daysTotal: 5, daysCompleted: 1, status: 'IN_PROGRESS' },
      { id: 'priority', name: 'Prioritária', area: 'Infraestrutura', totalCost: 1, daysTotal: 5, daysCompleted: 1, status: 'IN_PROGRESS', priorityMode: 'PRIORITARIA' },
      { id: 'third', name: 'Terceira', area: 'Saúde', totalCost: 1, daysTotal: 5, daysCompleted: 1, status: 'IN_PROGRESS' },
    ];
    expect(app.comparisonProjects().map((project) => project.id)).toEqual(['priority', 'normal']);
    expect(app.projectIndicatorReturn(app.game!.projects[0])).toBe('1.2');
  });

  it('explica a recomendação sem escolher pelo jogador', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana'; app.cityName = 'Aurora'; app.create();
    const urgent = { id: 'u', name: 'Urgente', area: 'Infraestrutura', totalCost: 1, daysTotal: 8, daysCompleted: 1, status: 'IN_PROGRESS' as const, risk: 'DELAYED' as const };
    const fast = { ...urgent, id: 'f', risk: 'NORMAL' as const, daysTotal: 3, daysCompleted: 1 };
    expect(app.projectRecommendation(urgent)).toContain('Mais urgente');
    expect(app.projectRecommendation(fast)).toContain('mais rápida');
  });

  it('agrega custo, risco, capacidade e retorno do portfólio', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana'; app.cityName = 'Aurora'; app.create();
    app.game!.projects = [
      { id: 'a', name: 'A', area: 'Infraestrutura', totalCost: 1, dailyExecutionCost: 10000, dailyIndicatorEffects: { infrastructure: 0.03 }, daysTotal: 5, daysCompleted: 1, status: 'IN_PROGRESS', risk: 'DELAYED', priorityMode: 'PRIORITARIA' },
      { id: 'b', name: 'B', area: 'Transporte', totalCost: 1, dailyExecutionCost: 9000, dailyIndicatorEffects: { transport: 0.04 }, daysTotal: 5, daysCompleted: 1, status: 'IN_PROGRESS' },
    ];
    expect(app.portfolioSummary()).toEqual(jasmine.objectContaining({ active: 2, dailyCost: 24000, riskCount: 1, capacity: 4.5 }));
    expect(app.portfolioSummary().returnPerCost).toBeCloseTo(0.875);
    expect(app.portfolioSummary().forecast30).toBeGreaterThan(0);
    expect(app.portfolioForecastStatus()).toContain('caixa');
    expect(['safe', 'caution', 'critical']).toContain(app.portfolioForecastClass());
  });

  it('classifica o portfólio pela capacidade e pelo risco real', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana'; app.cityName = 'Aurora'; app.create();
    app.game!.projects = [{ id: 'p', name: 'Obra', area: 'Infraestrutura', totalCost: 1, daysTotal: 5, daysCompleted: 1, status: 'IN_PROGRESS' }];
    app.game!.administrativeCapacity = 85;
    expect(app.portfolioStatus().label).toBe('Saudável');
    app.game!.administrativeCapacity = 60;
    expect(app.portfolioStatus().label).toBe('Pressionado');
    app.game!.projects[0].risk = 'DELAYED';
    expect(app.portfolioStatus().label).toBe('Sobrecarregado');
  });

  it('projeta custo adicional quando a secretaria alonga o prazo operacional', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.game = {
      treasury: 1000000,
      projects: [{ id: 'p', name: 'Obra', area: 'Infraestrutura', dailyExecutionCost: 10000, daysTotal: 10, daysCompleted: 0, status: 'IN_PROGRESS', risk: 'DELAYED' }],
      secretaries: [{ key: 'infrastructure', label: 'Infraestrutura', pressure: 90, efficiency: 35 }],
    } as any;
    expect(app.portfolioSummary().forecast30).toBeGreaterThan(100000);
  });

  it('ordena a fila de prioridades sem alterar o estado da partida', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana'; app.cityName = 'Aurora'; app.create();
    app.game!.decisions = [{ id: 'd', title: 'Decisão urgente', context: 'x', options: [], status: 'PENDING', createdDate: '2025-01-01' }];
    app.game!.projects = [{ id: 'p', name: 'Obra atrasada', area: 'Infraestrutura', totalCost: 1, daysTotal: 5, daysCompleted: 1, status: 'IN_PROGRESS', risk: 'DELAYED' }];
    const before = JSON.stringify(app.game);
    const queue = app.priorityQueue();
    expect(queue[0].title).toBe('Decisão urgente');
    expect(queue.some((item) => item.title === 'Obra atrasada')).toBeTrue();
    expect(JSON.stringify(app.game)).toBe(before);
  });

  it('seleciona no gabinete a decisão escolhida na fila de prioridades', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.game = {
      decisions: [
        { id: 'first', title: 'Primeira', status: 'PENDING', options: [], urgency: 'ALTA' },
        { id: 'second', title: 'Segunda', status: 'PENDING', options: [], urgency: 'BAIXA' },
      ],
    } as any;
    app.focusPriority({ id: 'decision-second', title: 'Segunda' });
    expect(app.selectedCabinetDecisionId).toBe('second');
    expect(app.cabinetDisplayDecisions().map((item) => item.id)).toEqual(['second']);
  });

  it('navega entre decisões pendentes sem despejar todas no gabinete', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.game = {
      decisions: [
        { id: 'a', title: 'A', status: 'PENDING', options: [], urgency: 'ALTA' },
        { id: 'b', title: 'B', status: 'PENDING', options: [], urgency: 'MÉDIA' },
      ],
    } as any;
    app.selectedCabinetDecisionId = 'a';
    app.nextCabinetDecision();
    expect(app.cabinetDisplayDecisions().map((item) => item.id)).toEqual(['b']);
    app.previousCabinetDecision();
    expect(app.cabinetDisplayDecisions().map((item) => item.id)).toEqual(['a']);
  });
  it('pagina os marcos filtrados em blocos curtos', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.game = { history: Array.from({ length: 9 }, (_, index) => `2025-01-${String(index + 1).padStart(2, '0')}: Obra entregue: ${index}`) } as any;
    expect(app.milestonePageItems().length).toBe(4);
    app.nextMilestonePage();
    expect(app.milestonePageItems().length).toBe(4);
    app.nextMilestonePage();
    expect(app.milestonePageItems().length).toBe(1);
  });
  it('reinicia a página ao trocar o filtro de marcos', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.game = { history: Array.from({ length: 6 }, (_, index) => `2025-01-${String(index + 1).padStart(2, '0')}: Obra entregue: ${index}`) } as any;
    app.milestonePage = 1;
    app.changeMilestoneFilter('WORKS');
    expect(app.milestonePage).toBe(0);
  });

  it('calcula a prévia financeira de um ajuste diário', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.game = { budget: [{ key: 'health', label: 'Saúde', dailyCost: 6000 }] } as any;
    expect(app.budgetPreview('health', 500)).toContain('R$ 15.000');
    expect(app.budgetPreview('health', 500)).toContain('recuperar capacidade');
    expect(app.budgetPreview('health', -500)).toContain('economiza');
  });
  it('calcula a participação das categorias de despesa', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.game = { ledger: [
      { category: 'OPERATION', amount: 100, kind: 'EXPENSE', date: '2025-01-01', label: 'Operação' },
      { category: 'DECISION', amount: 300, kind: 'EXPENSE', date: '2025-01-01', label: 'Decisão: teste' },
    ] } as any;
    expect(app.categoryShare('DECISION')).toBe(75);
    expect(app.categoryShare('PROJECT')).toBe(0);
  });

  it('calcula a cadeia temporal corretamente no início da partida', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana'; app.cityName = 'Aurora'; app.create();
    app.game!.snapshots = [
      { date: '2025-01-01', approval: 50, treasury: 100, serviceQuality: 55 },
      { date: '2025-01-02', approval: 52, treasury: 100, serviceQuality: 57 },
    ];
    const chain = app.consequenceChains();
    expect(chain[0].effect).toContain('aprovação +0.0');
    expect(chain[1].effect).toContain('aprovação +2.0');
  });

  it('associa a decisão resolvida ao snapshot do mesmo dia', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana'; app.cityName = 'Aurora'; app.create();
    app.game!.decisions = [{ id: 'd', title: 'Reforço na saúde', context: 'x', options: [], status: 'RESOLVED', resolvedDate: '2025-01-02', createdDate: '2025-01-01' }];
    app.game!.snapshots = [
      { date: '2025-01-01', approval: 50, treasury: 100, serviceQuality: 55 },
      { date: '2025-01-02', approval: 51, treasury: 90, serviceQuality: 56 },
    ];
    const chain = app.consequenceChains();
    expect(chain[1].cause).toBe('Decisão: Reforço na saúde');
    expect(chain[1].effect).toContain('aprovação +1.0');
  });

  it('identifica desdobramentos na cadeia causal', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana'; app.cityName = 'Aurora'; app.create();
    app.game!.decisions.push({ id: 'weather-original', title: 'Chuva adiada', context: '', options: [], status: 'RESOLVED' });
    app.game!.decisions.push({ id: 'weather-followup-2025-01-15', parentDecisionId: 'weather-original', title: 'Cobrança', context: '', options: [], status: 'RESOLVED' });
    app.game!.causalLinks = [{ decisionId: 'weather-followup-2025-01-15', date: '2025-01-17', cause: 'Cobrança', effect: 'Reparar', signal: 'resposta pública registrada' }];
    expect(app.consequenceChains()[0].continuation).toBeTrue();
    expect(app.consequenceChains()[0].origin).toBe('Origem: Chuva adiada');
    expect(app.consequenceChains()[0].depth).toBe(1);
    app.game!.decisions.push({ id: 'weather-followup-2', parentDecisionId: 'weather-followup-2025-01-15', title: 'Nova cobrança', context: '', options: [], status: 'RESOLVED' });
    app.game!.causalLinks[0].decisionId = 'weather-followup-2';
    expect(app.consequenceChains()[0].depth).toBe(2);
  });

  it('identifica padrões sem classificar uma decisão isolada', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana'; app.cityName = 'Aurora'; app.create();
    app.game!.decisions = [
      { id: 'a', title: 'A', context: 'x', options: [], status: 'RESOLVED', chosenOptionId: 'deny', createdDate: '2025-01-01' },
      { id: 'b', title: 'B', context: 'x', options: [], status: 'RESOLVED', chosenOptionId: 'defer', createdDate: '2025-01-02' },
    ];
    expect(app.accumulatedPatterns()[0].label).toBe('Padrão de adiamento');
  });

  it('ignora ritmo normal e opções desconhecidas ao formar padrões', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana'; app.cityName = 'Aurora'; app.create();
    app.game!.decisions = [
      { id: 'a', title: 'A', context: 'x', options: [], status: 'RESOLVED', chosenOptionId: 'normal-project', createdDate: '2025-01-01' },
      { id: 'b', title: 'B', context: 'x', options: [], status: 'RESOLVED', chosenOptionId: 'custom-option', createdDate: '2025-01-02' },
    ];
    expect(app.accumulatedPatterns()).toEqual([]);
  });

  it('considera apenas as decisões mais recentes no padrão do mandato', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana'; app.cityName = 'Aurora'; app.create();
    app.game!.decisions = Array.from({ length: 11 }, (_, index) => ({
      id: `i-${index}`, title: `Investimento ${index}`, context: 'x', options: [], status: 'RESOLVED' as const,
      chosenOptionId: 'hire', createdDate: `2025-01-${String(index + 1).padStart(2, '0')}`,
    }));
    app.game!.decisions.push(...Array.from({ length: 10 }, (_, index) => ({
      id: `d-${index}`, title: `Contenção ${index}`, context: 'x', options: [], status: 'RESOLVED' as const,
      chosenOptionId: index % 2 ? 'deny' : 'defer', createdDate: `2025-02-${String(index + 1).padStart(2, '0')}`,
    })));
    expect(app.accumulatedPatterns().map((item) => item.label)).toEqual(['Padrão de adiamento']);
  });

  it('coloca o padrão dominante em primeiro quando há orientações mistas', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana'; app.cityName = 'Aurora'; app.create();
    app.game!.decisions = [
      ...Array.from({ length: 4 }, (_, index) => ({ id: `i-${index}`, title: 'Investimento', context: 'x', options: [], status: 'RESOLVED' as const, chosenOptionId: 'hire', createdDate: '2025-01-01' })),
      { id: 'd-1', title: 'Contenção', context: 'x', options: [], status: 'RESOLVED', chosenOptionId: 'defer', createdDate: '2025-01-02' },
      { id: 'd-2', title: 'Contenção', context: 'x', options: [], status: 'RESOLVED', chosenOptionId: 'deny', createdDate: '2025-01-03' },
    ];
    expect(app.accumulatedPatterns()[0].label).toBe('Padrão de investimento');
  });

  it('reflete um padrão acumulado na descrição do estilo de governo', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana'; app.cityName = 'Aurora'; app.create();
    app.game!.decisions = [
      { id: 'a', title: 'A', context: 'x', options: [], status: 'RESOLVED', chosenOptionId: 'hire', createdDate: '2025-01-01' },
      { id: 'b', title: 'B', context: 'x', options: [], status: 'RESOLVED', chosenOptionId: 'authorize', createdDate: '2025-01-02' },
    ];
    app.game!.ledger = [
      { date: '2025-01-01', label: 'A', amount: 300000, kind: 'EXPENSE', category: 'DECISION' },
      { date: '2025-01-02', label: 'B', amount: 300000, kind: 'EXPENSE', category: 'DECISION' },
    ];
    expect(app.governanceStyle().description).toContain('orientação de investimento');
  });

  it('persiste a trajetória causal no fluxo local', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana'; app.cityName = 'Aurora'; app.create();
    const decision = app.game!.decisions[0];
    app.resolve(decision, 'hire');
    app.advance();
    expect(app.game!.causalLinks?.[0]).toEqual(jasmine.objectContaining({
      decisionId: decision.id,
      cause: 'Hospital municipal sobrecarregado',
      effect: 'Autorizar contratação',
    }));
    expect(app.game!.causalLinks?.[0].observedEffect).toContain('saúde');
  });

  it('mostra a tendência de recuperação ou desgaste da capacidade', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana'; app.cityName = 'Aurora'; app.create();
    app.game!.snapshots = [
      { date: '2025-01-01', approval: 50, treasury: 1, serviceQuality: 50, administrativeCapacity: 62 },
      { date: '2025-01-02', approval: 50, treasury: 1, serviceQuality: 50, administrativeCapacity: 66 },
    ];
    expect(app.capacityTrend().label).toBe('Recuperando');
    app.game!.snapshots[1].administrativeCapacity = 60;
    expect(app.capacityTrend().label).toBe('Em desgaste');
  });

  it('separa transições de planejamento na linha do tempo', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana'; app.cityName = 'Aurora'; app.create();
    app.game!.history = [
      '2025-02-01: Transição de planejamento: o portfólio passou de saudável para pressionado.',
      '2025-01-31: Boletim comum.',
    ];
    expect(app.planningTransitions()).toHaveSize(1);
    expect(app.planningTransitions()[0]).toContain('pressionado');
  });

  it('reúne marcos de obras, manutenção e finanças', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana'; app.cityName = 'Aurora'; app.create();
    app.game!.history = [
      '2025-02-03: Obra entregue: Corredor.',
      '2025-02-02: Boletim de rotina.',
      '2025-02-01: Fechamento mensal: receitas recebidas.',
      '2025-01-31: Alerta de projeto: obra atrasada.',
    ];
    expect(app.planningMilestones()).toHaveSize(3);
    expect(app.planningMilestones()[0]).toContain('Obra entregue');
  });

  it('filtra os marcos por dimensão do governo', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana'; app.cityName = 'Aurora'; app.create();
    app.game!.history = [
      '2025-02-03: Obra entregue: Corredor.',
      '2025-02-02: Transição de planejamento: portfólio pressionado.',
      '2025-02-01: Fechamento mensal: receitas recebidas.',
    ];
    app.milestoneFilter = 'WORKS';
    expect(app.filteredMilestones()).toEqual(['2025-02-03: Obra entregue: Corredor.']);
    app.milestoneFilter = 'FINANCE';
    expect(app.filteredMilestones()[0]).toContain('Fechamento mensal');
  });

  it('persiste preferências de leitura sem alterar o save', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.projectView = 'RISK'; app.projectSort = 'COST'; app.milestoneFilter = 'FINANCE';
    app.persistViewPreferences();
    expect(localStorage.getItem('mandato-project-view')).toBe('RISK');
    expect(localStorage.getItem('mandato-project-sort')).toBe('COST');
    expect(localStorage.getItem('mandato-milestone-filter')).toBe('FINANCE');
  });

  it('resume e ordena decisões pendentes pela urgência', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana';
    app.cityName = 'Aurora';
    app.create();
    app.game!.decisions.push(
      {
        id: 'low-priority',
        title: 'Revisão de rotina',
        context: 'Rotina',
        status: 'PENDING',
        category: 'ADMINISTRATIVA',
        urgency: 'BAIXA',
        options: [],
      },
      {
        id: 'high-priority',
        title: 'Crise urgente',
        context: 'Crise',
        status: 'PENDING',
        category: 'URGENTE',
        urgency: 'ALTA',
        options: [],
      },
    );
    fixture.detectChanges();
    expect(app.pendingDecisions()).toBe(3);
    expect(app.cabinetDecisions()[0].title).toBe('Crise urgente');
    expect(fixture.nativeElement.textContent).toContain(
      '3 decisão(ões) aguardando resposta',
    );
  });

  it('projeta o saldo mensal usando o orçamento das secretarias', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana';
    app.cityName = 'Aurora';
    app.create();
    expect(app.budgetTotal()).toBe(18000);
    expect(app.projectedMonthlyBalance()).toBe(7960000);
    expect(app.financialStatus()).toBe('equilibrado');
    app.game!.fiscalStability = 45;
    expect(app.financialStatus()).toBe('sob pressão');
  });

  it('exibe receita mensal a partir das fontes reais da partida', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana';
    app.cityName = 'Aurora';
    app.create();
    app.game!.revenueSources = {
      ownTaxes: 6000000,
      commerce: 1800000,
      transfers: 1200000,
    };
    expect(app.projectedMonthlyRevenue()).toBe(9000000);
    expect(app.projectedMonthlyBalance()).toBe(8460000);
  });

  it('registra custos de decisões e operação no livro-caixa', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana';
    app.cityName = 'Aurora';
    app.create();
    app.resolve(app.game!.decisions[0], 'hire');
    app.advance();
    expect(
      app.game!.ledger?.some((entry) =>
        entry.label.includes('Autorizar contratação'),
      ),
    ).toBeTrue();
    expect(
      app.game!.ledger?.some((entry) =>
        entry.label.includes('Operação diária'),
      ),
    ).toBeTrue();
    expect(app.ledgerTotal('EXPENSE')).toBe(138000);
    expect(app.categoryTotal('DECISION')).toBe(120000);
    expect(app.netLedger()).toBe(-138000);
  });

  it('filtra o livro-caixa por entradas e saídas', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana';
    app.cityName = 'Aurora';
    app.create();
    app.advance();
    app.advance();
    app.ledgerFilter = 'EXPENSE';
    expect(
      app.filteredLedger().every((entry) => entry.kind === 'EXPENSE'),
    ).toBeTrue();
    app.ledgerFilter = 'INCOME';
    expect(app.filteredLedger().length).toBe(0);
  });

  it('agrupa o resultado líquido do caixa por data', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana';
    app.cityName = 'Aurora';
    app.create();
    app.resolve(app.game!.decisions[0], 'hire');
    app.advance();
    const day = app.ledgerTimeline().find((item) => item.date === '2025-01-02');
    expect(day?.net).toBe(-18000);
    expect(app.ledgerTimeline().length).toBe(2);
  });

  it('compara o caixa atual com o caixa inicial da partida', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana';
    app.cityName = 'Aurora';
    app.create();
    app.advance();
    expect(app.treasuryDelta()).toBe(-18000);
  });

  it('ajusta o orçamento da secretaria sem permitir valor negativo', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana';
    app.cityName = 'Aurora';
    app.create();
    app.adjustBudget('health', 1000);
    expect(
      app.game!.budget!.find((line) => line.key === 'health')?.dailyCost,
    ).toBe(7000);
    expect(app.projectedMonthlyBalance()).toBe(7930000);
    app.adjustBudget('health', -100000);
    expect(
      app.game!.budget!.find((line) => line.key === 'health')?.dailyCost,
    ).toBe(0);
  });

  it('separa a operação diária por categoria no livro-caixa', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana';
    app.cityName = 'Aurora';
    app.create();
    app.advance();
    expect(app.categoryTotal('OPERATION')).toBe(18000);
    expect(app.categoryTotal('DECISION')).toBe(0);
  });
  it('separa metas concluídas e falhas no relatório final', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana';
    app.cityName = 'Aurora';
    app.create();
    app.game!.objectives![0].status = 'COMPLETED';
    app.game!.objectives![1].status = 'FAILED';
    expect(app.objectivesByStatus('COMPLETED').length).toBe(1);
    expect(app.objectivesByStatus('FAILED').length).toBe(1);
  });

  it('descreve a tendência populacional para o gabinete', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana';
    app.cityName = 'Aurora';
    app.create();
    app.game!.populationTrend = -4;
    expect(app.populationTrendLabel()).toBe('redução de 4 habitantes');
  });

  it('expõe impactos estratégicos conhecidos para cada alternativa', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.optionImpacts('hire')).toContain('Custo R$ 120.000');
    expect(app.optionImpacts('deny')).toContain('Sem custo imediato');
    expect(app.optionImpacts('unknown')).toBe('');
    expect(app.optionImpacts('extend-city-pulse')).toContain('Custo R$ 100.000');
    expect(app.optionImpacts('close-city-pulse')).toContain('Aprovação −0,05');
    expect(app.optionImpacts('repair-weather-disruption')).toContain('Custo R$ 120.000');
    expect(app.optionImpacts('accept-weather-delay')).toContain('Sem custo imediato');
  });

  it('mostra a escolha registrada no histórico do gabinete', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana';
    app.cityName = 'Aurora';
    app.create();
    expect(app.decisionChoice(app.game!.decisions[0])).toBe(
      'Ainda não decidida',
    );
    app.resolve(app.game!.decisions[0], 'hire');
    expect(app.decisionChoice(app.game!.decisions[0])).toBe(
      'Autorizar contratação',
    );
  });

  it('interpreta tendências usando sinais do estado atual', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana';
    app.cityName = 'Aurora';
    app.create();
    app.game!.indicators[0].trend = -1;
    app.game!.fiscalAlert = 'Atenção fiscal';
    expect(app.metricTrend('services')).toContain('queda');
    expect(app.metricTrend('fiscal')).toContain('atenção');
  });

  it('inicia metas de consolidação ao continuar o mandato', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana';
    app.cityName = 'Aurora';
    app.create();
    app.game!.evaluation = {
      score: 85,
      title: 'Ciclo concluído',
      summary: 'Resumo',
      completedObjectives: 1,
      totalObjectives: 3,
    };
    app.game!.currentDate = '2025-01-14';
    app.continueMandate();
    expect(app.game!.evaluation).toBeUndefined();
    expect(app.game!.evaluationDate).toBe('2025-02-13');
    expect(app.game!.activeGroupEffects?.['residents']).toBeCloseTo(0.6);
    expect(app.game!.objectives?.map((item) => item.id)).toEqual([
      'security',
      'stable-trust',
      'sustainable-cash',
    ]);
  });

  it('apresenta e registra uma agenda estratégica do segundo ciclo', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.mayorName = 'Ana';
    app.cityName = 'Aurora';
    app.create();
    app.game!.currentDate = '2025-01-14';
    app.game!.evaluationDate = '2025-02-13';
    app.advance();
    const agenda = app.game!.decisions.find(
      (decision) => decision.id === 'strategic-agenda-2025-01-15',
    );
    expect(agenda).toBeDefined();
    expect(app.optionImpacts('invest-infrastructure')).toContain(
      'Custo R$ 300.000',
    );
    app.resolve(agenda!, 'reserve-infrastructure');
    expect(agenda!.status).toBe('RESOLVED');
    expect(agenda!.chosenOptionId).toBe('reserve-infrastructure');
  });

  it('usa o contrato HTTP quando o modo API está ativado', () => {
    localStorage.setItem('mandato-api-mode', 'API');
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    app.mayorName = 'Ana';
    app.cityName = 'Aurora';
    app.create();
    const create = http.expectOne('http://localhost:3000/api/games');
    expect(create.request.method).toBe('POST');
    create.flush({
      id: 'g1',
      mayorName: 'Ana',
      cityName: 'Aurora',
      currentDate: '2025-01-01',
      mandateEndDate: '2028-12-31',
      population: 180000,
      treasury: 40000000,
      debt: 120000000,
      approval: 52,
      indicators: [],
      decisions: [],
      effects: {},
    });
    expect(localStorage.getItem('mandato-api-game-id')).toBe('g1');
    app.advance();
    const advance = http.expectOne(
      'http://localhost:3000/api/games/g1/advance-day',
    );
    expect(advance.request.method).toBe('POST');
    advance.flush({
      id: 'g1',
      mayorName: 'Ana',
      cityName: 'Aurora',
      currentDate: '2025-01-02',
      mandateEndDate: '2028-12-31',
      population: 180000,
      treasury: 39982000,
      debt: 120000000,
      approval: 52,
      indicators: [],
      decisions: [],
      effects: {},
    });
    http.verify();
  });

  it('carrega a partida online salva pelo identificador', () => {
    localStorage.setItem('mandato-api-mode', 'API');
    localStorage.setItem('mandato-api-game-id', 'g2');
    const fixture = TestBed.createComponent(AppComponent);
    const http = TestBed.inject(HttpTestingController);
    const load = http.expectOne('http://localhost:3000/api/games/g2');
    load.flush({
      id: 'g2',
      mayorName: 'Bia',
      cityName: 'Lagoa',
      currentDate: '2025-01-03',
      mandateEndDate: '2028-12-31',
      population: 180000,
      treasury: 39900000,
      debt: 120000000,
      approval: 51,
      indicators: [],
      decisions: [],
      effects: {},
    });
    expect(fixture.componentInstance.game?.cityName).toBe('Lagoa');
    http.verify();
  });

  it('recupera a partida remota após uma falha temporária da API', () => {
    localStorage.setItem('mandato-api-mode', 'API');
    localStorage.setItem('mandato-api-game-id', 'g-reconnect');
    localStorage.setItem('mandato-project-view', 'RISK');
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    const initialLoad = http.expectOne('http://localhost:3000/api/games/g-reconnect');
    initialLoad.error(new ProgressEvent('offline'));
    expect(app.connectionStatus).toBe('UNAVAILABLE');
    expect(app.game).toBeNull();
    app.checkApiConnection();
    http.expectOne('http://localhost:3000/api/health').flush({ status: 'ok', asyncProvider: 'file' });
    const recovered = http.expectOne('http://localhost:3000/api/games/g-reconnect');
    recovered.flush({ id: 'g-reconnect', mayorName: 'Bia', cityName: 'Lagoa', currentDate: '2025-02-01', mandateEndDate: '2028-12-31', population: 180000, treasury: 39000000, debt: 120000000, approval: 54, indicators: [], decisions: [], effects: {}, portfolioStatus: 'PRESSIONADO', projects: [] });
    expect(app.connectionStatus).toBe('ONLINE');
    expect(app.game?.portfolioStatus).toBe('PRESSIONADO');
    expect(app.projectView).toBe('RISK');
    http.verify();
  });

  it('repete a mesma operação online após falha de rede', () => {
    localStorage.setItem('mandato-api-mode', 'API');
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    app.mayorName = 'Ana'; app.cityName = 'Aurora'; app.create();
    const create = http.expectOne('http://localhost:3000/api/games');
    create.flush({ id: 'retry', mayorName: 'Ana', cityName: 'Aurora', currentDate: '2025-01-01', mandateEndDate: '2028-12-31', population: 1, treasury: 1, debt: 1, approval: 1, indicators: [], decisions: [{ id: 'd', title: 'D', context: 'C', status: 'PENDING', options: [{ id: 'o', label: 'O' }] }], effects: {} });
    app.advance();
    const first = http.expectOne('http://localhost:3000/api/games/retry/advance-day');
    const operation = first.request.headers.get('x-operation-id');
    first.error(new ProgressEvent('offline'));
    expect(app.pendingOnlineAction?.operationId).toBe(operation ?? undefined);
    app.retryOnlineAction();
    const retry = http.expectOne('http://localhost:3000/api/games/retry/advance-day');
    expect(retry.request.headers.get('x-operation-id')).toBe(operation);
    retry.flush({ id: 'retry', mayorName: 'Ana', cityName: 'Aurora', currentDate: '2025-01-02', mandateEndDate: '2028-12-31', population: 1, treasury: 1, debt: 1, approval: 1, indicators: [], decisions: [], effects: {} });
    expect(app.pendingOnlineAction).toBeUndefined();
    http.verify();
  });

  it('exibe a recuperação gradual restante da secretaria', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.game = { secretaryRecoveryDays: { health: 3 } } as any;
    expect(app.secretaryRecoveryLabel('health')).toContain('3 dia(s) restante(s)');
    expect(app.secretaryRecoveryLabel('education')).toBe('');
  });

  it('resume o impacto operacional da secretaria', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    expect(app.secretaryOperationalLabel({ pressure: 80, efficiency: 90 })).toContain('reduz o ritmo');
    expect(app.secretaryOperationalLabel({ pressure: 30, efficiency: 80 })).toContain('favorece');
    expect(app.secretaryOperationalLabel({ pressure: 30, efficiency: 60 })).toContain('equilibrado');
  });

  it('relaciona uma obra à capacidade da secretaria responsável', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.game = { secretaries: [{ key: 'infrastructure', label: 'Infraestrutura', pressure: 80, efficiency: 60 }] } as any;
    expect(app.projectSecretaryLabel({ area: 'Infraestrutura' } as any)).toContain('reduz o ritmo');
  });

  it('calcula prazo operacional usando eficiência, risco e prioridade', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.game = { secretaries: [{ key: 'infrastructure', label: 'Infraestrutura', pressure: 20, efficiency: 35 }] } as any;
    const project = { area: 'Infraestrutura', status: 'IN_PROGRESS', daysTotal: 10, daysCompleted: 0, risk: 'DELAYED' } as any;
    expect(app.projectOperationalDaysRemaining(project)).toBe(27);
  });

  it('interpreta a trajetória e recomenda recuperar o serviço mais frágil', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.game = {
      treasury: 1000000, administrativeCapacity: 80, fiscalAlert: undefined,
      indicators: [{ label: 'Saúde', value: 42 }], groups: [{ satisfaction: 70 }],
      snapshots: [{ date: '2025-01-01', approval: 52, serviceQuality: 60, treasury: 1000000 }, { date: '2025-01-07', approval: 52, serviceQuality: 50, treasury: 900000 }],
    } as any;
    expect(app.governmentTrajectory().label).toBe('Governo em deterioração');
    expect(app.trajectoryRecommendation().title).toContain('recuperar saúde');
  });

  it('prioriza finanças antes de sugerir novas ações', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.game = { treasury: -1, indicators: [], groups: [] } as any;
    expect(app.trajectoryRecommendation().title).toContain('estabilizar as finanças');
  });

  it('traduz ações eleitorais técnicas em rótulos narrativos', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    expect(app.campaignActionLabel('MEET_GROUPS')).toBe('Escuta com grupos sociais');
    expect(app.campaignActionLabel('ATTACK')).toBe('Ataque à oposição');
    expect(app.campaignActionLabel('legacy-action')).toBe('legacy-action');
  });

  it('diferencia percentual ausente de um percentual real', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    expect(app.percentageOrDash(undefined)).toBe('sem dado');
    expect(app.percentageOrDash(52.5)).toBe('52,5%');
  });
});
