#!/usr/bin/env node
"use strict";

/**
 * flow-to-figma.js — Reads flow-data.json, builds chrome from templates,
 * generates Figma plugin JS via the codegen library.
 *
 * Usage:
 *   node scripts/flow-to-figma.js <input.json> --target-node-id "288:7646" [--output-dir <dir>]
 *
 * Output: JSON array of { callIndex, code, description } to stdout
 *         With --output-dir: writes call-N.js files + manifest.json to <dir>
 * Logs:   "Done: N call(s), M screen(s)" to stderr
 */

const fs = require("fs");
const path = require("path");
const shared = require("./shared-constants");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_BIN_SIZE = shared.getMaxBinSize();
const OVERHEAD = 500; // per-item overhead estimate

const FONTS = [
  "Inter:Regular",
  "Inter:Medium",
  "Inter:Semi Bold",
  "Inter:Bold",
];

// Header height is fixed at 70px across all chrome types
const HEADER_HEIGHT = 70;

// ---------------------------------------------------------------------------
// REF_ALIASES
// ---------------------------------------------------------------------------

const REF_ALIASES = {
  // Meta Kit
  genLog: { registryKey: "generation-log", library: "meta" },
  researchFrame: { registryKey: "research-frame", library: "meta" },
  divider: { registryKey: "card-divider", library: "meta" },
  flowCoverCard: { registryKey: "flow-cover-card", library: "meta" },
  // FM Kit
  fmAppHeader: { registryKey: "fm-app_header", library: "fm" },
  fmButton: { registryKey: "fm-button", library: "fm" },
  fmTextInput: { registryKey: "fm-text-input-field", library: "fm" },
  fmDropdown: { registryKey: "fm-dropdown", library: "fm" },
  fmInputLabel: { registryKey: "fm-input-label", library: "fm" },
  fmSideNavBar: { registryKey: "fm-side-navigation-bar", library: "fm" },
  fmSideNavItem: { registryKey: "fm-side-navigation-item", library: "fm" },
  fmPageHeader: { registryKey: "fm-page-header", library: "fm" },
  fmTableCell: { registryKey: "fm-table-cell", library: "fm" },
  fmCheckbox: { registryKey: "fm-checkbox", library: "fm" },
  fmRadioButton: { registryKey: "fm-radio-button", library: "fm" },
  fmToggle: { registryKey: "fm-toggle", library: "fm" },
  fmSearchInput: { registryKey: "fm-search-input-field", library: "fm" },
  fmDateInput: { registryKey: "fm-date-input", library: "fm" },
  fmTextArea: { registryKey: "fm-text-area", library: "fm" },
  fmAlert: { registryKey: "fm-alert", library: "fm" },
  fmDialog: { registryKey: "fm-dialog", library: "fm" },
  fmBanner: { registryKey: "fm-banner", library: "fm" },
  fmStepper: { registryKey: "fm-stepper", library: "fm" },
  fmBadge: { registryKey: "fm-badge", library: "fm" },
  fmTag: { registryKey: "fm-tag", library: "fm" },
  fmChip: { registryKey: "fm-chip", library: "fm" },
  fmTab: { registryKey: "fm-tab", library: "fm" },
  fmTabs: { registryKey: "fm-tabs", library: "fm" },
  fmToast: { registryKey: "fm-toast", library: "fm" },
  fmEmptyState: { registryKey: "fm-empty-state", library: "fm" },
  fmPlaceholder: { registryKey: "fm-placeholder", library: "fm" },
  fmIconButtons: { registryKey: "fm-icon-buttons", library: "fm" },
  fmSpinner: { registryKey: "fm-spinner", library: "fm" },
  fmMultiSelectDropdown: {
    registryKey: "fm-multi-select-dropdown",
    library: "fm",
  },
  fmProgressBar: { registryKey: "fm-progress-bar", library: "fm" },
  fmMenuItem: { registryKey: "fm-menu-item", library: "fm" },
  fmTooltip: { registryKey: "fm-tooltip", library: "fm" },
  fmRichTextField: { registryKey: "fm-rich-text-field", library: "fm" },
  fmSlider: { registryKey: "fm-slider", library: "fm" },
};

// ---------------------------------------------------------------------------
// FALLBACK_KEYS
// ---------------------------------------------------------------------------

const FALLBACK_KEYS = {
  ...shared.META_KEYS,
  ...shared.FM_FALLBACK_KEYS,
};

// ---------------------------------------------------------------------------
// Template name resolution
// ---------------------------------------------------------------------------

// Map old-style chrome + app combo to a template name
const APP_TO_TEMPLATE = {
  Administration: "admin",
  Studio: "studio",
  Explorer: "explorer",
  Actian: "admin", // fallback for Actian brand app
};

