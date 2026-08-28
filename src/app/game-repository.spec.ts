import { LocalGameRepository } from './game-repository';

describe('LocalGameRepository', () => {
  it('persists and loads a state without depending on the component', () => {
    const storage = new StorageMock(); const repository = new LocalGameRepository(storage);
    const state = { currentDate: '2025-01-01', treasury: 1, approval: 50, indicators: [], effects: { health: 0, approval: 0, infrastructure: 0, transport: 0 }, decisions: [], history: [], news: [] };
    repository.save(state); expect(repository.load()).toEqual(state); expect(repository.mode).toBe('LOCAL');
  });

  it('clears only its configured save key', () => {
    const storage = new StorageMock(); const repository = new LocalGameRepository(storage, 'mandato-test'); storage.setItem('other', 'keep');
    repository.save({} as any); repository.clear(); expect(storage.getItem('mandato-test')).toBeNull(); expect(storage.getItem('other')).toBe('keep');
  });

  it('ignores a corrupted save instead of throwing', () => {
    const storage = new StorageMock();
    storage.setItem('mandato-test', '{not-json');
    const repository = new LocalGameRepository(storage, 'mandato-test');
    expect(repository.load()).toBeNull();
  });
});

class StorageMock implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}
