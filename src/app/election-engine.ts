export type ElectionPhase = 'PRE_CAMPAIGN' | 'CAMPAIGN' | 'DEBATE' | 'RESULT';

export type CampaignAction = 'MEET_GROUPS' | 'VISIT_PROJECT' | 'CRISIS_COMMUNICATION' | 'NEW_PROMISE';

export interface ElectionCandidate {
  id: string;
  name: string;
  isIncumbent: boolean;
  support: number;
  rejection: number;
  platform: string;
  style: string;
}

export interface ElectionState {
  phase: ElectionPhase;
  week: number;
  candidates: ElectionCandidate[];
  incumbentAgenda: string[];
  debateCompleted: boolean;
  winnerId?: string;
  explanation?: string;
  history: ElectionHistoryEntry[];
  pollHistory: ElectionPoll[];
  campaignFunds: number;
  promises: ElectionPromise[];
  debateQuestion: string;
}

export interface ElectionPromise { id: string; area: string; label: string; estimatedCost: number; deadlineWeeks: number; credibility: number; groupEffects: Record<string, number>; }

export interface ElectionHistoryEntry {
  type: 'CAMPAIGN' | 'DEBATE' | 'RESULT';
  week: number;
  label: string;
  incumbentSupport: number;
  cost?: number;
}

export interface ElectionSnapshot {
  approval: number;
  socialSatisfaction: number;
  completedProjects: number;
  delayedProjects: number;
  fiscalStability: number;
  activeFocus?: string;
}

export interface ElectionPoll {
  period: string;
  candidates: { id: string; name: string; support: number; rejection: number }[];
  undecided: number;
}

/** Núcleo determinístico e isolado da primeira fase eleitoral. */
export class ElectionEngine {
  start(snapshot: ElectionSnapshot, incumbentName: string): ElectionState {
    const incumbentSupport = this.baseSupport(snapshot);
    return {
      phase: 'PRE_CAMPAIGN', week: 0, debateCompleted: false, history: [], pollHistory: [], campaignFunds: 100, promises: [],
      debateQuestion: snapshot.delayedProjects > 0 ? 'A oposição questiona os atrasos do mandato. Como você explica essas entregas?' : snapshot.fiscalStability < 50 ? 'A oposição questiona a saúde das contas públicas. Como você pretende financiar sua agenda?' : 'A oposição questiona quais resultados do mandato justificam mais quatro anos de governo?',
      incumbentAgenda: snapshot.activeFocus ? [snapshot.activeFocus] : [],
      candidates: [
        { id: 'incumbent', name: incumbentName, isIncumbent: true, support: incumbentSupport, rejection: Math.max(5, 55 - snapshot.approval), platform: 'continuidade com resultados', style: 'gestão e prestação de contas' },
        { id: 'opposition-a', name: 'Marina Duarte', isIncumbent: false, support: 50 - incumbentSupport / 2, rejection: 24, platform: 'serviços públicos e proteção social', style: 'oposição fiscalizadora' },
        { id: 'opposition-b', name: 'Rafael Nascimento', isIncumbent: false, support: 50 - incumbentSupport / 2, rejection: 20, platform: 'eficiência, emprego e renovação', style: 'oposição propositiva' },
      ],
    };
  }

  campaign(state: ElectionState, action: CampaignAction, snapshot: ElectionSnapshot): ElectionState {
    if (state.phase !== 'CAMPAIGN' || state.week >= 3) return state;
    const next = this.clone(state);
    const cost = this.actionCost(action);
    if (next.campaignFunds < cost) return state;
    next.campaignFunds = this.clamp(next.campaignFunds - cost);
    if (action === 'NEW_PROMISE' && next.promises.length < 3) {
      const areas = ['saúde', 'transporte', 'educação'];
      const area = areas[next.week] ?? 'gestão pública';
      const groupEffects: Record<string, number> = area === 'saúde' ? { residents: 1.2, families: 1 } : area === 'transporte' ? { business: 1.2, workers: .8 } : { families: 1.3, workers: .7 };
      const promise = { id: `promise-${next.week + 1}`, area, label: `Compromisso de ${area}`, estimatedCost: 12 + next.week * 4, deadlineWeeks: 8, credibility: snapshot.fiscalStability >= 50 ? 78 : 55, groupEffects };
      next.promises.push(promise);
      next.incumbentAgenda.push(promise.label);
    }
    const incumbent = next.candidates.find((candidate) => candidate.isIncumbent)!;
    const delta = action === 'VISIT_PROJECT' ? snapshot.completedProjects * 0.8 - snapshot.delayedProjects * 1.2 : action === 'CRISIS_COMMUNICATION' ? snapshot.approval >= 50 ? 1.5 : -1 : action === 'MEET_GROUPS' ? snapshot.socialSatisfaction / 40 : -0.8;
    incumbent.support = this.clamp(incumbent.support + delta);
    this.shiftOpposition(next, delta);
    incumbent.rejection = this.clamp(incumbent.rejection + (action === 'NEW_PROMISE' ? 1 : -0.3));
    next.week += 1;
    next.phase = next.week >= 3 ? 'DEBATE' : 'CAMPAIGN';
    next.history.push({ type: 'CAMPAIGN', week: next.week, label: action, incumbentSupport: incumbent.support, cost });
    next.pollHistory.push(this.makePoll(next, `Semana ${next.week}`));
    return next;
  }