/**
 * Resolve template name for a screen.
 * Supports new `screen.template` field and old `screen.chrome` + `meta.app`.
 */
function resolveTemplateName(screen, meta, templates) {
  // New format: explicit template field
  if (screen.template && templates[screen.template]) {
    return screen.template;
  }

  // Old format: chrome + app mapping
  const oldChrome = screen.chrome || "standard";

  if (oldChrome === "none") return "bare";
  if (oldChrome === "no-sidebar") return "no-sidebar";

  // 'standard' → look up by app
  if (oldChrome === "standard" || oldChrome === "app-header-sidebar") {
    const app = (meta && meta.app) || "";
    return APP_TO_TEMPLATE[app] || "admin";
  }

  // Fallback
  return "admin";
}

// ---------------------------------------------------------------------------
// Registry loader
// ---------------------------------------------------------------------------

function loadRegistry(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    return null;
  }
}

function buildRefMap(pluginRoot) {
  const fmReg = loadRegistry(
    path.join(pluginRoot, "docs", "fm-components-registry.json"),
  );
  const metaReg = loadRegistry(
    path.join(pluginRoot, "docs", "meta-kit", "meta-kit-registry.json"),
  );

  const refMap = {};

  for (const [refName, alias] of Object.entries(REF_ALIASES)) {
    let comp = null;
    if (alias.library === "fm" && fmReg) {
      comp = (fmReg.components || {})[alias.registryKey];
    } else if (alias.library === "meta" && metaReg) {
      comp = (metaReg.components || {})[alias.registryKey];
    }

    if (comp && comp.key) {
      const method = comp.type === "component_set" ? "set" : "single";
      refMap[refName] = { key: comp.key, method };
    } else if (FALLBACK_KEYS[refName]) {
      refMap[refName] = FALLBACK_KEYS[refName];
    }
  }

  return refMap;
}

// ---------------------------------------------------------------------------
// Chrome builders
// ---------------------------------------------------------------------------

function buildAppHeader(appHeaderVariant) {
  return {
    type: "INSTANCE",
    ref: "fmAppHeader",
    variant: appHeaderVariant,
    name: "App Header",
  };
}

function buildSidebar(activeNavItem, navItems, sidebarWidth, bodyH) {
  const count = navItems || 4;
  const children = [];

  children.push({
    type: "INSTANCE",
    ref: "fmSideNavItem",
    variant: "State=On",
    name: "Nav: " + (activeNavItem || "Home"),
    props: { Label: activeNavItem || "Home" },
  });

  for (let i = 1; i < count; i++) {
    children.push({
      type: "INSTANCE",
      ref: "fmSideNavItem",
      variant: "State=Placeholder",
      name: "Nav: Placeholder " + i,
    });
  }

  return {
    type: "FRAME",
    name: "Sidebar",
    width: sidebarWidth,
    height: bodyH,
    layout: { mode: "VERTICAL", spacing: 0, padding: [28, 16, 8, 16] },
    fills: ["#FFFFFF"],
    children: children,
  };
}

function buildPageHeader(config) {
  if (!config || !config.title) return null;

  let variant;
  if (config.variant) {
    variant = "Type=" + config.variant;
  } else if (config.actions && config.actions.length > 0) {
    variant = "Type=Title + Actions";
  } else if (config.subtitle) {
    variant = "Type=Title + Subtitle";
  } else {
    variant = "Type=Title only";
  }

  const props = { Title: config.title };
  if (config.subtitle) props.Subtitle = config.subtitle;

  return {
    type: "INSTANCE",
    ref: "fmPageHeader",
    variant: variant,
    name: "Page Header",
    props: props,
  };
}

/**
 * Build a screen frame from a screen definition and its resolved template.
 */
