"use strict";

/**
 * shared-constants.js — Single source of truth for constants used across codegen scripts.
 *
 * Imported by flow-to-figma.js, brief-to-figma.js, and slide-to-figma.js.
 * Component keys and methods are read from registry JSON files
 * (vendor/components/registries/*.json — vendored from actian-ds-knowledge).
 * Only the ref-name → slug mapping is maintained here.
 */

const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Registry loader — reads JSON registries from vendor/components/registries/
// (Federation Phase 1.4b: vendored from volivarii/actian-ds-knowledge.
// See vendored.json for the pinned SHA. Run scripts/vendor/vendor-snapshot.js
// or trigger the vendor-snapshot.yml workflow to refresh.)
// ---------------------------------------------------------------------------

const _registryCache = {};
function loadRegistry(name) {
  if (!_registryCache[name]) {
    const filePath = path.join(
      __dirname,
      "..",
      "..",
      "vendor",
      "components",
      "registries",
      name + ".json",
    );
    _registryCache[name] = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }
  return _registryCache[name];
}

// ---------------------------------------------------------------------------
// Reverse key index — { key: slug } per kit, lazily built and cached
// ---------------------------------------------------------------------------

const _keyIndexCache = { ds: null, fm: null, meta: null };

function _kitToRegistry(kit) {
  if (kit === "ds") return "dskit";
  if (kit === "fm") return "fmkit";
  if (kit === "meta") return "metakit";
  throw new Error(
    'slugFromKey: unknown kit "' + kit + '" (expected "ds", "fm", or "meta")',
  );
}

/**
 * Resolve a Figma component key to its current registry slug.
 * Returns null for unknown keys or empty input.
 *
 * @param {string} key - Figma component_set or component key
 * @param {string} kit - "ds" | "fm" | "meta"
 * @returns {string|null}
 */