  beginCampaign(state: ElectionState): ElectionState { return { ...this.clone(state), phase: 'CAMPAIGN' }; }

  poll(state: ElectionState): ElectionPoll {
    return this.makePoll(state, state.phase === 'PRE_CAMPAIGN' ? 'Pré-campanha' : `Semana ${state.week}`);
  }

  private makePoll(state: ElectionState, period: string): ElectionPoll {
    const candidates = state.candidates.map((candidate) => ({ id: candidate.id, name: candidate.name, support: candidate.support, rejection: candidate.rejection }));
    const total = candidates.reduce((sum, candidate) => sum + candidate.support, 0);
    const undecided = this.clamp(100 - total);
    return { period, candidates, undecided };
  }

  debate(state: ElectionState, response: 'ACCOUNTABILITY' | 'ATTACK' | 'PROPOSAL' | 'ADMIT_FAILURE', snapshot: ElectionSnapshot): ElectionState {
    if (state.phase !== 'DEBATE' || state.debateCompleted) return state;
    const next = this.clone(state);
    const incumbent = next.candidates.find((candidate) => candidate.isIncumbent)!;
    const delta = response === 'ACCOUNTABILITY' ? 2 + snapshot.fiscalStability / 100 : response === 'ADMIT_FAILURE' ? (snapshot.approval >= 55 ? 1 : -2) : response === 'PROPOSAL' ? 1 : -2.5;
    incumbent.support = this.clamp(incumbent.support + delta);
    this.shiftOpposition(next, delta);
    incumbent.rejection = this.clamp(incumbent.rejection + (response === 'ATTACK' ? 2 : -0.5));
    next.debateCompleted = true;
    next.phase = 'RESULT';
    next.history.push({ type: 'DEBATE', week: next.week, label: response, incumbentSupport: incumbent.support });
    next.pollHistory.push(this.makePoll(next, 'Debate'));
    return next;
  }

  result(state: ElectionState): ElectionState {
    if (state.phase !== 'RESULT' || state.winnerId) return state;
    const next = this.clone(state);
    const incumbent = next.candidates.find((candidate) => candidate.isIncumbent);
    if (incumbent && next.promises.length) {
      const costPressure = next.promises.reduce((sum, promise) => sum + promise.estimatedCost, 0) * 0.08;
      const credibilityPenalty = next.promises.reduce((sum, promise) => sum + (100 - promise.credibility), 0) * 0.03;
      incumbent.support = this.clamp(incumbent.support - costPressure - credibilityPenalty);
      incumbent.rejection = this.clamp(incumbent.rejection + credibilityPenalty);
    }
    const winner = [...next.candidates].sort((a, b) => b.support - a.support || a.rejection - b.rejection)[0];
    next.winnerId = winner.id;
    next.explanation = `${winner.name} venceu com ${winner.support.toFixed(1)}% de apoio projetado; o resultado refletiu aprovação, entregas e confiança acumuladas no mandato.`;
    next.history.push({ type: 'RESULT', week: next.week, label: winner.name, incumbentSupport: next.candidates.find((candidate) => candidate.isIncumbent)?.support ?? 0 });
    next.pollHistory.push(this.makePoll(next, 'Resultado'));
    return next;
  }

  private baseSupport(snapshot: ElectionSnapshot) { return this.clamp(snapshot.approval * 0.55 + snapshot.socialSatisfaction * 0.25 + snapshot.fiscalStability * 0.1 + snapshot.completedProjects * 1.5 - snapshot.delayedProjects * 2); }
  actionCost(action: CampaignAction) { return action === 'NEW_PROMISE' ? 30 : action === 'CRISIS_COMMUNICATION' ? 20 : action === 'VISIT_PROJECT' ? 15 : 10; }
  private shiftOpposition(state: ElectionState, incumbentDelta: number) {
    const opposition = state.candidates.filter((candidate) => !candidate.isIncumbent);
    if (!opposition.length) return;
    const shift = incumbentDelta / opposition.length;
    opposition.forEach((candidate) => {
      candidate.support = this.clamp(candidate.support - shift);
    });
  }
  private clamp(value: number) { return Math.max(0, Math.min(100, Number(value.toFixed(2)))); }
  private clone(state: ElectionState): ElectionState {
    const clone = JSON.parse(JSON.stringify(state)) as ElectionState;
    clone.history ??= [];
    clone.pollHistory ??= [];
    clone.campaignFunds ??= 100;
    clone.promises ??= [];
    clone.debateQuestion ??= 'A oposição questiona os resultados do mandato. Como você responde?';
    return clone;
  }
}
