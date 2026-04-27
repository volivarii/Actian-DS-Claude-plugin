/**
 * Tier schema test
 *
 * Validates that flow-data.schema.json has the tier classification fields
 * required by the fallback ladder engine (Sprint B1, Task 1).
 *
 * Zero dependencies — uses only Node.js built-ins.
 */

// NOTE: These tests verify schema *shape* (field presence, types, conditional rules
// being declared) rather than schema *behavior* (whether a sample document actually
// validates). Behavioral validation against the schema lives in Task 12 of Sprint B1
// (integration fixtures hitting validate-flow-data.js end-to-end). Structural-only
// tests here keep this task scoped + zero-deps; behavioral coverage arrives in Task 12.

const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert");

const schemaPath = path.join(
  __dirname,
  "..",
  "schemas",
  "flow-data.schema.json",
);
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

function getScreenDef() {
  return schema.$defs?.screen || schema.properties?.screens?.items;
}

function test(name, fn) {
  try {
    fn();
    console.log("✓", name);
  } catch (e) {
    console.error("✗", name, "—", e.message);
    process.exit(1);
  }
}

test("schema has tier enum on screen", () => {
  const screenDef = getScreenDef();
  assert.ok(screenDef.properties.tier, "tier property missing");
  assert.deepStrictEqual(screenDef.properties.tier.enum, [
    "recognized",
    "adapted",
    "improvised",
  ]);
});

test("schema has confidence with min 0 max 1", () => {
  const screenDef = getScreenDef();
  assert.strictEqual(screenDef.properties.confidence.minimum, 0);
  assert.strictEqual(screenDef.properties.confidence.maximum, 1);
});

test("schema has matchedRecipe nullable string", () => {
  const screenDef = getScreenDef();
  assert.ok(Array.isArray(screenDef.properties.matchedRecipe.type));
  assert.ok(screenDef.properties.matchedRecipe.type.includes("string"));
  assert.ok(screenDef.properties.matchedRecipe.type.includes("null"));
});

test("schema has composition nullable array of strings", () => {
  const screenDef = getScreenDef();
  assert.ok(screenDef.properties.composition.type.includes("array"));
  assert.ok(screenDef.properties.composition.type.includes("null"));
  assert.strictEqual(screenDef.properties.composition.items.type, "string");
});

test("schema declares justification minLength 30", () => {
  const screenDef = getScreenDef();
  assert.strictEqual(screenDef.properties.justification.minLength, 30);
});

test("schema requires justification when tier is improvised", () => {
  const screenDef = getScreenDef();
  assert.ok(screenDef.allOf, "allOf conditional missing");
  const improvisedRule = screenDef.allOf.find(
    (r) =>
      JSON.stringify(r).includes("improvised") &&
      JSON.stringify(r).includes("justification"),
  );
  assert.ok(improvisedRule, "improvised tier should require justification");
});

test("schema requires justification when tier is adapted", () => {
  const screenDef = getScreenDef();
  const adaptedRule = screenDef.allOf.find(
    (r) =>
      JSON.stringify(r).includes("adapted") &&
      JSON.stringify(r).includes("justification"),
  );
  assert.ok(adaptedRule, "adapted tier should require justification");
});

test("tier field is optional (not in required)", () => {
  const screenDef = getScreenDef();
  const required = screenDef.required || [];
  assert.ok(
    !required.includes("tier"),
    "tier must remain optional for backwards compat",
  );
  assert.ok(!required.includes("confidence"), "confidence must be optional");
  assert.ok(
    !required.includes("justification"),
    "justification must be optional (conditionally required only via allOf)",
  );
});

console.log("All tier schema tests passed.");
