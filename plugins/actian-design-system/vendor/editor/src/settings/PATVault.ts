// Minimal token vault for GitHub PATs. Storage is injected so tests use an
// in-memory adapter and production uses window.localStorage. No obfuscation —
// the PAT lives in browser local storage with the same exposure surface as
// any single-page app credential. Users sign out by clearing the vault, which
// the Settings panel exposes as a button.

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const STORAGE_KEY = "knowledge-editor:pat:v1";

export class PATVault {
  private storage: KeyValueStore;

  constructor(storage?: KeyValueStore) {
    if (storage) {
      this.storage = storage;
    } else if (typeof window !== "undefined" && window.localStorage) {
      this.storage = window.localStorage;
    } else {
      throw new Error("PATVault: no storage available (pass one explicitly)");
    }
  }

  set(token: string): void {
    this.storage.setItem(STORAGE_KEY, token);
  }

  get(): string | null {
    return this.storage.getItem(STORAGE_KEY);
  }

  clear(): void {
    this.storage.removeItem(STORAGE_KEY);
  }
}
