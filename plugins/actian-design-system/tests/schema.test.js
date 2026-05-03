#!/usr/bin/env node
"use strict";

/**
 * schema.test.js — Tests for JSON Schema files and the validator.
 *
 * Run with: node tests/schema.test.js
 * (from the plugins/actian-design-system directory)
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// ---------------------------------------------------------------------------
// Minimal test harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    passed++;
    process.stdout.write("  \u2713 " + message + "\n");
  } else {
    failed++;
    failures.push(message);
    process.stdout.write("  \u2717 " + message + "\n");
  }
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, "..");
const schemasDir = path.join(ROOT, "schemas");
const scriptsDir = path.join(ROOT, "scripts");
const fixturesDir = path.join(ROOT, "tests", "fixtures");

const validate = require(path.join(scriptsDir, "validate-schema"));

// ---------------------------------------------------------------------------
// Test: Schema files parse as valid JSON
// ---------------------------------------------------------------------------

process.stdout.write("\nSchema files parse as valid JSON\n");

const schemaFiles = [
  "flow-data.schema.json",
  "brief-data.schema.json",
  "slide-data.schema.json",
];

const schemas = {};

for (const file of schemaFiles) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(path.join(schemasDir, file), "utf8"));
  } catch (e) {
    parsed = null;
  }
  schemas[file] = parsed;
  assert(
    parsed !== null && typeof parsed === "object",
    file + " parses as valid JSON",
  );
}

// ---------------------------------------------------------------------------
// Test: Fixtures validate against schemas with 0 errors
// ---------------------------------------------------------------------------

process.stdout.write("\nFixtures validate against schemas\n");

const fixturePairs = [
  { fixture: "admin-dashboard.json", schema: "flow-data.schema.json" },
  { fixture: "button-brief-data.json", schema: "brief-data.schema.json" },
  { fixture: "sample-presentation.json", schema: "slide-data.schema.json" },
];

for (const pair of fixturePairs) {
  const data = JSON.parse(
    fs.readFileSync(path.join(fixturesDir, pair.fixture), "utf8"),
  );
  const schema = schemas[pair.schema];
  const errors = validate(data, schema);
  // Filter out deprecation warnings for fixture validation
  const realErrors = errors.filter((e) => !e.includes("deprecated"));
  assert(
    realErrors.length === 0,
    pair.fixture +
      " validates against " +
      pair.schema +
      " (" +
      realErrors.length +
      " errors" +
      (realErrors.length > 0 ? ": " + realErrors[0] : "") +
      ")",
  );
}

// ---------------------------------------------------------------------------
// Test: Validator catches missing required field
// ---------------------------------------------------------------------------

process.stdout.write("\nValidator catches known bad input\n");

const badFlow = { screens: [] };
const flowErrors = validate(badFlow, schemas["flow-data.schema.json"]);
assert(
  flowErrors.some((e) => e.includes('missing required field "meta"')),
  'Detects missing required "meta" field',
);

const badFlowEmpty = { meta: { feature: "Test" }, screens: [] };
const emptyErrors = validate(badFlowEmpty, schemas["flow-data.schema.json"]);
assert(
  emptyErrors.some((e) => e.includes("minimum is 1")),
  "Detects empty screens array (minItems: 1)",
);

// ---------------------------------------------------------------------------
// Test: Validator catches wrong type
// ---------------------------------------------------------------------------

const badType = {
  meta: "not-an-object",
  screens: [{ name: "S1", content: [] }],
};
const typeErrors = validate(badType, schemas["flow-data.schema.json"]);
assert(
  typeErrors.some((e) => e.includes("expected object but got string")),
  "Detects wrong type (string instead of object)",
);

// ---------------------------------------------------------------------------
// Test: Validator catches invalid enum
// ---------------------------------------------------------------------------

const badEnum = {
  meta: { feature: "Test", app: "InvalidApp" },
  screens: [{ name: "S1", content: [] }],
};
const enumErrors = validate(badEnum, schemas["flow-data.schema.json"]);
assert(
  enumErrors.some((e) => e.includes("not in enum")),
  "Detects invalid enum value",
);

// ---------------------------------------------------------------------------
// Test: Validator detects deprecated field (warning)
// ---------------------------------------------------------------------------

const deprecatedFlow = {
  meta: { feature: "Test" },
  screens: [{ name: "S1", content: [], chrome: "standard" }],
};
const deprecatedErrors = validate(
  deprecatedFlow,
  schemas["flow-data.schema.json"],
);
assert(
  deprecatedErrors.some((e) => e.includes("deprecated")),
  "Detects deprecated field as warning",
);

// ---------------------------------------------------------------------------
// Test: Validator handles $ref/$defs correctly
// ---------------------------------------------------------------------------

process.stdout.write("\nValidator handles $ref/$defs\n");

const flowWithContent = {
  meta: { feature: "Test" },
  screens: [
    {
      name: "S1",
      content: [
        {
          type: "FRAME",
          name: "Row",
          children: [
            {
              type: "TEXT",
              content: "Hello",
              font: "Inter:Regular",
              size: 14,
              color: "#000",
            },
          ],
        },
        { type: "DIVIDER" },
      ],
    },
  ],
};
const refErrors = validate(flowWithContent, schemas["flow-data.schema.json"]);
const refRealErrors = refErrors.filter((e) => !e.includes("deprecated"));
assert(
  refRealErrors.length === 0,
  "Recursive $ref content nodes validate correctly (" +
    refRealErrors.length +
    " errors)",
);

const badContentType = {
  meta: { feature: "Test" },
  screens: [
    {
      name: "S1",
      content: [{ type: "INVALID_TYPE", name: "Bad" }],
    },
  ],
};
const badRefErrors = validate(badContentType, schemas["flow-data.schema.json"]);
assert(
  badRefErrors.some((e) => e.includes("not in enum")),
  "Detects invalid content node type via $ref",
);

// ---------------------------------------------------------------------------
// Test: Validator catches const mismatch
// ---------------------------------------------------------------------------

const badConst = {
  meta: { feature: "Test", skill: "wrong-skill" },
  screens: [{ name: "S1", content: [] }],
};
const constErrors = validate(badConst, schemas["flow-data.schema.json"]);
assert(
  constErrors.some((e) => e.includes("expected const")),
  "Detects const mismatch for skill field",
);

// ---------------------------------------------------------------------------
// Test: Brief schema validates fixture
// ---------------------------------------------------------------------------

process.stdout.write("\nBrief schema specifics\n");

const badBrief = { meta: { component: "X", skill: "component-brief" } };
const briefErrors = validate(badBrief, schemas["brief-data.schema.json"]);
assert(
  briefErrors.some((e) => e.includes('missing required field "card_header"')),
  "Brief requires card_header",
);

// ---------------------------------------------------------------------------
// Test: Slide schema validates fixture
// ---------------------------------------------------------------------------

process.stdout.write("\nSlide schema specifics\n");

const badSlide = { meta: {}, slides: [{ type: "cover", name: "C" }] };
const slideErrors = validate(badSlide, schemas["slide-data.schema.json"]);
assert(
  slideErrors.some((e) => e.includes('missing required field "title"')),
  "Slide meta requires title",
);

const badSlideType = {
  meta: { title: "T" },
  slides: [{ type: "invalid-type", name: "S" }],
};
const slideTypeErrors = validate(
  badSlideType,
  schemas["slide-data.schema.json"],
);
assert(
  slideTypeErrors.some((e) => e.includes("not in enum")),
  "Detects invalid slide type enum",
);

// ---------------------------------------------------------------------------
// Test: CLI mode works
// ---------------------------------------------------------------------------

process.stdout.write("\nCLI mode\n");

try {
  const cliOut = execSync(
    "node " +
      path.join(scriptsDir, "validate-schema.js") +
      " " +
      path.join(fixturesDir, "admin-dashboard.json") +
      " " +
      path.join(schemasDir, "flow-data.schema.json"),
    { encoding: "utf8" },
  );
  assert(
    cliOut.includes("Valid: 0 errors") || cliOut.includes("0 errors"),
    "CLI validates flow fixture",
  );
} catch (e) {
  // CLI exits 1 on deprecation warnings — check stderr
  const out = (e.stdout || "") + (e.stderr || "");
  assert(
    false,
    "CLI validates flow fixture (got: " + out.trim().substring(0, 100) + ")",
  );
}

// ---------------------------------------------------------------------------
// Test: Content node intent field
// ---------------------------------------------------------------------------

process.stdout.write("\nContent node intent field\n");

const intentFrameData = {
  meta: { feature: "Delete confirmation" },
  screens: [
    {
      name: "Screen 1",
      content: [
        {
          type: "FRAME",
          intent: "destructive-action",
          children: [
            {
              type: "INSTANCE",
              ref: "fmButton",
              variant: "Type=Destructive",
              props: { Label: "Delete" },
            },
          ],
        },
      ],
    },
  ],
};
const intentFrameErrors = validate(
  intentFrameData,
  schemas["flow-data.schema.json"],
);
const intentFrameRealErrors = intentFrameErrors.filter(
  (e) => !e.includes("deprecated"),
);
assert(
  intentFrameRealErrors.length === 0,
  "accepts contentNode with intent set on FRAME",
);

const intentInstanceData = {
  meta: { feature: "Test" },
  screens: [
    {
      name: "Screen 1",
      content: [
        {
          type: "INSTANCE",
          ref: "fmButton",
          variant: "Type=Destructive",
          intent: "destructive-action",
          props: { Label: "Delete" },
        },
      ],
    },
  ],
};
const intentInstanceErrors = validate(
  intentInstanceData,
  schemas["flow-data.schema.json"],
);
const intentInstanceRealErrors = intentInstanceErrors.filter(
  (e) => !e.includes("deprecated"),
);
assert(
  intentInstanceRealErrors.length === 0,
  "accepts contentNode with intent set on INSTANCE",
);

const invalidIntentData = {
  meta: { feature: "Test" },
  screens: [
    {
      name: "Screen 1",
      content: [{ type: "FRAME", intent: "bogus-intent", children: [] }],
    },
  ],
};
const invalidIntentErrors = validate(
  invalidIntentData,
  schemas["flow-data.schema.json"],
);
assert(
  invalidIntentErrors.some((e) => e.includes("not in enum")),
  "rejects invalid intent enum value",
);

const noIntentData = {
  meta: { feature: "Test" },
  screens: [
    {
      name: "Screen 1",
      content: [{ type: "FRAME", children: [] }],
    },
  ],
};
const noIntentErrors = validate(noIntentData, schemas["flow-data.schema.json"]);
const noIntentRealErrors = noIntentErrors.filter(
  (e) => !e.includes("deprecated"),
);
assert(
  noIntentRealErrors.length === 0,
  "accepts contentNode without intent (absence is valid)",
);

// ---------------------------------------------------------------------------
// Test: B-refine.1 — screen.id and meta.mode schema additions
// ---------------------------------------------------------------------------

process.stdout.write("\nB-refine.1 — screen.id and meta.mode\n");

// screen.id present, kebab-case → valid
const idOk = {
  meta: { feature: "T" },
  screens: [{ id: "test-1", name: "S", content: [] }],
};
const idOkErrs = validate(idOk, schemas["flow-data.schema.json"]).filter(
  (e) => !e.includes("deprecated"),
);
assert(idOkErrs.length === 0, "accepts screen.id when present and kebab-case");

// screen.id with uppercase → rejected
const idBadCase = {
  meta: { feature: "T" },
  screens: [{ id: "Test_1", name: "S", content: [] }],
};
const idBadCaseErrs = validate(idBadCase, schemas["flow-data.schema.json"]);
assert(
  idBadCaseErrs.some((e) => e.toLowerCase().includes("pattern")),
  "rejects screen.id with uppercase or underscores",
);

// screen.id absent → still valid (always-optional in schema; validator stamps)
const idAbsent = {
  meta: { feature: "T" },
  screens: [{ name: "S", content: [] }],
};
const idAbsentErrs = validate(
  idAbsent,
  schemas["flow-data.schema.json"],
).filter((e) => !e.includes("deprecated"));
assert(
  idAbsentErrs.length === 0,
  "accepts screen with no id (validator stamps)",
);

// meta.mode = "full" → valid
const modeFull = {
  meta: { feature: "T", mode: "full" },
  screens: [{ name: "S", content: [] }],
};
const modeFullErrs = validate(
  modeFull,
  schemas["flow-data.schema.json"],
).filter((e) => !e.includes("deprecated"));
assert(modeFullErrs.length === 0, 'accepts meta.mode = "full"');

// meta.mode = "refine" → valid
const modeRefine = {
  meta: { feature: "T", mode: "refine" },
  screens: [{ name: "S", content: [] }],
};
const modeRefineErrs = validate(
  modeRefine,
  schemas["flow-data.schema.json"],
).filter((e) => !e.includes("deprecated"));
assert(modeRefineErrs.length === 0, 'accepts meta.mode = "refine"');

// meta.mode = "patch" (unknown) → rejected
const modeBad = {
  meta: { feature: "T", mode: "patch" },
  screens: [{ name: "S", content: [] }],
};
const modeBadErrs = validate(modeBad, schemas["flow-data.schema.json"]);
assert(
  modeBadErrs.some((e) => e.toLowerCase().includes("enum")),
  "rejects unknown meta.mode value",
);

// ---------------------------------------------------------------------------
// meta.references[].fingerprint (C-vision v1.57.0+)
// ---------------------------------------------------------------------------

process.stdout.write("\nmeta.references[].fingerprint shape (C-vision)\n");

function makeFlowWithFingerprint(fingerprint) {
  return {
    meta: {
      feature: "Test",
      references: [
        {
          url: "https://figma.com/design/abc/?node-id=1-1",
          kind: "figma-frame",
          fingerprint: fingerprint,
        },
      ],
    },
    screens: [{ name: "Screen 1", content: [] }],
  };
}

function nonDeprecatedErrors(data) {
  return validate(data, schemas["flow-data.schema.json"]).filter(
    (e) => !e.includes("deprecated"),
  );
}

// 1. Fully-populated fingerprint validates
const fpValidFull = makeFlowWithFingerprint({
  density: "high",
  hierarchy_depth: 4,
  primary_components: ["toolbar", "table"],
  layout_archetype: "table-list",
  extracted_at: "2026-04-29T12:00:00Z",
});
const fpValidFullErrs = nonDeprecatedErrors(fpValidFull);
assert(
  fpValidFullErrs.length === 0,
  "accepts a fully-populated fingerprint (no errors: got " +
    fpValidFullErrs.length +
    (fpValidFullErrs.length > 0 ? " — " + fpValidFullErrs[0] : "") +
    ")",
);

// 2. Reference without fingerprint validates (back-compat with v1.56.x)
const fpAbsent = {
  meta: {
    feature: "Test",
    references: [
      { url: "https://figma.com/design/abc/?node-id=1-1", kind: "figma-frame" },
    ],
  },
  screens: [{ name: "Screen 1", content: [] }],
};
const fpAbsentErrs = nonDeprecatedErrors(fpAbsent);
assert(
  fpAbsentErrs.length === 0,
  "accepts a reference without fingerprint (back-compat)",
);

// 3. Empty fingerprint object validates (vacuous; partial extraction allowed)
const fpEmpty = makeFlowWithFingerprint({});
const fpEmptyErrs = nonDeprecatedErrors(fpEmpty);
assert(fpEmptyErrs.length === 0, "accepts an empty fingerprint object");

// 4. Invalid density enum rejected
const fpBadDensity = makeFlowWithFingerprint({ density: "ultra" });
const fpBadDensityErrs = validate(
  fpBadDensity,
  schemas["flow-data.schema.json"],
);
assert(
  fpBadDensityErrs.some(
    (e) =>
      e.toLowerCase().includes("enum") || e.toLowerCase().includes("density"),
  ),
  "rejects invalid density enum value",
);

// 5. hierarchy_depth wrong type rejected (validator enforces type but not maximum)
// Note: validate-schema.js does not enforce numeric minimum/maximum constraints —
// only type is checked. Passing a string where integer is required IS rejected.
const fpBadDepthType = makeFlowWithFingerprint({ hierarchy_depth: "four" });
const fpBadDepthTypeErrs = validate(
  fpBadDepthType,
  schemas["flow-data.schema.json"],
);
assert(
  fpBadDepthTypeErrs.length > 0,
  "rejects hierarchy_depth with wrong type (string instead of integer)",
);

// 6. extracted_at format: validator does not enforce format:"date-time" (runtime concern)
// The schema documents format:"date-time" as a hint for tooling, but validate-schema.js
// only enforces type, enum, required, pattern, and minItems — not format keywords.
// Runtime consumers (vision pipeline) are responsible for ISO 8601 enforcement.
const fpBadDate = makeFlowWithFingerprint({ extracted_at: "not-a-date" });
const fpBadDateErrs = nonDeprecatedErrors(fpBadDate);
assert(
  fpBadDateErrs.length === 0,
  "schema layer does NOT enforce extracted_at format (format:date-time is a hint only; runtime-enforced)",
);

// 7. Schema does NOT enforce layout_archetype enum (RECIPE_IDS validated at runtime)
// The schema-layer validation only checks type=string. RECIPE_IDS membership is
// enforced by scripts/fingerprint-schema.js validateFingerprint at runtime.
const fpUnknownArchetype = makeFlowWithFingerprint({
  layout_archetype: "made-up-archetype",
});
const fpUnknownArchetypeErrs = nonDeprecatedErrors(fpUnknownArchetype);
assert(
  fpUnknownArchetypeErrs.length === 0,
  "schema does NOT enforce layout_archetype enum (runtime concern)",
);

// ---------------------------------------------------------------------------
// Test: validateBriefData — Sub-project B _source contract
// ---------------------------------------------------------------------------

process.stdout.write("\nvalidateBriefData — Sub-project B _source contract\n");

function test(label, fn) {
  try {
    fn();
  } catch (e) {
    failed++;
    failures.push(label + " (threw: " + e.message + ")");
    process.stdout.write("  ✗ " + label + "\n");
    return;
  }
}

var assert_ok = function (cond, msg) {
  if (cond) {
    passed++;
    process.stdout.write("  ✓ " + msg + "\n");
  } else {
    failed++;
    failures.push(msg);
    process.stdout.write("  ✗ " + msg + "\n");
    throw new Error(msg);
  }
};

test("brief schema — every card object has _source field", function () {
  var schema = require("../scripts/validate-schema.js");
  var data = {
    meta: {},
    card_header: { name: "Button", description: "x" }, // missing _source
    card_tokens: { _source: "generated", colors: [] },
  };
  var result = schema.validateBriefData(data);
  assert_ok(
    result.findings.some(function (f) {
      return f.kind === "missing-source-field" && f.card === "card_header";
    }),
    "expected missing-source-field finding for card_header",
  );
});

test("brief schema — _source value must be 'figma' or 'generated'", function () {
  var schema = require("../scripts/validate-schema.js");
  var data = {
    meta: {},
    card_header: { _source: "wrong-value", name: "Button", description: "x" },
  };
  var result = schema.validateBriefData(data);
  assert_ok(
    result.findings.some(function (f) {
      return f.kind === "invalid-source-value";
    }),
    "expected invalid-source-value finding",
  );
});

test("brief schema — transcribed card with empty content + no _fallback flag → finding", function () {
  var schema = require("../scripts/validate-schema.js");
  var data = {
    meta: {},
    card_header: { _source: "figma", name: "Button", description: "" }, // empty + claims figma source
  };
  var result = schema.validateBriefData(data);
  assert_ok(
    result.findings.some(function (f) {
      return f.kind === "empty-figma-source";
    }),
    "expected empty-figma-source finding",
  );
});

test("brief schema — forbidden card keys card_api / card_code / card_states → finding", function () {
  var schema = require("../scripts/validate-schema.js");
  var data = {
    meta: {},
    card_api: { _source: "generated", props: [] },
  };
  var result = schema.validateBriefData(data);
  assert_ok(
    result.findings.some(function (f) {
      return f.kind === "forbidden-card-key" && f.card === "card_api";
    }),
    "expected forbidden-card-key finding for card_api",
  );
});

test("brief schema — _fallback: true with no _fallbackReason → finding", function () {
  var schema = require("../scripts/validate-schema.js");
  var data = {
    meta: {},
    card_header: {
      _source: "generated",
      _fallback: true,
      name: "Button",
      description: "x",
    },
  };
  var result = schema.validateBriefData(data);
  assert_ok(
    result.findings.some(function (f) {
      return f.kind === "fallback-without-reason";
    }),
    "expected fallback-without-reason finding",
  );
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

process.stdout.write("\n" + passed + " passed, " + failed + " failed\n");
if (failures.length > 0) {
  process.stdout.write("Failures:\n");
  for (const f of failures) process.stdout.write("  - " + f + "\n");
  process.exit(1);
}
