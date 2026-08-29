import { GameState, GameStateRepository } from '@mandato/engine';

/** Adaptador local do contrato do engine. Não contém regras de simulação. */
export class LocalEngineStateRepository implements GameStateRepository {
  constructor(private readonly storage: Storage = localStorage, private readonly key = 'mandato-engine-state') {}

  async load(gameId: string): Promise<GameState | null> {
    const raw = this.storage.getItem(`${this.key}:${gameId}`);
    if (!raw) return null;
    try { return JSON.parse(raw) as GameState; } catch { return null; }
  }

  async save(state: GameState): Promise<void> {
    this.storage.setItem(`${this.key}:${state.id}`, JSON.stringify(state));
  }
}
