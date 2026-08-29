import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  SimulationDecision,
  SimulationEngine,
  SimulationProject,
  SimulationState,
} from './simulation-engine';
import { LocalGameRepository } from './game-repository';
import { ApiGameRepository } from './api-game-repository';
import { GameViewContract } from './api-game-contract';
import { createInitialSimulationState } from './simulation-state-factory';
import { CampaignAction, ElectionEngine, ElectionState } from './election-engine';
import { adjustBudget as applySharedBudgetAdjustment, applyFiscalResponse as applySharedFiscalResponse, MandatoEngine } from '@mandato/engine';
import { LocalEngineSession } from './local-engine-session';

type Game = SimulationState & {
  mayorName: string;
  cityName: string;
  mandateEndDate: string;
  population: number;
  debt: number;
  saveVersion?: number;
  electionState?: ElectionState;
};
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  game: Game | null = null;
  mayorName = '';
  cityName = '';
  feedback = '';
  ledgerFilter: 'ALL' | 'INCOME' | 'EXPENSE' = 'ALL';
  dailyEventFilter:
    | 'ALL'
    | 'Decisão'
    | 'Receita'
    | 'Despesa'
    | 'Projeto'
    | 'Alerta'
    | 'Registro' = 'ALL';
  diaryDate = 'CURRENT';
  diaryPage = 0;
  decisionHistoryPage = 0;
  projectView: 'ALL' | 'ACTIVE' | 'RISK' = (localStorage.getItem('mandato-project-view') as 'ALL' | 'ACTIVE' | 'RISK') || 'ALL';
  projectSort: 'PRIORITY' | 'COST' | 'DEADLINE' = (localStorage.getItem('mandato-project-sort') as 'PRIORITY' | 'COST' | 'DEADLINE') || 'PRIORITY';
  milestoneFilter: 'ALL' | 'WORKS' | 'ADMIN' | 'FINANCE' | 'SOCIETY' = (localStorage.getItem('mandato-milestone-filter') as 'ALL' | 'WORKS' | 'ADMIN' | 'FINANCE' | 'SOCIETY') || 'ALL';
  milestonePage = 0;
  private readonly engine = new SimulationEngine();
  private readonly sharedLocalSession = new LocalEngineSession();
  private readonly sharedEngine = new MandatoEngine();
  private readonly repository = new LocalGameRepository();
  private readonly http = inject(HttpClient, { optional: true });
  private readonly api = this.http ? new ApiGameRepository(this.http) : null;
  onlineMode = localStorage.getItem('mandato-api-mode') === 'API';
  electionState?: ElectionState;
  private readonly electionEngine = new ElectionEngine();
  connectionStatus: 'OFFLINE' | 'CHECKING' | 'ONLINE' | 'UNAVAILABLE' =
    'OFFLINE';
  onlineBusy = false;
  activeArea = 'gabinete';
  selectedCabinetDecisionId?: string;
  onlinePersistence = '';
  pendingOnlineAction?: { kind: 'resolve' | 'advance' | 'continue'; operationId: string; decisionId?: string; optionId?: string } = this.readPendingOnlineAction();
  constructor() {
    this.syncAreaFromHash();
    this.load();
  }
  private fromApiGame(view: GameViewContract): Game {
    // A API retorna a mesma forma operacional do motor, mas alguns campos
    // opcionais podem faltar em partidas antigas. Centralizar o limite evita
    // casts espalhados e torna divergências de contrato fáceis de localizar.
    return {
      ...view,
      decisions: view.decisions.map((decision) => ({
        ...decision,
        options: decision.options.map((option) => ({
          ...option,
          description: option.description ?? '',
        })),
      })),
      indicators: view.indicators,
      effects: {
        health: view.effects?.['health'] ?? 0,
        approval: view.effects?.['approval'] ?? 0,
        infrastructure: view.effects?.['infrastructure'] ?? 0,
        transport: view.effects?.['transport'] ?? 0,
      },
      activeEffects: view.activeEffects ?? {},
      activeGroupEffects: view.activeGroupEffects ?? {},
      history: view.history ?? [],
      news: view.news ?? [],
      ledger: view.ledger ?? [],
      snapshots: view.snapshots ?? [],
      groups: view.groups ?? [],
      secretaries: view.secretaries ?? [],
      budget: view.budget ?? [],
      projects: view.projects ?? [],
      objectives: view.objectives ?? [],
    } as unknown as Game;
  }
  formatDate(value?: string) {
    if (!value) return '';
    const match = /^(\d{4})-(\d{2})-(\d{2})(?:T|$)/.exec(value);
    return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
  }
  formatNarrative(value?: string) {
    return value
      ? value
          .replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, '$3/$2/$1')
          .replace(/Boletim de \d{2}\/\d{2}\/\d{4}:/g, 'Boletim do dia:')
          .replace(/Relatório de marco: \d{2}\/\d{2}\/\d{4}:/g, 'Relatório de marco:')
          .replace(/^(Boletim do dia:\s*)+/, 'Boletim do dia: ')
          .replace(/^(Resumo do dia:\s*)+/, 'Resumo do dia: ')
          .replace(/\b-?\d+\.\d{4,}\b/g, (number) => Number(number).toFixed(1).replace('.', ','))
      : '';
  }
  narrativeType(value?: string) {
    const text = value ?? '';
    if (/^Boletim/i.test(text)) return 'BOLETIM';
    if (/^Resumo/i.test(text)) return 'RESUMO DO DIA';
    if (/^Relatório/i.test(text)) return 'MARCO DO MANDATO';
    if (/^Decisão/i.test(text) || /decisão registrada/i.test(text)) return 'DECISÃO';
    if (/^Meta/i.test(text)) return 'META';
    return 'REGISTRO';
  }
  signalLabel(signal?: string) {
    if (!signal) return 'efeito registrado';
    if (/pressão|queda|risco/i.test(signal)) return 'atenção necessária';
    if (/alta|melhor|positiv/i.test(signal)) return 'sinal favorável';
    return 'efeito registrado';
  }
  decisionArea(decision: SimulationDecision) {
    const text = `${decision.title} ${decision.context}`.toLowerCase();
    const areas: [string, string][] = [['health', 'SAÚDE'], ['education', 'EDUCAÇÃO'], ['transport', 'TRANSPORTE'], ['infrastructure', 'INFRAESTRUTURA'], ['security', 'SEGURANÇA']];
    const match = areas.find(([key]) => text.includes(key) || (key === 'health' && text.includes('saúde')) || (key === 'education' && text.includes('escolar')));
    return match?.[1] ?? (decision.category === 'ADMINISTRATIVA' ? 'GESTÃO' : 'GOVERNO');
  }
  optionTone(optionId: string) {
    if (/defer|delay|deny|maintain|preserve|ignore/i.test(optionId)) return 'PRESERVAR / ADIAR';
    if (/reorganize|stabilize|authorize|act|support|reinforce|invest/i.test(optionId)) return 'AGIR / INVESTIR';
    return 'ESCOLHA DO GABINETE';
  }
  impactItems(optionId: string) {
    const impact = this.optionImpacts(optionId);
    return impact ? impact.split(' · ') : [];
  }
  impactKind(impact: string) {
    if (/custo|R\$/i.test(impact)) return 'CUSTO';
    if (/risco|pressão|insatisf/i.test(impact)) return 'RISCO';
    if (/aprovação|percepção|atende|melhora|saúde|transporte|segurança|infraestrutura/i.test(impact)) return 'EFEITO';
    return 'IMPACTO';
  }
  private readPendingOnlineAction() {
    const raw = sessionStorage.getItem('mandato-pending-online-action');
    if (!raw) return undefined;
    try { return JSON.parse(raw) as { kind: 'resolve' | 'advance' | 'continue'; operationId: string; decisionId?: string; optionId?: string }; } catch { sessionStorage.removeItem('mandato-pending-online-action'); return undefined; }
  }
  private setPendingOnlineAction(action?: { kind: 'resolve' | 'advance' | 'continue'; operationId: string; decisionId?: string; optionId?: string }) {
    this.pendingOnlineAction = action;
    if (action) sessionStorage.setItem('mandato-pending-online-action', JSON.stringify(action));
    else sessionStorage.removeItem('mandato-pending-online-action');
  }
  selectArea(area: string) {
    this.activeArea = area;
  }
  async exportParityProjection() {
    // A comparação precisa usar a jornada canônica, e não uma partida que o
    // jogador possa ter conduzido por escolhas diferentes.
    const { runDeterministicParityJourney } = await import('./parity-journey');
    const projection = runDeterministicParityJourney();
    const payload = JSON.stringify(projection, null, 2);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    link.download = 'mandato-parity-local.json';
    link.click();
    URL.revokeObjectURL(link.href);
  }
  @HostListener('window:hashchange')
  syncAreaFromHash() {
    const area = window.location.hash.replace(/^#/, '');
    if (['gabinete', 'cidade', 'financas', 'memoria', 'metas', 'avaliacao', 'configuracoes'].includes(area)) {
      this.activeArea = area;
    }
  }
  storageModeLabel() {
    if (!this.onlineMode || !this.api) return 'Partida local';
    const status = this.connectionStatus === 'ONLINE' ? 'conectada' : this.connectionStatus === 'CHECKING' ? 'verificando' : 'indisponível';
    return this.onlinePersistence && this.connectionStatus === 'ONLINE'
      ? `API ${status} · ${this.onlinePersistence}`
      : `API ${status}`;
  }
  setOnlineMode(enabled: boolean) {
    this.onlineMode = enabled;
    this.connectionStatus = enabled ? 'CHECKING' : 'OFFLINE';
    localStorage.setItem('mandato-api-mode', enabled ? 'API' : 'LOCAL');
    if (enabled) this.checkApiConnection();
    if (enabled && !localStorage.getItem('mandato-api-game-id'))
      this.feedback =
        'Modo online selecionado. A API precisa estar disponível para criar a partida.';
  }
  checkApiConnection() {
    if (!this.api) {
      this.connectionStatus = 'UNAVAILABLE';
      return;
    }
    this.connectionStatus = 'CHECKING';
    this.api.health().subscribe({
      next: (health) => {
        this.connectionStatus = 'ONLINE';
        this.onlinePersistence = health.asyncProvider
          ? `armazenamento ${health.asyncProvider}`
          : health.persistence ?? '';
        this.feedback = 'API conectada.';
        if (!this.game && localStorage.getItem('mandato-api-game-id'))
          this.load();
      },
      error: () => {
        this.connectionStatus = 'UNAVAILABLE';
        this.feedback = 'API indisponível. Tente reconectar.';
      },
    });
  }
  create() {
    if (!this.mayorName.trim() || !this.cityName.trim()) {
      this.feedback = 'Informe o nome do prefeito e da cidade.';
      return;
    }
    if (this.onlineMode && this.api) {
      this.api
        .create({ mayorName: this.mayorName, cityName: this.cityName })
        .subscribe({
      next: (game) => {
           this.connectionStatus = 'ONLINE';
           this.game = this.fromApiGame(game);
           this.electionState = this.normalizeElectionState(this.game.electionState);
           this.selectedCabinetDecisionId = undefined;
            localStorage.setItem('mandato-api-game-id', (game as any).id);
            this.feedback = 'Partida online criada.';
          },
          error: () => {
            this.connectionStatus = 'UNAVAILABLE';
            this.feedback =
              'Não foi possível conectar à API. A partida local não foi alterada.';
          },
        });
      return;
    }
    this.game = this.newGame();
    this.game.groups = [
      {
        key: 'residents',
        label: 'Moradores',
        satisfaction: 52,
        concern: 'qualidade dos serviços',
      },
      {
        key: 'workers',
        label: 'Servidores públicos',
        satisfaction: 49,
        concern: 'condições de trabalho',
      },
      {
        key: 'business',
        label: 'Comerciantes',
        satisfaction: 54,
        concern: 'mobilidade e atividade econômica',
      },
      {
        key: 'families',
        label: 'Famílias',
        satisfaction: 53,
        concern: 'saúde e educação',
      },
    ];
    this.game.budget = [
      { key: 'health', label: 'Saúde', dailyCost: 6000 },
      { key: 'education', label: 'Educação', dailyCost: 5000 },
      { key: 'infrastructure', label: 'Infraestrutura', dailyCost: 3000 },
      { key: 'transport', label: 'Transporte', dailyCost: 2500 },
      { key: 'security', label: 'Segurança urbana', dailyCost: 1500 },
    ];
    this.save();
  }
  resolve(decision: SimulationDecision, optionId: string) {
    if (!this.game || decision.status !== 'PENDING') return;
    if (this.onlineMode && this.api) {
      if (this.onlineBusy) return;
      this.onlineBusy = true;
      const operationId = this.pendingOnlineAction?.kind === 'resolve' && this.pendingOnlineAction.decisionId === decision.id ? this.pendingOnlineAction.operationId : crypto.randomUUID();
      this.setPendingOnlineAction({ kind: 'resolve', operationId, decisionId: decision.id, optionId });
      this.api.resolve((this.game as any).id, decision.id, optionId, operationId).subscribe({
        next: (game) => {
          this.onlineBusy = false;
          this.connectionStatus = 'ONLINE';
          this.game = this.fromApiGame(game);
          this.feedback = 'Decisão registrada na partida online.';
          this.setPendingOnlineAction();
        },
        error: () => {
          this.onlineBusy = false;
          this.connectionStatus = 'UNAVAILABLE';
          this.feedback = 'A API não conseguiu registrar a decisão.';
        },
      });
      return;
    }
    const option = decision.options.find((item) => item.id === optionId);
    decision.status = 'RESOLVED';
    decision.chosenOptionId = optionId;
    decision.resolvedDate = this.game.currentDate;
    this.game.effects = this.immediateEffects(optionId);
    if (optionId.startsWith('wait-weather-disruption-')) this.game.effects.infrastructure = -0.25;
    if (optionId.startsWith('monitor-transit-disruption-')) this.game.effects.transport = -0.2;
    const cost = this.decisionCostForOption(optionId);
    this.game.treasury -= cost;
    if (decision.id.startsWith('maintenance-')) {
      const projectId = decision.id.replace('maintenance-', '');
      const project = this.game.projects?.find((item) => item.id === projectId);
      if (project) {
        project.maintenanceMode = optionId.startsWith('defer-')
          ? 'ADIADA'
          : optionId.startsWith('reduce-')
            ? 'REDUZIDA'
            : 'NORMAL';
        project.risk =
          project.maintenanceMode === 'ADIADA' ? 'DELAYED' : 'NORMAL';
      }
    }
    if (decision.id.startsWith('priority-')) {
      const projectId = decision.id.replace('priority-', '');
      const project = this.game.projects?.find((item) => item.id === projectId);
      if (project) project.priorityMode = optionId === `prioritize-${projectId}` ? 'PRIORITARIA' : 'NORMAL';
    }
    if (optionId === 'authorize-mobility-project') {
      this.game.projects ??= [];
      if (!this.game.projects.some((project) => project.id === 'mobility-corridor'))
        this.game.projects.push({ id: 'mobility-corridor', name: 'Corredor de mobilidade integrada', area: 'Transporte', totalCost: 280000, dailyExecutionCost: 9000, maintenanceCost: 2500, dailyIndicatorEffects: { transport: 0.04 }, dailyGroupEffects: { business: 0.05, residents: 0.03 }, daysTotal: 8, daysCompleted: 0, status: 'IN_PROGRESS' });
    }
    if (optionId === 'authorize-social-recovery') {
      const candidate = [...(this.game.groups ?? [])].sort((a, b) => a.satisfaction - b.satisfaction)[0];
      const config: Record<string, [string, string]> = { residents: ['Infraestrutura', 'Recuperação urbana'], families: ['Saúde', 'Ampliação da rede de atendimento'], workers: ['Educação', 'Recuperação escolar'], business: ['Transporte', 'Mobilidade comercial'] };
      const [area, name] = config[candidate?.key ?? 'residents'] ?? config['residents'];
      this.game.projects ??= [];
      if (!this.game.projects.some((project) => project.id === 'social-recovery-project')) this.game.projects.push({ id: 'social-recovery-project', name, area, totalCost: 240000, dailyExecutionCost: 10000, maintenanceCost: 1800, dailyIndicatorEffects: { [({ Infraestrutura: 'infrastructure', Saúde: 'health', Educação: 'education', Transporte: 'transport' } as Record<string, string>)[area] ?? 'infrastructure']: 0.04 }, dailyGroupEffects: { [candidate?.key ?? 'residents']: 0.04 }, daysTotal: 6, daysCompleted: 0, status: 'IN_PROGRESS' });
      this.game.treasury -= 240000;
    }
    if (optionId === 'reorganize-secretariat') {
      this.game.secretaries?.forEach((secretary) => {
        secretary.pressure = Math.max(0, secretary.pressure - 8);
        secretary.efficiency = Math.min(100, secretary.efficiency + 3);
      });
    }
    if (optionId.startsWith('stabilize-') && optionId.endsWith('-demand')) {
      const secretaryKey = optionId.replace('stabilize-', '').replace('-demand', '');
      this.game.secretaryRecoveryDays ??= {};
      this.game.secretaryRecoveryDays[secretaryKey] = 5;
    }
    if (optionId === 'stabilize-health-demand' || optionId === 'defer-health-demand') {
      const health = this.game.secretaries?.find((item) => item.key === 'health');
      if (health) { health.pressure = Math.max(0, Math.min(100, health.pressure + (optionId === 'stabilize-health-demand' ? -10 : 5))); health.efficiency = Math.max(0, Math.min(100, health.efficiency + (optionId === 'stabilize-health-demand' ? 2 : -1))); }
    if (optionId === 'stabilize-health-demand') this.game.treasury -= 180000;
    }
    if (optionId === 'stabilize-education-demand' || optionId === 'defer-education-demand') {
      const education = this.game.secretaries?.find((item) => item.key === 'education');
      if (education) { education.pressure = Math.max(0, Math.min(100, education.pressure + (optionId === 'stabilize-education-demand' ? -10 : 5))); education.efficiency = Math.max(0, Math.min(100, education.efficiency + (optionId === 'stabilize-education-demand' ? 2 : -1))); }
      if (optionId === 'stabilize-education-demand') this.game.treasury -= 160000;
    }
    if (optionId === 'stabilize-transport-demand' || optionId === 'defer-transport-demand') {
      const transport = this.game.secretaries?.find((item) => item.key === 'transport');
      if (transport) { transport.pressure = Math.max(0, Math.min(100, transport.pressure + (optionId === 'stabilize-transport-demand' ? -10 : 5))); transport.efficiency = Math.max(0, Math.min(100, transport.efficiency + (optionId === 'stabilize-transport-demand' ? 2 : -1))); }
      if (optionId === 'stabilize-transport-demand') this.game.treasury -= 140000;
      this.game.approval = Math.max(0, Math.min(100, this.game.approval + (optionId === 'stabilize-transport-demand' ? 0.15 : -0.1)));
    }
    if (optionId === 'stabilize-infrastructure-demand' || optionId === 'defer-infrastructure-demand') {
      const infrastructure = this.game.secretaries?.find((item) => item.key === 'infrastructure');
      if (infrastructure) { infrastructure.pressure = Math.max(0, Math.min(100, infrastructure.pressure + (optionId === 'stabilize-infrastructure-demand' ? -10 : 5))); infrastructure.efficiency = Math.max(0, Math.min(100, infrastructure.efficiency + (optionId === 'stabilize-infrastructure-demand' ? 2 : -1))); }
      if (optionId === 'stabilize-infrastructure-demand') this.game.treasury -= 220000;
      if (optionId === 'stabilize-infrastructure-demand') { this.game.projects ??= []; if (!this.game.projects.some((project) => project.id === 'urban-repairs')) this.game.projects.push({ id: 'urban-repairs', name: 'Reparos urbanos emergenciais', area: 'Infraestrutura', totalCost: 220000, dailyExecutionCost: 12000, maintenanceCost: 1800, dailyIndicatorEffects: { infrastructure: 0.05 }, dailyGroupEffects: { residents: 0.04, families: 0.03 }, daysTotal: 6, daysCompleted: 0, status: 'IN_PROGRESS' }); }
      const transport = this.game.secretaries?.find((item) => item.key === 'transport');
      if (optionId === 'defer-infrastructure-demand' && transport) { transport.pressure = Math.min(100, transport.pressure + 2); this.game.history.unshift(this.game.currentDate + ': Efeito cruzado: o adiamento da infraestrutura aumentou a pressão sobre o Transporte.'); }
    }
    if (optionId === 'stabilize-security-demand' || optionId === 'defer-security-demand') {
      const security = this.game.secretaries?.find((item) => item.key === 'security');
      if (security) { security.pressure = Math.max(0, Math.min(100, security.pressure + (optionId === 'stabilize-security-demand' ? -10 : 5))); security.efficiency = Math.max(0, Math.min(100, security.efficiency + (optionId === 'stabilize-security-demand' ? 2 : -1))); }
      if (optionId === 'stabilize-security-demand') this.game.treasury -= 190000;
      const health = this.game.secretaries?.find((item) => item.key === 'health');
      if (optionId === 'defer-security-demand' && health) { health.pressure = Math.min(100, health.pressure + 1.5); this.game.history.unshift(this.game.currentDate + ': Efeito cruzado: o adiamento da segurança aumentou a pressão sobre a Saúde.'); }
    }
    if (optionId === 'commerce-incentive' || optionId === 'tax-modernization') {
      this.game.economicPolicies ??= {
        commerceIncentive: 0,
        taxModernization: 0,
      };
      if (optionId === 'commerce-incentive')
        this.game.economicPolicies.commerceIncentive = Math.min(
          3,
          this.game.economicPolicies.commerceIncentive + 1,
        );
      if (optionId === 'tax-modernization')
        this.game.economicPolicies.taxModernization = Math.min(
          3,
          this.game.economicPolicies.taxModernization + 1,
        );
    }
    if (cost) {
      this.game.ledger ??= [];
      this.game.ledger.unshift({
        date: this.game.currentDate,
        label: 'Decisão: ' + option?.label,
        amount: cost,
        kind: 'EXPENSE',
        category: 'DECISION',
      });
    }
    this.game.groups?.forEach(
      (group) =>
        (group.satisfaction = Math.max(
          0,
          Math.min(
            100,
            group.satisfaction +
              (option?.groupEffects?.[group.key] ?? 0) *
                (decision.id.startsWith('public-pressure-')
                  ? (group.reputation ?? group.satisfaction) < 50
                    ? 0.6
                    : (group.reputation ?? group.satisfaction) >= 75
                      ? 1.25
                      : 1
                  : 1),
          ),
        )),
    );
    if (decision.id.startsWith('social-reaction-')) {
      const constructive = optionId.startsWith('meet-');
      this.game.approval = Math.max(0, Math.min(100, this.game.approval + (constructive ? 0.25 : -0.35)));
      const groupKey = optionId.replace(/^(meet|dismiss)-/, '');
      const secretaryByGroup: Record<string, string> = { residents: 'infrastructure', families: 'health', workers: 'education', business: 'transport' };
      const secretary = this.game.secretaries?.find((item) => item.key === secretaryByGroup[groupKey]);
      if (secretary) secretary.pressure = Math.max(0, Math.min(100, secretary.pressure + (constructive ? -1 : 1.5)));
      this.game.history.unshift(`${this.game.currentDate}: A reação social foi ${constructive ? 'acolhida em diálogo' : 'minimizada'} pelo gabinete.`);
    }
    this.game.secretaries ??= [
      { key: 'health', label: 'Saúde', efficiency: 72, pressure: 68 },
      { key: 'education', label: 'Educação', efficiency: 76, pressure: 42 },
      {
        key: 'infrastructure',
        label: 'Infraestrutura',
        efficiency: 64,
        pressure: 61,
      },
      { key: 'transport', label: 'Transporte', efficiency: 69, pressure: 55 },
      {
        key: 'security',
        label: 'Segurança urbana',
        efficiency: 63,
        pressure: 58,
      },
    ];
    const secretaryByOption: Record<string, string> = {
      hire: 'health',
      deny: 'health',
      'emergency-health': 'health',
      'manage-crisis': 'health',
      meals: 'education',
      'review-meals': 'education',
      bus: 'transport',
      wait: 'transport',
      'negotiate-bus': 'transport',
      'accept-bus': 'transport',
      lighting: 'security',
      'defer-lighting': 'security',
    };
    const secretary = this.game.secretaries?.find(
      (item) => item.key === secretaryByOption[optionId],
    );
    if (secretary) {
      const constructive = ![
        'deny',
        'wait',
        'review-meals',
        'defer-lighting',
        'manage-crisis',
        'accept-bus',
      ].includes(optionId);
      secretary.pressure = Math.max(
        0,
        Math.min(100, secretary.pressure + (constructive ? -2 : 2)),
      );
      secretary.efficiency = Math.max(
        0,
        Math.min(100, secretary.efficiency + (constructive ? 0.4 : -0.6)),
      );
    }
    if (optionId === 'contain-expenses') {
      applySharedFiscalResponse(this.game as any, optionId);
    }
    if (optionId === 'maintain-spending') applySharedFiscalResponse(this.game as any, optionId);
    if (optionId === 'amortize-debt' && this.game.treasury >= 2000000) {
      this.game.treasury -= 2000000;
      this.game.debt = Math.max(0, (this.game.debt ?? 120000000) - 10000000);
      this.game.approval = Math.min(100, this.game.approval + 0.2);
    }
    if (optionId === 'refinance-debt') {
      this.game.treasury += 500000;
      this.game.debt = (this.game.debt ?? 120000000) + 5000000;
      this.game.approval = Math.max(0, this.game.approval - 0.1);
    }
    this.game.projects ??= [];
    if (optionId === 'drainage')
      this.game.projects.push({
        id: 'drainage-avenue',
        name: 'Drenagem da avenida do hospital',
        area: 'Infraestrutura',
        totalCost: 350000,
        daysTotal: 5,
        daysCompleted: 0,
        status: 'IN_PROGRESS',
      });
    this.game.causalLinks ??= [];
    this.game.activeGroupEffects ??= {};
    for (const [group, value] of Object.entries(option?.groupEffects ?? {}))
      this.game.activeGroupEffects[group] = (this.game.activeGroupEffects[group] ?? 0) + Number(value) * 0.2;
    const causalText = `${optionId} ${decision.title}`.toLowerCase();
    const objectiveIds = [
      /saúde|hospital|health/.test(causalText) ? 'health' : '', /educa|escola|merenda/.test(causalText) ? 'education' : '',
      /transporte|ônibus|mobilidade/.test(causalText) ? 'transport' : '', /infraestrutura|drenagem|iluminação/.test(causalText) ? 'infrastructure' : '',
      /segurança|polícia|iluminação/.test(causalText) ? 'security' : '', /aprovação|confiança|comunica|approval/.test(causalText) ? 'approval' : '',
      /caixa|fiscal|dívida|treasury/.test(causalText) ? 'treasury' : '',
    ].filter(Boolean);
    this.game.causalLinks.unshift({ decisionId: decision.id, date: this.game.currentDate, cause: decision.title, effect: option?.label ?? optionId, affectedGroups: Object.keys(option?.groupEffects ?? {}), groupEffects: option?.groupEffects, objectiveIds: [...new Set(objectiveIds)], signal: /deny|defer|delay|ignore|preserve|reduce/i.test(optionId) ? 'pressão futura provável' : 'resposta pública registrada' });
    this.game.causalLinks = this.game.causalLinks.slice(0, 30);
    const text = 'Decisão registrada: ' + option?.label + '.';
    this.game.history.unshift(this.game.currentDate + ': ' + text);
    this.feedback = cost
      ? text + ' Custo: R$ ' + cost.toLocaleString('pt-BR') + '.'
      : text;
    this.selectedCabinetDecisionId = this.cabinetDecisions().find((item) => item.status === 'PENDING')?.id;
    this.save();
  }
  private immediateEffects(optionId: string) {
    const neutral = { health: 0, approval: 0, infrastructure: 0, transport: 0 };
    const effects: Record<string, typeof neutral> = {
      hire: { health: 0.25, approval: 0.05, infrastructure: 0, transport: 0 },
      deny: { health: -0.15, approval: -0.08, infrastructure: 0, transport: 0 },
      drainage: { ...neutral, approval: 0.03 },
      bus: { health: 0, approval: 0.03, infrastructure: 0, transport: 0.3 },
      'emergency-health': {
        health: 0.35,
        approval: 0.04,
        infrastructure: 0,
        transport: 0,
      },
      'manage-crisis': {
        health: -0.25,
        approval: -0.06,
        infrastructure: 0,
        transport: 0,
      },
      'negotiate-bus': {
        health: 0,
        approval: 0.03,
        infrastructure: 0,
        transport: 0.25,
      },
      'accept-bus': {
        health: 0,
        approval: -0.06,
        infrastructure: 0,
        transport: -0.35,
      },
    };
    return (
      effects[optionId] ??
      (optionId.startsWith('support-city-pulse-')
        ? { ...neutral, approval: 0.03 }
        : optionId.startsWith('preserve-city-pulse-')
          ? { ...neutral, approval: -0.04 }
          : optionId.startsWith('expand-project-')
        ? { ...neutral, infrastructure: 0.3, approval: 0.05 }
        : optionId.startsWith('consolidate-project-')
          ? { ...neutral, approval: 0.03 }
          :
      (optionId.startsWith('invest-') || optionId.startsWith('reserve-')
        ? neutral
        : { ...neutral, approval: 0.02 }))
    );
  }
  private decisionCostForOption(optionId: string) {
    const costs: Record<string, number> = {
      hire: 120000,
      drainage: 350000,
      bus: 180000,
      meals: 90000,
      lighting: 140000,
      'emergency-health': 250000,
      'expand-health': 80000,
      'negotiate-bus': 220000,
      'emergency-meals': 160000,
      'commerce-incentive': 450000,
      'tax-modernization': 600000,
      'reorganize-secretariat': 250000,
      'authorize-mobility-project': 280000,
      'support-city-pulse': 80000,
      'repair-weather-disruption': 120000,
    };
    if (optionId.startsWith('reroute-transit-disruption-')) return 45000;
    if (optionId === 'restore-transit-service') return 90000;
    if (optionId.startsWith('mobilize-weather-disruption-')) return 60000;
    if (optionId.startsWith('support-city-pulse-')) return 80000;
    if (optionId === 'repair-weather-disruption') return 120000;
    if (optionId.startsWith('expand-project-')) return 120000;
    return optionId.startsWith('invest-') ? 300000 : (costs[optionId] ?? 0);
  }
  optionImpacts(optionId: string) {
    const impacts: Record<string, string> = {
      hire: 'Saúde +0,25/dia · Aprovação +0,05/dia · Custo R$ 120.000',
      deny: 'Saúde −0,15/dia · Aprovação −0,08/dia · Sem custo imediato',
      drainage: 'Infraestrutura melhora com a obra · Custo R$ 350.000',
      postpone: 'Mantém a vulnerabilidade · Sem custo imediato',
      bus: 'Transporte +0,30/dia · Custo R$ 180.000',
      wait: 'Risco de paralisação · Sem custo imediato',
      meals: 'Atende as famílias · Custo R$ 90.000',
      'review-meals': 'Mantém a pressão nas escolas · Sem custo imediato',
      lighting: 'Melhora a segurança percebida · Custo R$ 140.000',
      'defer-lighting': 'Aumenta a insatisfação local · Sem custo imediato',
      'emergency-health': 'Reduz o dano à saúde · Custo R$ 250.000',
      'manage-crisis': 'Saúde −0,25 · Sem custo imediato',
      'expand-health': 'Amplia o atendimento · Custo R$ 80.000',
      'negotiate-bus': 'Reduz o impacto da paralisação · Custo R$ 220.000',
      'accept-bus': 'Prejudica a mobilidade · Sem custo imediato',
      'emergency-meals': 'Reduz o desgaste com as famílias · Custo R$ 160.000',
      'commerce-incentive': 'Comércio +3 de satisfação · Custo R$ 450.000',
      'tax-modernization': 'Apoia a arrecadação · Custo R$ 600.000',
      'authorize-mobility-project': 'Abre uma segunda frente de transporte · Custo R$ 280.000',
      'defer-mobility-project': 'Preserva capacidade e caixa · Sem custo imediato',
    };
    if (optionId.startsWith('invest-'))
      return this.fiscalStability() < 60
        ? 'Recupera o indicador prioritário · Reduz pressão administrativa · Aumenta o risco fiscal · Custo R$ 300.000'
        : 'Recupera o indicador prioritário · Reduz pressão administrativa · Custo R$ 300.000';
    if (optionId.startsWith('reserve-'))
      return this.fiscalStability() < 60
        ? 'Protege a margem financeira · Recuperação adiada · Sem custo imediato'
        : 'Preserva o caixa · Recuperação adiada · Sem custo imediato';
    if (optionId === 'extend-city-pulse') return 'Consolida a confiança do comércio · Aprovação +0,04 · Custo R$ 100.000';
    if (optionId === 'close-city-pulse') return 'Preserva o caixa · Aprovação −0,05 · Desgaste do comércio';
    if (optionId === 'repair-weather-disruption') return 'Infraestrutura +0,30 · Recupera confiança dos moradores · Custo R$ 120.000';
    if (optionId === 'accept-weather-delay') return 'Infraestrutura −0,15 · Prolonga a pressão social · Sem custo imediato';
    return impacts[optionId] ?? '';
  }
  projectOptionProjection(optionId: string) {
    if (optionId === 'authorize-mobility-project')
      return 'Projeção: 8 dias de execução · R$ 280.000 iniciais · R$ 9.000/dia';
    if (optionId.startsWith('prioritize-'))
      return 'Projeção: execução 35% mais rápida · +R$ 5.000/dia · maior pressão administrativa';
    if (optionId.startsWith('normal-'))
      return 'Projeção: prazo original preservado · sem custo adicional · pressão normal';
    return '';
  }
  projectOptionForecast(optionId: string) {
    if (!this.game) return '';
    if (optionId === 'authorize-mobility-project') {
      const total = 280000 + 9000 * 8;
      const finalTreasury = this.game.treasury - total;
      const current = this.game.indicators.find((item) => item.key === 'transport')?.value ?? 0;
      return `Estimativa em 8 dias: caixa R$ ${finalTreasury.toLocaleString('pt-BR')} · Transporte ${current.toFixed(1)} → ${(current + 0.32).toFixed(1)}`;
    }
    const prefix = optionId.startsWith('prioritize-') || optionId.startsWith('normal-');
    if (!prefix) return '';
    const id = optionId.replace(/^(prioritize|normal)-/, '');
    const project = this.game.projects?.find((item) => item.id === id);
    if (!project) return '';
    const remaining = Math.max(0, project.daysTotal - project.daysCompleted);
    const priority = optionId.startsWith('prioritize-');
    const days = priority ? Math.max(1, Math.ceil(remaining / 1.35)) : Math.ceil(remaining);
    const daily = (project.dailyExecutionCost ?? 0) + (priority ? 5000 : 0);
    const finalTreasury = this.game.treasury - daily * days;
    return `Estimativa até a entrega: ${days} dias · caixa R$ ${finalTreasury.toLocaleString('pt-BR')} · custo de execução R$ ${(daily * days).toLocaleString('pt-BR')} · ${priority ? 'infraestrutura priorizada' : 'efeitos no ritmo atual'}`;
  }
  decisionCategory(id: string) {
    return [
      'hospital-overload',
      'hospital-crisis',
      'transport-strike',
      'public-pressure',
    ].includes(id)
      ? 'URGENTE'
      : [
            'drainage-avenue',
            'bus-line',
            'school-meals',
            'street-lighting',
          ].includes(id)
        ? 'ESTRATÉGICA'
        : 'ADMINISTRATIVA';
  }
  decisionUrgency(id: string) {
    return ['hospital-crisis', 'transport-strike', 'public-pressure'].includes(
      id,
    )
      ? 'ALTA'
      : ['hospital-overload', 'school-meals', 'street-lighting'].includes(id)
        ? 'MÉDIA'
        : 'BAIXA';
  }
  decisionChoice(decision: SimulationDecision) {
    return (
      decision.options.find((option) => option.id === decision.chosenOptionId)
        ?.label ?? 'Ainda não decidida'
    );
  }
  decisionCost(decision: SimulationDecision) {
    const label = `Decisão: ${this.decisionChoice(decision)}`;
    return (
      this.game?.ledger?.find((entry) => entry.label === label)?.amount ?? 0
    );
  }
  serviceQuality() {
    return this.game
      ? Math.round(
          this.game.indicators.reduce(
            (sum, indicator) => sum + indicator.value,
            0,
          ) / Math.max(1, this.game.indicators.length),
        )
      : 0;
  }
  administrativeEfficiency() {
    const secretaries = this.game?.secretaries ?? [];
    return Math.round(
      secretaries.reduce((sum, secretary) => sum + secretary.efficiency, 0) /
        Math.max(1, secretaries.length),
    );
  }
  fiscalStability() {
    return !this.game
      ? 0
      : this.game.fiscalStability !== undefined
        ? Math.round(this.game.fiscalStability)
        : this.game.treasury < 0
          ? 0
          : this.game.fiscalAlert
            ? 55
            : 100;
  }
  socialTrust() {
    const groups = this.game?.groups ?? [];
    const weight = groups.reduce(
      (sum, group) => sum + (group.populationWeight ?? 1),
      0,
    );
    return Math.round(
      groups.reduce(
        (sum, group) =>
          sum + group.satisfaction * (group.populationWeight ?? 1),
        0,
      ) / Math.max(1, weight),
    );
  }

  percentageOrDash(value: number | null | undefined) {
    return value === null || value === undefined || !Number.isFinite(value)
      ? 'sem dado'
      : `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
  }
  metricTrend(metric: 'services' | 'administration' | 'fiscal' | 'trust') {
    if (!this.game) return '—';
    if (metric === 'services') {
      const falling = this.game.indicators.filter(
        (item) => item.trend < 0,
      ).length;
      return falling
        ? '▼ em queda'
        : this.game.indicators.some((item) => item.trend > 0)
          ? '▲ melhorando'
          : '— estável';
    }
    if (metric === 'administration')
      return this.administrativeEfficiency() >= 70
        ? '▲ saudável'
        : this.administrativeEfficiency() >= 50
          ? '— em atenção'
          : '▼ sobrecarregada';
    if (metric === 'fiscal')
      return this.fiscalStability() < 30
        ? '▼ crítica'
        : this.fiscalStability() < 60
          ? '— em atenção'
          : '▲ estável';
    return this.socialTrust() >= 60
      ? '▲ forte'
      : this.socialTrust() >= 45
        ? '— dividida'
        : '▼ frágil';
  }
  temporaryEffects() {
    const effects = this.game?.activeEffects ?? {};
    const labels: Record<string, string> = {
      health: 'Saúde',
      education: 'Educação',
      infrastructure: 'Infraestrutura',
      transport: 'Transporte',
      security: 'Segurança urbana',
      approval: 'Aprovação',
    };
    return Object.entries(effects)
      .filter(([, value]) => Math.abs(value ?? 0) >= 0.01)
      .map(([key, value]) => ({
        label: labels[key] ?? key,
        value: value ?? 0,
      }));
  }
  recentSnapshots() {
    return (this.game?.snapshots ?? []).slice(-10);
  }
  snapshotBar(value: number, maximum = 100) {
    return Math.max(
      4,
      Math.min(100, Math.round((value / Math.max(1, maximum)) * 100)),
    );
  }
  snapshotDelta(
    snapshot: { date: string; approval: number; serviceQuality: number },
    field: 'approval' | 'serviceQuality',
  ) {
    const snapshots = this.recentSnapshots();
    const index = snapshots.findIndex((item) => item.date === snapshot.date);
    const previous = index > 0 ? snapshots[index - 1][field] : snapshot[field];
    const delta = snapshot[field] - previous;
    return delta > 0 ? `+${delta}` : `${delta}`;
  }
  governmentTrajectory() {
    const snapshots = this.game?.snapshots ?? [];
    if (snapshots.length < 2) return { label: 'Sem tendência ainda', detail: 'Avance mais dias para formar uma leitura de trajetória.', className: 'neutral' };
    const current = snapshots[snapshots.length - 1];
    const previous = snapshots[Math.max(0, snapshots.length - Math.min(5, snapshots.length))];
    const deltas = [
      { label: 'qualidade dos serviços', value: current.serviceQuality - previous.serviceQuality },
      { label: 'aprovação', value: current.approval - previous.approval },
      ...(current.socialTrust !== undefined && previous.socialTrust !== undefined ? [{ label: 'confiança social', value: current.socialTrust - previous.socialTrust }] : []),
      ...(current.treasury !== undefined && previous.treasury !== undefined ? [{ label: 'caixa', value: (current.treasury - previous.treasury) / 1000000 }] : []),
    ];
    const score = deltas.reduce((sum, item) => sum + Math.sign(item.value), 0);
    const strongest = [...deltas].sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0];
    const label = score >= 2 ? 'Governo em melhora' : score <= -2 ? 'Governo em deterioração' : 'Governo estável';
    const className = score >= 2 ? 'positive' : score <= -2 ? 'negative' : 'neutral';
    const direction = strongest.value > 0 ? 'avançou' : strongest.value < 0 ? 'recuou' : 'permaneceu estável';
    return { label, className, detail: `A principal leitura é ${strongest.label}: ${direction} no período recente.` };
  }
  trajectoryRecommendation() {
    if (!this.game) return { title: '', detail: '' };
    const weakest = [...(this.game.indicators ?? [])].sort((a, b) => a.value - b.value)[0];
    const social = (this.game.groups ?? []).length ? (this.game.groups ?? []).reduce((sum, item) => sum + item.satisfaction, 0) / (this.game.groups ?? []).length : 100;
    if (this.game.treasury < 0 || this.game.fiscalAlert) return { title: 'Prioridade: estabilizar as finanças', detail: 'Revise despesas e evite abrir novas frentes até recuperar margem de caixa.' };
    if ((this.game.administrativeCapacity ?? 100) < 55) return { title: 'Prioridade: recuperar capacidade administrativa', detail: 'Reduza a sobrecarga antes de assumir novos projetos ou acelerar obras.' };
    if (weakest && weakest.value < 50) return { title: `Prioridade: recuperar ${weakest.label.toLowerCase()}`, detail: 'Procure uma decisão ou projeto que melhore o serviço mais frágil.' };
    if (social < 50) return { title: 'Prioridade: reconstruir confiança social', detail: 'Observe os grupos mais insatisfeitos e considere abrir diálogo com seus representantes.' };
    return { title: 'Prioridade: consolidar as entregas', detail: 'Mantenha a operação estável e acompanhe manutenção, prazos e satisfação.' };
  }
  adoptTrajectoryFocus() {
    if (!this.game || (this.game.focusDaysRemaining ?? 0) > 0) return;
    const recommendation = this.trajectoryRecommendation();
    const title = recommendation.title.toLowerCase();
    const metric = title.includes('finanças') ? 'treasury' : title.includes('capacidade') ? 'capacity' : title.includes('confiança') ? 'social' : 'service';
    if (this.onlineMode && this.api) {
      this.onlineBusy = true;
      this.api.adoptFocus((this.game as any).id, recommendation.title.replace(/^Prioridade:\s*/, ''), metric).subscribe({ next: (game) => { this.game = this.fromApiGame(game); this.onlineBusy = false; }, error: () => { this.onlineBusy = false; this.feedback = 'A API não conseguiu registrar o foco.'; } });
      return;
    }
    this.game.activeFocus = recommendation.title.replace(/^Prioridade:\s*/, '');
    this.game.focusDaysRemaining = 7;
    this.game.focusMetric = title.includes('finanças') ? 'treasury' : title.includes('capacidade') ? 'capacity' : title.includes('confiança') ? 'social' : 'service';
    this.game.focusBaseline = this.game.focusMetric === 'treasury' ? this.game.treasury : this.game.focusMetric === 'capacity' ? (this.game.administrativeCapacity ?? 0) : this.game.focusMetric === 'social' ? ((this.game.groups ?? []).reduce((sum, item) => sum + item.satisfaction, 0) / Math.max(1, (this.game.groups ?? []).length)) : ((this.game.indicators ?? []).reduce((sum, item) => sum + item.value, 0) / Math.max(1, (this.game.indicators ?? []).length));
    this.game.history ??= [];
    this.game.history.unshift(`${this.game.currentDate}: O prefeito adotou como foco temporário: ${this.game.activeFocus}.`);
    this.feedback = `Foco adotado por 7 dias: ${this.game.activeFocus}.`;
    this.save();
  }
  dailySummary() {
    const snapshots = this.game?.snapshots ?? [];
    if (snapshots.length < 2) return [];
    const current = snapshots[snapshots.length - 1];
    const previous = snapshots[snapshots.length - 2];
    const format = (value: number | undefined, money = false) => {
      if (value === undefined) return '—';
      const sign = value > 0 ? '+' : '';
      return money
        ? `${sign}R$ ${value.toLocaleString('pt-BR')}`
        : `${sign}${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}`;
    };
    return [
      {
        category: 'Serviços',
        label: 'Aprovação',
        value: format(current.approval - previous.approval),
      },
      {
        category: 'Serviços',
        label: 'Qualidade dos serviços',
        value: format(current.serviceQuality - previous.serviceQuality),
      },
      {
        category: 'Finanças',
        label: 'Caixa',
        value: format(current.treasury - previous.treasury, true),
      },
      ...(current.population !== undefined && previous.population !== undefined
        ? [
            {
              category: 'Cidade',
              label: 'População',
              value: format(current.population - previous.population),
            },
          ]
        : []),
      ...(current.socialTrust !== undefined &&
      previous.socialTrust !== undefined
        ? [
            {
              category: 'Governo',
              label: 'Confiança social',
              value: format(current.socialTrust - previous.socialTrust),
            },
          ]
        : []),
      ...(current.administrativeEfficiency !== undefined &&
      previous.administrativeEfficiency !== undefined
        ? [
            {
              category: 'Governo',
              label: 'Eficiência administrativa',
              value: format(
                current.administrativeEfficiency -
                  previous.administrativeEfficiency,
              ),
            },
          ]
        : []),
      ...(current.fiscalStability !== undefined &&
      previous.fiscalStability !== undefined
        ? [
            {
              category: 'Finanças',
              label: 'Estabilidade fiscal',
              value: format(current.fiscalStability - previous.fiscalStability),
            },
          ]
        : []),
    ];
  }
  dailySummaryGroups() {
    const summaries = this.dailySummary() as {
      category: string;
      label: string;
      value: string;
    }[];
    return ['Serviços', 'Finanças', 'Governo', 'Cidade']
      .map((category) => ({
        category,
        items: summaries.filter((item) => item.category === category),
      }))
      .filter((group) => group.items.length);
  }
  diaryDates() {
    const dates = new Set(
      (this.game?.snapshots ?? []).map((snapshot) => snapshot.date),
    );
    if (this.game) dates.add(this.game.currentDate);
    return [...dates].sort().reverse();
  }
  dailyEvents(
    date = this.diaryDate === 'CURRENT'
      ? this.game?.currentDate
      : this.diaryDate,
  ) {
    if (!this.game) return [];
    if (!date) return [];
    const events: { type: string; text: string }[] = [];
    this.game.decisions
      .filter((decision) => decision.resolvedDate === date)
      .forEach((decision) =>
        events.push({ type: 'Decisão', text: decision.title }),
      );
    this.game.ledger
      ?.filter((entry) => entry.date === date)
      .slice(0, 5)
      .forEach((entry) =>
        events.push({
          type: entry.kind === 'INCOME' ? 'Receita' : 'Despesa',
          text: `${entry.label}: R$ ${entry.amount.toLocaleString('pt-BR')}`,
        }),
      );
    if (date === this.game.currentDate)
      this.game.projects
        ?.filter((project) => project.status === 'IN_PROGRESS')
        .forEach((project) =>
          events.push({
            type: 'Projeto',
            text: `${project.name}: ${this.projectProgress(project)}% executado`,
          }),
        );
    if (date === this.game.currentDate)
      (this.game.administrativeAlerts ?? [])
        .slice(0, 3)
        .forEach((alert) => events.push({ type: 'Alerta', text: alert }));
    (this.game.history ?? [])
      .filter((item) => item.startsWith(`${date}:`))
      .forEach((item) =>
        events.push({
          type: 'Registro',
          text: item.slice(date.length + 1).trim(),
        }),
      );
    return events;
  }
  filteredDailyEvents() {
    const filtered = this.dailyEvents().filter(
      (event) =>
        this.dailyEventFilter === 'ALL' || event.type === this.dailyEventFilter,
    );
    this.diaryPage = Math.min(this.diaryPage, Math.max(0, Math.ceil(filtered.length / 5) - 1));
    const start = this.diaryPage * 5;
    return filtered.slice(start, start + 5);
  }
  dailyEventPageCount() {
    const total = this.dailyEvents().filter(
      (event) => this.dailyEventFilter === 'ALL' || event.type === this.dailyEventFilter,
    ).length;
    return Math.max(1, Math.ceil(total / 5));
  }
  changeDiaryDate(value: string) {
    this.diaryDate = value;
    this.diaryPage = 0;
  }
  changeDailyEventFilter(value: typeof this.dailyEventFilter) {
    this.dailyEventFilter = value;
    this.diaryPage = 0;
  }
  previousDiaryPage() {
    this.diaryPage = Math.max(0, this.diaryPage - 1);
  }
  nextDiaryPage() {
    this.diaryPage = Math.min(this.dailyEventPageCount() - 1, this.diaryPage + 1);
  }
  governanceStyle() {
    const expenses =
      this.game?.ledger?.filter((entry) => entry.kind === 'EXPENSE') ?? [];
    const decisions = expenses.filter((entry) => entry.category === 'DECISION');
    const projects = expenses.filter((entry) => entry.category === 'PROJECT');
    const decisionSpend = decisions.reduce(
      (sum, entry) => sum + entry.amount,
      0,
    );
    const pattern = this.accumulatedPatterns()[0];
    if (decisionSpend >= 500000 || projects.length >= 5)
      return {
        title: 'Governo de resposta',
        description:
          pattern?.label === 'Padrão de investimento'
            ? 'Você priorizou agir diante das crises e vem consolidando uma orientação de investimento.'
            : 'Você priorizou agir diante das crises, aceitando mais pressão sobre o caixa.',
      };
    if (decisionSpend < 200000 && projects.length < 2)
      return {
        title: 'Governo prudente',
        description:
          pattern?.label === 'Padrão de adiamento'
            ? 'Você protegeu o caixa e vem consolidando uma orientação de contenção e adiamento.'
            : 'Você protegeu o caixa e preferiu observar antes de comprometer recursos.',
      };
    return {
      title: 'Governo equilibrado',
      description:
        'Você combinou respostas imediatas com preservação da capacidade fiscal.',
    };
  }
  evaluationDiagnosis() {
    if (!this.game?.evaluation) return [] as string[];
    const diagnosis: string[] = [];
    const evaluation = this.game.evaluation;
    if ((evaluation.serviceQuality ?? 100) >= 65) diagnosis.push('Serviços públicos sustentaram um nível operacional consistente.');
    else diagnosis.push('A qualidade dos serviços terminou abaixo de uma margem confortável.');
    if ((evaluation.fiscalStability ?? 100) < 60) diagnosis.push('A margem fiscal exige cautela antes de assumir novas despesas permanentes.');
    else diagnosis.push('A situação fiscal ainda permite planejar novas ações com alguma margem.');
    const delayed = (this.game.projects ?? []).filter((item) => item.status === 'IN_PROGRESS' && item.risk === 'DELAYED').length;
    if (delayed) diagnosis.push(`${delayed} projeto(s) terminou(aram) o ciclo com atraso e precisa(m) de acompanhamento administrativo.`);
    const weakest = [...(this.game.indicators ?? [])].sort((a, b) => a.value - b.value)[0];
    if (weakest) diagnosis.push(`Prioridade recomendada para o próximo ciclo: ${weakest.label.toLowerCase()} (${weakest.value.toFixed(1)}).`);
    return diagnosis;
  }
  evaluationPriority() {
    const evaluation = this.game?.evaluation;
    return evaluation?.recommendedIndicatorLabel
      ? `Próxima prioridade: ${evaluation.recommendedIndicatorLabel}`
      : '';
  }
  advance() {
    if (!this.game || this.game.evaluation) return;
    if (this.onlineMode && this.api) {
      if (this.onlineBusy) return;
      this.onlineBusy = true;
      const operationId = this.pendingOnlineAction?.kind === 'advance' ? this.pendingOnlineAction.operationId : crypto.randomUUID();
      this.setPendingOnlineAction({ kind: 'advance', operationId });
      this.api.advance((this.game as any).id, operationId).subscribe({
        next: (game) => {
          this.onlineBusy = false;
          this.connectionStatus = 'ONLINE';
          this.game = this.fromApiGame(game);
          this.feedback =
            'O Simulation Engine processou os efeitos da decisão.';
          this.setPendingOnlineAction();
        },
        error: () => {
          this.onlineBusy = false;
          this.connectionStatus = 'UNAVAILABLE';
          this.feedback = 'A API não conseguiu avançar o dia.';
        },
      });
      return;
    }
    this.game = this.sharedEngine.execute(this.game as any, { type: 'ADVANCE_DAY' }) as unknown as Game;
    this.feedback = 'O motor compartilhado processou os efeitos da decisão.';
    this.save();
  }
  retryOnlineAction() {
    const action = this.pendingOnlineAction;
    if (!action || !this.game) return;
    if (action.kind === 'resolve') {
      const decision = this.game.decisions.find((item) => item.id === action.decisionId);
      if (decision && action.optionId) this.resolve(decision, action.optionId);
    } else if (action.kind === 'advance') this.advance();
    else this.continueMandate();
  }
  continueMandate() {
    if (!this.game?.evaluation) return;
    if (this.onlineMode && this.api) {
      if (this.onlineBusy) return;
      this.onlineBusy = true;
      const operationId = this.pendingOnlineAction?.kind === 'continue' ? this.pendingOnlineAction.operationId : crypto.randomUUID();
      this.setPendingOnlineAction({ kind: 'continue', operationId });
      this.api.continue((this.game as any).id, operationId).subscribe({
        next: (game) => {
          this.onlineBusy = false;
          this.connectionStatus = 'ONLINE';
          this.game = this.fromApiGame(game);
          this.feedback = 'Novo ciclo iniciado na partida online.';
          this.setPendingOnlineAction();
        },
        error: () => {
          this.onlineBusy = false;
          this.connectionStatus = 'UNAVAILABLE';
          this.feedback = 'A API não conseguiu iniciar o novo ciclo.';
        },
      });
      return;
    }
    const end = new Date(`${this.game.currentDate}T00:00:00Z`);
    end.setUTCDate(end.getUTCDate() + 30);
    const health =
      this.game.indicators.find((item) => item.key === 'health')?.value ?? 0;
    const weakest = [...this.game.indicators].sort((a, b) => a.value - b.value)[0];
    const recommendedKey = this.game.evaluation?.recommendedIndicatorKey ?? weakest?.key ?? 'health';
    const recommendedLabel = this.game.evaluation?.recommendedIndicatorLabel ?? weakest?.label ?? 'Saúde';
    const recommendedValue = this.game.indicators.find((item) => item.key === recommendedKey)?.value ?? health;
    const approval = this.game.approval;
    const cycleScore = this.game.evaluation?.score ?? 0;
    const legacyGroupEffect = cycleScore >= 80
      ? { residents: 0.6, workers: 0.4 }
      : cycleScore < 60
        ? { residents: -0.7, families: -0.5 }
        : {};
    this.game.activeGroupEffects = { ...(this.game.activeGroupEffects ?? {}) };
    for (const [key, value] of Object.entries(legacyGroupEffect))
      this.game.activeGroupEffects[key] = (this.game.activeGroupEffects[key] ?? 0) + value;
    this.game.evaluation = undefined;
    this.game.evaluationDate = end.toISOString().slice(0, 10);
    this.game.mandateEndDate = this.game.evaluationDate;
    this.game.objectives = [
      {
        id: recommendedKey,
        label: `Recuperar ${recommendedLabel.toLowerCase()}`,
        description:
          `Priorize ${recommendedLabel.toLowerCase()} e leve o indicador a pelo menos ` +
          Math.ceil(recommendedValue + 3) +
          '.',
        type: 'INDICATOR',
        target: Math.ceil(recommendedValue + 3),
        current: recommendedValue,
        status: 'IN_PROGRESS',
      },
      {
        id: 'stable-trust',
        label: 'Aumentar a confiança histórica',
        description: 'Eleve a aprovação geral em pelo menos 3 pontos.',
        type: 'APPROVAL',
        target: Math.ceil(approval + 3),
        current: approval,
        status: 'IN_PROGRESS',
      },
      {
        id: 'sustainable-cash',
        label: 'Preservar sustentabilidade fiscal',
        description: 'Termine o ciclo sem caixa negativo.',
        type: 'TREASURY',
        target: 0,
        current: this.game.treasury,
        status: 'IN_PROGRESS',
      },
    ];
    this.game.history.unshift(
      `${this.game.currentDate}: o governo iniciou um novo ciclo de planejamento de 30 dias.`,
    );
    this.game.legacy ??= [];
    this.game.legacy.unshift(
      cycleScore >= 80
        ? 'O novo ciclo começou com crédito social acumulado pelo bom desempenho do governo anterior.'
        : cycleScore < 60
          ? 'O novo ciclo começou sob desconfiança social; será preciso reconstruir apoio antes de ampliar a agenda.'
          : 'O novo ciclo começou com confiança social dividida e margem limitada para erros.',
    );
    this.game.legacy = this.game.legacy.slice(0, 6);
    this.feedback =
      'Novo ciclo iniciado. As decisões anteriores continuam produzindo efeitos.';
    this.save();
  }
  beginElection() {
    if (!this.game?.evaluation || this.electionState) return;
    const evaluation = this.game.evaluation;
    this.electionState = this.electionEngine.start({
      approval: this.game.approval,
      socialSatisfaction: evaluation.socialTrust ?? this.averageSocialSatisfaction(),
      completedProjects: (this.game.projects ?? []).filter((project) => project.status === 'COMPLETED').length,
      delayedProjects: (this.game.projects ?? []).filter((project) => project.risk === 'DELAYED').length,
      fiscalStability: evaluation.fiscalStability ?? this.game.fiscalStability ?? 50,
      activeFocus: this.game.activeFocus,
    }, this.game.mayorName);
    this.persistElectionState();
  }
  startCampaign() {
    if (this.electionState?.phase === 'PRE_CAMPAIGN') {
      this.electionState = this.electionEngine.beginCampaign(this.electionState);
      this.persistElectionState();
    }
  }
  runCampaignAction(action: CampaignAction) {
    if (!this.game || !this.electionState) return;
    this.electionState = this.electionEngine.campaign(this.electionState, action, {
      approval: this.game.approval,
      socialSatisfaction: this.averageSocialSatisfaction(),
      completedProjects: (this.game.projects ?? []).filter((project) => project.status === 'COMPLETED').length,
      delayedProjects: (this.game.projects ?? []).filter((project) => project.risk === 'DELAYED').length,
      fiscalStability: this.game.fiscalStability ?? 50,
    });
    this.persistElectionState();
  }

  campaignActionLabel(action: string) {
    return ({
      MEET_GROUPS: 'Escuta com grupos sociais',
      VISIT_PROJECT: 'Visita a uma entrega',
      CRISIS_COMMUNICATION: 'Comunicação em crise',
      NEW_PROMISE: 'Nova promessa de campanha',
      ACCOUNTABILITY: 'Prestação de contas',
      PROPOSAL: 'Apresentação de proposta',
      ADMIT_FAILURE: 'Reconhecimento de falhas',
      ATTACK: 'Ataque à oposição',
    } as Record<string, string>)[action] ?? action;
  }
  answerElectionDebate(response: 'ACCOUNTABILITY' | 'ATTACK' | 'PROPOSAL' | 'ADMIT_FAILURE') {
    if (!this.game || !this.electionState) return;
    this.electionState = this.electionEngine.debate(this.electionState, response, {
      approval: this.game.approval, socialSatisfaction: this.averageSocialSatisfaction(), completedProjects: 0, delayedProjects: 0, fiscalStability: this.game.fiscalStability ?? 50,
    });
    if (this.electionState.phase === 'RESULT') this.electionState = this.electionEngine.result(this.electionState);
    this.persistElectionState();
  }
  electionPoll() {
    return this.electionState ? this.electionEngine.poll(this.electionState) : undefined;
  }
  private averageSocialSatisfaction() {
    const groups = this.game?.groups ?? [];
    return groups.length ? groups.reduce((sum, group) => sum + group.satisfaction, 0) / groups.length : this.game?.approval ?? 50;
  }
  private normalizeElectionState(state?: ElectionState): ElectionState | undefined {
    if (!state) return undefined;
    return { ...state, history: state.history ?? [], pollHistory: state.pollHistory ?? [], incumbentAgenda: state.incumbentAgenda ?? [], promises: state.promises ?? [] };
  }
  promiseEffects(effects: Record<string, number>) {
    const labels: Record<string, string> = { residents: 'moradores', workers: 'servidores', business: 'comerciantes', families: 'famílias' };
    return Object.entries(effects).map(([group, value]) => `${labels[group] ?? group} +${value.toFixed(1).replace('.', ',')}`).join(' · ');
  }
  private persistElectionState() {
    if (!this.game || !this.electionState) return;
    if (this.onlineMode && this.api && (this.game as any).id) {
      this.game.electionState = JSON.parse(JSON.stringify(this.electionState)) as ElectionState;
      this.api.saveElection((this.game as any).id, this.electionState).subscribe({
        error: () => { this.feedback = 'A eleição foi atualizada nesta tela, mas não foi salva na API.'; },
      });
      return;
    }
    this.game.electionState = JSON.parse(JSON.stringify(this.electionState)) as ElectionState;
    this.save();
  }
  projectProgress(project: { daysCompleted: number; daysTotal: number }) {
    return Math.round((project.daysCompleted / project.daysTotal) * 100);
  }
  isContinuationCycle() {
    return !!this.game && this.game.currentDate > '2025-01-14' && !this.game.evaluation;
  }
  continuationBrief() {
    if (!this.game) return [] as string[];
    const active = (this.game.projects ?? []).filter((item) => item.status === 'IN_PROGRESS');
    const delayed = active.filter((item) => item.risk === 'DELAYED').length;
    const weakest = [...(this.game.indicators ?? [])].sort((a, b) => a.value - b.value)[0];
    const result = [`Este ciclo começou com ${active.length} projeto(s) herdado(s) em execução.`];
    if (delayed) result.push(`${delayed} projeto(s) já exige(m) atenção por atraso administrativo.`);
    if (weakest) result.push(`Prioridade inicial sugerida: ${weakest.label.toLowerCase()} (${weakest.value.toFixed(1)}).`);
    result.push(`Há R$ ${(this.game.treasury ?? 0).toLocaleString('pt-BR')} disponíveis no caixa para as próximas decisões.`);
    return result;
  }
  projectDaysRemaining(project: { daysCompleted: number; daysTotal: number }) {
    return Math.max(0, Math.ceil(project.daysTotal - project.daysCompleted));
  }
  projectOperationalDaysRemaining(project: SimulationProject) {
    const raw = this.projectDaysRemaining(project);
    if (project.status !== 'IN_PROGRESS' || raw === 0) return raw;
    const key = project.area === 'Transporte' ? 'transport' : project.area === 'Saúde' ? 'health' : project.area === 'Educação' ? 'education' : project.area === 'Segurança' ? 'security' : 'infrastructure';
    const secretary = this.game?.secretaries?.find((item) => item.key === key);
    const efficiency = secretary?.efficiency ?? 70;
    const speed = Math.max(0.5, efficiency / 70) * (project.risk === 'DELAYED' ? 0.75 : 1) * (project.priorityMode === 'PRIORITARIA' ? 1.35 : 1);
    return Math.max(1, Math.ceil(raw / speed));
  }
  activeProjectDailyCost() {
    return (this.game?.projects ?? [])
      .filter((project) => project.status === 'IN_PROGRESS')
      .reduce((total, project) => total + (project.dailyExecutionCost ?? 0) + (project.priorityMode === 'PRIORITARIA' ? 5000 : 0), 0);
  }
  persistViewPreferences() {
    localStorage.setItem('mandato-project-view', this.projectView);
    localStorage.setItem('mandato-project-sort', this.projectSort);
    localStorage.setItem('mandato-milestone-filter', this.milestoneFilter);
  }
  visibleProjects() {
    const projects = (this.game?.projects ?? []).filter((project) =>
      this.projectView === 'ACTIVE'
        ? project.status === 'IN_PROGRESS'
        : this.projectView === 'RISK'
          ? project.risk === 'DELAYED'
          : true,
    );
    return [...projects].sort((a, b) => {
      if (this.projectSort === 'COST') return (b.dailyExecutionCost ?? 0) - (a.dailyExecutionCost ?? 0);
      if (this.projectSort === 'DEADLINE') return this.projectDaysRemaining(a) - this.projectDaysRemaining(b);
      const risk = (value: typeof a) => (value.risk === 'DELAYED' ? 2 : value.priorityMode === 'PRIORITARIA' ? 1 : 0);
      return risk(b) - risk(a);
    });
  }
  projectScenario(project: SimulationProject) {
    if (project.status !== 'IN_PROGRESS') return 'Cenário 30 dias: obra concluída · manutenção vigente';
    const priority = project.priorityMode === 'PRIORITARIA';
    const daily = (project.dailyExecutionCost ?? 0) + (priority ? 5000 : 0);
    const indicatorKey = project.area === 'Transporte' ? 'transport' : 'infrastructure';
    const indicator = this.game?.indicators.find((item) => item.key === indicatorKey);
    const change = (project.dailyIndicatorEffects?.[indicatorKey] ?? (indicatorKey === 'transport' ? 0.04 : 0.03)) * 30;
    const social = Object.values(project.dailyGroupEffects ?? {}).reduce<number>((sum, value) => sum + Number(value), 0) * 30;
    const capacity = priority ? -3 : -1.5;
    const operational = this.projectSecretaryLabel(project);
    const operationalDays = this.projectOperationalDaysRemaining(project);
    return `Cenário 30 dias: caixa −R$ ${(daily * 30).toLocaleString('pt-BR')} · ${indicator?.label ?? indicatorKey} +${change.toFixed(1)} · satisfação social ${social >= 0 ? '+' : ''}${social.toFixed(1)} · capacidade ${capacity.toFixed(1)} · prazo operacional ${operationalDays} dia(s)${operational ? ` · ${operational}` : ''}`;
  }
  projectSecretaryLabel(project: SimulationProject) {
    const key = project.area === 'Transporte' ? 'transport' : project.area === 'Saúde' ? 'health' : project.area === 'Educação' ? 'education' : project.area === 'Segurança' ? 'security' : 'infrastructure';
    const secretary = this.game?.secretaries?.find((item) => item.key === key);
    return secretary ? `${secretary.label}: ${this.secretaryOperationalLabel(secretary)}` : '';
  }
  projectGroupLabels(project: SimulationProject) {
    const labels: Record<string, string> = { residents: 'moradores', families: 'famílias', business: 'comércio', vulnerable: 'vulneráveis', workers: 'trabalhadores' };
    return Object.entries(project.dailyGroupEffects ?? {})
      .map(([key, value]) => `${labels[key] ?? key} ${Number(value) >= 0 ? '+' : ''}${Number(value).toFixed(2)}/dia`)
      .join(' · ');
  }
  projectProtection(project: SimulationProject) {
    if (project.status !== 'IN_PROGRESS') return '';
    if (project.risk === 'DELAYED') return 'Proteção suspensa: o atraso reduziu a resiliência desta frente.';
    if (project.area === 'Infraestrutura') return 'Proteção ativa: reduz o risco de novas crises climáticas.';
    if (project.area === 'Transporte') return 'Proteção ativa: reduz o risco de novas interrupções de linha.';
    return '';
  }
  comparisonProjects() {
    return (this.game?.projects ?? [])
      .filter((project) => project.status === 'IN_PROGRESS')
      .sort((a, b) => (b.priorityMode === 'PRIORITARIA' ? 1 : 0) - (a.priorityMode === 'PRIORITARIA' ? 1 : 0))
      .slice(0, 2);
  }
  projectIndicatorReturn(project: SimulationProject) {
    const key = project.area === 'Transporte' ? 'transport' : 'infrastructure';
    return ((project.dailyIndicatorEffects?.[key] ?? (key === 'transport' ? 0.04 : 0.03)) * 30).toFixed(1);
  }
  projectRecommendation(project: SimulationProject) {
    if (project.risk === 'DELAYED') return 'Mais urgente: risco administrativo ativo.';
    const days = this.projectOperationalDaysRemaining(project);
    const daily = (project.dailyExecutionCost ?? 0) + (project.priorityMode === 'PRIORITARIA' ? 5000 : 0);
    const returnPerCost = Number(this.projectIndicatorReturn(project)) / Math.max(1, daily / 10000);
    if (days <= 3) return 'Entrega mais rápida: conclusão próxima.';
    if (returnPerCost >= 0.8) return 'Melhor retorno relativo ao custo.';
    return 'Ritmo equilibrado: acompanhar capacidade e caixa.';
  }
  portfolioSummary() {
    const active = this.comparisonProjects().length ? (this.game?.projects ?? []).filter((project) => project.status === 'IN_PROGRESS') : [];
    const dailyCost = active.reduce((sum, project) => sum + (project.dailyExecutionCost ?? 0) + (project.priorityMode === 'PRIORITARIA' ? 5000 : 0), 0);
    const riskCount = active.filter((project) => project.risk === 'DELAYED').length;
    const returnTotal = active.reduce((sum, project) => sum + Number(this.projectIndicatorReturn(project)), 0);
    const capacity = active.reduce((sum, project) => sum + (project.priorityMode === 'PRIORITARIA' ? 3 : 1.5), 0);
    const executionForecast = active.reduce((sum, project) => sum + ((project.dailyExecutionCost ?? 0) + (project.priorityMode === 'PRIORITARIA' ? 5000 : 0)) * Math.min(30, this.projectOperationalDaysRemaining(project)), 0);
    const maintenanceForecast = (this.game?.projects ?? []).filter((project) => project.status === 'COMPLETED' && project.maintenanceMode !== 'ADIADA').reduce((sum, project) => sum + (project.maintenanceCost ?? 0) * (project.maintenanceMode === 'REDUZIDA' ? 0.5 : 1) * 30, 0);
    return { active: active.length, dailyCost, riskCount, capacity, returnPerCost: dailyCost ? returnTotal / (dailyCost / 10000) : 0, forecast30: executionForecast + maintenanceForecast };
  }
  portfolioStatus() {
    const summary = this.portfolioSummary();
    const capacity = this.game?.administrativeCapacity ?? 100;
    if (summary.riskCount > 0 || capacity < 45 || summary.capacity > 8)
      return { label: 'Sobrecarregado', reason: 'Há risco ativo ou a capacidade comprometida ultrapassou a margem operacional.' };
    if (capacity < 70 || summary.active > 1 || summary.capacity > 4)
      return { label: 'Pressionado', reason: 'O portfólio exige acompanhamento próximo de caixa e capacidade administrativa.' };
    return { label: 'Saudável', reason: 'Há margem administrativa para acompanhar as frentes atuais.' };
  }
  portfolioForecastStatus() {
    const forecast = this.portfolioSummary().forecast30;
    const treasury = this.game?.treasury ?? 0;
    if (!forecast) return 'Sem compromissos projetados para os próximos 30 dias.';
    if (forecast > treasury) return 'Atenção: a projeção supera o caixa disponível.';
    if (forecast > treasury * 0.6) return 'Cautela: a projeção consome mais de 60% do caixa disponível.';
    return 'Margem preservada: a projeção cabe no caixa atual.';
  }
  portfolioForecastClass() {
    const forecast = this.portfolioSummary().forecast30;
    const treasury = this.game?.treasury ?? 0;
    if (forecast > treasury) return 'critical';
    if (forecast > treasury * 0.6) return 'caution';
    return 'safe';
  }
  capacityTrend() {
    const snapshots = this.game?.snapshots ?? [];
    if (snapshots.length < 2) return { label: 'Sem histórico', detail: 'Avance mais um dia para calcular a tendência.' };
    const current = snapshots[snapshots.length - 1].administrativeCapacity ?? this.game?.administrativeCapacity ?? 100;
    const previous = snapshots[snapshots.length - 2].administrativeCapacity ?? current;
    const delta = current - previous;
    if (delta > 0) return { label: 'Recuperando', detail: `+${delta} ponto(s) desde o último dia.` };
    if (delta < 0) return { label: 'Em desgaste', detail: `${delta} ponto(s) desde o último dia.` };
    return { label: 'Estável', detail: 'Sem variação desde o último dia.' };
  }
  priorityQueue() {
    if (!this.game) return [] as { id: string; title: string; type: string; reason: string; score: number }[];
    const items: { id: string; title: string; type: string; reason: string; score: number }[] = [];
    for (const decision of (this.game.decisions ?? []).filter((item) => item.status === 'PENDING')) {
      items.push({ id: `decision-${decision.id}`, title: decision.title, type: 'Decisão', reason: 'Há uma escolha do gabinete aguardando resposta.', score: 80 });
    }
    for (const project of (this.game.projects ?? []).filter((item) => item.status === 'IN_PROGRESS' && item.risk === 'DELAYED')) {
      items.push({ id: `project-${project.id}`, title: project.name, type: 'Projeto', reason: 'A obra está atrasada e consome capacidade administrativa.', score: 72 });
    }
    for (const secretary of (this.game.secretaries ?? []).filter((item: any) => item.pressure >= 75)) {
      items.push({ id: `secretary-${secretary.key}`, title: secretary.label, type: 'Secretaria', reason: `Pressão operacional em ${Math.round(secretary.pressure)}%.`, score: 55 + Math.min(20, secretary.pressure - 75) });
    }
    if ((this.game.fiscalStability ?? 100) < 60) {
      items.push({ id: 'budget-panel', title: 'Margem fiscal', type: 'Finanças', reason: 'A sustentabilidade fiscal está abaixo da margem de segurança.', score: 68 });
    }
    return items.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, 5);
  }
  focusPriority(item: { id: string; title: string }) {
    if (item.id.startsWith('decision-')) {
      this.selectedCabinetDecisionId = item.id.slice('decision-'.length);
      setTimeout(() => {
        const target = document.getElementById(item.id);
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target?.focus({ preventScroll: true });
      });
    } else {
      const target = document.getElementById(item.id);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target?.focus({ preventScroll: true });
    }
    this.feedback = `Abrindo: ${item.title}.`;
  }
  recentConsequences() {
    const entries = (this.game?.history ?? []).filter((entry) =>
      /após|depois|consequ|pressão|melhor|pior|atras|estabiliz|crise|satisfação/i.test(entry),
    );
    return entries.slice(0, 4).map((entry) => {
      const separator = entry.indexOf(': ');
      return {
        date: separator >= 0 ? entry.slice(0, separator) : '',
        text: separator >= 0 ? entry.slice(separator + 2) : entry,
      };
    });
  }
  consequenceChains() {
    if (this.game?.causalLinks?.length) {
      return this.game.causalLinks.slice(0, 6).map((link) => {
        const decision = (this.game?.decisions ?? []).find((item) => item.id === link.decisionId);
        const parent = decision?.parentDecisionId ? (this.game?.decisions ?? []).find((item) => item.id === decision.parentDecisionId) : undefined;
        const depth = this.decisionChainDepth(decision?.id);
        return {
        date: link.date,
        cause: `Decisão: ${link.cause}`,
        effect: link.observedEffect ? `${link.effect} → ${link.observedEffect}` : link.effect,
        signal: link.signal,
        groups: (link.affectedGroups ?? []).map((key) => this.groupLabel(key)).join(', '),
        groupImpact: this.groupImpact(link.groupEffects),
        objectives: (link.objectiveIds ?? []).map((id) => (this.game?.objectives ?? []).find((item) => item.id === id)?.label ?? this.objectiveLabel(id)).join(', '),
        continuation: /^\w+-followup-/.test(link.decisionId ?? ''),
        origin: parent ? `Origem: ${parent.title}` : '',
        depth,
      }; });
    }
    const snapshots = this.game?.snapshots ?? [];
    const decisions = (this.game?.decisions ?? []).filter((item) => item.status === 'RESOLVED' && item.resolvedDate);
    const start = Math.max(0, snapshots.length - 6);
    return snapshots.slice(start).map((snapshot, index) => {
      const previous = snapshots[Math.max(0, start + index - 1)] ?? snapshot;
      const decision = decisions.find((item) => item.resolvedDate === snapshot.date);
      const approvalDelta = snapshot.approval - previous.approval;
      const serviceDelta = snapshot.serviceQuality - previous.serviceQuality;
      const direction = approvalDelta >= 0 ? 'confiança em alta' : 'confiança em queda';
      return {
        date: snapshot.date,
        cause: decision ? `Decisão: ${decision.title}` : 'Efeitos acumulados do governo',
        effect: `Serviços ${serviceDelta >= 0 ? '+' : ''}${serviceDelta.toFixed(1)} · aprovação ${approvalDelta >= 0 ? '+' : ''}${approvalDelta.toFixed(1)}`,
        signal: direction,
        groups: '',
        groupImpact: '',
        objectives: '',
        continuation: false,
        origin: '',
        depth: 0,
      };
    });
  }
  groupLabel(key: string) {
    const labels: Record<string, string> = { residents: 'moradores', families: 'famílias', business: 'comércio', vulnerable: 'população vulnerável', workers: 'trabalhadores' };
    return labels[key] ?? key;
  }
  decisionChainDepth(decisionId?: string, visited = new Set<string>()): number {
    if (!decisionId || visited.has(decisionId)) return 0;
    const decision = (this.game?.decisions ?? []).find((item) => item.id === decisionId);
    if (!decision?.parentDecisionId) return 0;
    visited.add(decisionId);
    return Math.min(4, 1 + this.decisionChainDepth(decision.parentDecisionId, visited));
  }
  optionAffectedGroups(option: { groupEffects?: Record<string, number> }) {
    return Object.keys(option.groupEffects ?? {}).map((key) => this.groupLabel(key)).join(', ');
  }
  socialDecisionSummary(decision: SimulationDecision) {
    if (!decision.id.startsWith('social-recovery-project') && !decision.id.startsWith('social-reaction-')) return '';
    const group = Object.keys(decision.options[0]?.groupEffects ?? {})[0];
    return group ? `Pressão social · grupo afetado: ${this.groupLabel(group)}` : 'Pressão social persistente';
  }
  optionObjectives(option: { id: string }, decision: { title: string }) {
    const text = `${option.id} ${decision.title}`.toLowerCase();
    const ids = [
      /saúde|hospital|health/.test(text) ? 'health' : '', /educa|escola|merenda/.test(text) ? 'education' : '',
      /transporte|ônibus|mobilidade/.test(text) ? 'transport' : '', /infraestrutura|drenagem|iluminação/.test(text) ? 'infrastructure' : '',
      /segurança|polícia|iluminação/.test(text) ? 'security' : '', /aprovação|confiança|comunica|approval/.test(text) ? 'approval' : '',
      /caixa|fiscal|dívida|treasury/.test(text) ? 'treasury' : '',
    ].filter(Boolean);
    return [...new Set(ids)].map((id) => this.game?.objectives?.find((item) => item.id === id)?.label ?? this.objectiveLabel(id)).join(', ');
  }
  groupImpact(effects?: Record<string, number>) {
    return Object.entries(effects ?? {}).map(([key, value]) => `${this.groupLabel(key)} ${value > 0 ? '+' : ''}${value.toFixed(1)}`).join(' · ');
  }
  objectiveLabel(id: string) {
    const labels: Record<string, string> = { health: 'saúde', education: 'educação', transport: 'transporte', infrastructure: 'infraestrutura', security: 'segurança', approval: 'aprovação', treasury: 'caixa' };
    return labels[id] ?? id;
  }
  accumulatedPatterns() {
    const resolved = (this.game?.decisions ?? []).filter((item) => item.status === 'RESOLVED').slice(-10);
    const deferred = resolved.filter((item) => /deny|defer|delay|ignore|preserve|accept-overload|reduce|reduced/i.test(item.chosenOptionId ?? ''));
    const constructive = resolved.filter((item) => /hire|authorize|invest|reinforce|reorganize|prevent|prioritize|expand|emergency/i.test(item.chosenOptionId ?? ''));
    const patterns: { label: string; detail: string; count: number }[] = [];
    if (deferred.length >= 2) patterns.push({ label: 'Padrão de adiamento', detail: `${deferred.length} decisões recentes priorizaram preservar margem ou postergar ação.`, count: deferred.length });
    if (constructive.length >= 2) patterns.push({ label: 'Padrão de investimento', detail: `${constructive.length} decisões recentes priorizaram resposta direta e recuperação de serviços.`, count: constructive.length });
    return patterns.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }
  planningTransitions() {
    return (this.game?.history ?? [])
      .filter((entry) => entry.includes('Transição de planejamento:'))
      .slice(0, 6);
  }
  planningMilestones() {
    const markers = ['Transição de planejamento:', 'Obra entregue:', 'Alerta de projeto:', 'Manutenção:', 'Fechamento mensal:', 'Renegociação'];
    return (this.game?.history ?? []).filter((entry) => markers.some((marker) => entry.includes(marker))).slice(0, 12);
  }
  filteredMilestones() {
    const entries = this.planningMilestones();
    if (this.milestoneFilter === 'ALL') return entries;
    const markers: Record<string, string[]> = {
      WORKS: ['Obra entregue:', 'Alerta de projeto:', 'Manutenção:'],
      ADMIN: ['Transição de planejamento:', 'revisão', 'capacidade'],
      FINANCE: ['Fechamento mensal:', 'Renegociação', 'dívida', 'caixa'],
      SOCIETY: ['satisfação', 'população', 'grupo social'],
    };
    return entries.filter((entry) => markers[this.milestoneFilter].some((marker) => entry.toLowerCase().includes(marker.toLowerCase())));
  }
  changeMilestoneFilter(filter: 'ALL' | 'WORKS' | 'ADMIN' | 'FINANCE' | 'SOCIETY') {
    this.milestoneFilter = filter;
    this.milestonePage = 0;
    this.persistViewPreferences();
  }
  milestonePageItems() {
    const entries = this.filteredMilestones();
    const pageCount = Math.max(1, Math.ceil(entries.length / 4));
    this.milestonePage = Math.min(this.milestonePage, pageCount - 1);
    return entries.slice(this.milestonePage * 4, this.milestonePage * 4 + 4);
  }
  milestonePageCount() { return Math.max(1, Math.ceil(this.filteredMilestones().length / 4)); }
  previousMilestonePage() { this.milestonePage = Math.max(0, this.milestonePage - 1); }
  nextMilestonePage() { this.milestonePage = Math.min(this.milestonePageCount() - 1, this.milestonePage + 1); }
  reset() {
    if (confirm('Apagar a partida salva e voltar ao início?')) {
      this.repository.clear();
      localStorage.removeItem('mandato-api-game-id');
      this.game = null;
      this.feedback = '';
      }
    }
  exportSave() {
    if (!this.game) return;
    const blob = new Blob([JSON.stringify(this.game, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mandato-${this.game.cityName.toLowerCase().replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    this.feedback = 'Backup da partida exportado.';
  }
  importSave(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (
          !parsed?.cityName ||
          !parsed?.currentDate ||
          !Array.isArray(parsed?.indicators) ||
          !Array.isArray(parsed?.decisions)
        )
          throw new Error('formato');
        if (typeof parsed.saveVersion === 'number' && parsed.saveVersion > 2)
          throw new Error('versão futura');
        this.game = parsed as Game;
        this.save();
        this.feedback = 'Partida restaurada com sucesso.';
      } catch {
        this.feedback = 'Não foi possível importar este arquivo de partida.';
      }
      input.value = '';
    };
    reader.readAsText(file);
  }
  daysRemaining() {
    return this.game
      ? Math.ceil(
          (Date.parse(`${this.game.mandateEndDate}T00:00:00Z`) -
            Date.parse(`${this.game.currentDate}T00:00:00Z`)) /
            86400000,
        )
      : 0;
  }
  projectedMonthlyBalance() {
    return this.game
      ? this.projectedMonthlyRevenue() - this.budgetTotal() * 30
      : 0;
  }
  projectedMonthlyRevenue() {
    return this.game?.revenueSources
      ? Object.values(this.game.revenueSources).reduce(
          (total, value) => total + value,
          0,
        )
      : 8500000;
  }
  financialStatus() {
    const balance = this.projectedMonthlyBalance();
    return balance > 0 && this.fiscalStability() >= 60
      ? 'equilibrado'
      : 'sob pressão';
  }
  budgetTotal() {
    return (
      this.game?.budget?.reduce((total, line) => total + line.dailyCost, 0) ??
      this.game?.dailyOperatingCost ??
      18000
    );
  }
  budgetImpact(key: string) {
    const baseline: Record<string, number> = {
      health: 6000,
      education: 5000,
      infrastructure: 3000,
      transport: 2500,
      security: 1500,
    };
    const line = this.game?.budget?.find((item) => item.key === key);
    if (!line) return 'sem dados';
    const ratio = line.dailyCost / (baseline[key] ?? line.dailyCost);
    return ratio < 0.9
      ? 'pressão tende a subir'
      : ratio > 1.1
        ? 'capacidade tende a melhorar'
        : 'nível equilibrado';
  }
  budgetPreview(key: string, delta: number) {
    const line = this.game?.budget?.find((item) => item.key === key);
    if (!line) return '';
    const monthly = Math.abs(delta) * 30;
    const direction = delta > 0 ? 'investe' : 'economiza';
    const service = delta > 0 ? 'tende a recuperar capacidade' : 'pode aumentar a pressão';
    return `${direction} R$ ${monthly.toLocaleString('pt-BR')} em 30 dias · ${service}`;
  }
  secretaryState(value: number) {
    return value >= 70 ? 'sob pressão' : value >= 45 ? 'em atenção' : 'estável';
  }
  secretaryRecoveryLabel(key: string) {
    const days = this.game?.secretaryRecoveryDays?.[key] ?? 0;
    return days > 0 ? `recuperação em curso · ${days} dia(s) restante(s)` : '';
  }
  secretaryOperationalLabel(secretary: { pressure: number; efficiency: number }) {
    if (secretary.pressure >= 75) return 'pressão reduz o ritmo das entregas';
    if (secretary.efficiency >= 75) return 'capacidade favorece a execução';
    return 'ritmo operacional equilibrado';
  }
  objectiveProgress(objective: { current: number; target: number }) {
    if (objective.target === 0) return objective.current >= 0 ? 100 : 0;
    return Math.min(
      100,
      Math.round((objective.current / objective.target) * 100),
    );
  }
  objectiveStatusLabel(status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED') {
    return status === 'COMPLETED' ? 'CONCLUÍDA' : status === 'FAILED' ? 'NÃO CONCLUÍDA' : 'EM ANDAMENTO';
  }
  objectivesByStatus(status: 'COMPLETED' | 'FAILED') {
    return (
      this.game?.objectives?.filter(
        (objective) => objective.status === status,
      ) ?? []
    );
  }
  populationTrendLabel() {
    const trend = this.game?.populationTrend ?? 0;
    return trend > 0
      ? `crescimento de ${trend} habitantes`
      : trend < 0
        ? `redução de ${-trend} habitantes`
        : 'estável';
  }
  pendingDecisions() {
    return (
      this.game?.decisions.filter((decision) => decision.status === 'PENDING')
        .length ?? 0
    );
  }
  resolvedDecisionDates() {
    return (this.game?.decisions ?? []).filter((decision) => decision.resolvedDate);
  }
  decisionHistoryPageItems() {
    const decisions = this.game?.decisions ?? [];
    this.decisionHistoryPage = Math.min(this.decisionHistoryPage, Math.max(0, Math.ceil(decisions.length / 6) - 1));
    const start = this.decisionHistoryPage * 6;
    return decisions.slice(start, start + 6);
  }
  decisionHistoryPageCount() {
    return Math.max(1, Math.ceil((this.game?.decisions.length ?? 0) / 6));
  }
  previousDecisionHistoryPage() {
    this.decisionHistoryPage = Math.max(0, this.decisionHistoryPage - 1);
  }
  nextDecisionHistoryPage() {
    this.decisionHistoryPage = Math.min(this.decisionHistoryPageCount() - 1, this.decisionHistoryPage + 1);
  }
  mostUrgentPendingDecision() {
    return this.cabinetDecisions().find(
      (decision) => decision.status === 'PENDING',
    );
  }
  cabinetDecisions() {
    const urgency: Record<string, number> = { ALTA: 0, MÉDIA: 1, BAIXA: 2 };
    return [...(this.game?.decisions ?? [])].sort((a, b) => {
      const pendingOrder =
        Number(a.status !== 'PENDING') - Number(b.status !== 'PENDING');
      if (pendingOrder !== 0) return pendingOrder;
      const urgencyOrder =
        (urgency[a.urgency ?? 'MÉDIA'] ?? 1) -
        (urgency[b.urgency ?? 'MÉDIA'] ?? 1);
      if (urgencyOrder !== 0) return urgencyOrder;
      return (b.createdDate ?? b.resolvedDate ?? '').localeCompare(
        a.createdDate ?? a.resolvedDate ?? '',
      );
    });
  }
  cabinetDisplayDecisions() {
    const decisions = this.cabinetDecisions();
    const selected = decisions.find((decision) => decision.id === this.selectedCabinetDecisionId);
    return selected?.status === 'PENDING' ? [selected] : decisions.slice(0, 1);
  }
  cabinetPendingDecisions() {
    return this.cabinetDecisions().filter((decision) => decision.status === 'PENDING');
  }
  cabinetDecisionPosition() {
    const pending = this.cabinetPendingDecisions();
    const current = pending.findIndex((decision) => decision.id === this.selectedCabinetDecisionId);
    return current < 0 ? 0 : current;
  }
  previousCabinetDecision() {
    const pending = this.cabinetPendingDecisions();
    if (!pending.length) return;
    const index = this.cabinetDecisionPosition();
    this.selectedCabinetDecisionId = pending[(index - 1 + pending.length) % pending.length].id;
  }
  nextCabinetDecision() {
    const pending = this.cabinetPendingDecisions();
    if (!pending.length) return;
    const index = this.cabinetDecisionPosition();
    this.selectedCabinetDecisionId = pending[(index + 1) % pending.length].id;
  }
  attentionItems() {
    if (!this.game) return [];
    const items: string[] = [];
    this.cabinetDecisions()
      .filter((decision) => decision.status === 'PENDING')
      .forEach((decision) => items.push(`Decisão pendente: ${decision.title}`));
    if (this.game.fiscalAlert) items.push(`Finanças: ${this.game.fiscalAlert}`);
    (this.game.administrativeAlerts ?? [])
      .slice(0, 3)
      .forEach((alert) => items.push(`Administração: ${alert}`));
    (this.game.projects ?? [])
      .filter((project) => project.status === 'IN_PROGRESS')
      .forEach((project) =>
        items.push(
          `Projeto em execução: ${project.name} (${this.projectProgress(project)}%)`,
        ),
      );
    (this.game.projects ?? [])
      .filter(
        (project) =>
          project.status === 'COMPLETED' && project.risk === 'DELAYED',
      )
      .forEach((project) =>
        items.push(`Manutenção pendente: ${project.name} está em risco`),
      );
    this.game.indicators
      .filter((indicator) => indicator.trend < 0)
      .forEach((indicator) =>
        items.push(`Indicador em queda: ${indicator.label}`),
      );
    return items.slice(0, 6);
  }
  ledgerTotal(kind: 'INCOME' | 'EXPENSE') {
    return (
      this.game?.ledger
        ?.filter((entry) => entry.kind === kind)
        .reduce((total, entry) => total + entry.amount, 0) ?? 0
    );
  }
  treasuryDelta() {
    return this.game
      ? this.game.treasury - (this.game.initialTreasury ?? this.game.treasury)
      : 0;
  }
  netLedger() {
    return this.ledgerTotal('INCOME') - this.ledgerTotal('EXPENSE');
  }
  categoryTotal(category: 'OPERATION' | 'DECISION' | 'REVENUE' | 'PROJECT') {
    return (
      this.game?.ledger
        ?.filter(
          (entry) =>
            entry.category === category ||
            (category === 'DECISION' && entry.label.startsWith('Decisão:')),
        )
        .reduce((total, entry) => total + entry.amount, 0) ?? 0
    );
  }
  categoryShare(category: 'OPERATION' | 'DECISION' | 'PROJECT') {
    const total = ['OPERATION', 'DECISION', 'PROJECT']
      .map((item) => this.categoryTotal(item as 'OPERATION' | 'DECISION' | 'PROJECT'))
      .reduce((sum, value) => sum + value, 0);
    return total ? (this.categoryTotal(category) / total) * 100 : 0;
  }
  filteredLedger() {
    return (this.game?.ledger ?? [])
      .filter(
        (entry) =>
          this.ledgerFilter === 'ALL' || entry.kind === this.ledgerFilter,
      )
      .slice(0, 8);
  }
  ledgerBar(entry: { amount: number }) {
    const maximum = Math.max(
      ...(this.game?.ledger ?? []).map((item) => item.amount),
      1,
    );
    return Math.max(8, Math.round((entry.amount / maximum) * 100));
  }
  ledgerTimeline() {
    const days = new Map<string, number>();
    for (const entry of this.game?.ledger ?? [])
      days.set(
        entry.date,
        (days.get(entry.date) ?? 0) +
          (entry.kind === 'INCOME' ? entry.amount : -entry.amount),
      );
    return [...days.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 10)
      .map(([date, net]) => ({ date, net }));
  }
  timelineBar(net: number) {
    const maximum = Math.max(
      ...this.ledgerTimeline().map((item) => Math.abs(item.net)),
      1,
    );
    return Math.max(8, Math.round((Math.abs(net) / maximum) * 100));
  }
  adjustBudget(key: string, delta: number) {
    const line = this.game?.budget?.find((item) => item.key === key);
    if (!line) return;
    if (this.onlineMode && this.api) {
      if (this.onlineBusy) return;
      this.onlineBusy = true;
      this.api.adjustBudget((this.game as any).id, key, delta, crypto.randomUUID()).subscribe({
        next: (game) => {
          this.game = this.fromApiGame(game);
          this.electionState = this.normalizeElectionState(this.game.electionState);
          this.connectionStatus = 'ONLINE';
          this.onlineBusy = false;
          const updated = this.game.budget?.find((item) => item.key === key);
          this.feedback = `${updated?.label ?? line.label}: orçamento ajustado para R$ ${(updated?.dailyCost ?? 0).toLocaleString('pt-BR')}/dia.`;
        },
        error: () => {
          this.onlineBusy = false;
          this.connectionStatus = 'UNAVAILABLE';
          this.feedback = 'A API não conseguiu ajustar o orçamento.';
        },
      });
      return;
    }
    applySharedBudgetAdjustment(this.game as any, key as any, delta);
    this.feedback = `${line.label}: orçamento ajustado para R$ ${line.dailyCost.toLocaleString('pt-BR')}/dia.`;
    this.save();
  }
  private save() {
    if (this.game) {
      this.game.saveVersion = 2;
      this.game.initialTreasury ??= this.game.treasury;
      this.game.groups?.forEach(
        (group) =>
          (group.populationWeight ??=
            (
              {
                residents: 0.4,
                workers: 0.2,
                business: 0.15,
                families: 0.25,
              } as Record<string, number>
            )[group.key] ?? 1),
      );
      this.repository.save(this.game);
    }
  }
  private load() {
    const apiGameId = localStorage.getItem('mandato-api-game-id');
    if (this.onlineMode && this.api && apiGameId) {
      this.api.load(apiGameId).subscribe({
        next: (game) => {
          this.connectionStatus = 'ONLINE';
          this.game = this.fromApiGame(game);
          this.feedback = 'Partida online carregada.';
        },
        error: () => {
          this.connectionStatus = 'UNAVAILABLE';
          this.feedback =
            'Não foi possível carregar a partida online; o save local foi preservado.';
        },
      });
      return;
    }
    const parsed = this.repository.load();
    if (parsed) {
      this.game = parsed as Game;
      this.electionState = this.normalizeElectionState(this.game.electionState);
      const game = this.game!;
      game.saveVersion ??= 1;
      game.news ??= [];
      game.history ??= [];
      game.causalLinks ??= [];
      game.activeGroupEffects ??= {};
      game.effects ??= {
        health: 0,
        approval: 0,
        infrastructure: 0,
        transport: 0,
      };
      game.dailyOperatingCost ??= 18000;
      game.initialTreasury ??= game.treasury;
      game.projects ??= [];
      game.administrativeAlerts ??= [];
      game.ledger ??= [];
      game.snapshots ??= [];
      game.groups ??= [
        {
          key: 'residents',
          label: 'Moradores',
          satisfaction: game.approval,
          concern: 'qualidade dos serviços',
        },
        {
          key: 'workers',
          label: 'Servidores públicos',
          satisfaction: game.approval,
          concern: 'condições de trabalho',
        },
        {
          key: 'business',
          label: 'Comerciantes',
          satisfaction: game.approval,
          concern: 'mobilidade e atividade econômica',
        },
        {
          key: 'families',
          label: 'Famílias',
          satisfaction: game.approval,
          concern: 'saúde e educação',
        },
      ];
      game.budget ??= [
        { key: 'health', label: 'Saúde', dailyCost: 6000 },
        { key: 'education', label: 'Educação', dailyCost: 5000 },
        { key: 'infrastructure', label: 'Infraestrutura', dailyCost: 3000 },
        { key: 'transport', label: 'Transporte', dailyCost: 2500 },
        { key: 'security', label: 'Segurança urbana', dailyCost: 1500 },
      ];
      game.objectives ??= [
        {
          id: 'health',
          label: 'Elevar a saúde municipal',
          description: 'Leve o indicador de saúde a pelo menos 65.',
          type: 'INDICATOR',
          target: 65,
          current:
            game.indicators.find((item) => item.key === 'health')?.value ?? 0,
          status: 'IN_PROGRESS',
        },
        {
          id: 'approval',
          label: 'Conquistar confiança da cidade',
          description: 'Alcance 60% de aprovação.',
          type: 'APPROVAL',
          target: 60,
          current: game.approval,
          status: 'IN_PROGRESS',
        },
        {
          id: 'treasury',
          label: 'Preservar o caixa',
          description: 'Termine o primeiro ciclo com pelo menos R$ 38 milhões.',
          type: 'TREASURY',
          target: 38000000,
          current: game.treasury,
          status: 'IN_PROGRESS',
        },
      ];
      this.save();
    }
  }
  private newGame(): Game {
    return createInitialSimulationState(this.mayorName, this.cityName) as Game;
  }
}
