import { GameSession, MandatoEngine, migrateGameState } from '@mandato/engine';
import { LocalEngineStateRepository } from './engine-state-repository';
import { SimulationState } from './simulation-engine';

/** Fachada transitória para migrar o modo local sem interromper partidas existentes. */
export class LocalEngineSession {
  private readonly session = new GameSession(new LocalEngineStateRepository(), new MandatoEngine());

  async dispatch(state: SimulationState, command: Parameters<MandatoEngine['execute']>[1]): Promise<SimulationState> {
    const normalized = migrateGameState(state) as SimulationState;
    await new LocalEngineStateRepository().save(normalized as any);
    const result = await this.session.dispatch(normalized.id, command);
    return result as SimulationState;
  }
}
