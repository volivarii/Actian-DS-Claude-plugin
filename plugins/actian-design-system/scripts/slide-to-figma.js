#!/usr/bin/env node
"use strict";

/**
 * slide-to-figma.js — Reads slide-data.json, builds slide nodes,
 * generates Figma plugin JS via the codegen library.
 *
 * Usage:
 *   node scripts/slide-to-figma.js <slide-data.json> --target-node-id <id> [--output-dir <dir>]
 *
 * Output: JSON array of { callIndex, code, description } to stdout
 *         With --output-dir: writes call-N.js files + manifest.json to <dir>
 * Logs:   "Done: N call(s), M slide(s)" to stderr
 */

const fs = require("fs");
const path = require("path");
const codegen = require("./figma-codegen");
const shared = require("./shared-constants");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_BIN_SIZE = 12000; // bytes (raw JSON of items in bin) — keep calls under 50KB
const OVERHEAD = 800; // per-item overhead estimate

const SLIDE_W = 1920;
const SLIDE_H = 1080;

const FONTS = ["Roboto:Regular", "Roboto:Bold", "Roboto:Medium"];

// DS Kit variable keys for theme-aware colors
const VARIABLES = {
  brandPrimary: { key: "a256595115f6048a1e1c843e3099a79a5c259288" },
  bgDefault: { key: "805afec875092b89deebe685e17992963d603974" },
  bgGrey2: { key: "2d7f893d1d1f5807dfc84b7b6e057eff8fd2ae31" },
  bgReverse: { key: "3d35091ed8a67f9cf4dc1e55e32a4bac7ac07a79" },
  textPrimary: { key: "cb3cf6a8b661f3a2ff12835120957f3278d329d0" },
  textSecondary: { key: "54d9d36f7653380d99e9aadbad21e14f9dcdb295" },
  textReverse: { key: "d5b2b08fd5bab41595edb892bf4707cb94bae50a" },
  borderDefault: { key: "290c868621027b488cbc3b262619959bec52765f" },
  cat1Strong: { key: "a6da1a364e8613bd146667f77efa03ee7ea39305" },
  cat2Strong: { key: "c2c0376490a69426cedfdcb1ab2a6d531b626fdf" },
  cat3Strong: { key: "9997cab3913a4dfbcb8729e5a11bd21f14f16b86" },
  cat4Strong: { key: "2b5d7f13d3765cb54d6b7ffdcd36b6ed3543823f" },
  cat5Strong: { key: "8d43f11cdb9916465065f37576bb8d903706dcfc" },
};

const DARK_GRADIENT = [
  {
    type: "LINEAR",
    stops: [
      { color: "#090952", position: 0 },
      { color: "#1414B8", position: 1 },
    ],
    angle: 80,
  },
];

const LIGHT_GRADIENT = [
  {
    type: "LINEAR",
    stops: [
      { color: "#EEEEFD", position: 0 },
      { color: "#CBDAFF", position: 1 },
    ],
    angle: 80,
  },
];

const IMPORTS = {
  genLog: shared.META_KEYS.genLog,
  ...shared.SLIDE_KEYS,
};

// Template source (reference only — components now live in Meta Kit)
// const TEMPLATE_FILE_KEY = 'l7KNDEvTs22yr7xbymwoYe';
const BG_GRAPHIC_NODES = {
  dark: "5557:18", // Cover & back cover background
  light: "5557:38", // Section divider background
};

// ---------------------------------------------------------------------------
// Slide builders
// ---------------------------------------------------------------------------

function buildCover(slide) {
  return {
    type: "INSTANCE",
    ref: "slideCover",
    name: slide.name || "Slide: Cover",
    props: {
      Topic: slide.topic || "",
      Title: slide.title || "",
      Subtitle: slide.subtitle || "",
      Date: slide.date || "",
      Creators: slide.creators || "",
    },
  };
}

function buildSection(slide) {
  return {
    type: "INSTANCE",
    ref: "slideSection",
    name: slide.name || "Slide: Section",
    props: {
      Topic: slide.topic || "",
      Title: slide.title || "",
    },
  };
}

