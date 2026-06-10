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

const RECIPES_DIR = path.resolve(__dirname, "..", "..", "recipes");
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
    // DS-native nodes use library:"ds" + dsSlug instead of ref — accept either form
    const isDsNative =
      node.library === "ds" &&
      typeof node.dsSlug === "string" &&
      node.dsSlug.length > 0;
    if (!isDsNative) {
      errors.push(
        `${nodePath}: INSTANCE node missing "ref" (or use library:"ds" + dsSlug for DS-native nodes)`,
      );
    }
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

// Brief slot identifier: domain-anchored names (anatomy, variants, motion,
// accessibility, tokens, usage) or card_<name> for genuinely card-structural
// slots (card_header, card_content). F2 (knowledge 0.22.0) renamed the 6
// domain slots to drop the card_ prefix.
const CARD_PATTERN = /^(card_)?[a-z][a-z_]*$/;

for (const entry of briefIndex) {
  const label = `brief/${entry.file || "(unknown)"}`;
  const errors = [];

  // ── index-level checks ──
  if (typeof entry.file !== "string")
    errors.push('index entry missing "file" (string)');
  if (typeof entry.card !== "string" || !CARD_PATTERN.test(entry.card)) {
    errors.push(
      'index entry "card" must be a string matching a brief slot identifier (e.g. "anatomy", "card_header")',
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

// ── presentation recipes ────────────────────────────────────────────

const PRES_DIR = path.join(RECIPES_DIR, "presentation");
const PRES_INDEX_PATH = path.join(PRES_DIR, "_index.json");

if (fs.existsSync(PRES_INDEX_PATH)) {
  let presIndex;
  try {
    presIndex = JSON.parse(fs.readFileSync(PRES_INDEX_PATH, "utf-8"));
  } catch (err) {
    console.error(
      `FAIL  presentation/_index.json could not be loaded: ${err.message}`,
    );
    failed++;
  }

  if (presIndex) {
    assert.ok(
      Array.isArray(presIndex),
      "presentation/_index.json must be an array",
    );

    for (const entry of presIndex) {
      const label = `presentation/${entry.file || "(unknown)"}`;
      const errors = [];

      if (typeof entry.file !== "string")
        errors.push('index entry missing "file" (string)');
      if (typeof entry.slideType !== "string")
        errors.push('index entry missing "slideType" (string)');

      const presRecipePath = path.join(PRES_DIR, entry.file);
      if (!fs.existsSync(presRecipePath)) {
        errors.push(`recipe file not found: presentation/${entry.file}`);
        console.log(`FAIL  ${label}`);
        errors.forEach((e) => console.log(`        ${e}`));
        failed++;
        continue;
      }

      let recipe;
      try {
        recipe = JSON.parse(fs.readFileSync(presRecipePath, "utf-8"));
      } catch (err) {
        errors.push(`recipe file is not valid JSON: ${err.message}`);
        console.log(`FAIL  ${label}`);
        errors.forEach((e) => console.log(`        ${e}`));
        failed++;
        continue;
      }

      // Required string fields
      for (const field of ["slideType", "title", "description"]) {
        if (typeof recipe[field] !== "string") {
          errors.push(`missing or invalid field "${field}" (expected string)`);
        }
      }

      // slideType match
      if (
        typeof recipe.slideType === "string" &&
        recipe.slideType !== entry.slideType
      ) {
        errors.push(
          `slideType mismatch: index says "${entry.slideType}", recipe says "${recipe.slideType}"`,
        );
      }

      // sections: object with string values
      if (
        typeof recipe.sections !== "object" ||
        recipe.sections === null ||
        Array.isArray(recipe.sections)
      ) {
        errors.push('missing or invalid field "sections" (expected object)');
      } else {
        if (Object.keys(recipe.sections).length < 1) {
          errors.push('"sections" must have at least 1 entry');
        }
        for (const [key, val] of Object.entries(recipe.sections)) {
          if (typeof val !== "string") {
            errors.push(
              `sections["${key}"] must be a string, got ${typeof val}`,
            );
          }
        }
      }

      // qualityRules: array of strings
      if (!Array.isArray(recipe.qualityRules)) {
        errors.push('missing or invalid field "qualityRules" (expected array)');
      } else {
        if (recipe.qualityRules.length < 1) {
          errors.push('"qualityRules" must have at least 1 entry');
        }
        recipe.qualityRules.forEach((rule, i) => {
          if (typeof rule !== "string") {
            errors.push(
              `qualityRules[${i}] must be a string, got ${typeof rule}`,
            );
          }
        });
      }

      // minimums: object with number values
      if (
        typeof recipe.minimums !== "object" ||
        recipe.minimums === null ||
        Array.isArray(recipe.minimums)
      ) {
        errors.push('missing or invalid field "minimums" (expected object)');
      } else {
        for (const [key, val] of Object.entries(recipe.minimums)) {
          if (typeof val !== "number") {
            errors.push(
              `minimums["${key}"] must be a number, got ${typeof val}`,
            );
          }
        }
      }

      if (errors.length === 0) {
        console.log(`PASS  ${label}`);
        passed++;
      } else {
        console.log(`FAIL  ${label}`);
        errors.forEach((e) => console.log(`        ${e}`));
        failed++;
      }
    }
  }
}

// ── Task 5: composition-detail-table recipe ─────────────────────────

{
  const label = "composition-detail-table.json (composition checks)";
  const errors = [];
  const recipePath = path.join(
    RECIPES_DIR,
    "flow",
    "composition-detail-table.json",
  );

  if (!fs.existsSync(recipePath)) {
    errors.push("recipe file must exist at flow/composition-detail-table.json");
  } else {
    let recipe;
    try {
      recipe = JSON.parse(fs.readFileSync(recipePath, "utf-8"));
    } catch (err) {
      errors.push(`recipe file is not valid JSON: ${err.message}`);
    }

    if (recipe) {
      // Required composition fields
      if (recipe.archetype !== "composition-detail-table") {
        errors.push(
          `archetype must be "composition-detail-table", got "${recipe.archetype}"`,
        );
      }
      if (recipe.kind !== "composition") {
        errors.push(`kind must be "composition", got "${recipe.kind}"`);
      }
      try {
        assert.deepStrictEqual(recipe.composes, ["detail-view", "table-list"]);
      } catch (_) {
        errors.push(
          `composes must equal ["detail-view","table-list"], got ${JSON.stringify(recipe.composes)}`,
        );
      }
      if (
        typeof recipe.description !== "string" ||
        recipe.description.length === 0
      ) {
        errors.push("description must be a non-empty string");
      }
      if (!Array.isArray(recipe.tags)) {
        errors.push("tags must be an array");
      }

      // Slots describing each composed recipe's role
      if (
        typeof recipe.slots !== "object" ||
        recipe.slots === null ||
        Array.isArray(recipe.slots)
      ) {
        errors.push("slots field required (object)");
      } else if (Object.keys(recipe.slots).length < 2) {
        errors.push(
          "slots must have at least 2 entries (one per composed recipe role)",
        );
      }
    }
  }

  if (errors.length === 0) {
    console.log(`PASS  ${label}`);
    passed++;
  } else {
    console.log(`FAIL  ${label}`);
    errors.forEach((e) => console.log(`        ${e}`));
    failed++;
  }
}

{
  const label = "_index.json registers composition-detail-table";
  const errors = [];

  try {
    const idx = JSON.parse(fs.readFileSync(INDEX_PATH, "utf-8"));
    if (!Array.isArray(idx)) {
      errors.push("index is not a flat array");
    } else {
      const entry = idx.find((e) => e.archetype === "composition-detail-table");
      if (!entry) {
        errors.push(
          "composition-detail-table must be registered in _index.json",
        );
      } else {
        if (entry.file !== "composition-detail-table.json") {
          errors.push(
            `entry.file must be "composition-detail-table.json", got "${entry.file}"`,
          );
        }
        if (entry.kind !== "composition") {
          errors.push(`entry.kind must be "composition", got "${entry.kind}"`);
        }
        try {
          assert.deepStrictEqual(entry.composes, ["detail-view", "table-list"]);
        } catch (_) {
          errors.push(
            `entry.composes must equal ["detail-view","table-list"], got ${JSON.stringify(entry.composes)}`,
          );
        }
      }
    }
  } catch (err) {
    errors.push(`_index.json could not be parsed: ${err.message}`);
  }

  if (errors.length === 0) {
    console.log(`PASS  ${label}`);
    passed++;
  } else {
    console.log(`FAIL  ${label}`);
    errors.forEach((e) => console.log(`        ${e}`));
    failed++;
  }
}

// ── Task 6: composition-form-with-footer recipe ─────────────────────

{
  const label = "composition-form-with-footer.json (composition checks)";
  const errors = [];
  const recipePath = path.join(
    RECIPES_DIR,
    "flow",
    "composition-form-with-footer.json",
  );

  if (!fs.existsSync(recipePath)) {
    errors.push(
      "recipe file must exist at flow/composition-form-with-footer.json",
    );
  } else {
    let recipe;
    try {
      recipe = JSON.parse(fs.readFileSync(recipePath, "utf-8"));
    } catch (err) {
      errors.push(`recipe file is not valid JSON: ${err.message}`);
    }

    if (recipe) {
      if (recipe.archetype !== "composition-form-with-footer") {
        errors.push(
          `archetype must be "composition-form-with-footer", got "${recipe.archetype}"`,
        );
      }
      if (recipe.kind !== "composition") {
        errors.push(`kind must be "composition", got "${recipe.kind}"`);
      }
      try {
        assert.deepStrictEqual(recipe.composes, [
          "form-create",
          "sticky-footer",
        ]);
      } catch (_) {
        errors.push(
          `composes must equal ["form-create","sticky-footer"], got ${JSON.stringify(recipe.composes)}`,
        );
      }
      if (recipe.tier !== "adapted") {
        errors.push(`tier must be "adapted", got "${recipe.tier}"`);
      }
      if (
        typeof recipe.description !== "string" ||
        recipe.description.length === 0
      ) {
        errors.push("description must be a non-empty string");
      }
      if (!Array.isArray(recipe.tags)) {
        errors.push("tags must be an array");
      }
      if (
        typeof recipe.slots !== "object" ||
        recipe.slots === null ||
        Array.isArray(recipe.slots)
      ) {
        errors.push("slots field required (object)");
      } else if (Object.keys(recipe.slots).length < 2) {
        errors.push(
          "slots must have at least 2 entries (one per composed recipe role)",
        );
      }
      if (
        typeof recipe.embed_config !== "object" ||
        recipe.embed_config === null ||
        Array.isArray(recipe.embed_config)
      ) {
        errors.push("embed_config field required (object)");
      }
      if (
        !recipe.skeleton ||
        typeof recipe.skeleton !== "object" ||
        recipe.skeleton.composition !== true
      ) {
        errors.push("skeleton.composition must be true");
      }
      if (!Array.isArray(recipe.notes) || recipe.notes.length === 0) {
        errors.push("notes must be a non-empty array");
      } else if (
        typeof recipe.notes[0] !== "string" ||
        !recipe.notes[0].includes("skeleton.composition: true")
      ) {
        errors.push(
          "first note must document the skeleton.composition: true flag",
        );
      }
      if (
        !Array.isArray(recipe.missing_states) ||
        recipe.missing_states.length === 0
      ) {
        errors.push("missing_states must be a non-empty array");
      }
    }
  }

  if (errors.length === 0) {
    console.log(`PASS  ${label}`);
    passed++;
  } else {
    console.log(`FAIL  ${label}`);
    errors.forEach((e) => console.log(`        ${e}`));
    failed++;
  }
}

{
  const label = "_index.json registers composition-form-with-footer";
  const errors = [];

  try {
    const idx = JSON.parse(fs.readFileSync(INDEX_PATH, "utf-8"));
    if (!Array.isArray(idx)) {
      errors.push("index is not a flat array");
    } else {
      const entry = idx.find(
        (e) => e.archetype === "composition-form-with-footer",
      );
      if (!entry) {
        errors.push(
          "composition-form-with-footer must be registered in _index.json",
        );
      } else {
        if (entry.file !== "composition-form-with-footer.json") {
          errors.push(
            `entry.file must be "composition-form-with-footer.json", got "${entry.file}"`,
          );
        }
        if (entry.kind !== "composition") {
          errors.push(`entry.kind must be "composition", got "${entry.kind}"`);
        }
        try {
          assert.deepStrictEqual(entry.composes, [
            "form-create",
            "sticky-footer",
          ]);
        } catch (_) {
          errors.push(
            `entry.composes must equal ["form-create","sticky-footer"], got ${JSON.stringify(entry.composes)}`,
          );
        }
        if (!Array.isArray(entry.tags)) {
          errors.push("entry.tags must be an array");
        } else {
          // Tags must match the recipe file's tags exactly
          try {
            const recipe = JSON.parse(
              fs.readFileSync(
                path.join(
                  RECIPES_DIR,
                  "flow",
                  "composition-form-with-footer.json",
                ),
                "utf-8",
              ),
            );
            assert.deepStrictEqual(entry.tags, recipe.tags);
          } catch (_) {
            errors.push(
              "entry.tags must match recipe file's tags array exactly",
            );
          }
        }
      }
    }
  } catch (err) {
    errors.push(`_index.json could not be parsed: ${err.message}`);
  }

  if (errors.length === 0) {
    console.log(`PASS  ${label}`);
    passed++;
  } else {
    console.log(`FAIL  ${label}`);
    errors.forEach((e) => console.log(`        ${e}`));
    failed++;
  }
}

// ── intent annotations on recipes ──────────────────────────────────

var validIntents = [
  "destructive-action",
  "success-confirmation",
  "error-state",
  "default",
];

function collectIntents(node, out) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach(function (n) {
      collectIntents(n, out);
    });
    return;
  }
  if (node.intent !== undefined) out.push(node.intent);
  if (node.children) collectIntents(node.children, out);
}

// Test: overlay.json confirmationSkeleton uses valid intent values
var overlayTestErrors = [];
var overlayRecipe;
try {
  overlayRecipe = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "..", "..", "recipes", "flow", "overlay.json"),
      "utf8",
    ),
  );
} catch (err) {
  overlayTestErrors.push(`Failed to load overlay.json: ${err.message}`);
}

