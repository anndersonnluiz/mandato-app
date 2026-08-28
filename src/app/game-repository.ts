import { SimulationState } from './simulation-engine';

export type StorageMode = 'LOCAL' | 'API';

export interface GameRepository {
  readonly mode: StorageMode;
  load(): SimulationState | null;
  save(state: SimulationState): void;
  clear(): void;
}

/** Implementação local usada como referência e fallback offline do jogo. */
export class LocalGameRepository implements GameRepository {
  readonly mode: StorageMode = 'LOCAL';
  constructor(private readonly storage: Storage = localStorage, private readonly key = 'mandato-save') {}
  load(): SimulationState | null {
    const raw = this.storage.getItem(this.key);
    if (!raw) return null;
    try { return JSON.parse(raw) as SimulationState; } catch { return null; }
  }
  save(state: SimulationState): void { this.storage.setItem(this.key, JSON.stringify(state)); }
  clear(): void { this.storage.removeItem(this.key); }
}