function slugFromKey(key, kit) {
  if (!key) return null;
  if (!_keyIndexCache[kit]) {
    var registry = loadRegistry(_kitToRegistry(kit));
    var index = {};
    var components = registry.components || {};
    var slugs = Object.keys(components);
    for (var i = 0; i < slugs.length; i++) {
      var entry = components[slugs[i]];
      if (entry && entry.key) {
        index[entry.key] = slugs[i];
      }
    }
    _keyIndexCache[kit] = index;
  }
  return _keyIndexCache[kit][key] || null;
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
 * @param {object|string} slugMapOrRefName - slug map (old) or ref name string (new)
 * @param {string} refNameOrPrefix - ref name (old) or prefix (new)
 * @returns {object|null} Properties object with hash-suffixed names
 */
function getProperties(registryName, slugMapOrRefName, refNameOrPrefix) {
  // New signature: getProperties("fmkit", "fmButton", "fm")
  // Old signature: getProperties("fmkit", slugMapObj, "fmButton")
  var slug, registry;
  if (typeof slugMapOrRefName === "string") {
    // New calling convention: derive slug from ref name
    registry = loadRegistry(registryName);
    var prefix = refNameOrPrefix || registryName.replace("kit", "");
    for (var s of Object.keys(registry.components)) {
      var ref = slugToRef(s, prefix);
      if (ref === slugMapOrRefName) {
        return registry.components[s].properties || {};
      }
    }
    return null;
  }
  // Old calling convention: use slug map
  slug = slugMapOrRefName[refNameOrPrefix];
  if (!slug) return null;
  registry = loadRegistry(registryName);
  var entry = registry.components[slug];
  return entry ? entry.properties || {} : null;
}

/**
 * Derive ref name from registry slug + prefix.
 * "fm-button" with prefix "fm" → "fmButton"
 * "button" with prefix "ds" → "dsButton"
 * "fm-text-input" with prefix "fm" → "fmTextInput"
 */
function slugToRef(slug, prefix) {
  var stripped = slug.startsWith(prefix + "-")
    ? slug.slice(prefix.length + 1)
    : slug;
  return (
    prefix +
    stripped.charAt(0).toUpperCase() +
    stripped.slice(1).replace(/-([a-z])/g, function (_, c) {
      return c.toUpperCase();
    })
  );
}

/**
 * Build { refName: slug } map from a registry, deriving ref names from slugs.
 */
function buildSlugMap(registryName, prefix, section, overrides) {
  var registry = loadRegistry(registryName);
  var store = registry[section || "components"];
  var result = {};
  for (var slug of Object.keys(store)) {
    var ref = (overrides && overrides[slug]) || slugToRef(slug, prefix);
    result[ref] = slug;
  }
  return result;
}

/**
 * Build { refName: { key, method } } map from a registry, deriving ref names from slugs.
 */
function buildKeyMapFromRegistry(registryName, prefix, section, overrides) {
  var registry = loadRegistry(registryName);
  var store = registry[section || "components"];
  var result = {};
  for (var slug of Object.keys(store)) {
    var entry = store[slug];
    var ref = (overrides && overrides[slug]) || slugToRef(slug, prefix);
    result[ref] = {
      key: entry.key,
      method: entry.importMethod === "set" ? "set" : "single",
    };
  }
  return result;
}

// ---------------------------------------------------------------------------
// Ref-name → registry-slug mappings (only source of duplication)
// ---------------------------------------------------------------------------

// Slug values match the canonical keys in docs/generated/metakit.json. The REST sync
// orchestrator (Sprint 1) normalizes Figma component names through a single
// slugify pass that collapses runs of non-alphanumeric chars to "-", which
// dropped the legacy "meta-/-X-/-Y" form on 2026-04-30. Keep this table in
// step with metakit.json — adding a slug here that doesn't exist there will
// cause buildKeyMap to silently drop the entry.
const META_SLUGS = {
  genLog: "meta-chrome-generation-log",
  divider: "meta-utility-card-divider",
  codeBlock: "meta-content-code-block",
  flowCoverCard: "meta-chrome-flow-cover-card",
  researchFrame: "meta-content-research-frame",
  feedback: "meta-chrome-feedback",
  flowScreen: "meta-chrome-flow-screen",
};

const BRIEF_SLUGS = {
  briefCard: "meta-chrome-brief-card",
  doDontPair: "meta-content-do-don-t-pair",
  contrastBadge: "meta-content-contrast-badge",
  pointerBadge: "meta-content-pointer-badge",
  dimAnnotation: "meta-content-dimension-annotation",
  a11yCard: "meta-chrome-accessibility-card",
  colorSwatch: "meta-content-color-swatch",
  themeCard: "meta-chrome-theme-card",
  statCard: "meta-content-stat-card",
};

const TEMPLATE_SLUGS = {
  sectionHeader: "section-header",
  swatchRow: "swatch-row",
  a11ySpecRow: "a11y-spec-row",
};

const SLIDE_SLUGS = {
  slideCover: "meta-slide-cover",
  slideBodyFull: "meta-slide-body-full",
  slideBodyTV: "meta-slide-body-text-visual",
  slideSection: "meta-slide-section",
  slideBack: "meta-slide-back-cover",
};

const FM_SLUGS = buildSlugMap("fmkit", "fm");
const DS_SLUGS = buildSlugMap("dskit", "ds");

// ---------------------------------------------------------------------------
// Build key maps from registries (computed at module load)
// ---------------------------------------------------------------------------

const META_KEYS = buildKeyMap("metakit", META_SLUGS);
const BRIEF_KEYS = buildKeyMap("metakit", BRIEF_SLUGS);
const TEMPLATE_KEYS = buildKeyMap("metakit", TEMPLATE_SLUGS, "templates");
const SLIDE_KEYS = buildKeyMap("metakit", SLIDE_SLUGS);
const FM_KEYS = buildKeyMapFromRegistry("fmkit", "fm");
const DS_KEYS = buildKeyMapFromRegistry("dskit", "ds");

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

/**
 * Map a tier enum value to a short label.
 * @param {string} tier - "recognized" | "adapted" | "improvised" | undefined
 * @returns {string} "tier 1" | "tier 2" | "tier 3" | "tier ?"
 */
function tierShort(tier) {
  if (tier === "recognized") return "tier 1";
  if (tier === "adapted") return "tier 2";
  if (tier === "improvised") return "tier 3";
  return "tier ?";
}

/**
 * Build a TEXT node spec rolling up per-screen tier metadata.
 * Pushed alongside (after) the GenLog instance when any screen has a tier.
 *
 * @param {Array<object>} screens - screen objects with optional { tier, confidence, matchedRecipe, composition, justification }
 * @returns {object|null} TEXT node spec, or null if no screen has a tier
 */
function buildTierSummary(screens) {
  if (!Array.isArray(screens) || screens.length === 0) return null;
  var tiered = screens.filter(function (s) {
    return !!s.tier;
  });
  if (tiered.length === 0) return null;

  var counts = { recognized: 0, adapted: 0, improvised: 0 };
  for (var i = 0; i < tiered.length; i++) {
    var t = tiered[i].tier;
    if (counts[t] != null) counts[t]++;
  }

  var lines = [];
  lines.push(
    "Tiers: " +
      counts.recognized +
      " recognized, " +
      counts.adapted +
      " adapted, " +
      counts.improvised +
      " improvised",
  );
  lines.push("");

  for (var j = 0; j < screens.length; j++) {
    var s = screens[j];
    if (!s.tier) continue;
    var label = tierShort(s.tier);
    var recipeOrCustom;
    if (s.matchedRecipe) {
      recipeOrCustom = s.matchedRecipe;
    } else if (s.composition && s.composition.length) {
      recipeOrCustom = s.composition.join("+");
    } else {
      recipeOrCustom = "custom layout";
    }
    var conf = typeof s.confidence === "number" ? s.confidence.toFixed(2) : "—";
    lines.push(
      "  " + s.name + " — " + label + " — " + recipeOrCustom + " — " + conf,
    );
  }

  // Justifications for tier-3 AND tier-2-deviation (matchedRecipe set, composition null)
  var needsJustification = screens.filter(function (s) {
    if (s.tier === "improvised") return true;
    if (s.tier === "adapted" && s.matchedRecipe && !s.composition) return true;
    return false;
  });
  if (needsJustification.length > 0) {
    lines.push("");
    lines.push("Justifications:");
    for (var k = 0; k < needsJustification.length; k++) {
      var nj = needsJustification[k];
      lines.push("  " + nj.name + ": " + (nj.justification || ""));
    }
  }

  return {
    type: "TEXT",
    name: "Tier Summary",
    text: lines.join("\n"),
    sizing: { horizontal: "HUG", vertical: "HUG" },
  };
}

/** Return byte size of compact JSON representation. */
function compactSize(obj) {
  return Buffer.byteLength(JSON.stringify(obj), "utf8");
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  META_KEYS,
  BRIEF_KEYS,
  TEMPLATE_KEYS,
  SLIDE_KEYS,
  FM_KEYS,
  DS_KEYS,
  META_SLUGS,
  BRIEF_SLUGS,
  TEMPLATE_SLUGS,
  SLIDE_SLUGS,
  FM_SLUGS,
  DS_SLUGS,
  loadRegistry,
  getProperties,
  slugToRef,
  slugFromKey,
  buildSlugMap,
  buildKeyMapFromRegistry,
  TOKEN_COLORS,
  PALETTE,
  buildGenLog,
  tierShort,
  buildTierSummary,
  compactSize,
  deriveScreenId: require("./screen-id.js").deriveScreenId,
  stampScreenIds: require("./screen-id.js").stampScreenIds,
};