if (!overlayTestErrors.length && !overlayRecipe.confirmationSkeleton) {
  overlayTestErrors.push("confirmationSkeleton block missing");
}

if (!overlayTestErrors.length) {
  var overlayIntents = [];
  collectIntents(overlayRecipe.confirmationSkeleton.content, overlayIntents);
  if (overlayIntents.length === 0) {
    overlayTestErrors.push("expected at least one intent annotation");
  } else {
    overlayIntents.forEach(function (i) {
      if (validIntents.indexOf(i) === -1) {
        overlayTestErrors.push("invalid intent: " + i);
      }
    });
    if (overlayIntents.indexOf("destructive-action") === -1) {
      overlayTestErrors.push(
        "expected destructive-action somewhere in confirmationSkeleton",
      );
    }
  }
}

if (overlayTestErrors.length === 0) {
  console.log("PASS  overlay.json confirmationSkeleton intent annotations");
  passed++;
} else {
  console.log("FAIL  overlay.json confirmationSkeleton intent annotations");
  overlayTestErrors.forEach((e) => console.log(`        ${e}`));
  failed++;
}

// Test: sticky-footer.json destructiveSkeleton uses valid intent values
var stickyTestErrors = [];
var stickyRecipe;
try {
  stickyRecipe = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "..", "..", "recipes", "flow", "sticky-footer.json"),
      "utf8",
    ),
  );
} catch (err) {
  stickyTestErrors.push(`Failed to load sticky-footer.json: ${err.message}`);
}

if (!stickyTestErrors.length && !stickyRecipe.destructiveSkeleton) {
  stickyTestErrors.push("destructiveSkeleton block missing");
}

if (!stickyTestErrors.length) {
  var stickyIntents = [];
  collectIntents(stickyRecipe.destructiveSkeleton.content, stickyIntents);
  if (stickyIntents.length === 0) {
    stickyTestErrors.push("expected at least one intent annotation");
  } else {
    stickyIntents.forEach(function (i) {
      if (validIntents.indexOf(i) === -1) {
        stickyTestErrors.push("invalid intent: " + i);
      }
    });
    if (stickyIntents.indexOf("destructive-action") === -1) {
      stickyTestErrors.push(
        "expected destructive-action in destructiveSkeleton",
      );
    }
  }
}

if (stickyTestErrors.length === 0) {
  console.log(
    "PASS  sticky-footer.json destructiveSkeleton intent annotations",
  );
  passed++;
} else {
  console.log(
    "FAIL  sticky-footer.json destructiveSkeleton intent annotations",
  );
  stickyTestErrors.forEach((e) => console.log(`        ${e}`));
  failed++;
}

// ── summary ──────────────────────────────────────────────────────────

console.log("");
console.log(`${passed + failed} recipes: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