function buildScreen(screenDef, templateDef) {
  const chrome = templateDef.chrome;
  const screenW = templateDef.width || screenDef.width || 1440;
  const screenH = templateDef.height || screenDef.height || 960;

  // chrome: "none" — full screen, content is direct children
  if (chrome === "none") {
    return {
      type: "FRAME",
      name: screenDef.name,
      width: screenW,
      height: screenH,
      fills: ["#FFFFFF"],
      clipsContent: true,
      layout: { mode: "VERTICAL", spacing: 0 },
      children: screenDef.content || [],
    };
  }

  const bodyH = screenH - HEADER_HEIGHT;
  const sidebarWidth = templateDef.sidebarWidth || 260;
  const contentW =
    chrome === "app-header-sidebar" ? screenW - sidebarWidth : screenW;
  const contentPadding = templateDef.contentPadding || [24, 32, 24, 32];
  const contentFill = templateDef.contentFill || "#F5F5FA";
  const appHeaderVariant = templateDef.appHeaderVariant || "Type=Admin";
  const contentSpacing =
    screenDef.contentSpacing != null ? screenDef.contentSpacing : 16;

  // Build Content Area children
  const contentChildren = [];
  const ph = buildPageHeader(screenDef.pageHeader);
  if (ph) contentChildren.push(ph);
  if (screenDef.content)
    contentChildren.push.apply(contentChildren, screenDef.content);

  const contentArea = {
    type: "FRAME",
    name: "Content Area",
    width: contentW,
    height: bodyH,
    layout: {
      mode: "VERTICAL",
      spacing: contentSpacing,
      padding: contentPadding,
    },
    fills: [contentFill],
    sizing: { horizontal: "FILL", vertical: "FILL" },
    children: contentChildren,
  };

  // Build Body children
  const bodyChildren = [];
  if (chrome === "app-header-sidebar") {
    bodyChildren.push(
      buildSidebar(
        screenDef.activeNavItem,
        screenDef.navItems,
        sidebarWidth,
        bodyH,
      ),
    );
  }
  bodyChildren.push(contentArea);

  const body = {
    type: "FRAME",
    name: "Body",
    width: screenW,
    height: bodyH,
    layout: { mode: "HORIZONTAL", spacing: 0 },
    fills: [],
    sizing: { horizontal: "FILL", vertical: "FILL" },
    children: bodyChildren,
  };

  return {
    type: "FRAME",
    name: screenDef.name,
    width: screenW,
    height: screenH,
    fills: ["#FFFFFF"],
    clipsContent: true,
    layout: { mode: "VERTICAL", spacing: 0 },
    children: [buildAppHeader(appHeaderVariant), body],
  };
}

// ---------------------------------------------------------------------------
// Meta builders
// ---------------------------------------------------------------------------

function buildGenLog(meta) {
  return shared.buildGenLog(meta, { skillName: "generate-flow" });
}

function buildCoverCard(meta) {
  return {
    type: "INSTANCE",
    ref: "flowCoverCard",
    name: "Cover: " + (meta.feature || "Flow"),
    props: {
      Feature: meta.feature || "",
      Flow: meta.flow || "",
      User: meta.user || "",
    },
  };
}

function buildResearchCard(meta) {
  var research = meta.research;
  var title = research.title || "UX Research";
  var source = research.source || "";

  var bodyParts = [];
  if (research.competitors)
    bodyParts.push("How others handle this:\n" + research.competitors);
  if (research.patterns)
    bodyParts.push("Key patterns adopted:\n" + research.patterns);
  if (research.recommendation)
    bodyParts.push("Recommendation:\n" + research.recommendation);
  if (research.sources) bodyParts.push("Sources:\n" + research.sources);

  var children = [];
  if (bodyParts.length > 0) {
    children.push({
      type: "TEXT",
      name: "Research body",
      text: bodyParts.join("\n\n"),
      style: {
        fontSize: 13,
        fontFamily: "Inter",
        fontWeight: "Regular",
        lineHeight: 20,
      },
      fills: ["#475467"], // --fm-text-tertiary
      sizing: { horizontal: "FILL" },
    });
  }

  return {
    type: "INSTANCE",
    ref: "researchFrame",
    name: "Research: " + title,
    props: {
      Title: title,
      Source: source,
    },
    children: children,
  };
}

// ---------------------------------------------------------------------------
// Import resolver
// ---------------------------------------------------------------------------

/** Walk a tree of nodes and collect all ref values + DIVIDER markers. */
function scanRefs(nodes, refs) {
  if (!refs) refs = new Set();
  if (!Array.isArray(nodes)) return refs;
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (!node) continue;
    if (node.ref) refs.add(node.ref);
    if (node.type === "DIVIDER") refs.add("divider");
    if (node.children) scanRefs(node.children, refs);
  }
  return refs;
}

function resolveImports(refs, refMap) {
  const imports = {};

  for (const ref of refs) {
    if (refMap[ref]) {
      imports[ref] = refMap[ref];
    } else if (FALLBACK_KEYS[ref]) {
      imports[ref] = FALLBACK_KEYS[ref];
      process.stderr.write(
        'Warning: ref "' + ref + '" not in registry, using fallback key\n',
      );
    } else {
      process.stderr.write(
        'Warning: unknown ref "' + ref + '" — no import key found\n',
      );
    }
  }

  return imports;
}

// ---------------------------------------------------------------------------
// Build description for a call
// ---------------------------------------------------------------------------

