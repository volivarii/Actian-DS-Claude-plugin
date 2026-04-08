"use strict";

/**
 * shared-constants.js — Single source of truth for constants used across codegen scripts.
 *
 * Imported by flow-to-figma.js, brief-to-figma.js, and slide-to-figma.js.
 * Component keys and methods are read from registry JSON files (docs/*.json).
 * Only the ref-name → slug mapping is maintained here.
 */

const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Registry loader — reads JSON registries from docs/
// ---------------------------------------------------------------------------

const _registryCache = {};
function loadRegistry(name) {
  if (!_registryCache[name]) {
    const filePath = path.join(__dirname, "..", "docs", name + ".json");
    _registryCache[name] = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }
  return _registryCache[name];
}

/**
 * Build a { refName: { key, method } } map from a registry + slug mapping.
 * @param {string} registryName - "metakit", "fmkit", or "dskit"
 * @param {object} slugMap - { refName: slug } where slug is the key in registry.components
 * @param {string} [section] - "components" (default) or "templates"
 */
function buildKeyMap(registryName, slugMap, section) {
  var registry = loadRegistry(registryName);
  var store = registry[section || "components"];
  var result = {};
  for (var ref in slugMap) {
    var slug = slugMap[ref];
    var entry = store[slug];
    if (entry) {
      result[ref] = {
        key: entry.key,
        method: entry.importMethod === "set" ? "set" : "single",
      };
    }
  }
  return result;
}

/**
 * Look up full properties for a component by ref name.
 * @param {string} registryName
 * @param {object} slugMap
 * @param {string} refName
 * @returns {object|null} Properties object with hash-suffixed names
 */
function getProperties(registryName, slugMap, refName) {
  var slug = slugMap[refName];
  if (!slug) return null;
  var registry = loadRegistry(registryName);
  var entry = registry.components[slug];
  return entry ? entry.properties || {} : null;
}

// ---------------------------------------------------------------------------
// Ref-name → registry-slug mappings (only source of duplication)
// ---------------------------------------------------------------------------

const META_SLUGS = {
  genLog: "meta-/-chrome-/-generation-log",
  divider: "meta-/-utility-/-card-divider",
  codeBlock: "meta-/-content-/-code-block",
  flowCoverCard: "meta-/-chrome-/-flow-cover-card",
  researchFrame: "meta-/-content-/-research-frame",
  feedback: "meta-/-chrome-/-feedback",
  flowScreen: "meta-/-chrome-/-flow-screen",
};

const BRIEF_SLUGS = {
  briefCard: "meta-/-chrome-/-brief-card",
  doDontPair: "meta-/-content-/-do-don't-pair",
  contrastBadge: "meta-/-content-/-contrast-badge",
  pointerBadge: "meta-/-content-/-pointer-badge",
  dimAnnotation: "meta-/-content-/-dimension-annotation",
  a11yCard: "meta-/-chrome-/-accessibility-card",
  colorSwatch: "meta-/-content-/-color-swatch",
  themeCard: "meta-/-chrome-/-theme-card",
  statCard: "meta-/-content-/-stat-card",
};

const TEMPLATE_SLUGS = {
  tableHeaderRow: "table-header-row",
  tableDataRow: "table-data-row",
  stateColumn: "state-column",
  sectionHeader: "section-header",
  swatchRow: "swatch-row",
  a11ySpecRow: "a11y-spec-row",
};

const SLIDE_SLUGS = {
  slideCover: "meta-/-slide-/-cover",
  slideBodyFull: "meta-/-slide-/-body-full",
  slideBodyTV: "meta-/-slide-/-body-text-visual",
  slideSection: "meta-/-slide-/-section",
  slideBack: "meta-/-slide-/-back-cover",
};

