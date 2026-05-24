// Regression: the knowledge-repo schemas all declare
// `$schema: https://json-schema.org/draft/2020-12/schema`. The editor's
// validators must use Ajv's 2020-12 build (`ajv/dist/2020`) — the default
// `ajv` import compiles against draft-07 and throws "no schema with key or
// ref 'https://json-schema.org/draft/2020-12/schema'" the moment it sees
// a real schema. This failure mode was caught by day-1 dogfood (PR #126
// post-#125 form-fix).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateAgainstSchema } from "../../src/core/validateAgainstSchema";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..", "..", "..");

function loadSchema(rel: string): Record<string, unknown> {
  return JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, rel), "utf8"),
  ) as Record<string, unknown>;
}

test("validateAgainstSchema — compiles the real guideline-meta (draft 2020-12) without throwing", () => {
  const schema = loadSchema("schemas/guideline-meta.json");
  const validYaml =
    "component: Button\n" +
    "category: action\n" +
    "domains:\n" +
    "  content: { status: approved }\n" +
    "  usage: { status: not-started }\n" +
    "  design: { status: inherited }\n" +
    "  behavior: { status: inherited }\n" +
    "  tokens: { status: not-started }\n";
  assert.doesNotThrow(() =>
    validateAgainstSchema({
      path: "components/src/button/_meta.yml",
      content: validYaml,
      schemas: { "guideline-meta": schema },
    }),
  );
});

test("validateAgainstSchema — rejects a guideline-meta missing `component`", () => {
  const schema = loadSchema("schemas/guideline-meta.json");
  const bad =
    "category: action\n" +
    "domains:\n" +
    "  content: { status: approved }\n";
  assert.throws(() =>
    validateAgainstSchema({
      path: "components/src/x/_meta.yml",
      content: bad,
      schemas: { "guideline-meta": schema },
    }),
  );
});

test("validateAgainstSchema — compiles the real app-context schema (draft 2020-12)", () => {
  const schema = loadSchema("schemas/app-context.json");
  const data = fs.readFileSync(
    path.join(REPO_ROOT, "app-context/app-context.json"),
    "utf8",
  );
  assert.doesNotThrow(() =>
    validateAgainstSchema({
      path: "app-context/app-context.json",
      content: data,
      schemas: { "app-context": schema },
    }),
  );
});
