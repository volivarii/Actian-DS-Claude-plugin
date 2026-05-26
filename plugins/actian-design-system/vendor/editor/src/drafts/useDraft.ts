// React hook glue between DraftStore and the markdown editor.
//
// Responsibilities:
//   - On mount, attempt to load a draft for the path.
//   - Provide a debounced `saveText(text)` that persists with the
//     current basedOnSha.
//   - Provide `clearDraft()` to remove on submit success.
//   - Expose `pendingPaths` (Set<string>) for the Sidebar's draft-dot
//     indicator — updated when save/clear runs.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DraftStore, type Draft } from "./DraftStore";

export interface UseDraftReturn {
  /** The draft as loaded on mount, or null if none. */
  loadedDraft: Draft | null;
  /** Save `text` against `basedOnSha`, debounced by 1s. */
  saveText: (text: string) => void;
  /** Remove the draft for `path` (call on submit success). */
  clearDraft: () => void;
  /** Paths that currently have drafts (for sidebar indicators). */
  pendingPaths: Set<string>;
}

const DEBOUNCE_MS = 1000;

export function useDraft(
  path: string,
  basedOnSha: string,
  store: DraftStore,
): UseDraftReturn {
  const [loadedDraft] = useState<Draft | null>(() => store.load(path));
  const [pendingPaths, setPendingPaths] = useState<Set<string>>(() =>
    store.allPaths(),
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestTextRef = useRef<string>("");

  const flush = useCallback(() => {
    const ok = store.save(path, {
      text: latestTextRef.current,
      basedOnSha,
      ts: Date.now(),
    });
    if (ok) setPendingPaths(store.allPaths());
  }, [path, basedOnSha, store]);

  const saveText = useCallback(
    (text: string) => {
      latestTextRef.current = text;
      if (timerRef.current) clearTimeout(timerRef.current);
      store.markPending(path);
      timerRef.current = setTimeout(flush, DEBOUNCE_MS);
    },
    [flush, path, store],
  );

  const clearDraft = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    store.clear(path);
    setPendingPaths(store.allPaths());
  }, [path, store]);

  useEffect(() => {
    return () => {
      // Flush on unmount so the user doesn't lose their last 1s of edits.
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        flush();
      }
    };
  }, [flush]);

  return useMemo(
    () => ({ loadedDraft, saveText, clearDraft, pendingPaths }),
    [loadedDraft, saveText, clearDraft, pendingPaths],
  );
}
