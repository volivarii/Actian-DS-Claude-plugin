import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const baseCss = readFileSync(
  resolve(__dirname, "../../src/styles/base.css"),
  "utf-8",
);

const REQUIRED_TOKENS = [
  "--zen-color-text-primary",
  "--zen-color-neutral-50",
  "--zen-color-neutral-200",
  "--zen-color-neutral-300",
  "--zen-color-neutral-500",
  "--zen-color-bg-subtle",
  "--zen-color-bg-muted",
  "--zen-color-text-link-default",
  "--zen-font-family-text",
  "--zen-font-family-mono",
];

test("base.css references all Zen tokens the prose layer depends on", () => {
  for (const token of REQUIRED_TOKENS) {
    assert.ok(
      baseCss.includes(token),
      `base.css missing reference to ${token}`,
    );
  }
});

test("base.css defines the .md-prose selector", () => {
  assert.match(baseCss, /\.md-prose\b/);
});

test("base.css defines the .cm-anchor-marker selector", () => {
  assert.match(baseCss, /\.cm-anchor-marker\b/);
});
