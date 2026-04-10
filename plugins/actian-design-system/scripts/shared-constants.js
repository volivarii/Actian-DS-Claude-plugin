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

// DS ref names follow pattern ds + PascalCase(slug). Only slugs used in fm-to-ds-map.json.
const DS_SLUGS = {
  dsButton: "button",
  dsInput: "input",
  dsDropdownSelectDefault: "dropdown-select-default",
  dsCheckboxWithLabel: "checkbox-with-label",
  dsRadioButtonRadioButton: "radio-button-radio-button",
  dsToggle: "toggle",
  dsGlobalHeader: "global-header",
  dsSideNav: "side-nav",
  dsNavItem: "nav-item",
  dsPageHeader: "page-header",
  dsSearch: "search",
  dsInputDate: "input-date",
  dsAlertBanner: "alert-banner",
  dsNotification: "notification",
  dsBadge: "badge",
  dsTagInteractive: "tag-interactive",
  dsTagDefault: "tag-default",
  dsTab: "tab",
  dsStepper: "stepper",
  dsEmptyState: "empty-state",
  dsProgressBarSmall: "progress-bar-small",
  dsTooltip: "tooltip",
  dsRichText: "rich-text",
  dsMenuItem: "menu-item",
  dsTableCell: "table-cell",
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
const DS_KEYS = buildKeyMap("dskit", DS_SLUGS);

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
  FM_FALLBACK_KEYS,
  DS_KEYS,
  META_SLUGS,
  BRIEF_SLUGS,
  TEMPLATE_SLUGS,
  SLIDE_SLUGS,
  FM_SLUGS,
  DS_SLUGS,
  loadRegistry,
  getProperties,
  TOKEN_COLORS,
  PALETTE,
  buildGenLog,
  compactSize,
};
