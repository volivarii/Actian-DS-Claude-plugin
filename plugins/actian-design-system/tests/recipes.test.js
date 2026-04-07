/**
 * Recipe validation test
 *
 * Validates every recipe referenced in recipes/_index.json:
 * - Index entries have required fields
 * - Referenced recipe files exist
 * - Recipe files have valid structure and content
 *
 * Zero dependencies — uses only Node.js built-ins.
 */

const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const RECIPES_DIR = path.resolve(__dirname, "..", "recipes");
const INDEX_PATH = path.join(RECIPES_DIR, "flow", "_index.json");

const VALID_NODE_TYPES = new Set([
  "FRAME",
  "TEXT",
  "INSTANCE",
  "DIVIDER",
  "ELLIPSE",
  "RECT",
]);
const SPACING_SCALE = new Set([0, 4, 8, 12, 16, 24, 28, 32]);

// ── helpers ──────────────────────────────────────────────────────────

function validateContentNode(node, nodePath) {
  const errors = [];

  if (!node.type || !VALID_NODE_TYPES.has(node.type)) {
    errors.push(
      `${nodePath}: invalid type "${node.type}" (expected one of ${[...VALID_NODE_TYPES].join(", ")})`,
    );
  }

  if (node.type === "INSTANCE" && !node.ref) {
    errors.push(`${nodePath}: INSTANCE node missing "ref"`);
  }

  if (node.type === "FRAME") {
    if (!node.layout) {
      errors.push(`${nodePath}: FRAME node missing "layout"`);
    }
    if (!node.sizing) {
      errors.push(`${nodePath}: FRAME node missing "sizing"`);
    }
  }

  // Check spacing values
  if (node.spacing !== undefined && !SPACING_SCALE.has(node.spacing)) {
    errors.push(
      `${nodePath}: spacing ${node.spacing} not in scale [${[...SPACING_SCALE].join(", ")}]`,
    );
  }
  if (node.paddingX !== undefined && !SPACING_SCALE.has(node.paddingX)) {
    errors.push(
      `${nodePath}: paddingX ${node.paddingX} not in scale [${[...SPACING_SCALE].join(", ")}]`,
    );
  }
  if (node.paddingY !== undefined && !SPACING_SCALE.has(node.paddingY)) {
    errors.push(
      `${nodePath}: paddingY ${node.paddingY} not in scale [${[...SPACING_SCALE].join(", ")}]`,
    );
  }

  // Recurse into children
  if (Array.isArray(node.content)) {
    node.content.forEach((child, i) => {
      errors.push(...validateContentNode(child, `${nodePath}.content[${i}]`));
    });
  }

  return errors;
}

// ── main ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

// Load index
let index;
try {
  const raw = fs.readFileSync(INDEX_PATH, "utf-8");
  index = JSON.parse(raw);
} catch (err) {
  console.error(`FAIL  _index.json could not be loaded: ${err.message}`);
  process.exit(1);
}

// Validate index is an array
assert.ok(Array.isArray(index), "_index.json must be an array");

for (const entry of index) {
  const label = entry.file || "(unknown)";
  const errors = [];

  // ── index-level checks ──
  if (typeof entry.file !== "string")
    errors.push('index entry missing "file" (string)');
  if (typeof entry.archetype !== "string")
    errors.push('index entry missing "archetype" (string)');
  if (typeof entry.pattern !== "number")
    errors.push('index entry missing "pattern" (number)');
  if (!Array.isArray(entry.tags))
    errors.push('index entry missing "tags" (array)');

  // ── recipe file existence ──
  const recipePath = path.join(RECIPES_DIR, "flow", entry.file);
  if (!fs.existsSync(recipePath)) {
    errors.push(`recipe file not found: flow/${entry.file}`);
    // Cannot validate further without the file
    console.log(`FAIL  ${label}`);
    errors.forEach((e) => console.log(`        ${e}`));
    failed++;
    continue;
  }

  // ── load recipe ──
  let recipe;
  try {
    recipe = JSON.parse(fs.readFileSync(recipePath, "utf-8"));
  } catch (err) {
    errors.push(`recipe file is not valid JSON: ${err.message}`);
    console.log(`FAIL  ${label}`);
    errors.forEach((e) => console.log(`        ${e}`));
    failed++;
    continue;
  }

  // ── required fields ──
  const requiredStrings = ["archetype", "description"];
  for (const field of requiredStrings) {
    if (typeof recipe[field] !== "string") {
      errors.push(`missing or invalid field "${field}" (expected string)`);
    }
  }
  if (typeof recipe.pattern !== "number") {
    errors.push('missing or invalid field "pattern" (expected number)');
  }
  if (!Array.isArray(recipe.tags)) {
    errors.push('missing or invalid field "tags" (expected array)');
  }
  if (
    typeof recipe.slots !== "object" ||
    recipe.slots === null ||
    Array.isArray(recipe.slots)
  ) {
    errors.push('missing or invalid field "slots" (expected object)');
  } else {
    // Validate slot values are strings
    for (const [key, val] of Object.entries(recipe.slots)) {
      if (typeof val !== "string") {
        errors.push(`slots["${key}"] must be a string, got ${typeof val}`);
      }
    }
  }
  if (typeof recipe.skeleton !== "object" || recipe.skeleton === null) {
    errors.push('missing or invalid field "skeleton" (expected object)');
  } else if (!Array.isArray(recipe.skeleton.content)) {
    errors.push('skeleton missing "content" array');
  } else {
    // Recursively validate content nodes
    recipe.skeleton.content.forEach((node, i) => {
      errors.push(...validateContentNode(node, `skeleton.content[${i}]`));
    });
  }
  if (!Array.isArray(recipe.notes)) {
    errors.push('missing or invalid field "notes" (expected array)');
  }
  if (!Array.isArray(recipe.missing_states)) {
    errors.push('missing or invalid field "missing_states" (expected array)');
  }

  // ── archetype match ──
  if (
    typeof recipe.archetype === "string" &&
    recipe.archetype !== entry.archetype
  ) {
    errors.push(
      `archetype mismatch: index says "${entry.archetype}", recipe says "${recipe.archetype}"`,
    );
  }

  // ── report ──
  if (errors.length === 0) {
    console.log(`PASS  ${label}`);
    passed++;
  } else {
    console.log(`FAIL  ${label}`);
    errors.forEach((e) => console.log(`        ${e}`));
    failed++;
  }
}

