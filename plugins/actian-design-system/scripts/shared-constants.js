"use strict";

/**
 * shared-constants.js — Single source of truth for constants used across codegen scripts.
 *
 * Imported by flow-to-figma.js, brief-to-figma.js, and slide-to-figma.js.
 * Change a component key HERE, not in 3 places.
 */

// ---------------------------------------------------------------------------
// Meta Kit component keys (shared across skills)
// ---------------------------------------------------------------------------

const META_KEYS = {
  genLog: { key: "a9653f30925367e96dea90093d750bfe70849571", method: "single" },
  divider: {
    key: "f4d778e1cf9bb61a33712c791486f54bb1c095b7",
    method: "single",
  },
  codeBlock: {
    key: "1bf10eee1751a46da5f90a9671be6c9abf0073b7",
    method: "single",
  },
  flowCoverCard: {
    key: "eaebde6bd07d2f19f3f9c00a9587240cb085a90d",
    method: "single",
  },
  researchFrame: {
    key: "e671618f2b4c6ea406a995fdc3012ac54eadfe56",
    method: "single",
  },
  feedback: { key: "d5cba21bc3dbf36578665bac89834fbe1ca29ed0", method: "set" },
  flowScreen: {
    key: "2ca7c756ad54e81219104d3a270ba8eb9eeffcf6",
    method: "set",
  },
};

// ---------------------------------------------------------------------------
// Brief-specific Meta Kit keys
// ---------------------------------------------------------------------------

const BRIEF_KEYS = {
  briefCard: { key: "3dbb732730af0754210cde7af35e5236a2502843", method: "set" },
  doDontPair: {
    key: "28edfacf13e50706586172bd48f8a3ad84d7c263",
    method: "set",
  },
  contrastBadge: {
    key: "941756541adc6ce21e32e848c2039c64fece0fcf",
    method: "set",
  },
  pointerBadge: {
    key: "7e066fc21d9a2bbbcd1149113787cf59140162d4",
    method: "set",
  },
  dimAnnotation: {
    key: "49bf6a1b210a403ba145a3fdee9b1994eb54069a",
    method: "set",
  },
  a11yCard: { key: "b4779a13f4097d682413a669eaaf9ead1b49f115", method: "set" },
  colorSwatch: {
    key: "da3369932f710386b76ca91a40ebd48d94e3f2e0",
    method: "set",
  },
  themeCard: {
    key: "9081a7761dfbe11d576182f3cb1711b9e76c2d36",
    method: "set",
  },
  statCard: {
    key: "8662c721d74d6f0079f273f76eec374b12ec2fae",
    method: "set",
  },
};

// ---------------------------------------------------------------------------
// Template keys (clone → detach → fill textSlots)
// ---------------------------------------------------------------------------

const TEMPLATE_KEYS = {
  tableHeaderRow: {
    key: "0754accfc4bc79ce9a68ff8fe7a108f1b41b9b2e",
    method: "single",
  },
  tableDataRow: {
    key: "3a1fae22dd85936f81565122888efd8a50e37180",
    method: "single",
  },
  stateColumn: {
    key: "4f782d1a8541b4474858767209f99dce1428784b",
    method: "single",
  },
  sectionHeader: {
    key: "f4fd576001f4f1f4606a4efb051d1e4492e378c4",
    method: "single",
  },
  swatchRow: {
    key: "96647364b6cb5c55b7ced72106708daaa33afb7f",
    method: "single",
  },
  a11ySpecRow: {
    key: "92ed7bc88cf229782c4b42238aacba1d15f8fd06",
    method: "single",
  },
};

// ---------------------------------------------------------------------------
// Slide-specific Meta Kit keys
// ---------------------------------------------------------------------------

const SLIDE_KEYS = {
  slideCover: {
    key: "a12f6f0b26fffc59fdac49df2bc3c36182c912da",
    method: "single",
  },
  slideBodyFull: {
    key: "281e7a9bc55abe69bb2364e639f7511b4a005694",
    method: "single",
  },
  slideBodyTV: {
    key: "28ea7a37752149d78679847ec7893368a4c4f1a0",
    method: "single",
  },
  slideSection: {
    key: "348efaa22a6da818c435017399a357b47257bcdc",
    method: "single",
  },
  slideBack: {
    key: "6df533ae800a6596fd84e93a2e5fc725dbd6a369",
    method: "single",
  },
};

