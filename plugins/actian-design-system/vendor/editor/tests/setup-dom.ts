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
  "NodeFilter",
  "getComputedStyle",
  "MutationObserver",
  "Event",
  "CustomEvent",
  "MessageEvent",
  "Window",
  "HTMLDivElement",
  "DOMException",
  "localStorage",
  "sessionStorage",
] as const;

for (const key of COPY_KEYS) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    writable: true,
    value: w[key],
  });
}

// Additionally, mirror every HTML*Element / SVG*Element class from the
// jsdom window onto globalThis. Radix focus-trap walks the DOM and does
// `instanceof HTMLInputElement` / `HTMLButtonElement` / etc. checks; missing
// any one fails the trap in jsdom. Copying everything matching the
// (HTML|SVG).*Element shape avoids whack-a-mole.
for (const key of Object.getOwnPropertyNames(w)) {
  if (!/^(HTML|SVG)\w*Element$/.test(key)) continue;
  if (key in globalThis) continue;
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

// jsdom doesn't ship ResizeObserver / IntersectionObserver. cmdk + several
// Radix layout primitives instantiate one on mount; a no-op stub is fine
// for unit smoke since we don't assert on layout reflow behavior.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (!("ResizeObserver" in globalThis)) {
  Object.defineProperty(globalThis, "ResizeObserver", {
    configurable: true,
    writable: true,
    value: NoopObserver,
  });
}
if (!("IntersectionObserver" in globalThis)) {
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: NoopObserver,
  });
}

// jsdom HTMLElement lacks scrollIntoView. cmdk calls it on the selected
// list item to keep it visible; no-op stub is fine for unit smoke.
{
  const proto = (globalThis as unknown as { Element: { prototype: object } })
    .Element?.prototype as unknown as { scrollIntoView?: () => void };
  if (proto && typeof proto.scrollIntoView !== "function") {
    proto.scrollIntoView = function scrollIntoView() {};
  }
}
