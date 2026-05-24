import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { guidelineMetaUiSchema } from "../../src/uiSchemas/guidelineMeta";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.resolve(
  HERE,
  "..",
  "..",
  "..",
  "schemas",
  "guideline-meta.json",
);

function loadSchema(): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8")) as Record<
    string,
    unknown
  >;
}

// RJSF rule: `ui:order` must either enumerate every top-level property of
// the schema OR end with the `"*"` wildcard. A violation produces
// `Invalid "root" object field configuration: uiSchema order list does not
// contain property '<name>'.` at render time and the form fails to mount.
//
// This test was added after the live editor surfaced the error for
// `section` — the schema's set of top-level keys had drifted ahead of the
// uiSchema's explicit list. The wildcard sentinel insulates us from future
// drift without forcing every new field to ship paired uiSchema updates.

test("guidelineMetaUiSchema — ui:order ends with '*' OR covers every schema property", () => {
  const schema = loadSchema();
  const schemaProps = Object.keys(
    (schema.properties as Record<string, unknown>) ?? {},
  );
  const order = (guidelineMetaUiSchema["ui:order"] ?? []) as string[];
  const hasWildcard = order.includes("*");
  if (hasWildcard) {
    assert.ok(true);
    return;
  }
  const missing = schemaProps.filter((p) => !order.includes(p));
  assert.equal(
    missing.length,
    0,
    `ui:order is missing schema properties: ${missing.join(", ")}. ` +
      `Add them, or end the list with "*" to accept anything.`,
  );
});

test("guidelineMetaUiSchema — explicit prefix entries all exist in the schema", () => {
  const schema = loadSchema();
  const schemaProps = new Set(
    Object.keys((schema.properties as Record<string, unknown>) ?? {}),
  );
  const order = (guidelineMetaUiSchema["ui:order"] ?? []) as string[];
  const ghost = order.filter((k) => k !== "*" && !schemaProps.has(k));
  assert.equal(
    ghost.length,
    0,
    `ui:order references properties not in the schema: ${ghost.join(", ")}`,
  );
});