function buildDescription(callIdx, totalCalls, items) {
  const parts = ["Call " + callIdx + "/" + totalCalls + ":"];
  for (const item of items) {
    parts.push(item.name || item.type || "item");
  }
  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

function validateInput(input, pluginRoot) {
  const warnings = [];

  // Reject contentHtml — must use content[] nodes
  for (const screen of input.screens || []) {
    if (screen.contentHtml) {
      warnings.push(
        'Screen "' +
          (screen.name || "?") +
          '" uses contentHtml — use content[] nodes instead',
      );
    }
  }

  // Check for missing boolean properties on button instances
  let registry = null;
  try {
    const regPath = path.join(
      pluginRoot,
      "docs",
      "fm-components-registry.json",
    );
    registry = JSON.parse(fs.readFileSync(regPath, "utf8"));
  } catch (e) {
    /* registry not available — skip boolean checks */
  }

  if (registry && registry.components) {
    const walkNodes = function (nodes) {
      for (const node of nodes || []) {
        if (node.type === "INSTANCE" && node.componentKey) {
          const comp = registry.components[node.componentKey];
          if (comp && comp.booleanProperties) {
            for (const propName of Object.keys(comp.booleanProperties)) {
              if (!node.overrides || !(propName in node.overrides)) {
                warnings.push(
                  'Screen instance "' +
                    (node.componentKey || "?") +
                    '" missing boolean prop "' +
                    propName +
                    '" (defaults to ' +
                    comp.booleanProperties[propName].default +
                    ")",
                );
              }
            }
          }
        }
        if (node.children) walkNodes(node.children);
      }
    };

    for (const screen of input.screens || []) {
      walkNodes(screen.content);
    }
  }

  // Check required meta fields
  if (!input.meta) {
    warnings.push("Missing meta object");
  } else {
    if (!input.meta.feature) warnings.push("meta.feature is missing");
    if (!input.meta.skill) warnings.push("meta.skill is missing");
  }

  return warnings;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  let inputPath = null;
  let targetNodeId = null;
  let outputDir = null;
  let pluginRoot = path.resolve(__dirname, "..");
  var callFilter = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--target-node-id" && args[i + 1]) {
      targetNodeId = args[++i];
    } else if (args[i] === "--output-dir" && args[i + 1]) {
      outputDir = args[++i];
    } else if (args[i] === "--plugin-root" && args[i + 1]) {
      pluginRoot = args[++i];
    } else if (args[i] === "--call" && i + 1 < args.length) {
      callFilter = parseInt(args[++i], 10);
    } else if (args[i] === "--fill" && args[i + 1]) {
      callFilter = parseInt(args[++i], 10);
    } else if (!inputPath) {
      inputPath = args[i];
    }
  }

  if (args.indexOf("--help") !== -1) {
    var helpMeta = {
      name: "flow-to-figma",
      description:
        "Reads flow-data.json, generates Figma Plugin API JavaScript.",
      flags: [
        {
          name: "--target-node-id",
          required: false,
          description: "Figma node ID to append output to",
        },
        {
          name: "--output-dir",
          required: false,
          description: "Directory to write call-N.js + manifest.json",
        },
        {
          name: "--plugin-root",
          required: false,
          description: "Override plugin root path",
        },
        {
          name: "--call",
          required: false,
          description: "Only write the specified call file (1-based index)",
        },
      ],
      templates: Object.keys(
        JSON.parse(
          fs.readFileSync(path.join(__dirname, "templates.json"), "utf8"),
        )["flow-templates"],
      ),
    };
    process.stdout.write(JSON.stringify(helpMeta, null, 2) + "\n");
    process.exit(0);
  }

  if (!inputPath) {
    process.stderr.write(
      'Usage: node flow-to-figma.js <input.json> --target-node-id "288:7646" [--output-dir <dir>]\n',
    );
    process.exit(1);
  }

  // Read input
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
    var flowSchema = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "..", "schemas", "flow-data.schema.json"),
        "utf8",
      ),
    );
    var schemaErrors = schemaValidator(input, flowSchema);
    for (var i = 0; i < schemaErrors.length; i++) {
      process.stderr.write("SCHEMA: " + schemaErrors[i] + "\n");
    }
  } catch (e) {
    /* schema files not available — skip */
  }

  // Validate input
  const warnings = validateInput(input, pluginRoot);
  for (const w of warnings) {
    process.stderr.write("WARNING: " + w + "\n");
  }

  // Override targetNodeId from CLI
  if (targetNodeId) {
    if (!input.meta) input.meta = {};
    input.meta.targetNodeId = targetNodeId;
  }

  const meta = input.meta || {};

  // Load templates
  const templatesPath = path.join(__dirname, "templates.json");
  let templatesData;
  try {
    templatesData = JSON.parse(fs.readFileSync(templatesPath, "utf8"));
  } catch (e) {
    process.stderr.write(
      "Error: could not load templates.json: " + e.message + "\n",
    );
    process.exit(1);
  }
  const templates = templatesData["flow-templates"];

  // Load registries
  const refMap = buildRefMap(pluginRoot);

  // Build all items: genLog + researchCard (if present) + coverCard + screens
  const allItems = [];
  const itemIds = [];
  allItems.push(buildGenLog(meta));
  itemIds.push("genLog");
  if (meta.research) {
    allItems.push(buildResearchCard(meta));
    itemIds.push("researchCard");
  }
  allItems.push(buildCoverCard(meta));
  itemIds.push("coverCard");

  let screenIdx = 0;
  for (const screen of input.screens || []) {
    const templateName = resolveTemplateName(screen, meta, templates);
    const templateDef = templates[templateName] || templates["admin"];
    allItems.push(buildScreen(screen, templateDef));
    itemIds.push("screen_" + screenIdx);
    screenIdx++;
  }

  // Bin-pack
  const bins = shared.binPack(allItems, MAX_BIN_SIZE, OVERHEAD);
  const totalCalls = bins.length;

  // Build unitMap: which call contains each item
  const unitMap = {};
  let itemIdx = 0;
  for (let b = 0; b < bins.length; b++) {
    const callIdx = b + 1;
    for (let i = 0; i < bins[b].length; i++) {
      unitMap[itemIds[itemIdx]] = callIdx;
      itemIdx++;
    }
  }

  // Build section keys from bin contents
  const sectionKeys = bins.map(function (bin, idx) {
    return "__section_flow_" + idx;
  });

  // Scaffold spec: wrapper + empty section frames
  const scaffoldSpec = {
    meta: {
      skill: "generate-flow",
      targetNodeId: meta.targetNodeId || "__TARGET_NODE_ID__",
      wrapperName: "generate-flow: " + (meta.feature || "Flow"),
      sectionName: "generate-flow: " + (meta.feature || "Flow"),
    },
    fonts: ["Inter:Regular"],
    imports: {},
    tree: sectionKeys.map(function (key) {
      return {
        type: "FRAME",
        name: key,
        layout: {
          mode: "HORIZONTAL",
          spacing: 32,
          primarySizing: "AUTO",
          counterSizing: "AUTO",
        },
        fills: [],
      };
    }),
  };

  // Fill specs
  const fills = [];
  for (let b = 0; b < bins.length; b++) {
    const bin = bins[b];
    const fillIdx = b + 1;

    const refs = scanRefs(bin);
    const imports = resolveImports(refs, refMap);

    const fillSpec = {
      meta: {
        skill: "generate-flow",
        fillSection: sectionKeys[b],
      },
      fonts: FONTS,
      imports: imports,
      tree: bin,
    };

    process.stderr.write(
      "Fill " +
        fillIdx +
        ": " +
        bin.length +
        " items (tree=" +
        shared.compactSize(bin) +
        " bytes)\n",
    );

    fills.push({
      fillIndex: fillIdx,
      spec: fillSpec,
      sectionKey: sectionKeys[b],
      description: buildDescription(fillIdx, bins.length, bin),
    });
  }

  // Validate --call/--fill filter
  if (callFilter && (callFilter < 1 || callFilter > fills.length)) {
    process.stderr.write(
      "Error: --call " +
        callFilter +
        " but only " +
        fills.length +
        " fills generated\n",
    );
    process.exit(1);
  }

  // Output
  if (outputDir) {
    shared.writeCallFilesV2(
      outputDir,
      scaffoldSpec,
      fills,
      unitMap,
      callFilter,
    );
    process.stderr.write(
      "Wrote " + (1 + fills.length) + " call file(s) to " + outputDir + "\n",
    );
  } else {
    // Legacy: JSON array to stdout
    const results = [];
    results.push({
      callIndex: 0,
      code: shared.assembleCall(scaffoldSpec),
      description: "Scaffold: wrapper + sections",
    });
    for (const f of fills) {
      results.push({
        callIndex: f.fillIndex,
        code: shared.assembleCall(f.spec),
        description: f.description,
      });
    }
    process.stdout.write(JSON.stringify(results, null, 2) + "\n");
  }

  process.stderr.write(
    "Done: 1 scaffold + " +
      fills.length +
      " fill(s), " +
      (input.screens || []).length +
      " screen(s)\n",
  );
}

main();
