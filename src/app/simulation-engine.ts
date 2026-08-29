import { applyBudgetEffects as applySharedBudgetEffects, applyCapacityEffects as applySharedCapacityEffects, applySecretaryRecovery as applySharedSecretaryRecovery, applyTemporaryEffects as applySharedTemporaryEffects, escalateCriticalDecisions as escalateSharedCriticalDecisions, updateAdministrativeCapacity as updateSharedAdministrativeCapacity } from '@mandato/engine';

export type SimulationIndicator = {
  key: string;
  label: string;
  value: number;
  trend: number;
};
export type SimulationDecision = {
  id: string;
  parentDecisionId?: string;
  title: string;
  context: string;
  status: 'PENDING' | 'RESOLVED';
  chosenOptionId?: string;
  resolvedDate?: string;
  applied?: boolean;
  recovered?: boolean;
  createdDate?: string;
  escalationApplied?: boolean;
  category?: 'URGENTE' | 'ESTRATÉGICA' | 'ADMINISTRATIVA';
  urgency?: 'ALTA' | 'MÉDIA' | 'BAIXA';
  options: {
    id: string;
    label: string;
    description: string;
    groupEffects?: Record<string, number>;
  }[];
};
export type SimulationBudgetLine = {
  key: string;
  label: string;
  dailyCost: number;
};
export type SimulationProject = {
  id: string;
  name: string;
  area: string;
  totalCost: number;
  dailyExecutionCost?: number;
  maintenanceCost?: number;
  dailyIndicatorEffects?: Record<string, number>;
  dailyGroupEffects?: Record<string, number>;
  daysTotal: number;
  daysCompleted: number;
  status: 'IN_PROGRESS' | 'COMPLETED';
  risk?: 'NORMAL' | 'DELAYED';
  priorityMode?: 'NORMAL' | 'PRIORITARIA';
  maintenanceMode?: 'NORMAL' | 'REDUZIDA' | 'ADIADA';
};
export type SimulationSecretary = {
  key: string;
  label: string;
  efficiency: number;
  pressure: number;
};
export type SimulationGroup = {
  key: string;
  label: string;
  satisfaction: number;
  concern: string;
  populationWeight?: number;
  reputation?: number;
  satisfactionTrend?: number;
};
export type SimulationObjective = {
  id: string;
  label: string;
  description: string;
  type: 'INDICATOR' | 'APPROVAL' | 'TREASURY';
  target: number;
  current: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
};
export type SimulationEvaluation = {
  score: number;
  title: string;
  summary: string;
  completedObjectives: number;
  totalObjectives: number;
  serviceQuality?: number;
  administrativeEfficiency?: number;
  administrativeCapacity?: number;
  fiscalStability?: number;
  revenueSources?: { ownTaxes: number; commerce: number; transfers: number };
  economicPolicies?: { commerceIncentive: number; taxModernization: number };
  socialTrust?: number;
  recommendedIndicatorKey?: string;
  recommendedIndicatorLabel?: string;
  approvalDelta?: number;
  serviceQualityDelta?: number;
  treasuryDelta?: number;
};
export type SimulationLedgerEntry = {
  date: string;
  label: string;
  amount: number;
  kind: 'INCOME' | 'EXPENSE';
  category?: 'OPERATION' | 'DECISION' | 'REVENUE' | 'PROJECT';
};
export type SimulationSnapshot = {
  date: string;
  approval: number;
  treasury: number;
  population?: number;
  serviceQuality: number;
  administrativeEfficiency?: number;
  administrativeCapacity?: number;
  fiscalStability?: number;
  socialTrust?: number;
};
export type SimulationCausalLink = {
  date: string;
  decisionId?: string;
  cause: string;
  effect: string;
  signal: string;
  observedEffect?: string;
  affectedGroups?: string[];
  groupEffects?: Record<string, number>;
  objectiveIds?: string[];
};
export type SimulationState = {
  currentDate: string;
  treasury: number;
  debt?: number;
  initialTreasury?: number;
  population?: number;
  populationTrend?: number;
  approval: number;
  indicators: SimulationIndicator[];
  effects: {
    health: number;
    approval: number;
    infrastructure: number;
    transport: number;
  };
  activeEffects?: {
    health?: number;
    education?: number;
    infrastructure?: number;
    transport?: number;
    security?: number;
    approval?: number;
  };
  activeGroupEffects?: Record<string, number>;
  budgetPressureDays?: Record<string, number>;
  activeFocus?: string;
  focusDaysRemaining?: number;
  focusMetric?: 'treasury' | 'capacity' | 'service' | 'social';
  focusBaseline?: number;
  decisions: SimulationDecision[];
  history: string[];
  news: string[];
  legacy?: string[];
  dailyOperatingCost?: number;
  budget?: SimulationBudgetLine[];
  projects?: SimulationProject[];
  secretaries?: SimulationSecretary[];
  groups?: SimulationGroup[];
  objectives?: SimulationObjective[];
  evaluation?: SimulationEvaluation;
  evaluationDate?: string;
  fiscalAlert?: string;
  fiscalStability?: number;
  revenueSources?: { ownTaxes: number; commerce: number; transfers: number };
  economicPolicies?: { commerceIncentive: number; taxModernization: number };
  administrativeCapacity?: number;
  administrativeAlerts?: string[];
  secretaryRecoveryDays?: Record<string, number>;
  portfolioStatus?: 'SAUDAVEL' | 'PRESSIONADO' | 'SOBRECARREGADO';
  ledger?: SimulationLedgerEntry[];
  snapshots?: SimulationSnapshot[];
  causalLinks?: SimulationCausalLink[];
};