function buildBodyFull(slide) {
  // Body slides use build-from-scratch — the content area is filled with
  // generated nodes that can't be added as component instance overrides.
  // Cover/section/back-cover use real template imports.
  const children = [
    {
      type: "TEXT",
      name: "Title",
      content: slide.title || "",
      font: "Roboto:Regular",
      size: 56,
      color: "#12131F",
      lineHeight: { value: 103, unit: "PERCENT" },
      sizing: { horizontal: "FILL", vertical: "HUG" },
      variables: { "fills.0.color": "textPrimary" },
    },
  ];

  if (slide.content && slide.content.length > 0) {
    children.push({
      type: "FRAME",
      name: "Content area",
      layout: {
        mode: "VERTICAL",
        spacing: 16,
        padding: [24, 24, 24, 24],
        primaryAxisAlign: "CENTER",
        counterAxisAlign: "CENTER",
      },
      sizing: { horizontal: "FILL", vertical: "FILL" },
      fills: ["#F5F5FA"],
      cornerRadius: 4,
      variables: { "fills.0.color": "bgGrey2" },
      children: slide.content,
    });
  }

  return {
    type: "FRAME",
    name: slide.name || "Slide: Body",
    width: SLIDE_W,
    height: SLIDE_H,
    layout: { mode: "VERTICAL", spacing: 24, padding: [64, 80, 64, 80] },
    clipsContent: true,
    fills: ["#FFFFFF"],
    variables: { "fills.0.color": "bgDefault" },
    children: children,
  };
}

function buildBodyTextVisual(slide) {
  // Body slides use build-from-scratch — visual content area is filled with
  // generated nodes. Cover/section/back-cover use real template imports.
  return {
    type: "FRAME",
    name: slide.name || "Slide: Body",
    width: SLIDE_W,
    height: SLIDE_H,
    layout: { mode: "VERTICAL", spacing: 0, padding: [64, 80, 64, 80] },
    clipsContent: true,
    fills: ["#FFFFFF"],
    variables: { "fills.0.color": "bgDefault" },
    children: [
      {
        type: "TEXT",
        name: "Title",
        content: slide.title || "",
        font: "Roboto:Regular",
        size: 56,
        color: "#12131F",
        lineHeight: { value: 103, unit: "PERCENT" },
        sizing: { horizontal: "FILL", vertical: "HUG" },
        variables: { "fills.0.color": "textPrimary" },
      },
      {
        type: "FRAME",
        name: "Content columns",
        layout: { mode: "HORIZONTAL", spacing: 56 },
        sizing: { horizontal: "FILL", vertical: "FILL" },
        fills: [],
        children: [
          {
            type: "FRAME",
            name: "Text column",
            layout: { mode: "VERTICAL", spacing: 16 },
            sizing: { horizontal: 549, vertical: "FILL" },
            fills: [],
            children: slide.textContent || [
              {
                type: "TEXT",
                name: "Body",
                content: slide.body || "",
                font: "Roboto:Regular",
                size: 24,
                color: "#000000",
                width: 549,
                lineHeight: { value: 130, unit: "PERCENT" },
              },
            ],
          },
          {
            type: "FRAME",
            name: "Visual area",
            layout: {
              mode: "VERTICAL",
              spacing: 0,
              padding: [24, 24, 24, 24],
              primaryAxisAlign: "CENTER",
              counterAxisAlign: "CENTER",
            },
            sizing: { horizontal: "FILL", vertical: "FILL" },
            fills: ["#F5F5FA"],
            cornerRadius: 4,
            variables: { "fills.0.color": "bgGrey2" },
            children: slide.visualContent || [],
          },
        ],
      },
    ],
  };
}

function buildBackCover(slide) {
  return {
    type: "INSTANCE",
    ref: "slideBack",
    name: slide.name || "Slide: Back cover",
    props: {
      Title: slide.title || "Thank you",
    },
  };
}

function buildSlide(slide) {
  const t = slide.type || "body-full";
  switch (t) {
    case "cover":
      return buildCover(slide);
    case "section":
      return buildSection(slide);
    case "body-full":
      return buildBodyFull(slide);
    case "body-text-visual":
      return buildBodyTextVisual(slide);
    case "back-cover":
      return buildBackCover(slide);
    default:
      process.stderr.write(
        'Warning: unknown slide type "' + t + '", using body-full\n',
      );
      return buildBodyFull(slide);
  }
}