const FM_SLUGS = {
  fmAppHeader: "fm-app-header",
  fmSideNavItem: "fm-side-navigation-item",
  fmPageHeader: "fm-page-header",
  fmButton: "fm-button",
  fmTableCell: "fm-table-cell",
  fmTextInput: "fm-text-input-field",
  fmDropdown: "fm-dropdown",
  fmInputLabel: "fm-input-label",
  fmSearchInput: "fm-search-input-field",
  fmTag: "fm-tag",
  fmChip: "fm-chip",
  fmTab: "fm-tab",
  fmPlaceholder: "fm-placeholder",
  fmEmptyState: "fm-empty-state",
  fmAlert: "fm-alert",
  fmBanner: "fm-banner",
  fmToggle: "fm-toggle",
  fmCheckbox: "fm-checkbox",
  fmDialog: "fm-dialog",
  fmTextArea: "fm-text-area",
  fmBadge: "fm-badge",
  fmStepper: "fm-stepper",
  fmToast: "fm-toast",
  fmIconButtons: "fm-icon-buttons",
  fmSpinner: "fm-spinner",
  fmRadioButton: "fm-radio-button",
  fmDateInput: "fm-date-input",
  fmProgressBar: "fm-progress-bar",
  fmMultiSelectDropdown: "fm-multi-select-dropdown",
  fmTabs: "fm-tabs",
};

// ---------------------------------------------------------------------------
// Build key maps from registries (computed at module load)
// ---------------------------------------------------------------------------

const META_KEYS = buildKeyMap("metakit", META_SLUGS);
const BRIEF_KEYS = buildKeyMap("metakit", BRIEF_SLUGS);
const TEMPLATE_KEYS = buildKeyMap("metakit", TEMPLATE_SLUGS, "templates");
const SLIDE_KEYS = buildKeyMap("metakit", SLIDE_SLUGS);
const FM_FALLBACK_KEYS = Object.assign(buildKeyMap("fmkit", FM_SLUGS), {
  // Components in Figma but not yet in fmkit.json — will resolve after next sync
  fmBanner: {
    key: "d7f323e492b456a2c56f81f3dc892eb24de11a6e",
    method: "single",
  },
  fmDialog: {
    key: "0cc53eca9c90cccb8cbc57864ea110378414fd2b",
    method: "single",
  },
  fmSpinner: {
    key: "52927648847b15a51d314cf06ca1c0f19f398b4d",
    method: "single",
  },
  fmTabs: { key: "860eadef9ba29cf20a3da3ca9d014718e3f6cabb", method: "single" },
});

// ---------------------------------------------------------------------------
// Syntax highlighting colors (code blocks in briefs + slides)
// ---------------------------------------------------------------------------

const TOKEN_COLORS = {
  selector: "#FF79C6",
  property: "#82AAFF",
  value: "#C3E88D",
  comment: "#676E95",
  keyword: "#C792EA",
  string: "#C3E88D",
  punctuation: "#BABED8",
  tag: "#FF5370",
  attribute: "#FFCB6B",
  function: "#82AAFF",
  text: "#BABED8",
};

// ---------------------------------------------------------------------------
// DS palette (card chrome, typography, backgrounds)
// ---------------------------------------------------------------------------

const PALETTE = {
  textPrimary: "#1A1A2E",
  textSecondary: "#595968",
  textTertiary: "#888888",
  bgGrey: "#F5F5FA",
  bgLight: "#F9FAFB",
  white: "#FFFFFF",
  errorRed: "#C10C0D",
  successGreen: "#047800",
  errorBg: "#FEF3F2",
  annotationPink: "#E91E8C",
};

// ---------------------------------------------------------------------------
// Shared GenLog builder (used by all 3 codegen scripts)
// ---------------------------------------------------------------------------

/**
 * Build a Generation Log spec node.
 * @param {object} meta - meta object from data JSON
 * @param {object} opts - { skillName, promptOverride }
 */
function buildGenLog(meta, opts) {
  opts = opts || {};
  var skill = opts.skillName || meta.skill || "unknown";
  var prompt = opts.promptOverride || meta.prompt || "";
  return {
    type: "INSTANCE",
    ref: "genLog",
    name: "Generation Log",
    props: {
      Skill: "Skill: " + skill,
      Prompt: "Prompt: " + prompt.substring(0, 200),
      Date: meta.generatedAt || new Date().toISOString(),
      Duration: "Duration: " + (meta.duration || "n/a"),
      Model: meta.model || "",
      "Plugin Version": "v" + (meta.pluginVersion || "unknown"),
    },
    sizing: { horizontal: "HUG", vertical: "HUG" },
  };
}

// ---------------------------------------------------------------------------
// Interpreter call assembly
// ---------------------------------------------------------------------------

