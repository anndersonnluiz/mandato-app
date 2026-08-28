import { SimulationState } from './simulation-engine';

export type InitialSimulationState = SimulationState & {
  mayorName: string;
  cityName: string;
  mandateEndDate: string;
  population: number;
  debt: number;
};

/** Estado inicial único usado pela UI e pelos cenários determinísticos. */
export function createInitialSimulationState(mayorName: string, cityName: string): InitialSimulationState {
  return {
    mayorName: mayorName.trim(), cityName: cityName.trim(),
    currentDate: '2025-01-01', mandateEndDate: '2028-12-31',
    population: 180000, treasury: 40000000, debt: 120000000, approval: 52,
    indicators: [
      ['health', 'Saúde', 58], ['education', 'Educação', 61],
      ['infrastructure', 'Infraestrutura', 55], ['transport', 'Transporte', 57],
      ['security', 'Segurança urbana', 53],
    ].map(([key, label, value]) => ({ key: String(key), label: String(label), value: Number(value), trend: 0 })),
    objectives: [
      { id: 'health', label: 'Elevar a saúde municipal', description: 'Leve o indicador de saúde a pelo menos 65.', type: 'INDICATOR', target: 65, current: 58, status: 'IN_PROGRESS' },
      { id: 'approval', label: 'Conquistar confiança da cidade', description: 'Alcance 60% de aprovação.', type: 'APPROVAL', target: 60, current: 52, status: 'IN_PROGRESS' },
      { id: 'treasury', label: 'Preservar o caixa', description: 'Termine o primeiro ciclo com pelo menos R$ 38 milhões.', type: 'TREASURY', target: 38000000, current: 40000000, status: 'IN_PROGRESS' },
    ],
    decisions: [{
      id: 'hospital-overload', title: 'Hospital municipal sobrecarregado',
      context: 'O hospital está operando próximo da capacidade. A Secretaria da Saúde solicita contratação temporária de profissionais.',
      status: 'PENDING', options: [
        { id: 'hire', label: 'Autorizar contratação', description: 'Contrata profissionais temporários por R$ 120 mil.', groupEffects: { workers: 1.5 } },
        { id: 'deny', label: 'Não autorizar', description: 'Preserva o caixa, mas mantém a pressão sobre o atendimento.', groupEffects: { workers: -1.5 } },
      ],
    }],
    effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 },
    history: [], causalLinks: [], activeGroupEffects: {},
    news: ['Boletim de posse: o novo governo inicia o mandato com cinco áreas prioritárias sob acompanhamento.'],
  };
}
