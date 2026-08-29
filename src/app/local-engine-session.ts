import { GameSession, MandatoEngine, migrateGameState } from '@mandato/engine';
import { LocalEngineStateRepository } from './engine-state-repository';
import { SimulationState } from './simulation-engine';

/** Fachada transitória para migrar o modo local sem interromper partidas existentes. */
export class LocalEngineSession {
  private readonly repository = new LocalEngineStateRepository();
  private readonly session = new GameSession(this.repository, new MandatoEngine());

  /** Executes a domain command synchronously; persistence remains an explicit concern. */
  execute(state: SimulationState, command: Parameters<MandatoEngine['execute']>[1]): SimulationState {
    const normalized = migrateGameState(state) as unknown as SimulationState & { id: string };
    return new MandatoEngine().execute(normalized as any, command) as unknown as SimulationState;
  }

  async dispatch(state: SimulationState, command: Parameters<MandatoEngine['execute']>[1]): Promise<SimulationState> {
    const normalized = migrateGameState(state) as unknown as SimulationState & { id: string };
    await this.repository.save(normalized as any);
    const result = await this.session.dispatch(normalized.id, command);
    return result as unknown as SimulationState;
  }
}
