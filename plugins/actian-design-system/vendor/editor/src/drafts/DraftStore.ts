// localStorage I/O for in-progress markdown drafts.
//
// Single-doc semantics — one draft per file path. NOT the full draft inbox
// (T12 in PR 2c upgrades this to a list view with multi-doc state).
//
// All methods are synchronous. The debounce-1s save loop lives in the
// useDraft hook, not here.

export interface Draft {
  /** Current editor text (post-edit). */
  text: string;
  /** SHA the draft was opened against. Used to detect remote conflict. */
  basedOnSha: string;
  /** Last-save timestamp (ms since epoch). */
  ts: number;
}

export type DraftStoreEvent =
  | { kind: "saved"; path: string }
  | { kind: "cleared"; path: string }
  | { kind: "pending"; path: string }
  | { kind: "writing"; path: string };

export type DraftStoreListener = (event: DraftStoreEvent) => void;

const PREFIX = "editor:draft:";

export class DraftStore {
  private readonly listeners = new Set<DraftStoreListener>();

  constructor(private readonly storage: Storage) {}

  subscribe(listener: DraftStoreListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: DraftStoreEvent): void {
    for (const l of this.listeners) l(event);
  }

  load(path: string): Draft | null {
    const raw = this.storage.getItem(PREFIX + path);
    if (raw == null) return null;
    try {
      const parsed = JSON.parse(raw) as Draft;
      if (
        typeof parsed.text !== "string" ||
        typeof parsed.basedOnSha !== "string" ||
        typeof parsed.ts !== "number"
      ) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  markPending(path: string): void {
    this.emit({ kind: "pending", path });
  }

  save(path: string, draft: Draft): boolean {
    this.emit({ kind: "writing", path });
    try {
      this.storage.setItem(PREFIX + path, JSON.stringify(draft));
      this.emit({ kind: "saved", path });
      return true;
    } catch {
      return false;
    }
  }

  clear(path: string): void {
    this.storage.removeItem(PREFIX + path);
    this.emit({ kind: "cleared", path });
  }

  has(path: string): boolean {
    return this.storage.getItem(PREFIX + path) !== null;
  }

  allPaths(): Set<string> {
    const out = new Set<string>();
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(PREFIX)) {
        out.add(key.slice(PREFIX.length));
      }
    }
    return out;
  }
}