/** Read the minified interpreter source (cached after first read) */
let _interpreterCache = null;
function getInterpreterSource() {
  if (!_interpreterCache) {
    _interpreterCache = fs.readFileSync(
      path.join(__dirname, "figma-interpreter.min.js"),
      "utf8",
    );
  }
  return _interpreterCache;
}

/** Byte length of the minified interpreter (cached). */
function getRuntimeSize() {
  return Buffer.byteLength(getInterpreterSource(), "utf8");
}

/**
 * Calculate the maximum tree-node bin size that keeps assembled code under the
 * use_figma 50,000-character limit.
 *
 * Budget: 50000 - runtime - specOverhead - safetyMargin
 *   specOverhead ≈ 2100 bytes (meta + fonts + imports + JSON structure)
 *   safetyMargin = 500 bytes
 */
function getMaxBinSize() {
  return 50000 - getRuntimeSize() - 2100 - 500;
}

/**
 * Assemble a self-contained call: interpreter source + JSON spec.
 * Each call inlines the full interpreter (~18KB) + spec data.
 * No eval needed — Figma sandbox doesn't support eval for function defs.
 */
function assembleCall(spec) {
  var interpreterSource = getInterpreterSource();
  var specJSON = JSON.stringify(spec);
  return (
    interpreterSource +
    "\nvar _spec = " +
    specJSON +
    ";\n" +
    "return await buildFromSpec(_spec);"
  );
}

/**
 * Write call files in split format: runtime.js (once) + call-N.json (spec per call).
 * Returns the manifest object. Caller should write manifest.json separately if needed.
 *
 * @param {string} outputDir - Directory to write files into (created if missing)
 * @param {Array<{callIndex: number, code: string, description: string, spec: object}>} calls
 * @param {object} unitMap - Card/screen/slide → call index mapping
 * @param {number|null} callFilter - If set, only write this specific call index
 * @returns {object} manifest
 */