// ---------------------------------------------------------------------------
// Gen Log
// ---------------------------------------------------------------------------

function buildGenLog(meta) {
  return shared.buildGenLog(meta, { skillName: "generate-presentation" });
}

// ---------------------------------------------------------------------------
// Variable scanner — collect all variable ref names used in content
// ---------------------------------------------------------------------------

function scanVariables(nodes, vars) {
  if (!vars) vars = new Set();
  if (!Array.isArray(nodes)) return vars;
  for (const node of nodes) {
    if (!node) continue;
    if (node.variables) {
      for (const val of Object.values(node.variables)) {
        if (typeof val === "string") vars.add(val);
      }
    }
    if (node.children) scanVariables(node.children, vars);
  }
  return vars;
}

// scanRefs: use codegen.scanRefs

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate(input) {
  const errors = [];
  if (!input.meta) errors.push('Missing "meta" object');
  else {
    if (!input.meta.title) errors.push("Missing meta.title");
    if (!input.meta.targetNodeId) errors.push("Missing meta.targetNodeId");
  }
  if (
    !input.slides ||
    !Array.isArray(input.slides) ||
    input.slides.length === 0
  ) {
    errors.push('Missing or empty "slides" array');
  } else {
    const validTypes = [
      "cover",
      "section",
      "body-full",
      "body-text-visual",
      "back-cover",
    ];
    for (let i = 0; i < input.slides.length; i++) {
      const s = input.slides[i];
      if (s.type && !validTypes.includes(s.type)) {
        errors.push(
          "slides[" + i + "]: type must be one of: " + validTypes.join(", "),
        );
      }
    }
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Auto-splitter
// ---------------------------------------------------------------------------

function autoSplit(meta, allItems, usedVars) {
  const bins = codegen.binPack(allItems, MAX_BIN_SIZE, OVERHEAD);

  // Resolve which variables are actually used
  const resolvedVars = {};
  for (const v of usedVars) {
    if (VARIABLES[v]) resolvedVars[v] = { key: VARIABLES[v].key };
  }

  // Resolve additional imports from content refs
  const allRefs = codegen.scanRefs(allItems);
  const imports = Object.assign({}, IMPORTS);
  if (allRefs.has("divider")) {
    imports.divider = {
      key: "f4d778e1cf9bb61a33712c791486f54bb1c095b7",
      method: "single",
    };
  }

  const calls = [];
  for (let b = 0; b < bins.length; b++) {
    const spec = {
      meta: { skill: "generate-presentation" },
      fonts: FONTS,
      imports: b === 0 ? imports : {},
      variables: resolvedVars,
      tree: bins[b],
    };

    if (b === 0) {
      spec.meta.targetNodeId = meta.targetNodeId;
      spec.meta.component = meta.title || "Presentation";
      spec.meta.wrapperName = "Presentation: " + (meta.title || "Deck");
      spec.meta.sectionName = "Presentation: " + (meta.title || "Deck");
    } else {
      spec.meta.targetNodeId = meta.targetNodeId;
      spec.meta.appendToId = "__WRAPPER_ID__";
    }

    // Generate code using codegen library
    const code = codegen.generateCallCode(spec);
    const codeSize = Buffer.byteLength(code, "utf8");

    const slideNames = bins[b]
      .filter((item) => item.type === "FRAME")
      .map((item) => item.name || "Slide")
      .join(", ");
    const description =
      "Call " +
      (b + 1) +
      " of " +
      bins.length +
      ": " +
      (slideNames || "generation log") +
      " (" +
      codeSize +
      " bytes)";

    process.stderr.write(
      "Call " +
        (b + 1) +
        ": " +
        bins[b].length +
        " items, " +
        codeSize +
        " bytes code\n",
    );
    if (codeSize > 45000) {
      process.stderr.write(
        "WARNING: Call " +
          (b + 1) +
          " code exceeds 45KB (" +
          codeSize +
          " bytes) — may hit use_figma limit\n",
      );
    }

    calls.push({ callIndex: b + 1, code: code, description: description });
  }

  return calls;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  let inputPath = null;
  let targetNodeId = null;
  let outputPath = null;
  let outputDir = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--target-node-id" && args[i + 1]) {
      targetNodeId = args[++i];
    } else if (args[i] === "--output-dir" && args[i + 1]) {
      outputDir = args[++i];
    } else if (args[i] === "--output" && args[i + 1]) {
      outputPath = args[++i];
    } else if (!inputPath) {
      inputPath = args[i];
    }
  }

  if (args.indexOf("--help") !== -1) {
    process.stdout.write(
      JSON.stringify(
        {
          name: "slide-to-figma",
          description:
            "Reads slide-data.json, generates Figma Plugin API JavaScript for presentations.",
          flags: [
            {
              name: "--target-node-id",
              required: false,
              description: "Figma node ID to append output to",
            },
            {
              name: "--output",
              required: false,
              description: "Write JSON output to file instead of stdout",
            },
            {
              name: "--output-dir",
              required: false,
              description: "Directory to write call-N.js + manifest.json",
            },
          ],
        },
        null,
        2,
      ) + "\n",
    );
    process.exit(0);
  }

  if (!inputPath) {
    process.stderr.write(
      "Usage: node slide-to-figma.js <slide-data.json> --target-node-id <id> [--output <path>] [--output-dir <dir>]\n",
    );
    process.exit(1);
  }

  let raw;
  if (inputPath === "-") {
    raw = fs.readFileSync(0, "utf8");
  } else {
    if (!fs.existsSync(inputPath)) {
      process.stderr.write("Error: file not found: " + inputPath + "\n");
      process.exit(1);
    }
    raw = fs.readFileSync(inputPath, "utf8");
  }

  let input;
  try {
    input = JSON.parse(raw);
  } catch (e) {
    process.stderr.write("Error: invalid JSON: " + e.message + "\n");
    process.exit(1);
  }

  // Schema validation (warn only — backwards compatible)
  try {
    var schemaValidator = require("./validate-schema");
    var slideSchema = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "..", "schemas", "slide-data.schema.json"),
        "utf8",
      ),
    );
    var schemaErrors = schemaValidator(input, slideSchema);
    for (var i = 0; i < schemaErrors.length; i++) {
      process.stderr.write("SCHEMA: " + schemaErrors[i] + "\n");
    }
  } catch (e) {
    /* schema files not available — skip */
  }

  if (targetNodeId) {
    if (!input.meta) input.meta = {};
    input.meta.targetNodeId = targetNodeId;
  }

  const errors = validate(input);
  if (errors.length > 0) {
    process.stderr.write("Validation errors:\n");
    for (const e of errors) process.stderr.write("  - " + e + "\n");
    process.exit(1);
  }

  // Build slides
  const items = [];
  items.push(buildGenLog(input.meta));

  for (const slide of input.slides) {
    items.push(buildSlide(slide));
  }

  // Scan variables used across all slides
  const usedVars = scanVariables(items);
  // Always include core variables for slides
  [
    "bgDefault",
    "bgGrey2",
    "textPrimary",
    "textSecondary",
    "textReverse",
    "brandPrimary",
    "borderDefault",
  ].forEach(function (v) {
    usedVars.add(v);
  });

  const calls = autoSplit(input.meta, items, usedVars);
  const output = JSON.stringify(calls);

  if (outputDir) {
    // Write each call as a separate file + manifest
    fs.mkdirSync(outputDir, { recursive: true });
    const manifest = { totalCalls: calls.length, calls: [] };
    for (const r of calls) {
      const fileName = "call-" + r.callIndex + ".js";
      const filePath = path.join(outputDir, fileName);
      fs.writeFileSync(filePath, r.code, "utf8");
      manifest.calls.push({
        callIndex: r.callIndex,
        file: fileName,
        sizeBytes: Buffer.byteLength(r.code, "utf8"),
        description: r.description,
      });
    }
    fs.writeFileSync(
      path.join(outputDir, "manifest.json"),
      JSON.stringify(manifest, null, 2),
      "utf8",
    );
    process.stderr.write(
      "Wrote " + calls.length + " call file(s) to " + outputDir + "\n",
    );
  } else if (outputPath) {
    fs.writeFileSync(outputPath, output);
    process.stderr.write("Written to " + outputPath + "\n");
  } else {
    process.stdout.write(output + "\n");
  }

  process.stderr.write(
    "Done: " +
      calls.length +
      " call(s), " +
      input.slides.length +
      " slide(s)\n",
  );
}

main();