export class SimulationEngine {
  advanceDay(state: SimulationState): {
    state: SimulationState;
    report: string;
  } {
    state.groups ??= [
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
    state.secretaries ??= [
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
    for (const decision of state.decisions)
      if (decision.status === 'RESOLVED')
        decision.resolvedDate ??= state.currentDate;
    this.applyEmergencyResponses(state);
    this.applyEmergencySecretaryRecovery(state);
    this.applySecretaryDecisions(state);
    this.applyOperationalReviews(state);
    this.applyStrategicAgendas(state);
    this.deriveTemporaryEffects(state);
    const date = new Date(`${state.currentDate}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + 1);
    state.currentDate = date.toISOString().slice(0, 10);
    if ((state.focusDaysRemaining ?? 0) > 0) {
      state.focusDaysRemaining = (state.focusDaysRemaining ?? 1) - 1;
      if (state.focusDaysRemaining === 0) {
        const metric = state.focusMetric ?? 'service';
        const current = metric === 'treasury' ? state.treasury : metric === 'capacity' ? (state.administrativeCapacity ?? 0) : metric === 'social' ? ((state.groups ?? []).reduce((sum, item) => sum + item.satisfaction, 0) / Math.max(1, (state.groups ?? []).length)) : (state.indicators.reduce((sum, item) => sum + item.value, 0) / Math.max(1, state.indicators.length));
        const baseline = state.focusBaseline ?? current;
        const delta = current - baseline;
        const result = delta > 0.5 ? 'melhorou' : delta < -0.5 ? 'piorou' : 'permaneceu estável';
        const report = `Relatório do foco: ${state.activeFocus} ${result} em sete dias (${delta >= 0 ? '+' : ''}${delta.toFixed(1)}).`;
        state.history.unshift(`${state.currentDate}: ${report}`); state.news.unshift(report);
        state.activeFocus = undefined; state.focusMetric = undefined; state.focusBaseline = undefined;
      }
    }
    this.escalatePendingEmergencies(state);
    this.apply(state, 0, 'health');
    this.apply(state, 2, 'infrastructure');
    this.apply(state, 3, 'transport');
    this.applyTemporaryEffects(state);
    this.applyActiveGroupEffects(state);
    this.applyFocusBonus(state);
    const operatingCost =
      state.budget?.reduce((total, line) => total + line.dailyCost, 0) ??
      state.dailyOperatingCost ??
      18000;
    state.treasury -= operatingCost;
    const runwayDays = operatingCost > 0 ? state.treasury / operatingCost : 0;
    const debtBurden = Math.min(40, (state.debt ?? 120000000) / 10000000);
    state.fiscalStability = Math.max(
      0,
      Math.min(100, Math.round(Math.min(100, runwayDays / 3) - debtBurden)),
    );
    state.ledger ??= [];
    for (const project of state.projects ?? []) {
      project.maintenanceMode ??= 'NORMAL';
      project.dailyExecutionCost ??=
        project.id === 'drainage-avenue' ? 10000 : 0;
      project.maintenanceCost ??= project.id === 'drainage-avenue' ? 3000 : 0;
      project.dailyIndicatorEffects ??=
        project.id === 'drainage-avenue' ? { infrastructure: 0.03 } : {};
      project.dailyGroupEffects ??=
        project.id === 'drainage-avenue'
          ? { residents: 0.04, families: 0.04 }
          : {};
    }
    state.ledger.unshift({
      date: state.currentDate,
      label: 'Operação diária das secretarias',
      amount: operatingCost,
      kind: 'EXPENSE',
      category: 'OPERATION',
    });
    state.administrativeAlerts ??= [];
    const baselineBudget: Record<string, number> = {
      health: 6000,
      education: 5000,
      infrastructure: 3000,
      transport: 2500,
      security: 1500,
    };
    for (const secretary of state.secretaries ?? []) {
      const budgetLine = state.budget?.find(
        (line) => line.key === secretary.key,
      );
      const baseline = baselineBudget[secretary.key] ?? 1;
      const budgetRatio = budgetLine ? budgetLine.dailyCost / baseline : 1;
      secretary.pressure = Math.max(
        0,
        secretary.pressure - 0.1 + (1 - budgetRatio) * 0.5,
      );
      state.secretaryRecoveryDays ??= {};
      const recoveryDays = state.secretaryRecoveryDays[secretary.key] ?? 0;
      if (recoveryDays > 0) {
        secretary.pressure = Math.max(0, secretary.pressure - 0.5);
        state.secretaryRecoveryDays[secretary.key] = recoveryDays - 1;
        if (recoveryDays === 1) {
          const message = `${secretary.label} concluiu a recuperação operacional e voltou a trabalhar sem o reforço temporário.`;
          state.news.unshift(message);
          state.history.unshift(`${state.currentDate}: ${message}`);
        }
      }
      secretary.efficiency = Math.max(
        0,
        Math.min(100, secretary.efficiency + (budgetRatio - 1) * 0.15),
      );
      if (secretary.pressure > 75) {
        secretary.efficiency = Math.max(0, secretary.efficiency - 0.1);
        const alert = `${secretary.label} está sobrecarregada e perdeu eficiência.`;
        if (!state.administrativeAlerts.includes(alert)) {
          state.administrativeAlerts.unshift(alert);
          state.news.unshift(`Alerta administrativo: ${alert}`);
        }
      }
    }
    if (state.treasury < 0) {
      state.fiscalAlert =
        'O caixa está negativo. Novas despesas exigem contenção e podem reduzir a aprovação.';
      state.approval = this.clamp(state.approval - 0.2);
      if (!state.news.some((item) => item.includes('caixa está negativo')))
        state.news.unshift(`Crise fiscal: ${state.fiscalAlert}`);
    } else if (state.treasury < operatingCost * 7)
      state.fiscalAlert =
        'Atenção: o caixa cobre menos de uma semana de operação.';
    else state.fiscalAlert = undefined;
    if (state.groups?.length) {
      this.updateGroupConcerns(state);
      for (const group of state.groups) {
        group.populationWeight ??= 1;
        group.satisfaction = Math.max(
          0,
          Math.min(100, group.satisfaction + state.effects.approval * 0.6),
        );
      }
      this.updateGroupReputation(state);
      const totalWeight = state.groups.reduce(
        (sum, group) => sum + (group.populationWeight ?? 1),
        0,
      );
      state.approval = this.clamp(
        state.groups.reduce(
          (sum, group) =>
            sum +
            (group.satisfaction * 0.7 +
              (group.reputation ?? group.satisfaction) * 0.3) *
              (group.populationWeight ?? 1),
          0,
        ) / totalWeight,
      );
    }
    for (const project of state.projects ?? []) {
      if (project.status === 'COMPLETED') {
        const maintenance = project.maintenanceCost ?? 0;
        const maintenanceFactor =
          project.maintenanceMode === 'REDUZIDA' ? 0.5 : 1;
        if (project.maintenanceMode === 'ADIADA') {
          for (const [key, change] of Object.entries(
            project.dailyIndicatorEffects ?? {},
          )) {
            const indicator = state.indicators.find((item) => item.key === key);
            if (indicator)
              indicator.value = this.clamp(
                indicator.value - Math.min(0.02, Math.abs(change) * 0.5),
              );
          }
          for (const group of state.groups ?? [])
            group.satisfaction = this.clamp(group.satisfaction - 0.03);
          const message = `Manutenção adiada: ${project.name} começa a perder qualidade e exige atenção do gabinete.`;
          if (!state.news.some((item) => item.includes(message))) {
            state.news.unshift(message);
            state.history.unshift(`${state.currentDate}: ${message}`);
          }
          continue;
        } else if (maintenance) {
          state.treasury -= maintenance * maintenanceFactor;
          state.ledger!.unshift({
            date: state.currentDate,
            label: `Manutenção: ${project.name}`,
            amount: maintenance * maintenanceFactor,
            kind: 'EXPENSE',
            category: 'PROJECT',
          });
        }
        for (const [key, change] of Object.entries(
          project.dailyIndicatorEffects ?? {},
        )) {
          const indicator = state.indicators.find((item) => item.key === key);
          if (indicator)
            indicator.value = this.clamp(
              indicator.value + change * maintenanceFactor,
            );
        }
        for (const group of state.groups ?? [])
          group.satisfaction = this.clamp(
            group.satisfaction +
              (project.dailyGroupEffects?.[group.key] ?? 0) * maintenanceFactor,
          );
        continue;
      }
      const secretary = state.secretaries?.find(
        (item) => item.label === project.area,
      );
      const competing = (state.projects ?? []).filter((item) => item.status === 'IN_PROGRESS').length > 1;
      const delayed =
        (!!secretary && secretary.efficiency < 55) ||
        (state.administrativeCapacity ?? 100) < 50 ||
        (competing && (state.administrativeCapacity ?? 100) < 70);
      const priority = project.priorityMode === 'PRIORITARIA';
      const executionCost = (project.dailyExecutionCost ?? 0) + (priority ? 5000 : 0);
      const delaySurcharge = delayed ? Math.round(executionCost * 0.25) : 0;
      const projectCost = executionCost + delaySurcharge;
      if (projectCost) {
        state.treasury -= projectCost;
        state.ledger!.unshift({
          date: state.currentDate,
          label: `Execução: ${project.name}`,
          amount: projectCost,
          kind: 'EXPENSE',
          category: 'PROJECT',
        });
      }
      const speed = secretary
        ? Math.max(0.5, secretary.efficiency / 70) * (delayed ? 0.75 : 1) * (priority ? 1.35 : 1)
        : 1;
      project.risk = delayed ? 'DELAYED' : 'NORMAL';
      project.daysCompleted += speed;
      if (secretary)
        secretary.pressure = Math.min(100, secretary.pressure + (priority ? 3 : 1.5));
      if (delayed) {
        for (const [groupKey, dailyEffect] of Object.entries(project.dailyGroupEffects ?? {})) {
          const group = (state.groups ?? []).find((item) => item.key === groupKey);
          if (!group) continue;
          const socialWear = Math.min(0.06, Math.max(0.02, Math.abs(Number(dailyEffect)) * 0.25));
          group.satisfaction = this.clamp(group.satisfaction - socialWear);
          group.satisfactionTrend = -socialWear;
        }
        const alert = `O projeto ${project.name} está atrasado por baixa capacidade da secretaria.`;
        if (!state.administrativeAlerts!.includes(alert)) {
          state.administrativeAlerts!.unshift(alert);
          state.news.unshift(`Alerta de projeto: ${alert}`);
        }
      }
      if (project.daysCompleted >= project.daysTotal) {
        project.status = 'COMPLETED';
        state.approval = this.clamp(state.approval + 0.2);
        if (project.area === 'Infraestrutura')
          state.indicators.find(
            (item) => item.key === 'infrastructure',
          )!.value = this.clamp(
            state.indicators.find((item) => item.key === 'infrastructure')!
              .value + 2,
          );
        state.history.unshift(
          `${state.currentDate}: o projeto ${project.name} foi concluído.`,
        );
        state.news.unshift(`Obra entregue: ${project.name}.`);
      }
    }
    if ((state.decisions ?? []).some((item) => item.id.startsWith('capacity-') && item.status === 'RESOLVED' && item.chosenOptionId?.startsWith('reorganize-'))) {
      for (const project of state.projects ?? [])
        if (project.status === 'IN_PROGRESS' && project.risk === 'DELAYED') project.risk = 'NORMAL';
    }
    this.createMaintenanceDecisions(state);
    this.createDelayedProjectDecisions(state);
    this.createCompletedProjectDecisions(state);
    if (state.currentDate.endsWith('-01') && (state.debt ?? 120000000) > 0) {
      const debtService = Math.round((state.debt ?? 120000000) * 0.005);
      state.treasury -= debtService;
      state.ledger.unshift({
        date: state.currentDate,
        label: 'Serviço mensal da dívida',
        amount: debtService,
        kind: 'EXPENSE',
        category: 'OPERATION',
      });
      state.history.unshift(
        `${state.currentDate}: serviço mensal da dívida comprometeu R$ ${debtService.toLocaleString('pt-BR')}.`,
      );
    }
    if (state.currentDate.endsWith('-01')) {
      const businessTrust =
        state.groups?.find((group) => group.key === 'business')?.satisfaction ??
        50;
      const approvalFactor = Math.max(
        -0.1,
        Math.min(0.1, (state.approval - 50) / 1000),
      );
      const populationFactor = Math.max(
        -0.05,
        Math.min(0.05, ((state.population ?? 180000) - 180000) / 3600000),
      );
      const businessFactor = Math.max(
        -0.05,
        Math.min(0.05, (businessTrust - 50) / 1000),
      );
      const policy = state.economicPolicies ?? {
        commerceIncentive: 0,
        taxModernization: 0,
      };
      const ownTaxPolicy = policy.taxModernization * 0.02;
      const ownTaxes = Math.round(
        5525000 * (1 + approvalFactor + populationFactor + ownTaxPolicy),
      );
      const commerce = Math.round(
        1700000 * (1 + businessFactor + policy.commerceIncentive * 0.02),
      );
      const transfers = Math.round(1275000 * (1 + populationFactor * 0.5));
      const monthlyRevenue = ownTaxes + commerce + transfers;
      const variation = Math.round(
        (approvalFactor + populationFactor + businessFactor + ownTaxPolicy) *
          100,
      );
      const explanation =
        variation === 0
          ? 'mantendo a referência do orçamento'
          : variation > 0
            ? `com alta de ${variation}% por aprovação, população e confiança comercial`
            : `com queda de ${Math.abs(variation)}% por aprovação, população e confiança comercial`;
      state.treasury += monthlyRevenue;
      state.revenueSources = {
        ownTaxes,
        commerce,
        transfers,
      };
      state.ledger.unshift({
        date: state.currentDate,
        label: 'Receita mensal prevista',
        amount: monthlyRevenue,
        kind: 'INCOME',
        category: 'REVENUE',
      });
      const finance = `Fechamento mensal: a prefeitura recebeu R$ ${monthlyRevenue.toLocaleString('pt-BR')} em receitas, ${explanation}. Despesas diárias seguem comprometendo o caixa.`;
      state.history.unshift(`${state.currentDate}: ${finance}`);
      state.news.unshift(finance);
    }
    state.approval = this.clamp(state.approval + state.effects.approval);
    if (state.population !== undefined) {
      const serviceQuality =
        state.indicators.reduce((sum, indicator) => sum + indicator.value, 0) /
        Math.max(1, state.indicators.length);
      state.populationTrend = Math.round(
        (state.approval - 50) * 2 + (serviceQuality - 55) * 0.2,
      );
      state.population = Math.max(0, state.population + state.populationTrend);
    }
    this.createPopulationBulletin(state);
    this.applyBudgetQuality(state);
    this.applyEconomicPolicyEffects(state);
    this.updateAdministrativeCapacity(state);
    this.createHealthSecretaryDemand(state);
    this.createEducationSecretaryDemand(state);
    this.createTransportSecretaryDemand(state);
    this.createInfrastructureSecretaryDemand(state);
    this.createSecuritySecretaryDemand(state);
    this.applyAdministrativeCapacityEffects(state);
    this.createCausalBulletin(state);
    this.createPublicSentimentBulletin(state);
    this.applyBudgetSocialEffects(state);
    this.updateBudgetPressureHistory(state);
    this.createSocialReaction(state);
    this.createPositiveReaction(state);
    if (state.evaluationDate && state.evaluationDate > '2025-01-14')
      this.createOperationalReview(state);
    if (state.evaluationDate && state.evaluationDate > '2025-01-14')
      this.createStrategicAgenda(state);
    this.calibratePositiveReaction(state);
    this.createSecretaryDecisions(state);
    const weakest = [...state.indicators].sort((a, b) => a.value - b.value)[0];
    this.applyCriticalServiceReaction(state, weakest);
    this.updateObjectives(state);
    this.recordSnapshot(state);
    this.recordObservedCausalEffects(state);
    if (
      state.currentDate >= (state.evaluationDate ?? '2025-01-14') &&
      !state.evaluation
    )
      this.evaluateCycle(state);
    const report = this.dailyBulletin(state, weakest);
    state.history.unshift(report);
    state.news.unshift(report);
    this.createWeeklyMilestone(state);
    this.unlockDrainage(state);
    this.unlockTransport(state);
    this.unlockEducation(state);
    this.unlockSafety(state);
    this.unlockEconomicDecision(state);
    this.unlockAdministrativeRecovery(state);
    this.unlockHospitalConsequence(state);
    this.unlockTransportConsequence(state);
    this.unlockEducationConsequence(state);
    this.unlockFiscalContainment(state);
    this.unlockDebtRenegotiation(state);
    this.createPriorityDecisions(state);
    this.unlockMobilityProject(state);
    this.unlockSocialRecoveryProject(state);
    this.unlockInfrastructureContingency(state);
    this.recordPortfolioTransition(state);
    this.createPortfolioOverloadBulletin(state);
    this.unlockPublicPressure(state);
    this.createCityPulseDecision(state);
    this.createCityPulseFollowUp(state);
    this.createWeatherFollowUp(state);
    this.createTransitDisruptionFollowUp(state);
    this.createWeatherDisruptionDecision(state);
    this.createTransitDisruptionDecision(state);
    return { state, report };
  }
  private createHealthSecretaryDemand(state: SimulationState) {
    const secretary = state.secretaries?.find((item) => item.key === 'health');
    const id = `secretary-demand-health-${state.currentDate}`;
    if (!secretary || secretary.pressure < 85 || this.hasSecretaryDemandCooldown(state, 'health') || state.decisions.some((item) => item.id === id || (item.id.startsWith('secretary-demand-health-') && item.status === 'PENDING'))) return;
    state.decisions.push({ id, createdDate: state.currentDate, title: 'Atenção extra na Secretaria de Saúde', context: `A pressão da Secretaria de Saúde chegou a ${Math.round(secretary.pressure)}%. O gabinete precisa decidir entre reforçar a equipe ou aceitar o desgaste operacional.`, status: 'PENDING', category: 'ADMINISTRATIVA', urgency: 'ALTA', options: [
      { id: 'stabilize-health-demand', label: 'Reforçar a equipe de saúde', description: 'Custa R$ 180 mil, reduz a pressão e recupera eficiência.', groupEffects: { workers: 1.2, families: 0.6 } },
      { id: 'defer-health-demand', label: 'Adiar o reforço', description: 'Preserva o caixa, mas aumenta a pressão sobre o atendimento.', groupEffects: { workers: -1, families: -0.8 } },
    ] });
  }
  private createEducationSecretaryDemand(state: SimulationState) {
    const secretary = state.secretaries?.find((item) => item.key === 'education');
    const id = `secretary-demand-education-${state.currentDate}`;
    if (!secretary || secretary.pressure < 85 || this.hasSecretaryDemandCooldown(state, 'education') || state.decisions.some((item) => item.id === id || (item.id.startsWith('secretary-demand-education-') && item.status === 'PENDING'))) return;
    state.decisions.push({ id, createdDate: state.currentDate, title: 'Rede escolar pede reforço imediato', context: `A pressão da Secretaria de Educação chegou a ${Math.round(secretary.pressure)}%. O gabinete precisa decidir entre reforçar a operação das escolas ou adiar a resposta.`, status: 'PENDING', category: 'ADMINISTRATIVA', urgency: 'ALTA', options: [
      { id: 'stabilize-education-demand', label: 'Reforçar a rede escolar', description: 'Custa R$ 160 mil, reduz a pressão e recupera eficiência.', groupEffects: { families: 1.2, residents: 0.4 } },
      { id: 'defer-education-demand', label: 'Adiar o reforço', description: 'Preserva o caixa, mas aumenta a pressão nas escolas.', groupEffects: { families: -1.1, residents: -0.5 } },
    ] });
  }
  private createTransportSecretaryDemand(state: SimulationState) {
    const secretary = state.secretaries?.find((item) => item.key === 'transport');
    const id = `secretary-demand-transport-${state.currentDate}`;
    if (!secretary || secretary.pressure < 85 || this.hasSecretaryDemandCooldown(state, 'transport') || state.decisions.some((item) => item.id === id || (item.id.startsWith('secretary-demand-transport-') && item.status === 'PENDING'))) return;
    state.decisions.push({ id, createdDate: state.currentDate, title: 'Mobilidade urbana pede intervenção', context: `A pressão da Secretaria de Transporte chegou a ${Math.round(secretary.pressure)}%. O gabinete precisa decidir entre reforçar a operação ou conviver com atrasos e reclamações.`, status: 'PENDING', category: 'ADMINISTRATIVA', urgency: 'ALTA', options: [{ id: 'stabilize-transport-demand', label: 'Reforçar a operação', description: 'Custa R$ 140 mil, reduz a pressão e recupera eficiência.', groupEffects: { residents: 1, business: 0.8 } }, { id: 'defer-transport-demand', label: 'Adiar a intervenção', description: 'Preserva o caixa, mas aumenta os atrasos e o desgaste.', groupEffects: { residents: -0.9, business: -1 } }] });
  }
  private createInfrastructureSecretaryDemand(state: SimulationState) {
    const secretary = state.secretaries?.find((item) => item.key === 'infrastructure');
    const id = `secretary-demand-infrastructure-${state.currentDate}`;
    if (!secretary || secretary.pressure < 85 || this.hasSecretaryDemandCooldown(state, 'infrastructure') || state.decisions.some((item) => item.id === id || (item.id.startsWith('secretary-demand-infrastructure-') && item.status === 'PENDING'))) return;
    state.decisions.push({ id, createdDate: state.currentDate, title: 'Manutenção urbana em ponto crítico', context: `A pressão da Secretaria de Infraestrutura chegou a ${Math.round(secretary.pressure)}%. O gabinete precisa escolher entre uma intervenção imediata ou adiar os reparos.`, status: 'PENDING', category: 'ADMINISTRATIVA', urgency: 'ALTA', options: [{ id: 'stabilize-infrastructure-demand', label: 'Autorizar reparos imediatos', description: 'Custa R$ 220 mil, reduz a pressão e recupera eficiência.', groupEffects: { residents: 1.1, families: 0.7 } }, { id: 'defer-infrastructure-demand', label: 'Adiar os reparos', description: 'Preserva o caixa, mas aumenta o desgaste da infraestrutura.', groupEffects: { residents: -1.1, families: -0.7 } }] });
  }
  private createSecuritySecretaryDemand(state: SimulationState) {
    const secretary = state.secretaries?.find((item) => item.key === 'security');
    const id = `secretary-demand-security-${state.currentDate}`;
    if (!secretary || secretary.pressure < 85 || this.hasSecretaryDemandCooldown(state, 'security') || state.decisions.some((item) => item.id === id || (item.id.startsWith('secretary-demand-security-') && item.status === 'PENDING'))) return;
    state.decisions.push({ id, createdDate: state.currentDate, title: 'Segurança urbana pede reforço', context: `A pressão da Secretaria de Segurança chegou a ${Math.round(secretary.pressure)}%. O gabinete precisa decidir entre reforçar a prevenção ou adiar a resposta.`, status: 'PENDING', category: 'ADMINISTRATIVA', urgency: 'ALTA', options: [{ id: 'stabilize-security-demand', label: 'Reforçar a prevenção', description: 'Custa R$ 190 mil, reduz a pressão e recupera eficiência.', groupEffects: { residents: 1.2, business: 0.4 } }, { id: 'defer-security-demand', label: 'Adiar o reforço', description: 'Preserva o caixa, mas aumenta a sensação de insegurança.', groupEffects: { residents: -1.2, business: -0.4 } }] });
  }
  private hasSecretaryDemandCooldown(state: SimulationState, key: string) {
    const last = [...state.decisions].reverse().find((item) => item.id.startsWith(`secretary-demand-${key}-`) && item.status === 'RESOLVED');
    return !!last?.resolvedDate && this.daysBetween(last.resolvedDate, state.currentDate) < 5;
  }
  private recordObservedCausalEffects(state: SimulationState) {
    const links = state.causalLinks ?? [];
    if (!links.length) return;
    const snapshot = state.snapshots?.at(-1);
    if (!snapshot) return;
    const latest = links[0];
    if (latest.date === state.currentDate) return;
    const linkArea: Record<string, string> = { health: 'saúde', education: 'educação', transport: 'transporte', infrastructure: 'infraestrutura', security: 'segurança' };
    const option = latest.effect;
    const key = /ônibus|transporte|mobilidade/i.test(option) ? 'transport' : /iluminação|segurança/i.test(option) ? 'security' : /merenda|educação/i.test(option) ? 'education' : /drenagem|infraestrutura/i.test(option) ? 'infrastructure' : 'health';
    const indicator = state.indicators.find((item) => item.key === key);
    const affected = (state.groups ?? []).filter((group) => !latest.affectedGroups?.length || latest.affectedGroups.includes(group.key));
    const social = affected.length ? affected.reduce((sum, item) => sum + item.satisfaction, 0) / affected.length : undefined;
    const socialLabel = latest.affectedGroups?.length ? 'satisfação dos grupos afetados' : 'satisfação média';
    const observation = `${state.currentDate}: ${linkArea[key]} ${indicator?.value ?? snapshot.serviceQuality} (${indicator?.trend && indicator.trend > 0 ? '+' : ''}${indicator?.trend ?? 0}) · aprovação ${snapshot.approval}${social === undefined ? '' : ` · ${socialLabel} ${social.toFixed(1)}`}`;
    if (latest.observedEffect?.includes(`${state.currentDate}:`)) return;
    latest.observedEffect = latest.observedEffect ? `${latest.observedEffect} | ${observation}` : observation;
  }
  private createMaintenanceDecisions(state: SimulationState) {
    for (const project of state.projects ?? []) {
      if (project.status !== 'COMPLETED') continue;
      const id = `maintenance-${project.id}`;
      if (state.decisions.some((decision) => decision.id === id)) continue;
      state.decisions.push({
        id,
        title: `Manutenção de ${project.name}`,
        context:
          'A obra foi concluída. O gabinete precisa decidir se mantém o padrão de manutenção ou adia o custo.',
        category: 'ADMINISTRATIVA',
        urgency: 'MÉDIA',
        status: 'PENDING',
        options: [
          {
            id: `maintain-${project.id}`,
            label: 'Manter manutenção normal',
            description:
              'Custa R$ 3.000 por dia, preserva integralmente os efeitos da obra e evita deterioração.',
          },
          {
            id: `defer-maintenance-${project.id}`,
            label: 'Adiar manutenção',
            description:
              'Evita a despesa agora, mas reduz gradualmente os efeitos da obra e a satisfação social.',
          },
          {
            id: `reduce-maintenance-${project.id}`,
            label: 'Reduzir manutenção',
            description:
              'Custa R$ 1.500 por dia e preserva metade dos efeitos positivos da obra.',
          },
        ],
      });
    }
  }
  private createDelayedProjectDecisions(state: SimulationState) {
    for (const project of state.projects ?? []) {
      if (project.status !== 'IN_PROGRESS' || project.risk !== 'DELAYED') continue;
      const id = `project-recovery-${project.id}`;
      if (state.decisions.some((decision) => decision.id === id)) continue;
      state.decisions.push({
        id,
        createdDate: state.currentDate,
        title: `Plano de recuperação: ${project.name}`,
        context: 'A obra está atrasada e a secretaria precisa decidir entre reorganizar a execução ou aceitar o prazo maior.',
        category: 'ADMINISTRATIVA',
        urgency: 'MÉDIA',
        status: 'PENDING',
        options: [
          { id: `recover-${project.id}`, label: 'Reorganizar a execução', description: 'Concentra a equipe na obra e recupera parte da confiança social.', groupEffects: { residents: 0.8, workers: 0.4 } },
          { id: `accept-delay-${project.id}`, label: 'Aceitar o atraso', description: 'Preserva a capacidade atual, mas prolonga o desgaste com moradores e famílias.', groupEffects: { residents: -0.6, families: -0.4 } },
        ],
      });
      state.news.unshift(`Projeto em risco: o gabinete recebeu um plano de recuperação para ${project.name}.`);
      state.history.unshift(`${state.currentDate}: a secretaria propôs recuperar o atraso de ${project.name}.`);
    }
  }
  private createCompletedProjectDecisions(state: SimulationState) {
    for (const project of state.projects ?? []) {
      if (project.status !== 'COMPLETED') continue;
      const id = `project-legacy-${project.id}`;
      if (state.decisions.some((decision) => decision.id === id)) continue;
      state.decisions.push({ id, createdDate: state.currentDate, title: `Próximo passo: ${project.name}`, context: 'A obra foi entregue. O gabinete precisa decidir se amplia o benefício ou consolida o serviço com o padrão atual.', category: 'ESTRATÉGICA', urgency: 'BAIXA', status: 'PENDING', options: [
        { id: `expand-project-${project.id}`, label: 'Ampliar o benefício', description: 'Investe R$ 120 mil e amplia o retorno percebido pela cidade.', groupEffects: { residents: 0.8, business: 0.4 } },
        { id: `consolidate-project-${project.id}`, label: 'Consolidar o serviço', description: 'Preserva o caixa e fortalece a confiança de famílias e servidores.', groupEffects: { families: 0.5, workers: 0.3 } },
      ] });
      state.news.unshift(`Obra entregue: ${project.name} agora exige uma decisão de consolidação.`);
    }
  }
  private createPriorityDecisions(state: SimulationState) {
    if (state.currentDate < '2025-01-15') return;
    for (const project of state.projects ?? []) {
      if (project.status !== 'IN_PROGRESS' || state.decisions.some((d) => d.id === `priority-${project.id}`)) continue;
      state.decisions.push({
        id: `priority-${project.id}`, createdDate: state.currentDate,
        title: `Prioridade de execução: ${project.name}`,
        context: 'A capacidade administrativa está disputada. O gabinete pode concentrar equipes nesta obra ou manter o ritmo atual.',
        category: 'ESTRATÉGICA', urgency: 'MÉDIA', status: 'PENDING',
        options: [
          { id: `prioritize-${project.id}`, label: 'Priorizar a obra', description: 'Acelera a entrega, mas custa R$ 5.000 adicionais por dia e aumenta a pressão da secretaria.' },
          { id: `normal-${project.id}`, label: 'Manter ritmo normal', description: 'Preserva caixa e capacidade administrativa, mantendo o prazo atual.' },
        ],
      });
      const message = `O gabinete abriu uma revisão de prioridade para a obra ${project.name}.`;
      state.news.unshift(message); state.history.unshift(`${state.currentDate}: ${message}`);
    }
  }
  private unlockMobilityProject(state: SimulationState) {
    if (state.currentDate < '2025-01-20' || state.decisions.some((d) => d.id === 'mobility-project-proposal')) return;
    state.decisions.push({
      id: 'mobility-project-proposal', createdDate: state.currentDate,
      title: 'Corredor de mobilidade integrada',
      context: 'A cidade precisa melhorar a circulação, mas uma nova obra disputará equipes e caixa com as frentes já iniciadas.',
      category: 'ESTRATÉGICA', urgency: 'MÉDIA', status: 'PENDING',
      options: [
        { id: 'authorize-mobility-project', label: 'Autorizar o projeto', description: 'Investe R$ 280.000 e abre uma segunda frente de execução.' },
        { id: 'defer-mobility-project', label: 'Adiar o projeto', description: 'Preserva capacidade administrativa e caixa no ciclo atual.' },
      ],
    });
    state.news.unshift('A Secretaria de Transporte apresentou um novo projeto de mobilidade para o gabinete.');
    state.history.unshift(`${state.currentDate}: A Secretaria de Transporte apresentou um novo projeto de mobilidade para o gabinete.`);
  }
  private unlockSocialRecoveryProject(state: SimulationState) {
    const candidate = [...(state.groups ?? [])].sort((a, b) => a.satisfaction - b.satisfaction)[0];
    if (!candidate || candidate.satisfaction >= 45 || state.decisions.some((d) => d.id === 'social-recovery-project-proposal')) return;
    const config: Record<string, { area: string; title: string; effect: string }> = {
      residents: { area: 'Infraestrutura', title: 'Plano de recuperação urbana', effect: 'reparos emergenciais' },
      families: { area: 'Saúde', title: 'Ampliação da rede de atendimento', effect: 'reforço da capacidade de saúde' },
      workers: { area: 'Educação', title: 'Programa de recuperação escolar', effect: 'melhorias na rede de ensino' },
      business: { area: 'Transporte', title: 'Plano de mobilidade comercial', effect: 'melhorias na circulação' },
    };
    const item = config[candidate.key] ?? config['residents'];
    state.decisions.push({ id: 'social-recovery-project-proposal', createdDate: state.currentDate, title: item.title, context: `${candidate.label} está insatisfeito com ${candidate.concern}. A secretaria propõe um projeto de ${item.effect}, mas a iniciativa compromete caixa e capacidade de execução.`, category: 'ESTRATÉGICA', urgency: 'MÉDIA', status: 'PENDING', options: [{ id: 'authorize-social-recovery', label: 'Autorizar o projeto', description: 'Investe R$ 240 mil e abre uma frente de recuperação para a área prioritária.', groupEffects: { [candidate.key]: 1.5 } }, { id: 'defer-social-recovery', label: 'Adiar o projeto', description: 'Preserva o caixa, mas mantém a insatisfação do grupo.' , groupEffects: { [candidate.key]: -0.5 } }] });
    state.news.unshift(`Agenda social: a Secretaria de ${item.area.toLowerCase()} apresentou um plano de recuperação para responder à pressão de ${candidate.label.toLowerCase()}.`);
  }
  private createPortfolioOverloadBulletin(state: SimulationState) {
    const active = (state.projects ?? []).filter((project) => project.status === 'IN_PROGRESS');
    if (active.length < 2 || (state.administrativeCapacity ?? 100) >= 70) return;
    const marker = 'portfólio de obras sobrecarregado';
    if (state.news.some((item) => item.includes(marker))) return;
    const message = 'Alerta de planejamento: o portfólio de obras está sobrecarregado; a capacidade administrativa reduz o ritmo das frentes e aumenta o risco de atraso.';
    state.news.unshift(message); state.history.unshift(`${state.currentDate}: ${message}`);
  }
  private recordPortfolioTransition(state: SimulationState) {
    const active = (state.projects ?? []).filter((project) => project.status === 'IN_PROGRESS');
    const load = active.reduce((sum, project) => sum + (project.priorityMode === 'PRIORITARIA' ? 2 : 1), 0);
    const capacity = state.administrativeCapacity ?? 100;
    const next = active.some((project) => project.risk === 'DELAYED') || capacity < 45 || load > 8
      ? 'SOBRECARREGADO' : capacity < 70 || active.length > 1 || load > 4 ? 'PRESSIONADO' : 'SAUDAVEL';
    if (state.portfolioStatus === next) return;
    const previous = state.portfolioStatus;
    state.portfolioStatus = next;
    if (!previous) return;
    const labels: Record<string, string> = { SAUDAVEL: 'saudável', PRESSIONADO: 'pressionado', SOBRECARREGADO: 'sobrecarregado' };
    const message = `Transição de planejamento: o portfólio passou de ${labels[previous]} para ${labels[next]}, conforme a capacidade administrativa e os riscos das frentes.`;
    state.news.unshift(message); state.history.unshift(`${state.currentDate}: ${message}`);
  }
  private applyEmergencyResponses(state: SimulationState) {
    for (const decision of state.decisions) {
      if (
        !decision.id.startsWith('critical-') ||
        decision.status !== 'RESOLVED' ||
        decision.applied ||
        !decision.chosenOptionId
      )
        continue;
      const key = decision.id.replace('critical-', '');
      const indicator = state.indicators.find((item) => item.key === key);
      const groupKey: Record<string, string> = {
        health: 'families',
        education: 'families',
        infrastructure: 'residents',
        transport: 'business',
        security: 'residents',
      };
      const group = state.groups?.find((item) => item.key === groupKey[key]);
      const acted = decision.chosenOptionId.startsWith('act-');
      if (indicator)
        indicator.value = this.clamp(indicator.value + (acted ? 4 : -2));
      if (group)
        group.satisfaction = this.clamp(group.satisfaction + (acted ? 2 : -2));
      if (acted) {
        state.treasury -= 200000;
        state.ledger ??= [];
        state.ledger.unshift({
          date: state.currentDate,
          label: `Resposta emergencial: ${indicator?.label ?? key}`,
          amount: 200000,
          kind: 'EXPENSE',
          category: 'DECISION',
        });
        state.history.unshift(
          `${state.currentDate}: recursos foram liberados para recuperar ${indicator?.label?.toLowerCase() ?? key}.`,
        );
      } else
        state.history.unshift(
          `${state.currentDate}: o gabinete adiou a resposta para ${indicator?.label?.toLowerCase() ?? key}.`,
        );
      decision.applied = true;
    }
  }
  private applyEmergencySecretaryRecovery(state: SimulationState) {
    applySharedSecretaryRecovery(state as any);
  }
  private escalatePendingEmergencies(state: SimulationState) {
    escalateSharedCriticalDecisions(state as any);
  }
  private apply(
    state: SimulationState,
    index: number,
    key: 'health' | 'infrastructure' | 'transport',
  ) {
    const indicator = state.indicators[index];
    const change = state.effects[key];
    indicator.value = this.clamp(indicator.value + change);
    indicator.trend = change;
  }
  private updateGroupReputation(state: SimulationState) {
    for (const group of state.groups ?? []) {
      group.reputation ??= group.satisfaction;
      group.reputation = this.clamp(
        group.reputation + (group.satisfaction - group.reputation) * 0.12,
      );
    }
  }
  private updateGroupConcerns(state: SimulationState) {
    const concerns: Record<string, string[]> = {
      residents: ['saúde', 'infraestrutura', 'segurança urbana'],
      workers: ['educação', 'transporte', 'condições de trabalho'],
      business: ['transporte', 'infraestrutura', 'atividade econômica'],
      families: ['saúde', 'educação', 'segurança urbana'],
    };
    const byKey = new Map(state.indicators.map((item) => [item.key, item]));
    for (const group of state.groups ?? []) {
      const options = concerns[group.key] ?? ['qualidade dos serviços'];
      const weakest = options.map((label) => [...byKey.values()].find((item) => item.label.toLowerCase().includes(label.split(' ')[0]))).filter(Boolean).sort((a, b) => (a!.value - b!.value))[0];
      if (weakest && weakest.value < 58) group.concern = weakest.label.toLowerCase();
    }
  }
  private dailyBulletin(state: SimulationState, weakest?: SimulationIndicator) {
    const snapshots = state.snapshots ?? [];
    const current = snapshots.at(-1);
    const previous = snapshots.at(-2);
    const change = (field: 'approval' | 'serviceQuality' | 'treasury') =>
      current && previous ? current[field] - previous[field] : 0;
    const formatChange = (value: number, suffix = '') =>
      value === 0 ? 'estável' : `${value > 0 ? '+' : ''}${value.toFixed(value % 1 ? 1 : 0)}${suffix}`;
    const variation = current && previous
      ? ` Variação do dia: aprovação ${formatChange(change('approval'), ' p.p.')}, serviços ${formatChange(change('serviceQuality'), ' p.p.')}, caixa ${formatChange(change('treasury'))}.`
      : '';
    const pressure = Object.entries(state.budgetPressureDays ?? {}).sort(
      ([, a], [, b]) => b - a,
    )[0];
    if (weakest && weakest.value < 50) {
      const suffix =
        pressure && pressure[1] >= 2
          ? ` A cidade sente os efeitos de ${pressure[1]} dias de pressão orçamentária.`
          : '';
      return `Boletim de ${state.currentDate}: moradores relatam dificuldades em ${weakest.label.toLowerCase()}, hoje o indicador mais pressionado da cidade.${suffix}${variation}`;
    }
    if (pressure && pressure[1] >= 2)
      return `Boletim de ${state.currentDate}: a pressão orçamentária começa a aparecer na rotina dos serviços públicos após ${pressure[1]} dias.${variation}`;
    return `Boletim de ${state.currentDate}: os serviços públicos avançam após as decisões recentes do gabinete.${variation}`;
  }
  private createWeeklyMilestone(state: SimulationState) {
    const day = Number(state.currentDate.slice(-2));
    if (day % 7 !== 0) return;
    const marker = `Relatório de marco: ${state.currentDate}`;
    if (state.history.some((item) => item.includes(marker))) return;
    const quality = state.indicators.reduce((sum, item) => sum + item.value, 0) / Math.max(1, state.indicators.length);
    const social = (state.groups ?? []).length ? (state.groups ?? []).reduce((sum, item) => sum + item.satisfaction, 0) / (state.groups ?? []).length : 0;
    const active = (state.projects ?? []).filter((item) => item.status === 'IN_PROGRESS').length;
    const text = `${marker}: serviços ${quality.toFixed(1)}, aprovação ${state.approval.toFixed(1)}%, satisfação social ${social.toFixed(1)}%, caixa R$ ${state.treasury.toLocaleString('pt-BR')} e ${active} obra(s) em execução.`;
    state.history.unshift(text); state.news.unshift(text);
  }
  private deriveTemporaryEffects(state: SimulationState) {
    state.activeEffects ??= {};
    const recent = state.decisions.filter(
      (decision) =>
        decision.status === 'RESOLVED' &&
        decision.resolvedDate === state.currentDate,
    );
    for (const decision of recent) {
      const optionId = decision.chosenOptionId;
      if (optionId === 'meals')
        state.activeEffects.education =
          (state.activeEffects.education ?? 0) + 1.2;
      if (optionId === 'lighting')
        state.activeEffects.security = (state.activeEffects.security ?? 0) + 1;
      if (optionId === 'accept-bus')
        state.activeEffects.transport =
          (state.activeEffects.transport ?? 0) - 0.4;
      if (optionId === 'emergency-health')
        state.activeEffects.health = (state.activeEffects.health ?? 0) + 1;
    }
  }
  private applyTemporaryEffects(state: SimulationState) {
    applySharedTemporaryEffects(state as any);
  }
  private applyActiveGroupEffects(state: SimulationState) {
    const active = state.activeGroupEffects ?? {};
    for (const [key, raw] of Object.entries(active)) {
      const group = state.groups?.find((item) => item.key === key);
      if (group) {
        group.satisfactionTrend = Number(raw);
        group.satisfaction = Math.max(0, Math.min(100, group.satisfaction + Number(raw)));
      }
    }
    state.activeGroupEffects = Object.fromEntries(Object.entries(active).map(([key, value]) => [key, Math.abs(Number(value) * 0.75) < 0.01 ? 0 : Number(value) * 0.75]));
  }
  private applyFocusBonus(state: SimulationState) {
    if ((state.focusDaysRemaining ?? 0) <= 0) return;
    if (state.focusMetric === 'service') {
      const weakest = [...state.indicators].sort((a, b) => a.value - b.value)[0];
      if (weakest) weakest.value = this.clamp(weakest.value + 0.05);
    } else if (state.focusMetric === 'capacity') {
      for (const secretary of state.secretaries ?? []) secretary.pressure = this.clamp(secretary.pressure - 0.2);
    } else if (state.focusMetric === 'social') {
      for (const group of state.groups ?? []) group.satisfaction = this.clamp(group.satisfaction + 0.1);
    }
  }
  private createSecretaryDecisions(state: SimulationState) {
    for (const secretary of state.secretaries ?? []) {
      if (secretary.pressure < 80) continue;
      const id = `capacity-${secretary.key}`;
      if (state.decisions.some((decision) => decision.id === id)) continue;
      const activeProjects = (state.projects ?? []).filter((project) => project.status === 'IN_PROGRESS');
      const portfolioCost = activeProjects.reduce((sum, project) => sum + (project.dailyExecutionCost ?? 0), 0);
      const portfolioText = activeProjects.length ? ` Há ${activeProjects.length} obra(s) em execução, consumindo R$ ${portfolioCost.toLocaleString('pt-BR')} por dia.` : '';
      state.decisions.push({
        id,
        createdDate: state.currentDate,
        title: `Capacidade crítica na secretaria de ${secretary.label.toLowerCase()}`,
        context: `A equipe de ${secretary.label.toLowerCase()} está operando sob pressão elevada. A secretaria pede uma decisão de gestão antes que a eficiência continue caindo.${portfolioText}`,
        category: 'ADMINISTRATIVA',
        urgency: 'ALTA',
        status: 'PENDING',
        options: [
          {
            id: `reorganize-${secretary.key}`,
            label: 'Reorganizar a operação',
            description:
              'Reduz a pressão e recupera eficiência, mas desloca servidores de outras tarefas.',
            groupEffects: { workers: 0.8 },
          },
          {
            id: `maintain-${secretary.key}`,
            label: 'Manter a estrutura atual',
            description: 'Evita mudança imediata, mas a sobrecarga continua.',
            groupEffects: { workers: -1 },
          },
        ],
      });
      state.news.unshift(
        `Alerta: a secretaria de ${secretary.label.toLowerCase()} pede uma decisão de capacidade.`,
      );
      state.history.unshift(
        `${state.currentDate}: A secretaria de ${secretary.label.toLowerCase()} solicitou reorganização operacional.`,
      );
    }
  }
  private applyEconomicPolicyEffects(state: SimulationState) {
    const policy = state.economicPolicies;
    if (!policy) return;
    const transport = state.indicators.find((item) => item.key === 'transport');
    if (transport && policy.commerceIncentive > 0)
      transport.value = this.clamp(
        transport.value + policy.commerceIncentive * 0.01,
      );
    const secretary = state.secretaries?.find(
      (item) => item.key === 'administration',
    );
    if (secretary && policy.taxModernization > 0)
      secretary.efficiency = Math.min(
        100,
        secretary.efficiency + policy.taxModernization * 0.02,
      );
  }
  private updateAdministrativeCapacity(state: SimulationState) {
    updateSharedAdministrativeCapacity(state as any);
  }
  private applyAdministrativeCapacityEffects(state: SimulationState) {
    applySharedCapacityEffects(state as any);
  }

  private createPopulationBulletin(state: SimulationState) {
    const trend = state.populationTrend ?? 0;
    if (Math.abs(trend) < 5 || state.population === undefined) return;
    const direction = trend > 0 ? 'cresceu' : 'encolheu';
    const message = `Boletim demográfico: a população ${direction} ${Math.abs(trend).toLocaleString('pt-BR')} moradores, refletindo a aprovação do governo e a qualidade média dos serviços.`;
    state.history.unshift(`${state.currentDate}: ${message}`);
    state.news.unshift(message);
  }

  private createCausalBulletin(state: SimulationState) {
    const capacity = state.administrativeCapacity ?? 100;
    if (
      capacity < 45 &&
      !state.news.some((item) =>
        item.includes('capacidade administrativa crítica'),
      )
    ) {
      const message = `Alerta de governo: a capacidade administrativa crítica está afetando o atendimento, a satisfação dos grupos sociais e a permanência da população.`;
      state.history.unshift(`${state.currentDate}: ${message}`);
      state.news.unshift(message);
    }
  }

  private createPublicSentimentBulletin(state: SimulationState) {
    const group = [...(state.groups ?? [])].sort(
      (a, b) => a.satisfaction - b.satisfaction,
    )[0];
    if (!group || group.satisfaction >= 45) return;
    const marker = `Boletim social: ${group.key}`;
    if (state.news.some((item) => item.includes(marker))) return;
    const message = `${marker}: ${group.label} demonstra insatisfação crescente com os serviços e passa a pressionar o gabinete por respostas.`;
    state.history.unshift(`${state.currentDate}: ${message}`);
    state.news.unshift(message);
  }

  private applyBudgetQuality(state: SimulationState) {
    applySharedBudgetEffects(state as any, false);
  }
  private applyBudgetSocialEffects(state: SimulationState) {
    applySharedBudgetEffects(state as any, true);
  }
  private updateBudgetPressureHistory(state: SimulationState) {
    state.budgetPressureDays ??= {};
    const baseline: Record<string, number> = {
      health: 6000,
      education: 5000,
      infrastructure: 3000,
      transport: 2500,
      security: 1500,
    };
    const affectedGroups: Record<string, string[]> = {
      health: ['families', 'residents'],
      education: ['families', 'workers'],
      infrastructure: ['residents', 'business'],
      transport: ['business', 'workers'],
      security: ['residents', 'families'],
    };
    for (const line of state.budget ?? []) {
      const underfunded =
        line.dailyCost < (baseline[line.key] ?? line.dailyCost) * 0.9;
      for (const groupKey of affectedGroups[line.key] ?? [])
        state.budgetPressureDays[groupKey] = underfunded
          ? (state.budgetPressureDays[groupKey] ?? 0) + 1
          : 0;
    }
  }
  private createSocialReaction(state: SimulationState) {
    const candidate = [...(state.groups ?? [])].sort(
      (a, b) => a.satisfaction - b.satisfaction,
    )[0];
    if (!candidate || candidate.satisfaction >= 45) return;
    const id = `social-reaction-${state.currentDate}`;
    if (state.decisions.some((decision) => decision.id === id)) return;
    const pressureDays = state.budgetPressureDays?.[candidate.key] ?? 0;
    const cause =
      pressureDays >= 2
        ? ` após ${pressureDays} dias de subfinanciamento afetando ${candidate.concern}`
        : ` em meio às preocupações com ${candidate.concern}`;
    const reputation = candidate.reputation ?? candidate.satisfaction;
    const reactionImpact = reputation < 40 ? 3 : reputation > 60 ? 1.5 : 2;
    state.decisions.push({
      id,
      createdDate: state.currentDate,
      title: `${candidate.label} reage às condições da cidade`,
      context: `A satisfação de ${candidate.label.toLowerCase()} caiu para ${Math.round(candidate.satisfaction)}%${cause}. A confiança histórica do grupo está em ${Math.round(reputation)}%, por isso a cobrança é ${reactionImpact > 2 ? 'mais intensa' : reactionImpact < 2 ? 'mais moderada' : 'proporcional'}.`,
      category: 'URGENTE',
      urgency: 'MÉDIA',
      status: 'PENDING',
      options: [
        {
          id: `meet-${candidate.key}`,
          label: 'Receber representantes',
          description:
            'Abre diálogo e recupera confiança, mas consome capacidade administrativa.',
          groupEffects: { [candidate.key]: reactionImpact, workers: 0.2 },
        },
        {
          id: `dismiss-${candidate.key}`,
          label: 'Minimizar a reclamação',
          description:
            'Evita mudar a agenda, mas amplia o desgaste com o grupo.',
          groupEffects: { [candidate.key]: -reactionImpact },
        },
      ],
    });
    state.news.unshift(
      `Pressão social: ${candidate.label} organizou uma manifestação sobre ${candidate.concern}.`,
    );
    state.history.unshift(
      `${state.currentDate}: O gabinete recebeu uma reação pública de ${candidate.label.toLowerCase()}.`,
    );
  }
  private createPositiveReaction(state: SimulationState) {
    if (
      !state.currentDate.endsWith('-05') &&
      !state.currentDate.endsWith('-10')
    )
      return;
    const candidate = [...(state.groups ?? [])].sort(
      (a, b) => b.satisfaction - a.satisfaction,
    )[0];
    if (!candidate || candidate.satisfaction < 65) return;
    const id = `public-support-${state.currentDate}`;
    if (state.decisions.some((decision) => decision.id === id)) return;
    state.decisions.push({
      id,
      createdDate: state.currentDate,
      title: `${candidate.label} reconhece os avanços`,
      context: `A satisfação de ${candidate.label.toLowerCase()} chegou a ${Math.round(candidate.satisfaction)}%. Representantes elogiam os resultados e pedem que o governo consolide a política de ${candidate.concern}.`,
      category: 'ESTRATÉGICA',
      urgency: 'BAIXA',
      status: 'PENDING',
      options: [
        {
          id: `celebrate-${candidate.key}`,
          label: 'Comunicar a entrega',
          description:
            'Reforça a confiança pública e dá visibilidade ao resultado.',
          groupEffects: { [candidate.key]: 0.8 },
        },
        {
          id: `consolidate-${candidate.key}`,
          label: 'Consolidar silenciosamente',
          description:
            'Evita exposição e preserva a capacidade administrativa.',
          groupEffects: { [candidate.key]: 0.3, workers: 0.2 },
        },
      ],
    });
    state.news.unshift(
      `Apoio público: ${candidate.label} reconhece avanços em ${candidate.concern}.`,
    );
    state.history.unshift(
      `${state.currentDate}: O gabinete recebeu uma manifestação de apoio de ${candidate.label.toLowerCase()}.`,
    );
  }
  private createOperationalReview(state: SimulationState) {
    const day = Number(state.currentDate.slice(-2));
    if (day % 10 !== 0) return;
    const secretary = [...(state.secretaries ?? [])].sort(
      (a, b) => b.pressure - a.pressure,
    )[0];
    if (!secretary) return;
    const id = `operational-review-${state.currentDate}`;
    if (state.decisions.some((decision) => decision.id === id)) return;
    state.decisions.push({
      id,
      createdDate: state.currentDate,
      title: `Revisão operacional de ${secretary.label.toLowerCase()}`,
      context: `A revisão do período mostra eficiência de ${Math.round(secretary.efficiency)} e pressão de ${Math.round(secretary.pressure)} na secretaria de ${secretary.label.toLowerCase()}. O gabinete precisa decidir como ajustar a operação.`,
      category: 'ESTRATÉGICA',
      urgency: 'MÉDIA',
      status: 'PENDING',
      options: [
        {
          id: `invest-review-${secretary.key}`,
          label: 'Priorizar a secretaria',
          description:
            'Direciona atenção política e reduz a pressão operacional.',
          groupEffects: { workers: 0.5 },
        },
        {
          id: `defer-review-${secretary.key}`,
          label: 'Adiar a revisão',
          description:
            'Mantém o foco nas urgências, mas deixa a pressão acumular.',
          groupEffects: { workers: -0.5 },
        },
      ],
    });
    state.news.unshift(
      `Boletim administrativo: a secretaria de ${secretary.label.toLowerCase()} precisa de revisão.`,
    );
    state.history.unshift(
      `${state.currentDate}: o gabinete abriu uma revisão operacional periódica.`,
    );
  }
  private calibratePositiveReaction(state: SimulationState) {
    const decision = state.decisions.find(
      (item) => item.id === `public-support-${state.currentDate}`,
    );
    if (!decision) return;
    const groupKey = Object.keys(decision.options[0]?.groupEffects ?? {})[0];
    const group = state.groups?.find((item) => item.key === groupKey);
    if (!group) return;
    const reputation = group.reputation ?? group.satisfaction;
    const factor = reputation >= 75 ? 1.5 : reputation < 50 ? 0.5 : 1;
    for (const option of decision.options)
      if (option.groupEffects?.[groupKey] !== undefined)
        option.groupEffects[groupKey] = option.groupEffects[groupKey]! * factor;
  }
  private applySecretaryDecisions(state: SimulationState) {
    for (const decision of state.decisions) {
      if (
        !decision.id.startsWith('capacity-') ||
        decision.status !== 'RESOLVED' ||
        decision.applied
      )
        continue;
      const secretary = state.secretaries?.find(
        (item) => `capacity-${item.key}` === decision.id,
      );
      if (secretary) {
        const reorganized = decision.chosenOptionId?.startsWith('reorganize-');
        secretary.pressure = Math.max(
          0,
          secretary.pressure - (reorganized ? 15 : 0),
        );
        secretary.efficiency = this.clamp(
          secretary.efficiency + (reorganized ? 4 : -2),
        );
        if (reorganized) {
          const cost = 50000;
          state.treasury -= cost;
          state.ledger ??= [];
          state.ledger.unshift({
            date: state.currentDate,
            label: `Reorganização: ${secretary.label}`,
            amount: cost,
            kind: 'EXPENSE',
            category: 'DECISION',
          });
          for (const project of state.projects ?? []) {
            if (project.status === 'IN_PROGRESS' && project.risk === 'DELAYED') project.risk = 'NORMAL';
          }
        }
        state.history.unshift(
          `${state.currentDate}: ${secretary.label} ${reorganized ? 'reorganizou a operação e recuperou capacidade' : 'manteve a estrutura apesar da sobrecarga'}.`,
        );
      }
      decision.applied = true;
    }
  }
  private applyOperationalReviews(state: SimulationState) {
    for (const decision of state.decisions) {
      if (
        !decision.id.startsWith('operational-review-') ||
        decision.status !== 'RESOLVED' ||
        decision.applied
      )
        continue;
      const key = decision.chosenOptionId
        ?.replace('invest-review-', '')
        .replace('defer-review-', '');
      const secretary = state.secretaries?.find((item) => item.key === key);
      if (secretary) {
        const prioritized =
          decision.chosenOptionId?.startsWith('invest-review-');
        secretary.pressure = this.clamp(
          secretary.pressure + (prioritized ? -8 : 5),
        );
        secretary.efficiency = this.clamp(
          secretary.efficiency + (prioritized ? 2 : -1),
        );
        state.history.unshift(
          `${state.currentDate}: a revisão de ${secretary.label.toLowerCase()} foi ${prioritized ? 'priorizada' : 'adiada'}.`,
        );
      }
      decision.applied = true;
    }
  }
  private createStrategicAgenda(state: SimulationState) {
    const day = Number(state.currentDate.slice(-2));
    if (day !== 15) return;
    const weakest = [...state.indicators].sort((a, b) => a.value - b.value)[0];
    if (!weakest) return;
    const id = `strategic-agenda-${state.currentDate}`;
    if (state.decisions.some((decision) => decision.id === id)) return;
    const groupKey: Record<string, string> = {
      health: 'families',
      education: 'families',
      infrastructure: 'residents',
      transport: 'business',
      security: 'residents',
    };
    state.decisions.push({
      id,
      createdDate: state.currentDate,
      title: `Agenda estratégica: recuperar ${weakest.label.toLowerCase()}`,
      context: `O balanço do ciclo mostra ${weakest.label.toLowerCase()} como o indicador mais fraco, em ${weakest.value.toFixed(1)}. O gabinete precisa escolher entre investir agora ou preservar margem financeira.`,
      category: 'ESTRATÉGICA',
      urgency: 'MÉDIA',
      status: 'PENDING',
      options: [
        {
          id: `invest-${weakest.key}`,
          label: 'Priorizar investimento',
          description:
            'Custa R$ 300 mil, melhora o serviço e reduz a pressão da secretaria.',
          groupEffects: { [groupKey[weakest.key] ?? 'residents']: 1 },
        },
        {
          id: `reserve-${weakest.key}`,
          label: 'Preservar o caixa',
          description:
            'Evita a despesa imediata, mas adia a recuperação e gera desgaste.',
          groupEffects: { [groupKey[weakest.key] ?? 'residents']: -0.6 },
        },
      ],
    });
    state.news.unshift(
      `Agenda estratégica: o governo precisa decidir como recuperar ${weakest.label.toLowerCase()}.`,
    );
    state.history.unshift(
      `${state.currentDate}: o gabinete abriu a agenda estratégica do período.`,
    );
  }
  private applyStrategicAgendas(state: SimulationState) {
    for (const decision of state.decisions) {
      if (
        !decision.id.startsWith('strategic-agenda-') ||
        decision.status !== 'RESOLVED' ||
        decision.applied ||
        !decision.chosenOptionId
      )
        continue;
      const key = decision.chosenOptionId
        .replace('invest-', '')
        .replace('reserve-', '');
      const indicator = state.indicators.find((item) => item.key === key);
      const secretary = state.secretaries?.find((item) => item.key === key);
      const invested = decision.chosenOptionId.startsWith('invest-');
      if (invested) {
        if (indicator) indicator.value = this.clamp(indicator.value + 1.2);
        if (secretary) {
          secretary.pressure = this.clamp(secretary.pressure - 3);
          secretary.efficiency = this.clamp(secretary.efficiency + 1);
        }
        state.treasury -= 300000;
        state.ledger ??= [];
        state.ledger.unshift({
          date: state.currentDate,
          label: `Investimento estratégico: ${indicator?.label ?? key}`,
          amount: 300000,
          kind: 'EXPENSE',
          category: 'DECISION',
        });
        state.history.unshift(
          `${state.currentDate}: o investimento estratégico começou a recuperar ${indicator?.label?.toLowerCase() ?? key}.`,
        );
      } else {
        if (indicator) indicator.value = this.clamp(indicator.value - 0.3);
        if (secretary) secretary.pressure = this.clamp(secretary.pressure + 2);
        state.history.unshift(
          `${state.currentDate}: o governo preservou o caixa e adiou a recuperação de ${indicator?.label?.toLowerCase() ?? key}.`,
        );
      }
      decision.applied = true;
    }
  }
  private recordSnapshot(state: SimulationState) {
    state.snapshots ??= [];
    const serviceQuality =
      state.indicators.reduce((sum, indicator) => sum + indicator.value, 0) /
      Math.max(1, state.indicators.length);
    const groups = state.groups ?? [];
    const weight = groups.reduce(
      (sum, group) => sum + (group.populationWeight ?? 1),
      0,
    );
    const socialTrust = groups.length
      ? groups.reduce(
          (sum, group) =>
            sum + group.satisfaction * (group.populationWeight ?? 1),
          0,
        ) / Math.max(1, weight)
      : undefined;
    const secretaries = state.secretaries ?? [];
    const administrativeEfficiency = secretaries.length
      ? secretaries.reduce((sum, secretary) => sum + secretary.efficiency, 0) /
        secretaries.length
      : undefined;
    const fiscalStability =
      state.treasury < 0 ? 0 : state.fiscalAlert ? 55 : 100;
    state.snapshots.push({
      date: state.currentDate,
      approval: state.approval,
      treasury: state.treasury,
      population: state.population,
      serviceQuality: Math.round(serviceQuality),
      administrativeEfficiency:
        administrativeEfficiency === undefined
          ? undefined
          : Math.round(administrativeEfficiency),
      administrativeCapacity: state.administrativeCapacity,
      fiscalStability,
      socialTrust:
        socialTrust === undefined ? undefined : Math.round(socialTrust),
    });
    if (state.snapshots.length > 90)
      state.snapshots.splice(0, state.snapshots.length - 90);
  }
  private applyCriticalServiceReaction(
    state: SimulationState,
    weakest?: SimulationIndicator,
  ) {
    if (!weakest || weakest.value >= 40 || !state.groups?.length) return;
    const groupKey: Record<string, string> = {
      health: 'families',
      education: 'families',
      infrastructure: 'residents',
      transport: 'business',
      security: 'residents',
    };
    const group = state.groups.find(
      (item) => item.key === groupKey[weakest.key],
    );
    if (group) group.satisfaction = this.clamp(group.satisfaction - 0.8);
    const secretary = state.secretaries?.find(
      (item) => item.key === weakest.key,
    );
    if (secretary) {
      secretary.pressure = Math.min(100, secretary.pressure + 4);
      secretary.efficiency = Math.max(0, secretary.efficiency - 1);
    }
    state.administrativeAlerts ??= [];
    const alert = `A secretaria de ${weakest.label.toLowerCase()} precisa de um plano de recuperação.`;
    if (!state.administrativeAlerts.includes(alert)) {
      state.administrativeAlerts.unshift(alert);
      state.news.unshift(`Alerta administrativo: ${alert}`);
    }
    const decisionId = `critical-${weakest.key}`;
    if (!state.decisions.some((decision) => decision.id === decisionId)) {
      state.decisions.push({
        id: decisionId,
        createdDate: state.currentDate,
        title: `Plano emergencial para ${weakest.label.toLowerCase()}`,
        context: `O indicador de ${weakest.label.toLowerCase()} entrou em nível crítico. A secretaria solicita uma resposta imediata para evitar deterioração dos serviços.`,
        category: 'URGENTE',
        urgency: 'ALTA',
        status: 'PENDING',
        options: [
          {
            id: `act-${weakest.key}`,
            label: 'Liberar resposta emergencial',
            description:
              'Direciona recursos agora e reduz a pressão sobre o serviço.',
          },
          {
            id: `defer-${weakest.key}`,
            label: 'Adiar a resposta',
            description:
              'Preserva o caixa, mas a insatisfação e o risco operacional aumentam.',
          },
        ],
      });
      state.news.unshift(
        `Decisão urgente: o gabinete precisa agir em ${weakest.label.toLowerCase()}.`,
      );
    }
  }
  private unlockDrainage(state: SimulationState) {
    if (
      state.currentDate < '2025-01-04' ||
      state.decisions.some((d) => d.id === 'hospital-access')
    )
      return;
    state.decisions.push({
      id: 'hospital-access',
      title: 'Alagamentos ameaçam o acesso ao hospital',
      context:
        'Uma chuva intensa alagou a avenida de acesso ao hospital. A Defesa Civil recomenda uma obra emergencial de drenagem.',
      status: 'PENDING',
      options: [
        {
          id: 'drainage',
          label: 'Autorizar obra emergencial',
          description: 'Custa R$ 350 mil e reduz o risco para o hospital.',
        },
        {
          id: 'postpone',
          label: 'Adiar a obra',
          description:
            'Preserva o caixa, mas mantém a infraestrutura vulnerável.',
        },
      ],
    });
    state.news.unshift(
      'Alerta: chuva intensa causa alagamentos no acesso ao hospital municipal.',
    );
    state.history.unshift(
      `${state.currentDate}: Uma nova decisão chegou ao gabinete.`,
    );
  }
  private unlockTransport(state: SimulationState) {
    if (
      state.currentDate < '2025-01-07' ||
      state.decisions.some((d) => d.id === 'bus-line')
    )
      return;
    state.decisions.push({
      id: 'bus-line',
      title: 'Linha de ônibus ameaça parar',
      context:
        'A empresa responsável informa que uma linha essencial pode ser suspensa por falta de manutenção. Usuários já relatam atrasos.',
      status: 'PENDING',
      options: [
        {
          id: 'bus',
          label: 'Liberar manutenção emergencial',
          description: 'Custa R$ 180 mil e evita a interrupção.',
        },
        {
          id: 'wait',
          label: 'Aguardar negociação',
          description: 'Preserva o caixa, mas aumenta o risco de paralisação.',
        },
      ],
    });
    state.news.unshift(
      'Alerta: uma linha essencial de ônibus está em risco de paralisação.',
    );
    state.history.unshift(
      `${state.currentDate}: Uma nova decisão de transporte chegou ao gabinete.`,
    );
  }
  private unlockEducation(state: SimulationState) {
    if (
      state.currentDate < '2025-01-06' ||
      state.decisions.some((d) => d.id === 'school-meals')
    )
      return;
    state.decisions.push({
      id: 'school-meals',
      title: 'Escolas pedem reforço na merenda',
      context:
        'Diretores relatam aumento da demanda e pedem um reforço emergencial para manter a alimentação dos alunos.',
      status: 'PENDING',
      options: [
        {
          id: 'meals',
          label: 'Reforçar a merenda',
          description: 'Custa R$ 90 mil e atende as famílias.',
          groupEffects: { families: 1.2, residents: 0.5 },
        },
        {
          id: 'review-meals',
          label: 'Fazer revisão técnica',
          description: 'Adia o gasto, mas mantém a pressão sobre as escolas.',
          groupEffects: { families: -0.8, workers: -0.3 },
        },
      ],
    });
    state.news.unshift(
      'Alerta: escolas municipais pedem reforço emergencial na merenda.',
    );
    state.history.unshift(
      `${state.currentDate}: Uma nova decisão de educação chegou ao gabinete.`,
    );
  }
  private unlockSafety(state: SimulationState) {
    if (
      state.currentDate < '2025-01-10' ||
      state.decisions.some((d) => d.id === 'street-lighting')
    )
      return;
    state.decisions.push({
      id: 'street-lighting',
      title: 'Bairros cobram iluminação pública',
      context:
        'Relatos de ruas escuras aumentaram. A secretaria propõe uma força-tarefa de manutenção.',
      status: 'PENDING',
      options: [
        {
          id: 'lighting',
          label: 'Autorizar força-tarefa',
          description: 'Custa R$ 140 mil e melhora a sensação de segurança.',
          groupEffects: { residents: 1, families: 0.8 },
        },
        {
          id: 'defer-lighting',
          label: 'Adiar manutenção',
          description: 'Preserva o caixa, mas aumenta a insatisfação local.',
          groupEffects: { residents: -1, families: -0.6 },
        },
      ],
    });
    state.news.unshift(
      'Alerta: moradores cobram manutenção da iluminação pública.',
    );
    state.history.unshift(
      `${state.currentDate}: Uma nova decisão de segurança chegou ao gabinete.`,
    );
  }
  private unlockEconomicDecision(state: SimulationState) {
    if (
      state.currentDate < '2025-01-15' ||
      state.decisions.some((d) => d.id === 'economic-program')
    )
      return;
    state.decisions.push({
      id: 'economic-program',
      title: 'Como fortalecer a economia local?',
      context:
        'A arrecadação precisa crescer sem comprometer a confiança da cidade. O gabinete pode apoiar o comércio ou modernizar a cobrança de tributos.',
      status: 'PENDING',
      options: [
        {
          id: 'commerce-incentive',
          label: 'Incentivar o comércio',
          description:
            'Custa R$ 450 mil e aumenta a confiança dos comerciantes.',
          groupEffects: { business: 3 },
        },
        {
          id: 'tax-modernization',
          label: 'Modernizar a arrecadação',
          description:
            'Custa R$ 600 mil e melhora a aprovação da gestão financeira.',
          groupEffects: { residents: 0.5, business: -0.5 },
        },
        {
          id: 'defer-economic',
          label: 'Adiar o programa',
          description:
            'Preserva o caixa, mas não melhora a capacidade de arrecadação.',
        },
      ],
    });
  }
  private unlockAdministrativeRecovery(state: SimulationState) {
    if (
      (state.administrativeCapacity ?? 100) >= 50 ||
      state.currentDate < '2025-01-20' ||
      state.decisions.some((d) => d.id === 'administrative-recovery')
    )
      return;
    state.decisions.push({
      id: 'administrative-recovery',
      title: 'Capacidade administrativa em nível crítico',
      context:
        'As secretarias estão sobrecarregadas e a execução das políticas começa a perder ritmo. O gabinete precisa decidir se reorganiza as equipes ou aceita o desgaste.',
      status: 'PENDING',
      options: [
        {
          id: 'reorganize-secretariat',
          label: 'Reorganizar as equipes',
          description:
            'Custa R$ 250 mil, reduz a pressão e recupera eficiência.',
        },
        {
          id: 'accept-overload',
          label: 'Aceitar a sobrecarga',
          description: 'Preserva o caixa, mas mantém o risco de atrasos.',
        },
      ],
    });
  }
  private unlockHospitalConsequence(state: SimulationState) {
    if (
      state.currentDate < '2025-01-08' ||
      state.decisions.some(
        (d) => d.id === 'hospital-crisis' || d.id === 'hospital-stable',
      )
    )
      return;
    const hospital = state.decisions.find((d) => d.id === 'hospital-overload');
    if (!hospital?.chosenOptionId) return;
    if (hospital.chosenOptionId === 'deny') {
      state.decisions.push({
        id: 'hospital-crisis',
        title: 'Crise no atendimento do hospital',
        context:
          'A falta de profissionais aumentou as filas e a imprensa noticia pacientes aguardando atendimento. O gabinete precisa agir.',
        status: 'PENDING',
        options: [
          {
            id: 'emergency-health',
            label: 'Abrir plantão emergencial',
            description: 'Custa R$ 250 mil e reduz o dano à saúde.',
            groupEffects: { residents: 1.5, families: 1.2 },
          },
          {
            id: 'manage-crisis',
            label: 'Comunicar e aguardar',
            description: 'Evita o gasto imediato, mas desgasta a confiança.',
            groupEffects: { residents: -2, families: -1.5 },
          },
        ],
      });
      state.news.unshift(
        'Crise: filas no hospital municipal pressionam o governo.',
      );
      state.history.unshift(
        `${state.currentDate}: A decisão anterior sobre o hospital gerou uma crise.`,
      );
    } else {
      state.decisions.push({
        id: 'hospital-stable',
        title: 'Atendimento do hospital estabilizado',
        context:
          'A contratação temporária reduziu as filas. A Secretaria da Saúde pede apenas monitoramento até o fim do ciclo.',
        status: 'PENDING',
        options: [
          {
            id: 'monitor-health',
            label: 'Manter monitoramento',
            description:
              'Sem custo adicional; consolida o resultado da contratação.',
            groupEffects: { residents: 0.6, families: 0.5 },
          },
          {
            id: 'expand-health',
            label: 'Ampliar o atendimento',
            description:
              'Custa R$ 80 mil e melhora ainda mais a percepção das famílias.',
            groupEffects: { residents: 1, families: 1 },
          },
        ],
      });
      state.news.unshift(
        'Boa notícia: o atendimento do hospital municipal foi estabilizado.',
      );
      state.history.unshift(
        `${state.currentDate}: A decisão de saúde produziu uma consequência favorável.`,
      );
    }
  }
  private unlockTransportConsequence(state: SimulationState) {
    if (
      state.currentDate < '2025-01-11' ||
      state.decisions.some(
        (d) => d.id === 'transport-stable' || d.id === 'transport-strike',
      )
    )
      return;
    const decision = state.decisions.find((d) => d.id === 'bus-line');
    if (!decision?.chosenOptionId) return;
    const stable = decision.chosenOptionId === 'bus';
    state.decisions.push({
      id: stable ? 'transport-stable' : 'transport-strike',
      title: stable
        ? 'Linha de ônibus normalizada'
        : 'Paralisação afeta a cidade',
      context: stable
        ? 'A manutenção emergencial evitou a interrupção da linha. O gabinete deve decidir como comunicar o resultado.'
        : 'A negociação não avançou e a linha foi paralisada. A população cobra uma resposta imediata.',
      status: 'PENDING',
      options: stable
        ? [
            {
              id: 'announce-bus',
              label: 'Comunicar o resultado',
              description:
                'Reforça a confiança dos comerciantes e trabalhadores.',
              groupEffects: { business: 0.8, workers: 0.5 },
            },
            {
              id: 'quiet-bus',
              label: 'Não dar destaque',
              description:
                'Evita exposição, mas perde uma oportunidade de reconhecimento.',
              groupEffects: { business: -0.4 },
            },
          ]
        : [
            {
              id: 'negotiate-bus',
              label: 'Abrir negociação emergencial',
              description: 'Custa R$ 220 mil e reduz o impacto da paralisação.',
              groupEffects: { business: 1, workers: 0.8 },
            },
            {
              id: 'accept-bus',
              label: 'Aceitar a paralisação',
              description: 'Preserva o caixa, mas prejudica a mobilidade.',
              groupEffects: { business: -2, workers: -1 },
            },
          ],
    });
    state.history.unshift(
      `${state.currentDate}: O transporte produziu uma nova consequência.`,
    );
    state.news.unshift(
      stable
        ? 'Boa notícia: a linha de ônibus voltou à normalidade.'
        : 'Crise: uma linha de ônibus foi paralisada.',
    );
  }
  private unlockEducationConsequence(state: SimulationState) {
    if (
      state.currentDate < '2025-01-12' ||
      state.decisions.some((d) => d.id === 'school-result')
    )
      return;
    const decision = state.decisions.find((d) => d.id === 'school-meals');
    if (!decision?.chosenOptionId) return;
    const helped = decision.chosenOptionId === 'meals';
    state.decisions.push({
      id: 'school-result',
      title: helped
        ? 'Merenda reforçada melhora a frequência'
        : 'Escolas relatam falta de alimentos',
      context: helped
        ? 'A medida emergencial foi bem recebida pelas famílias e a frequência melhorou.'
        : 'A revisão demorou mais que o esperado e as escolas pedem uma resposta antes do fim do ciclo.',
      status: 'PENDING',
      options: helped
        ? [
            {
              id: 'record-meals',
              label: 'Registrar o resultado',
              description: 'Consolida a confiança das famílias.',
              groupEffects: { families: 0.8 },
            },
          ]
        : [
            {
              id: 'emergency-meals',
              label: 'Fazer compra emergencial',
              description:
                'Custa R$ 160 mil e reduz o desgaste com as famílias.',
              groupEffects: { families: 1 },
            },
            {
              id: 'keep-review',
              label: 'Manter a revisão',
              description: 'Evita o gasto, mas prolonga a insatisfação.',
              groupEffects: { families: -1.2 },
            },
          ],
    });
    state.history.unshift(
      `${state.currentDate}: A política de educação produziu uma nova consequência.`,
    );
  }
  private unlockFiscalContainment(state: SimulationState) {
    if (
      (state.fiscalStability ?? 100) >= 60 ||
      state.currentDate < '2025-01-05' ||
      state.decisions.some((d) => d.id === 'fiscal-containment')
    )
      return;
    state.decisions.push({
      id: 'fiscal-containment',
      title: 'Caixa sob pressão exige contenção',
      context:
        'A margem fiscal caiu abaixo do nível seguro. O gabinete precisa reduzir despesas ou aceitar maior risco.',
      category: 'URGENTE',
      urgency: 'ALTA',
      status: 'PENDING',
      options: [
        {
          id: 'contain-expenses',
          label: 'Adotar contenção temporária',
          description:
            'Reduz em 5% o orçamento diário, mas gera custo político.',
        },
        {
          id: 'maintain-spending',
          label: 'Manter os gastos atuais',
          description:
            'Preserva os serviços no curto prazo, mas mantém a deterioração fiscal.',
        },
      ],
    });
    state.news.unshift(
      'Alerta fiscal: o gabinete recebeu uma proposta de contenção de despesas.',
    );
    state.history.unshift(
      `${state.currentDate}: uma decisão de contenção fiscal chegou ao gabinete.`,
    );
  }
  private unlockDebtRenegotiation(state: SimulationState) {
    if (
      state.currentDate < '2025-02-01' ||
      !(state.debt ?? 120000000) ||
      state.decisions.some((d) => d.id === 'debt-renegotiation')
    )
      return;
    state.decisions.push({
      id: 'debt-renegotiation',
      title: 'Credores propõem renegociação da dívida',
      context:
        'O serviço mensal pesa sobre o orçamento. O governo pode amortizar parte da dívida ou refinanciar o compromisso para preservar caixa.',
      category: 'ESTRATÉGICA',
      urgency: 'MÉDIA',
      status: 'PENDING',
      options: [
        {
          id: 'amortize-debt',
          label: 'Amortizar parte da dívida',
          description:
            'Paga R$ 2 milhões agora e reduz R$ 10 milhões do saldo devedor.',
        },
        {
          id: 'refinance-debt',
          label: 'Refinanciar o compromisso',
          description:
            'Recebe R$ 500 mil agora, mas aumenta a dívida em R$ 5 milhões.',
        },
      ],
    });
    state.news.unshift('Finanças: credores propuseram renegociação da dívida.');
    state.history.unshift(
      `${state.currentDate}: uma proposta de renegociação chegou ao gabinete.`,
    );
  }
  private unlockInfrastructureContingency(state: SimulationState) {
    if (state.currentDate < '2025-01-22' || state.decisions.some((d) => d.id === 'infrastructure-contingency')) return;
    const delayed = (state.projects ?? []).some((p) => p.status === 'IN_PROGRESS' && p.risk === 'DELAYED');
    const infrastructure = state.indicators.find((item) => item.key === 'infrastructure')?.value ?? 100;
    const protectedByProject = (state.projects ?? []).some((item) => item.status === 'IN_PROGRESS' && item.area === 'Infraestrutura' && item.risk !== 'DELAYED');
    if (!delayed && infrastructure >= 55) return;
    state.decisions.push({
      id: 'infrastructure-contingency', createdDate: state.currentDate,
      title: 'Plano preventivo de abastecimento',
      context: 'A pressão sobre a infraestrutura exige uma ação preventiva para evitar interrupções nos serviços essenciais.',
      category: 'ESTRATÉGICA', urgency: 'ALTA', status: 'PENDING',
      options: [
        { id: 'prevent-infrastructure', label: 'Executar manutenção preventiva', description: 'Investe agora e recupera a confiança de moradores e famílias.', groupEffects: { residents: 1.2, families: 1 } },
        { id: 'defer-infrastructure', label: 'Adiar a intervenção', description: 'Preserva o caixa no curto prazo, mas aumenta a pressão social.', groupEffects: { residents: -1, families: -1.2 } },
      ],
    });
    state.news.unshift('Infraestrutura: o gabinete recebeu um plano preventivo de abastecimento.');
    state.history.unshift(`${state.currentDate}: a infraestrutura entrou em atenção e recebeu um plano preventivo.`);
  }
  private createCityPulseDecision(state: SimulationState) {
    const day = Number(state.currentDate.slice(-2));
    const id = `city-pulse-${state.currentDate}`;
    if (day % 7 !== 0 || state.decisions.some((item) => item.id === id) || state.decisions.some((item) => item.status === 'PENDING' && item.urgency === 'ALTA')) return;
    state.decisions.push({ id, createdDate: state.currentDate, title: 'Fim de semana movimentado no centro', context: 'O comércio local pede apoio para organizar uma programação que aumenta a circulação, mas exige uma despesa imediata.', status: 'PENDING', category: 'ESTRATÉGICA', urgency: 'MÉDIA', options: [
      { id: `support-${id}`, label: 'Apoiar a programação', description: 'Investe R$ 80 mil e melhora a confiança do comércio e dos moradores.', groupEffects: { business: 1.2, residents: 0.4 } },
      { id: `preserve-${id}`, label: 'Preservar o caixa', description: 'Evita a despesa, mas reduz o entusiasmo do comércio local.', groupEffects: { business: -0.8 } },
    ] });
    state.news.unshift('Cidade viva: o comércio local trouxe uma demanda sobre a movimentação do centro.');
  }
  private createCityPulseFollowUp(state: SimulationState) {
    const source = state.decisions.find((item) => item.id.startsWith('city-pulse-') && item.chosenOptionId?.startsWith('support-city-pulse-'));
    if (!source || !source.resolvedDate || this.daysBetween(source.resolvedDate, state.currentDate) < 3 || state.decisions.some((item) => item.id === `city-pulse-followup-${source.createdDate}`)) return;
    const id = `city-pulse-followup-${source.createdDate}`;
    state.decisions.push({ id, createdDate: state.currentDate, title: 'O comércio pede continuidade', context: 'A programação movimentou o centro e comerciantes pedem que o governo mantenha o apoio.', status: 'PENDING', category: 'ESTRATÉGICA', urgency: 'MÉDIA', options: [{ id: 'extend-city-pulse', label: 'Manter o apoio por mais um ciclo', description: 'Investe R$ 100 mil e consolida a confiança do comércio.', groupEffects: { business: 1, residents: 0.3 } }, { id: 'close-city-pulse', label: 'Encerrar o apoio', description: 'Preserva o caixa, mas frustra parte dos comerciantes.', groupEffects: { business: -0.8 } }] });
    state.decisions[state.decisions.length - 1].parentDecisionId = source.id;
    state.news.unshift('Cidade viva: após o sucesso da programação, o comércio pediu continuidade.');
  }
  private createWeatherFollowUp(state: SimulationState) {
    const source = state.decisions.find((item) => item.id.startsWith('weather-disruption-') && item.chosenOptionId?.startsWith('wait-weather-disruption-'));
    if (!source || !source.resolvedDate || this.daysBetween(source.resolvedDate, state.currentDate) < 2 || state.decisions.some((item) => item.id === `weather-followup-${source.createdDate}`)) return;
    const id = `weather-followup-${source.createdDate}`;
    state.decisions.push({ id, createdDate: state.currentDate, title: 'Moradores cobram reparos após a chuva', context: 'O adiamento da resposta prolongou os transtornos. Moradores pedem uma correção antes que a próxima chuva agrave o problema.', status: 'PENDING', category: 'URGENTE', urgency: 'ALTA', options: [{ id: 'repair-weather-disruption', label: 'Autorizar reparos corretivos', description: 'Investe R$ 120 mil, recupera a infraestrutura e reduz a pressão social.', groupEffects: { residents: 0.9, families: 0.7 } }, { id: 'accept-weather-delay', label: 'Aceitar o atraso', description: 'Preserva o caixa, mas prolonga o desgaste dos moradores.', groupEffects: { residents: -1, families: -0.8 } }] });
    state.decisions[state.decisions.length - 1].parentDecisionId = source.id;
    state.news.unshift('Pressão social: moradores cobraram reparos após o adiamento da resposta à chuva.');
  }
  private createWeatherDisruptionDecision(state: SimulationState) {
    const infrastructure = state.indicators.find((item) => item.key === 'infrastructure')?.value ?? 100;
    const protectedByProject = (state.projects ?? []).some((item) => item.status === 'IN_PROGRESS' && item.area === 'Infraestrutura' && item.risk !== 'DELAYED');
    const id = `weather-disruption-${state.currentDate}`;
    const recent = state.decisions.some((item) => item.id.startsWith('weather-disruption-') && (Date.parse(`${state.currentDate}T00:00:00Z`) - Date.parse(`${item.createdDate ?? state.currentDate}T00:00:00Z`)) / 86400000 < 7);
    if (state.currentDate < '2025-01-15' || infrastructure >= 56 || protectedByProject || recent || state.decisions.some((item) => item.status === 'PENDING' && item.urgency === 'ALTA')) return;
    state.decisions.push({ id, createdDate: state.currentDate, title: 'Chuva forte testa a infraestrutura', context: 'Uma chuva intensa causou alagamentos pontuais. O gabinete precisa escolher entre mobilizar recursos imediatamente ou aguardar a água baixar.', status: 'PENDING', category: 'URGENTE', urgency: 'ALTA', options: [
      { id: `mobilize-${id}`, label: 'Mobilizar equipes', description: 'Reduz os transtornos agora, mas consome R$ 60 mil.', groupEffects: { residents: 0.8, families: 0.5 } },
      { id: `wait-${id}`, label: 'Aguardar', description: 'Preserva o caixa, mas aumenta a insatisfação dos moradores.', groupEffects: { residents: -1.1, families: -0.7 } },
    ] });
    state.news.unshift('Cidade viva: uma chuva forte expôs a fragilidade da infraestrutura urbana.');
  }
  private createTransitDisruptionDecision(state: SimulationState) {
    const transport = state.indicators.find((item) => item.key === 'transport')?.value ?? 100;
    const protectedByProject = (state.projects ?? []).some((item) => item.status === 'IN_PROGRESS' && item.area === 'Transporte' && item.risk !== 'DELAYED');
    const id = `transit-disruption-${state.currentDate}`;
    const recent = state.decisions.some((item) => item.id.startsWith('transit-disruption-') && (Date.parse(`${state.currentDate}T00:00:00Z`) - Date.parse(`${item.createdDate ?? state.currentDate}T00:00:00Z`)) / 86400000 < 7);
    if (transport >= 55 || protectedByProject || recent || state.decisions.some((item) => item.status === 'PENDING' && item.urgency === 'ALTA')) return;
    state.decisions.push({ id, createdDate: state.currentDate, title: 'Interrupção de linha afeta a cidade', context: 'Uma linha importante foi interrompida e trabalhadores e famílias pedem uma resposta rápida.', status: 'PENDING', category: 'URGENTE', urgency: 'ALTA', options: [
      { id: `reroute-${id}`, label: 'Criar operação emergencial', description: 'Custa R$ 45 mil e reduz o impacto sobre a mobilidade.', groupEffects: { workers: 0.6, families: 0.5 } },
      { id: `monitor-${id}`, label: 'Monitorar a situação', description: 'Preserva o caixa, mas aumenta a frustração de trabalhadores e famílias.', groupEffects: { workers: -0.8, families: -0.5 } },
    ] });
    state.news.unshift('Cidade viva: uma interrupção de transporte afetou a rotina de trabalhadores e famílias.');
  }
  private createTransitDisruptionFollowUp(state: SimulationState) {
    const source = state.decisions.find((item) => item.id.startsWith('transit-disruption-') && item.chosenOptionId?.startsWith('monitor-'));
    if (!source || !source.resolvedDate || this.daysBetween(source.resolvedDate, state.currentDate) < 2 || state.decisions.some((item) => item.id === `transit-followup-${source.createdDate}`)) return;
    const id = `transit-followup-${source.createdDate}`;
    state.decisions.push({ id, createdDate: state.currentDate, title: 'Trabalhadores cobram solução para a linha', context: 'O monitoramento não resolveu a interrupção. Trabalhadores e famílias pedem uma resposta antes que o serviço comprometa a rotina da cidade.', status: 'PENDING', category: 'URGENTE', urgency: 'ALTA', options: [{ id: 'restore-transit-service', label: 'Restabelecer a operação', description: 'Investe R$ 90 mil, reduz a pressão sobre o Transporte e recupera a confiança dos usuários.', groupEffects: { workers: 1, families: 0.8 } }, { id: 'extend-transit-monitoring', label: 'Prorrogar o monitoramento', description: 'Preserva o caixa, mas prolonga a frustração de trabalhadores e famílias.', groupEffects: { workers: -1.1, families: -0.8 } }] });
    state.decisions[state.decisions.length - 1].parentDecisionId = source.id;
    state.news.unshift('Pressão de mobilidade: trabalhadores cobraram solução após o adiamento da resposta à interrupção.');
  }
  private unlockPublicPressure(state: SimulationState) {
    if (
      state.currentDate < '2025-01-05' ||
      state.decisions.some((d) => d.id.startsWith('public-pressure-') && d.status === 'PENDING')
    )
      return;
    const pressureDecisions = state.decisions.filter((d) => d.id === 'public-pressure' || d.id.startsWith('public-pressure-'));
    const lastResolved = pressureDecisions.filter((d) => d.status === 'RESOLVED' && d.resolvedDate).sort((a, b) => (b.resolvedDate ?? '').localeCompare(a.resolvedDate ?? ''))[0];
    if (lastResolved?.resolvedDate && this.daysBetween(lastResolved.resolvedDate, state.currentDate) < 3) return;
    const group = [...(state.groups ?? [])].sort(
      (a, b) =>
        (a.satisfaction - 50) * (a.populationWeight ?? 1) -
        (b.satisfaction - 50) * (b.populationWeight ?? 1),
    )[0];
    if (!group || group.satisfaction >= 45) return;
    state.decisions.push({
      id: state.decisions.some((item) => item.id === 'public-pressure') ? `public-pressure-${state.currentDate}` : 'public-pressure',
      title: `${group.label} exige resposta do governo`,
      context: `A satisfação de ${group.label.toLowerCase()} caiu para ${Math.round(group.satisfaction)}%. A confiança histórica está em ${Math.round(group.reputation ?? group.satisfaction)}%, e representantes pedem uma resposta pública antes que a insatisfação se espalhe.`,
      category: 'URGENTE',
      urgency: 'ALTA',
      status: 'PENDING',
      options: [
        {
          id: 'listen-public',
          label: 'Abrir mesa de diálogo',
          description: 'Dedica tempo do gabinete e recupera confiança.',
          groupEffects: { [group.key]: 1.5 },
        },
        {
          id: 'ignore-public',
          label: 'Manter a agenda',
          description: 'Evita custo imediato, mas amplia o desgaste.',
          groupEffects: { [group.key]: -1.5 },
        },
      ],
    });
    state.news.unshift(
      `Pressão pública: ${group.label} pede resposta do gabinete.`,
    );
    state.history.unshift(
      `${state.currentDate}: Um grupo social organizou uma pressão pública.`,
    );
  }
  private daysBetween(from: string, to: string) {
    return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
  }
  private updateObjectives(state: SimulationState) {
    for (const objective of state.objectives ?? []) {
      if (objective.status !== 'IN_PROGRESS') continue;
      if (objective.type === 'APPROVAL') objective.current = state.approval;
      else if (objective.type === 'TREASURY')
        objective.current = state.treasury;
      else
        objective.current =
          state.indicators.find((item) => item.key === objective.id)?.value ??
          objective.current;
      if (objective.current >= objective.target) {
        objective.status = 'COMPLETED';
        state.history.unshift(
          `${state.currentDate}: meta concluída — ${objective.label}.`,
        );
        state.news.unshift(`Meta alcançada: ${objective.label}.`);
      }
    }
  }
  private evaluateCycle(state: SimulationState) {
    const objectives = state.objectives ?? [];
    for (const objective of objectives)
      if (objective.status === 'IN_PROGRESS') objective.status = 'FAILED';
    const completed = objectives.filter(
      (item) => item.status === 'COMPLETED',
    ).length;
    const pending = state.decisions.filter(
      (decision) => decision.status === 'PENDING',
    ).length;
    const fiscalPenalty = state.treasury < 0 ? 12 : state.fiscalAlert ? 4 : 0;
    const serviceQuality = Math.round(
      state.indicators.reduce((sum, indicator) => sum + indicator.value, 0) /
        Math.max(1, state.indicators.length),
    );
    const administrativeEfficiency = Math.round(
      (state.secretaries ?? []).reduce(
        (sum, secretary) => sum + secretary.efficiency,
        0,
      ) / Math.max(1, state.secretaries?.length ?? 1),
    );
    const fiscalStability =
      state.treasury < 0 ? 0 : state.fiscalAlert ? 55 : 100;
    const groups = state.groups ?? [];
    const socialWeight = groups.reduce(
      (sum, group) => sum + (group.populationWeight ?? 1),
      0,
    );
    const socialTrust = Math.round(
      groups.reduce(
        (sum, group) =>
          sum + group.satisfaction * (group.populationWeight ?? 1),
        0,
      ) / Math.max(1, socialWeight),
    );
    const score = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          (completed / Math.max(1, objectives.length)) * 60 +
            state.approval * 0.4 -
            pending * 2 -
            fiscalPenalty,
        ),
      ),
    );
    const title =
      score >= 80
        ? 'Um início de mandato promissor'
        : score >= 60
          ? 'Um governo em construção'
          : 'Um início de mandato sob pressão';
    const weakest = [...state.indicators].sort((a, b) => a.value - b.value)[0];
    const baseline = state.snapshots?.[0];
    const latest = state.snapshots?.at(-1);
    state.evaluation = {
      score,
      title,
      summary: `Você concluiu ${completed} de ${objectives.length} metas do primeiro ciclo, encerrou o período com ${state.approval.toFixed(1)}% de aprovação e deixou ${pending} decisão(ões) pendente(s).`,
      completedObjectives: completed,
      totalObjectives: objectives.length,
      serviceQuality,
      administrativeEfficiency,
      fiscalStability,
      socialTrust,
      recommendedIndicatorKey: weakest?.key,
      recommendedIndicatorLabel: weakest?.label,
      approvalDelta: baseline && latest ? Number(latest.approval) - Number(baseline.approval) : undefined,
      serviceQualityDelta: baseline && latest ? Number(latest.serviceQuality) - Number(baseline.serviceQuality) : undefined,
      treasuryDelta: baseline && latest ? Number(latest.treasury) - Number(baseline.treasury) : undefined,
    };
    state.legacy ??= [];
    state.legacy.unshift(
      `${state.currentDate}: ciclo encerrado com nota ${score}/100; ${completed} de ${objectives.length} metas concluídas. Prioridade deixada para o próximo ciclo: ${weakest?.label ?? 'equilíbrio geral'}.`,
    );
    state.legacy = state.legacy.slice(0, 6);
    state.history.unshift(
      `${state.currentDate}: avaliação do primeiro ciclo — ${title}.`,
    );
    state.news.unshift(`Avaliação do governo: ${title}.`);
  }
  private clamp(value: number) {
    return Math.max(0, Math.min(100, value));
  }
}
