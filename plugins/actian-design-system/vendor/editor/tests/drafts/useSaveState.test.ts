import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import "../setup-dom";
import { renderHook, act } from "@testing-library/react";
import { DraftStore } from "../../src/drafts/DraftStore";
import { useSaveState } from "../../src/drafts/useSaveState";

function makeMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => Array.from(map.keys())[i] ?? null,
    removeItem: (k) => {
      map.delete(k);
    },
    setItem: (k, v) => {
      map.set(k, v);
    },
  };
}

let store: DraftStore;
beforeEach(() => {
  store = new DraftStore(makeMemoryStorage());
});

test("useSaveState: idle when path is null", () => {
  const { result } = renderHook(() => useSaveState(null, store));
  assert.equal(result.current.kind, "idle");
});

test("useSaveState: idle when no draft exists for path", () => {
  const { result } = renderHook(() => useSaveState("foundations.md", store));
  assert.equal(result.current.kind, "idle");
});

test("useSaveState: transitions to saved when draft exists at mount", () => {
  store.save("foundations.md", {
    text: "x",
    basedOnSha: "abc",
    ts: Date.now(),
  });
  const { result } = renderHook(() => useSaveState("foundations.md", store));
  assert.equal(result.current.kind, "saved");
  assert.equal(
    typeof (result.current as { savedAt: number }).savedAt,
    "number",
  );
});

test("useSaveState: transitions to saved when DraftStore.save is called for path", () => {
  const { result } = renderHook(() => useSaveState("foundations.md", store));
  assert.equal(result.current.kind, "idle");
  act(() => {
    store.save("foundations.md", {
      text: "y",
      basedOnSha: "abc",
      ts: Date.now(),
    });
  });
  assert.equal(result.current.kind, "saved");
});

test("useSaveState: transitions back to idle when DraftStore.clear is called for path", () => {
  store.save("foundations.md", {
    text: "x",
    basedOnSha: "abc",
    ts: Date.now(),
  });
  const { result } = renderHook(() => useSaveState("foundations.md", store));
  assert.equal(result.current.kind, "saved");
  act(() => {
    store.clear("foundations.md");
  });
  assert.equal(result.current.kind, "idle");
});

test("useSaveState: ignores save/clear events for OTHER paths", () => {
  const { result } = renderHook(() => useSaveState("foundations.md", store));
  act(() => {
    store.save("other.md", { text: "y", basedOnSha: "abc", ts: Date.now() });
  });
  assert.equal(result.current.kind, "idle");
});

test("useSaveState: transitions to unsaved when DraftStore.markPending fires", () => {
  const { result } = renderHook(() => useSaveState("foundations.md", store));
  act(() => {
    store.markPending("foundations.md");
  });
  assert.equal(result.current.kind, "unsaved");
});

test("useSaveState: transitions through unsaved → saving → saved on full cycle", () => {
  const { result } = renderHook(() => useSaveState("foundations.md", store));
  act(() => store.markPending("foundations.md"));
  assert.equal(result.current.kind, "unsaved");
  act(() => {
    store.save("foundations.md", {
      text: "x",
      basedOnSha: "abc",
      ts: Date.now(),
    });
  });
  // After save, "writing" event fires synchronously before "saved" —
  // final observed state is "saved".
  assert.equal(result.current.kind, "saved");
});