// ── brief recipes ───────────────────────────────────────────────────

const BRIEF_DIR = path.join(RECIPES_DIR, "brief");
const BRIEF_INDEX_PATH = path.join(BRIEF_DIR, "_index.json");

let briefIndex;
try {
  const briefRaw = fs.readFileSync(BRIEF_INDEX_PATH, "utf-8");
  briefIndex = JSON.parse(briefRaw);
} catch (err) {
  console.error(`FAIL  brief/_index.json could not be loaded: ${err.message}`);
  process.exit(1);
}

assert.ok(Array.isArray(briefIndex), "brief/_index.json must be an array");

const CARD_PATTERN = /^card[1-9]_/;

for (const entry of briefIndex) {
  const label = `brief/${entry.file || "(unknown)"}`;
  const errors = [];

  // ── index-level checks ──
  if (typeof entry.file !== "string")
    errors.push('index entry missing "file" (string)');
  if (typeof entry.card !== "string" || !CARD_PATTERN.test(entry.card)) {
    errors.push(
      'index entry "card" must be a string matching card[1-9]_ pattern',
    );
  }

  // ── recipe file existence ──
  const briefRecipePath = path.join(BRIEF_DIR, entry.file);
  if (!fs.existsSync(briefRecipePath)) {
    errors.push(`recipe file not found: brief/${entry.file}`);
    console.log(`FAIL  ${label}`);
    errors.forEach((e) => console.log(`        ${e}`));
    failed++;
    continue;
  }

  // ── load recipe ──
  let recipe;
  try {
    recipe = JSON.parse(fs.readFileSync(briefRecipePath, "utf-8"));
  } catch (err) {
    errors.push(`recipe file is not valid JSON: ${err.message}`);
    console.log(`FAIL  ${label}`);
    errors.forEach((e) => console.log(`        ${e}`));
    failed++;
    continue;
  }

  // ── required fields ──
  if (typeof recipe.card !== "string") {
    errors.push('missing or invalid field "card" (expected string)');
  }
  if (typeof recipe.title !== "string") {
    errors.push('missing or invalid field "title" (expected string)');
  }
  if (typeof recipe.description !== "string") {
    errors.push('missing or invalid field "description" (expected string)');
  }

  // ── sections: object with at least 1 entry, all values strings ──
  if (
    typeof recipe.sections !== "object" ||
    recipe.sections === null ||
    Array.isArray(recipe.sections)
  ) {
    errors.push('missing or invalid field "sections" (expected object)');
  } else {
    const sectionKeys = Object.keys(recipe.sections);
    if (sectionKeys.length < 1) {
      errors.push('"sections" must have at least 1 entry');
    }
    for (const [key, val] of Object.entries(recipe.sections)) {
      if (typeof val !== "string") {
        errors.push(`sections["${key}"] must be a string, got ${typeof val}`);
      }
    }
  }

  // ── qualityRules: array of strings with at least 1 entry ──
  if (!Array.isArray(recipe.qualityRules)) {
    errors.push('missing or invalid field "qualityRules" (expected array)');
  } else {
    if (recipe.qualityRules.length < 1) {
      errors.push('"qualityRules" must have at least 1 entry');
    }
    recipe.qualityRules.forEach((rule, i) => {
      if (typeof rule !== "string") {
        errors.push(`qualityRules[${i}] must be a string, got ${typeof rule}`);
      }
    });
  }

  // ── minimums: object with all values being numbers ──
  if (
    typeof recipe.minimums !== "object" ||
    recipe.minimums === null ||
    Array.isArray(recipe.minimums)
  ) {
    errors.push('missing or invalid field "minimums" (expected object)');
  } else {
    for (const [key, val] of Object.entries(recipe.minimums)) {
      if (typeof val !== "number") {
        errors.push(`minimums["${key}"] must be a number, got ${typeof val}`);
      }
    }
  }

  // ── card match ──
  if (typeof recipe.card === "string" && recipe.card !== entry.card) {
    errors.push(
      `card mismatch: index says "${entry.card}", recipe says "${recipe.card}"`,
    );
  }

  // ── report ──
  if (errors.length === 0) {
    console.log(`PASS  ${label}`);
    passed++;
  } else {
    console.log(`FAIL  ${label}`);
    errors.forEach((e) => console.log(`        ${e}`));
    failed++;
  }
}

// ── summary ──────────────────────────────────────────────────────────

console.log("");
console.log(`${passed + failed} recipes: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
