// Per-session cart of files to be submitted as a single batched PR.
//
// One file path → at most one cart entry (add-when-present replaces).
// localStorage-backed so the cart survives reloads. Subscribe pattern
// mirrors DraftStore — UI components reactively re-render on cart change.
//
// V1 scope (PR 2b T3): MarkdownEditScreen integration only. The
// MetaEditScreen + form-engine path needs form-state serialization at
// add-time; deferred as a known follow-up.

export interface CartEntry {
  path: string;
  content: string;
  basedOnSha: string;
  addedAt: number;
}

export type CartEvent =
  | { kind: "added"; path: string }
  | { kind: "removed"; path: string }
  | { kind: "cleared" };

export type CartListener = (event: CartEvent) => void;

const KEY = "editor:submission-cart:v1";

export class SubmissionCart {
  private readonly listeners = new Set<CartListener>();

  constructor(private readonly storage: Storage) {}

  subscribe(listener: CartListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: CartEvent): void {
    for (const l of this.listeners) l(event);
  }

  list(): CartEntry[] {
    const raw = this.storage.getItem(KEY);
    if (raw == null) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isCartEntry);
    } catch {
      return [];
    }
  }

  add(entry: CartEntry): void {
    const current = this.list().filter((e) => e.path !== entry.path);
    current.push(entry);
    this.write(current);
    this.emit({ kind: "added", path: entry.path });
  }

  remove(path: string): void {
    const before = this.list();
    const after = before.filter((e) => e.path !== path);
    if (after.length === before.length) return;
    this.write(after);
    this.emit({ kind: "removed", path });
  }

  clear(): void {
    if (this.list().length === 0) return;
    this.storage.removeItem(KEY);
    this.emit({ kind: "cleared" });
  }

  has(path: string): boolean {
    return this.list().some((e) => e.path === path);
  }

  private write(entries: CartEntry[]): void {
    try {
      this.storage.setItem(KEY, JSON.stringify(entries));
    } catch {
      // quota — silently drop. Same posture as DraftStore.
    }
  }
}

function isCartEntry(v: unknown): v is CartEntry {
  if (!v || typeof v !== "object") return false;
  const e = v as Record<string, unknown>;
  return (
    typeof e.path === "string" &&
    typeof e.content === "string" &&
    typeof e.basedOnSha === "string" &&
    typeof e.addedAt === "number"
  );
}
