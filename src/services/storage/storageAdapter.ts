import { get, set, del } from "idb-keyval";
import type { AppState } from "../../models/types";

const STATE_KEY = "little-explorer-state-v1";

/**
 * Thin abstraction over the persistence backend. Today this is IndexedDB
 * (via idb-keyval), chosen for offline-first local storage. Swapping to a
 * cloud-synced backend later only means implementing this interface again.
 */
export interface StorageAdapter {
  load(): Promise<AppState | null>;
  save(state: AppState): Promise<void>;
  clear(): Promise<void>;
}

class IndexedDbStorageAdapter implements StorageAdapter {
  async load(): Promise<AppState | null> {
    try {
      const state = await get<AppState>(STATE_KEY);
      return state ?? null;
    } catch (error) {
      console.error("Failed to load app state", error);
      return null;
    }
  }

  async save(state: AppState): Promise<void> {
    try {
      await set(STATE_KEY, state);
    } catch (error) {
      console.error("Failed to save app state", error);
    }
  }

  async clear(): Promise<void> {
    await del(STATE_KEY);
  }
}

export const storage: StorageAdapter = new IndexedDbStorageAdapter();
