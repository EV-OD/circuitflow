import { CircuitState } from '../types';

export interface StorageAdapter {
  save(key: string, data: CircuitState): Promise<void>;
  load(key: string): Promise<CircuitState | null>;
  list(): Promise<string[]>;
}

export class LocalStorageAdapter implements StorageAdapter {
  private prefix = 'circuitflow_';

  async save(key: string, data: CircuitState): Promise<void> {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(`${this.prefix}${key}`, json);
      // Simulate async for interface consistency
      return Promise.resolve();
    } catch (e) {
      console.error("Failed to save to local storage", e);
      throw e;
    }
  }

  async load(key: string): Promise<CircuitState | null> {
    try {
      const item = localStorage.getItem(`${this.prefix}${key}`);
      if (!item) return Promise.resolve(null);
      return Promise.resolve(JSON.parse(item) as CircuitState);
    } catch (e) {
      console.error("Failed to load from local storage", e);
      return Promise.resolve(null);
    }
  }

  async list(): Promise<string[]> {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.replace(this.prefix, ''));
      }
    }
    return Promise.resolve(keys);
  }
}

export const storage = new LocalStorageAdapter();