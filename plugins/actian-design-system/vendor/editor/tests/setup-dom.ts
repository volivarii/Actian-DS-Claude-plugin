// JSDOM bootstrap for React component smoke tests under node:test.
// Wires globalThis to a jsdom window so React + RTL can mount.
//
// Note: Node 22 exposes a built-in `navigator` getter on globalThis, so we
// use Object.defineProperty (configurable: true) to override it.
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});

const w = dom.window as unknown as Record<string, unknown>;
const COPY_KEYS = [
  "window",
  "document",
  "navigator",
  "HTMLElement",
  "Element",
  "Node",
  "getComputedStyle",
  "MutationObserver",
  "Event",
  "CustomEvent",
] as const;

for (const key of COPY_KEYS) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    writable: true,
    value: w[key],
  });
}

Object.defineProperty(globalThis, "requestAnimationFrame", {
  configurable: true,
  writable: true,
  value: (cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 0) as unknown as number,
});

Object.defineProperty(globalThis, "cancelAnimationFrame", {
  configurable: true,
  writable: true,
  value: (id: number) => clearTimeout(id),
});