// ---------------------------------------------------------------------------
// FM Kit fallback keys (used when registry lookup fails)
// ---------------------------------------------------------------------------

const FM_FALLBACK_KEYS = {
  fmAppHeader: {
    key: "8fc9bcee610c7f8d22ebcc268467993f6dc99c87",
    method: "set",
  },
  fmSideNavItem: {
    key: "d18a0a772ed4acd760c497cb93de796ff052a7b4",
    method: "set",
  },
  fmPageHeader: {
    key: "ae1f8684a4a89aa74463d439e4e8c1e7a48137fe",
    method: "set",
  },
  fmButton: { key: "368b62312ca941c80ea8eeed84a57d33bb470b09", method: "set" },
  fmTableCell: {
    key: "9267fecfadc4577563deb1425fa598d1f5af9144",
    method: "set",
  },
  fmTextInput: {
    key: "355855c7b2e05b5b336167883b3c9ebbfbd881ad",
    method: "set",
  },
  fmDropdown: {
    key: "781f86dca2a37706771f3e2e580242d2693a722f",
    method: "set",
  },
  fmInputLabel: {
    key: "a39aa1c7cb593f7d26b7659e4cbe4e419e00c766",
    method: "set",
  },
  fmSearchInput: {
    key: "443e232d5454f06dbd5bc06c2cacf21e80a20e4a",
    method: "set",
  },
  fmTag: { key: "c7239d9355ddf557f36f4d159153619672ab81ef", method: "set" },
  fmChip: { key: "0861d937682e66d39f57fe52ca83d526e634ff66", method: "set" },
  fmTab: { key: "cfbd732ff4f4e6620b333c60f1ac7fe5116a93aa", method: "set" },
  fmPlaceholder: {
    key: "e49a9de0573cf527736e8173f722f230fa957fb8",
    method: "set",
  },
  fmEmptyState: {
    key: "cf44b9c0b5623a394d90f320f98250dc77378268",
    method: "set",
  },
  fmAlert: { key: "fe30f37740688350762bd2b1be426d9d1588b7d9", method: "set" },
  fmBanner: {
    key: "d7f323e492b456a2c56f81f3dc892eb24de11a6e",
    method: "single",
  },
  fmToggle: { key: "fe9e82118d1df75a8aea732eb7f9169ccaa21878", method: "set" },
  fmCheckbox: {
    key: "965cf2c85659bbde891f6f086bbd02d50d445d58",
    method: "set",
  },
  fmDialog: {
    key: "0cc53eca9c90cccb8cbc57864ea110378414fd2b",
    method: "single",
  },
  fmTextArea: {
    key: "bba14eea66edb3871ea389afeb4e1a07585e5733",
    method: "set",
  },
  fmBadge: { key: "2410b87c83d33d3bcb2a6ac7aa2168a53a4eb3d8", method: "set" },
  fmStepper: { key: "d0a21b5288571cc7690c6c9289d18cd298035c53", method: "set" },
  fmToast: { key: "6140b137ce98ebfeeb7fc7e426f6d09de1cc18d0", method: "set" },
  fmIconButtons: {
    key: "f868aabb0aa2c52f00610c09da8dce3bccc79dc4",
    method: "set",
  },
  fmSpinner: {
    key: "52927648847b15a51d314cf06ca1c0f19f398b4d",
    method: "single",
  },
  fmRadioButton: {
    key: "1569353eb82fd5f6cb8da979f1048cd1b323e8c4",
    method: "set",
  },
  fmDateInput: {
    key: "69d6329ea2d5ac3515b6ebb04ad6c1bd72e4890e",
    method: "set",
  },
  fmProgressBar: {
    key: "12abe66d36a63ef385a17e2553a1312560a0f106",
    method: "set",
  },
  fmMultiSelectDropdown: {
    key: "876bfa32334594915085ebea82f1f887b3fecb09",
    method: "set",
  },
  fmTabs: { key: "860eadef9ba29cf20a3da3ca9d014718e3f6cabb", method: "single" },
};

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

const fs = require("fs");
const path = require("path");

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
  TOKEN_COLORS,
  PALETTE,
  buildGenLog,
  assembleCall,
  writeCallFiles,
  reassembleCall,
  compactSize,
  binPack,
};
