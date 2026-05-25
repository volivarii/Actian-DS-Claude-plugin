// Hook tracking save-state for the active file's draft.
//
// Transitions:
//   - idle      → no draft exists for the path (or path is null)
//   - saved     → a draft exists (just saved or loaded from prior session)
//
// The intermediate "unsaved" and "saving" states are introduced in Task 8
// (when useDraft starts emitting "pending" events on debounce timer start).
// This hook handles whatever event kinds the store currently emits.

import { useEffect, useState } from "react";
import { DraftStore } from "./DraftStore";

export type SaveState =
  | { kind: "idle" }
  | { kind: "unsaved" }
  | { kind: "saving" }
  | { kind: "saved"; savedAt: number };

export function useSaveState(
  path: string | null,
  store: DraftStore,
): SaveState {
  const [state, setState] = useState<SaveState>(() => {
    if (path == null) return { kind: "idle" };
    const draft = store.load(path);
    return draft ? { kind: "saved", savedAt: draft.ts } : { kind: "idle" };
  });

  useEffect(() => {
    if (path == null) {
      setState({ kind: "idle" });
      return;
    }
    // Snapshot on path change.
    const draft = store.load(path);
    setState(draft ? { kind: "saved", savedAt: draft.ts } : { kind: "idle" });
    return store.subscribe((event) => {
      if (event.path !== path) return;
      if (event.kind === "pending") {
        setState({ kind: "unsaved" });
      } else if (event.kind === "writing") {
        setState({ kind: "saving" });
      } else if (event.kind === "saved") {
        const refreshed = store.load(path);
        setState({
          kind: "saved",
          savedAt: refreshed?.ts ?? Date.now(),
        });
      } else if (event.kind === "cleared") {
        setState({ kind: "idle" });
      }
    });
  }, [path, store]);

  return state;
}