function writeCallFiles(outputDir, calls, unitMap, callFilter) {
  fs.mkdirSync(outputDir, { recursive: true });

  // Write runtime once
  const runtimeSource = getInterpreterSource();
  fs.writeFileSync(path.join(outputDir, "runtime.js"), runtimeSource, "utf8");

  const manifest = {
    totalCalls: calls.length,
    unitMap: unitMap,
    runtime: "runtime.js",
    calls: [],
  };

  for (const r of calls) {
    const fileName = "call-" + r.callIndex + ".json";
    const specJSON = JSON.stringify(r.spec, null, 2);
    if (!callFilter || r.callIndex === callFilter) {
      fs.writeFileSync(path.join(outputDir, fileName), specJSON, "utf8");
    }
    manifest.calls.push({
      callIndex: r.callIndex,
      file: fileName,
      specBytes: Buffer.byteLength(specJSON, "utf8"),
      description: r.description,
    });
  }

  fs.writeFileSync(
    path.join(outputDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8",
  );

  return manifest;
}

/**
 * Write call files in scaffold + direct-fill format.
 *
 * Push flow (what the agent does):
 *   1. Read scaffold.js → use_figma (creates wrapper + named sections)
 *   2. For each fill: read fill-N.js → use_figma (builds cards into section)
 *      Cards appear in Figma after each fill — progressive visible output.
 *
 * Output:
 *   outputDir/
 *   ├── manifest.json            (v2 manifest)
 *   ├── scaffold.js              (pre-assembled, ~22KB)
 *   ├── fill-1.js                (pre-assembled: runtime + fill spec)
 *   ├── fill-N.js                ...
 *   ├── runtime.js               (debugging only)
 *   ├── scaffold.json            (debugging only)
 *   └── fill-1.json              (pretty spec, debugging only)
 *
 * @param {string} outputDir
 * @param {object} scaffoldSpec - Spec for the scaffold call
 * @param {Array<{fillIndex: number, spec: object, description: string, sectionKey: string}>} fills
 * @param {object} unitMap - Card/screen/slide → fill index mapping
 * @param {number|null} fillFilter - If set, only write this specific fill index
 * @returns {object} manifest
 */
function writeCallFilesV2(outputDir, scaffoldSpec, fills, unitMap, fillFilter) {
  fs.mkdirSync(outputDir, { recursive: true });

  var runtimeSource = getInterpreterSource();

  // Always write runtime (for debugging/reference)
  fs.writeFileSync(path.join(outputDir, "runtime.js"), runtimeSource, "utf8");

  // Write scaffold (pre-assembled)
  var scaffoldJSON = JSON.stringify(scaffoldSpec, null, 2);
  var scaffoldCode = assembleCall(scaffoldSpec);
  if (!fillFilter) {
    fs.writeFileSync(
      path.join(outputDir, "scaffold.json"),
      scaffoldJSON,
      "utf8",
    );
    fs.writeFileSync(path.join(outputDir, "scaffold.js"), scaffoldCode, "utf8");
  }

  var manifest = {
    version: 2,
    totalCalls: 1 + fills.length,
    unitMap: unitMap,
    scaffold: {
      file: "scaffold.js",
      specFile: "scaffold.json",
      sizeBytes: Buffer.byteLength(scaffoldCode, "utf8"),
      sections: fills.map(function (f) {
        return f.sectionKey;
      }),
      description: "Creates wrapper + " + fills.length + " section frames",
    },
    fills: [],
  };

  for (var i = 0; i < fills.length; i++) {
    var f = fills[i];
    var fillJSON = JSON.stringify(f.spec, null, 2);
    var fillCode = assembleCall(f.spec);
    var jsFile = "fill-" + f.fillIndex + ".js";
    var jsonFile = "fill-" + f.fillIndex + ".json";

    if (!fillFilter || f.fillIndex === fillFilter) {
      fs.writeFileSync(path.join(outputDir, jsonFile), fillJSON, "utf8");
      fs.writeFileSync(path.join(outputDir, jsFile), fillCode, "utf8");
    }

    var codeSize = Buffer.byteLength(fillCode, "utf8");
    if (codeSize > 50000) {
      process.stderr.write(
        "WARNING: fill-" +
          f.fillIndex +
          " exceeds 50KB use_figma limit (" +
          codeSize +
          " bytes)\n",
      );
    }

    manifest.fills.push({
      fillIndex: f.fillIndex,
      file: jsFile,
      specFile: jsonFile,
      sizeBytes: codeSize,
      sectionKey: f.sectionKey,
      description: f.description,
    });
  }

  fs.writeFileSync(
    path.join(outputDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8",
  );

  return manifest;
}

/**
 * Reassemble a call from runtime source + spec JSON for use_figma execution.
 * Used at push time: read runtime.js once, read each call-N.json, combine.
 *
 * @param {string} runtimeSource - Content of runtime.js
 * @param {string} specJSON - Content of call-N.json
 * @returns {string} Executable code for use_figma
 */
function reassembleCall(runtimeSource, specJSON) {
  return (
    runtimeSource +
    "\nvar _spec = " +
    specJSON +
    ";\n" +
    "return await buildFromSpec(_spec);"
  );
}

/** Return byte size of compact JSON representation. */
function compactSize(obj) {
  return Buffer.byteLength(JSON.stringify(obj), "utf8");
}

/** Bin-pack items into groups where raw JSON size stays under maxBinSize. */
function binPack(items, maxBinSize, overhead) {
  var bins = [];
  var currentBin = [];
  var currentSize = 0;
  for (var i = 0; i < items.length; i++) {
    var itemSize = compactSize(items[i]);
    if (
      currentBin.length > 0 &&
      currentSize + itemSize + overhead > maxBinSize
    ) {
      bins.push(currentBin);
      currentBin = [];
      currentSize = 0;
    }
    currentBin.push(items[i]);
    currentSize += itemSize + overhead;
  }
  if (currentBin.length > 0) bins.push(currentBin);
  return bins;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  META_KEYS,
  BRIEF_KEYS,
  TEMPLATE_KEYS,
  SLIDE_KEYS,
  FM_FALLBACK_KEYS,
  META_SLUGS,
  BRIEF_SLUGS,
  TEMPLATE_SLUGS,
  SLIDE_SLUGS,
  FM_SLUGS,
  loadRegistry,
  getProperties,
  TOKEN_COLORS,
  PALETTE,
  buildGenLog,
  assembleCall,
  writeCallFiles,
  writeCallFilesV2,
  reassembleCall,
  getRuntimeSize,
  getMaxBinSize,
  compactSize,
  binPack,
};
