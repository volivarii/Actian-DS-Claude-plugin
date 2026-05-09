#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "../..");
var rules = require(path.join(__dirname, "component-property-rules.js"));
var resolver = require(path.join(__dirname, "..", "lib", "intent-resolver.js"));

// ---------------------------------------------------------------------------
// Pass 1: registry helpers + INSTANCE-node walker
// ---------------------------------------------------------------------------

function loadKitRegistry(kit) {
  var fileName =
    kit === "fm" ? "fmkit.json" : kit === "ds" ? "dskit.json" : "metakit.json";
  var registryPath = path.join(
    __dirname,
    "..",
    "..",
    "docs",
    "generated",
    fileName,
  );
  try {
    return JSON.parse(fs.readFileSync(registryPath, "utf8"));
  } catch (e) {
    return { components: {} };
  }
}

// Stub-aware validation helpers (v1.64.0+).
// Lookup component-guideline JSON by slug; cache per-process to avoid
// repeated disk reads on flows that use the same component many times.
var _guidelineCache = {};
function _kebab(s) {
  if (typeof s !== "string") return s;
  return s.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}
function loadGuidelineForSlug(refOrSlug, opts) {
  if (opts && typeof opts.loadGuideline === "function") {
    // Test injection — bypass cache + disk
    return opts.loadGuideline(refOrSlug);
  }
  var slug = _kebab(refOrSlug);
  if (Object.prototype.hasOwnProperty.call(_guidelineCache, slug)) {
    return _guidelineCache[slug];
  }
  var p = path.join(
    PLUGIN_ROOT,
    "docs",
    "component-guidelines",
    slug + ".json",
  );
  var data = null;
  try {
    data = JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    data = null;
  }
  _guidelineCache[slug] = data;
  return data;
}

var _registryCache = null;
function getCombinedRegistry() {
  if (_registryCache) return _registryCache;
  var fm = loadKitRegistry("fm").components || {};
  var ds = loadKitRegistry("ds").components || {};
  // Build slug → componentDef lookup. flow-data.json uses camelCase refs
  // ('fmButton', 'fmPageHeader'); registry slugs are kebab-case
  // ('fm-button', 'fm-page-header'). Index both forms.
  var combined = {};
  function indexKit(kit) {
    var slugs = Object.keys(kit);
    for (var i = 0; i < slugs.length; i++) {
      combined[slugs[i]] = kit[slugs[i]]; // kebab-case
      // camelCase form: 'fm-button' → 'fmButton'
      var camel = slugs[i].replace(/-([a-z])/g, function (_, c) {
        return c.toUpperCase();
      });
      combined[camel] = kit[slugs[i]];
    }
  }
  indexKit(fm);
  indexKit(ds);
  _registryCache = combined;
  return _registryCache;
}

function walkInstanceNodes(node, currentPath, callback) {
  if (node === null || node === undefined) return;
  if (Array.isArray(node)) {
    for (var i = 0; i < node.length; i++) {
      walkInstanceNodes(node[i], currentPath + "[" + i + "]", callback);
    }
    return;
  }
  if (typeof node !== "object") return;
  if (node.type === "INSTANCE" && typeof node.ref === "string") {
    callback(node, currentPath);
  }
  var keys = Object.keys(node);
  for (var k = 0; k < keys.length; k++) {
    walkInstanceNodes(node[keys[k]], currentPath + "." + keys[k], callback);
  }
}

// Structural fields whose values are identifiers, not user-visible text.
// Skipping these prevents the placeholder/banned walker from firing on
// component refs (e.g., ref: "button" matches /^Button$/i), kebab-case
// intent slugs, variant axes, screen ids, and the like.
var STRUCTURAL_FIELD_KEYS = {
  ref: true,
  id: true,
  type: true,
  intent: true,
  variant: true,
  variantName: true,
  archetype: true,
  recipe: true,
  pattern: true,
  source: true,
  mode: true,
  tier: true,
  kind: true,
  app: true,
  view: true,
  layoutMode: true,
};

function walkStringValues(node, currentPath, callback, parentKey) {
  if (node === null || node === undefined) return;
  if (typeof node === "string") {
    if (parentKey && STRUCTURAL_FIELD_KEYS[parentKey]) return;
    callback(node, currentPath);
    return;
  }
  if (Array.isArray(node)) {
    for (var i = 0; i < node.length; i++) {
      walkStringValues(
        node[i],
        currentPath + "[" + i + "]",
        callback,
        parentKey,
      );
    }
    return;
  }
  if (typeof node === "object") {
    var keys = Object.keys(node);
    for (var k = 0; k < keys.length; k++) {
      walkStringValues(
        node[keys[k]],
        currentPath + "." + keys[k],
        callback,
        keys[k],
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Banned placeholder strings (P0 — blocks push)
// ---------------------------------------------------------------------------

var BANNED_STRINGS = [
  "Page Title",
  "Description text",
  "Button label",
  "Label",
  "Nav Item",
  "Tag",
  "Header",
  "Feature Name",
  "Flow Description",
  "User Persona",
  "Dropdown item",
  "Input text",
  "Caption",
];

// Props to check for banned text
var BANNED_PROP_KEYS = [
  "Label",
  "Input Text",
  "Title",
  "Subtitle",
  "Dropdown Text",
  "Label Text",
  "Caption Text",
  "Feature",
  "Flow",
  "User",
];

// ---------------------------------------------------------------------------
// Walk content nodes recursively
// ---------------------------------------------------------------------------

function walkNodes(nodes, screenName, pathPrefix, visitor) {
  if (!Array.isArray(nodes)) return;
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    var nodePath = pathPrefix + "[" + i + "]";
    visitor(node, screenName, nodePath);
    if (node.children) {
      walkNodes(node.children, screenName, nodePath + ".children", visitor);
    }
  }
}

// ---------------------------------------------------------------------------
// Check 1: Banned text detection
// ---------------------------------------------------------------------------

function findBannedTextRaw(data) {
  var issues = [];

  for (var si = 0; si < data.screens.length; si++) {
    var screen = data.screens[si];
    var screenName = screen.name || "Screen " + (si + 1);

    // Check pageHeader
    if (screen.pageHeader) {
      if (
        screen.pageHeader.title &&
        BANNED_STRINGS.indexOf(screen.pageHeader.title) !== -1
      ) {
        issues.push({
          severity: "P0",
          check: "banned-text",
          screen: screenName,
          screenId: screen.id || "",
          path: "pageHeader.title",
          value: screen.pageHeader.title,
        });
      }
      if (
        screen.pageHeader.subtitle &&
        BANNED_STRINGS.indexOf(screen.pageHeader.subtitle) !== -1
      ) {
        issues.push({
          severity: "P0",
          check: "banned-text",
          screen: screenName,
          screenId: screen.id || "",
          path: "pageHeader.subtitle",
          value: screen.pageHeader.subtitle,
        });
      }
    }

    // Walk content nodes
    walkNodes(
      screen.content,
      screenName,
      "content",
      function (node, sName, nPath) {
        // Check TEXT node content
        if (
          node.type === "TEXT" &&
          node.content &&
          BANNED_STRINGS.indexOf(node.content) !== -1
        ) {
          issues.push({
            severity: "P0",
            check: "banned-text",
            screen: sName,
            screenId: screen.id || "",
            path: nPath + ".content",
            value: node.content,
          });
        }

        // Check INSTANCE props
        if (node.props) {
          for (var k = 0; k < BANNED_PROP_KEYS.length; k++) {
            var propKey = BANNED_PROP_KEYS[k];
            if (
              node.props[propKey] &&
              BANNED_STRINGS.indexOf(node.props[propKey]) !== -1
            ) {
              issues.push({
                severity: "P0",
                check: "banned-text",
                screen: sName,
                screenId: screen.id || "",
                path: nPath + ".props." + propKey,
                value: node.props[propKey],
              });
            }
          }
        }
      },
    );
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Check 3: Token reference validation
// ---------------------------------------------------------------------------

function loadTokenNames() {
  var cssPath = path.join(PLUGIN_ROOT, "tokens", "tokens.css");
  try {
    var css = fs.readFileSync(cssPath, "utf8");
    var names = {};
    var re = /(--(?:zen|fm)-[a-z0-9-]+)/g;
    var m;
    while ((m = re.exec(css)) !== null) {
      names[m[1]] = true;
    }
    return names;
  } catch (e) {
    return null;
  }
}

function extractTokenRefs(obj) {
  var refs = [];
  if (typeof obj === "string") {
    var re = /var\((--(?:zen|fm)-[a-z0-9-]+)\)/g;
    var m;
    while ((m = re.exec(obj)) !== null) {
      refs.push(m[1]);
    }
  } else if (Array.isArray(obj)) {
    for (var i = 0; i < obj.length; i++) {
      refs = refs.concat(extractTokenRefs(obj[i]));
    }
  } else if (obj && typeof obj === "object") {
    var keys = Object.keys(obj);
    for (var k = 0; k < keys.length; k++) {
      refs = refs.concat(extractTokenRefs(obj[keys[k]]));
    }
  }
  return refs;
}

function findUnresolvedTokensRaw(data) {
  var tokenNames = loadTokenNames();
  if (!tokenNames) return [];

  var issues = [];

  for (var si = 0; si < data.screens.length; si++) {
    var screen = data.screens[si];
    var screenName = screen.name || "Screen " + (si + 1);

    walkNodes(
      screen.content,
      screenName,
      "content",
      function (node, sName, nPath) {
        var fieldsToCheck = ["fills", "color", "stroke"];
        for (var f = 0; f < fieldsToCheck.length; f++) {
          var field = fieldsToCheck[f];
          if (node[field]) {
            var refs = extractTokenRefs(node[field]);
            for (var r = 0; r < refs.length; r++) {
              if (!tokenNames[refs[r]]) {
                issues.push({
                  severity: "P1",
                  check: "token",
                  screen: sName,
                  screenId: screen.id || "",
                  path: nPath + "." + field,
                  value: "var(" + refs[r] + ") not found in tokens.css",
                });
              }
            }
          }
        }
      },
    );
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Check 4: Terminology check
// ---------------------------------------------------------------------------

function loadTerminology() {
  var appContextPath = path.join(
    PLUGIN_ROOT,
    "docs",
    "generated",
    "app-context.json",
  );
  try {
    var appContext = JSON.parse(fs.readFileSync(appContextPath, "utf8"));
    return appContext.terminology || {};
  } catch (e) {
    return null;
  }
}

function buildTerminologyRules(terminology) {
  var rules = [];
  var keys = Object.keys(terminology);
  for (var i = 0; i < keys.length; i++) {
    var entry = terminology[keys[i]];
    if (!entry.notUse || entry.notUse.length === 0) continue;
    for (var j = 0; j < entry.notUse.length; j++) {
      var wrong = entry.notUse[j];
      // Strip parenthetical context notes like "dataset (when curated)"
      var cleanWrong = wrong.replace(/\s*\(.*?\)\s*$/, "").trim();
      if (cleanWrong.length < 3) continue;
      var escaped = cleanWrong.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      rules.push({
        pattern: new RegExp("\\b" + escaped + "\\b", "i"),
        wrong: cleanWrong,
        correct: entry.use,
      });
    }
  }
  return rules;
}

function findTerminologyIssuesRaw(data) {
  var terminology = loadTerminology();
  if (!terminology) return [];

  var rules = buildTerminologyRules(terminology);
  if (rules.length === 0) return [];

  var issues = [];

  function checkText(text, screenName, nodePath) {
    if (!text || typeof text !== "string") return;
    for (var r = 0; r < rules.length; r++) {
      if (rules[r].pattern.test(text)) {
        issues.push({
          severity: "P1",
          check: "terminology",
          screen: screenName,
          screenId: screen.id || "",
          path: nodePath,
          value: text,
          found: rules[r].wrong,
          suggestion: 'use "' + rules[r].correct + '"',
        });
      }
    }
  }

  for (var si = 0; si < data.screens.length; si++) {
    var screen = data.screens[si];
    var screenName = screen.name || "Screen " + (si + 1);

    if (screen.pageHeader) {
      checkText(screen.pageHeader.title, screenName, "pageHeader.title");
      checkText(screen.pageHeader.subtitle, screenName, "pageHeader.subtitle");
    }

    walkNodes(
      screen.content,
      screenName,
      "content",
      function (node, sName, nPath) {
        if (node.content) {
          checkText(node.content, sName, nPath + ".content");
        }
        if (node.props) {
          var propKeys = Object.keys(node.props);
          for (var pk = 0; pk < propKeys.length; pk++) {
            var val = node.props[propKeys[pk]];
            if (typeof val === "string") {
              checkText(val, sName, nPath + ".props." + propKeys[pk]);
            }
          }
        }
      },
    );
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Check 5: Tier justification (Sprint B1 — fallback ladder)
// ---------------------------------------------------------------------------
//
// Schema requires a justification (>=30 chars) when a screen's tier is
// "adapted" or "improvised". Tier "recognized" needs no justification.
// Pre-tier flow-data (no `tier` field) is unaffected — backwards compatible.

function checkTierJustification(screen, findings) {
  if (!screen || !screen.tier) return; // backwards compat — pre-tier screens skip
  if (screen.tier !== "adapted" && screen.tier !== "improvised") return; // tier 1 doesn't need justification

  var j = screen.justification;
  var trimmed = typeof j === "string" ? j.trim() : "";
  // Minimum justification length (30 chars) mirrors flow-data.schema.json:
  // $defs.screen.properties.justification.minLength. Keep the values aligned.
  var ok = typeof j === "string" && trimmed.length >= 30;
  if (!ok) {
    var sample;
    if (j == null) {
      sample = "null";
    } else if (typeof j !== "string") {
      sample = "(" + typeof j + ")";
    } else {
      var preview = j.length > 40 ? j.slice(0, 40) + "…" : j;
      sample = '"' + preview + '" (' + trimmed.length + " chars)";
    }
    findings.push({
      severity: "error",
      kind: "missing-justification",
      screen: screen.id || "",
      message:
        'Tier "' +
        screen.tier +
        '" requires a justification of 30+ chars; got ' +
        sample,
    });
  }
}

function findMissingJustificationsRaw(data) {
  var findings = [];
  if (!data || !Array.isArray(data.screens)) return findings;
  for (var si = 0; si < data.screens.length; si++) {
    checkTierJustification(data.screens[si], findings);
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Check 5b: Hardcoded color detection (v1.53.3 — companion to unresolved-token)
// ---------------------------------------------------------------------------
//
// findUnresolvedTokensRaw() only catches `var(--unknown-token)` patterns. It
// does NOT catch raw color literals (hex strings, rgb()/hsl() strings, or
// Figma's {r,g,b,a} object form), which is how hardcoded colors slip past the
// validator into pushed designs.
//
// This detector inspects every value at a known color field and flags
// non-token color literals.

var COLOR_FIELDS = [
  "fills",
  "stroke",
  "strokes",
  "color",
  "backgroundColor",
  "borderColor",
];

var COLOR_LITERAL_OK = ["transparent", "none", "currentColor", "inherit"];

function describeHardcodedColor(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "string") {
    var trimmed = val.trim();
    if (trimmed === "" || COLOR_LITERAL_OK.indexOf(trimmed) !== -1) return null;
    if (/var\(--(?:zen|fm)-[a-z0-9-]+\)/.test(trimmed)) return null;
    if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return trimmed;
    if (/^(rgb|hsl)a?\s*\(/i.test(trimmed)) return trimmed;
    return null; // unrecognized string — not a literal color
  }
  if (typeof val === "object" && !Array.isArray(val)) {
    if (
      typeof val.r === "number" &&
      typeof val.g === "number" &&
      typeof val.b === "number"
    ) {
      return JSON.stringify(val);
    }
    if (val.type === "SOLID" && val.color !== undefined) {
      return describeHardcodedColor(val.color);
    }
    if (Array.isArray(val.stops)) {
      for (var s = 0; s < val.stops.length; s++) {
        var hit = describeHardcodedColor(val.stops[s] && val.stops[s].color);
        if (hit) return hit;
      }
    }
    // Wrapper object with a 'color' subfield (e.g. stroke: { color, weight, align })
    if (val.color !== undefined) {
      return describeHardcodedColor(val.color);
    }
  }
  return null;
}

function walkColorFields(node, currentPath, callback) {
  if (node === null || node === undefined) return;
  if (Array.isArray(node)) {
    for (var i = 0; i < node.length; i++) {
      walkColorFields(node[i], currentPath + "[" + i + "]", callback);
    }
    return;
  }
  if (typeof node !== "object") return;

  for (var c = 0; c < COLOR_FIELDS.length; c++) {
    var f = COLOR_FIELDS[c];
    if (!Object.prototype.hasOwnProperty.call(node, f)) continue;
    var val = node[f];
    var fieldPath = currentPath + "." + f;
    if (Array.isArray(val)) {
      for (var ai = 0; ai < val.length; ai++) {
        var hitArr = describeHardcodedColor(val[ai]);
        if (hitArr) callback(fieldPath + "[" + ai + "]", hitArr);
      }
    } else {
      var hit = describeHardcodedColor(val);
      if (hit) callback(fieldPath, hit);
    }
  }

  // Recurse into non-color-field children only — color values are already inspected above
  var keys = Object.keys(node);
  for (var k = 0; k < keys.length; k++) {
    if (COLOR_FIELDS.indexOf(keys[k]) === -1) {
      walkColorFields(node[keys[k]], currentPath + "." + keys[k], callback);
    }
  }
}

function findHardcodedColorsRaw(data) {
  var issues = [];
  if (!data || !Array.isArray(data.screens)) return issues;
  for (var si = 0; si < data.screens.length; si++) {
    var screen = data.screens[si];
    var screenName = screen.name || "Screen " + (si + 1);
    walkColorFields(
      screen.content,
      "screens[" + si + "].content",
      (function (sName) {
        return function (p, value) {
          issues.push({
            severity: "P0",
            check: "hardcoded-color",
            screen: sName,
            screenId: screen.id || "",
            path: p,
            value: value,
          });
        };
      })(screenName),
    );
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Check 5c: Unmuted-chrome heuristic (v1.53.4 — FM focus principle)
// ---------------------------------------------------------------------------
//
// references/ds-rules/quality-tiers.md:14 — "Non-feature chrome is ALWAYS placeholder."
// fm-nav-item and fm-tab carry a `State` variant axis with a `Placeholder`
// value precisely for this — when the model writes real-looking labels on
// State=On/Off and the feature isn't navigation/tabs, that's the symptom.
//
// Soft warning, not error — heuristic by design has false positives. Designer
// reviews the GenLog summary and decides whether to mute or accept.

var CHROME_RULES = [
  {
    refs: ["fmNavItem"],
    textProp: "Label",
    defaultText: "Nav Item",
    mutedVariant: "Placeholder",
    variantAxis: "State",
    activeMarker: "sidebarActive",
  },
  {
    refs: ["fmTab"],
    textProp: "Tab label",
    defaultText: null,
    mutedVariant: "Placeholder",
    variantAxis: "State",
    activeMarker: null,
  },
];

var FEATURE_IS_CHROME_PATTERNS = [
  /\bnav(igation)?\b/i,
  /\bsidebar\b/i,
  /\bmenu\b/i,
  /\btab(s)?\b/i,
  /\btoolbar\b/i,
  /\bbreadcrumb\b/i,
  /\b(side|top)\s*bar\b/i,
];

function looksLikeChromeFeature(text) {
  if (!text || typeof text !== "string") return false;
  for (var i = 0; i < FEATURE_IS_CHROME_PATTERNS.length; i++) {
    if (FEATURE_IS_CHROME_PATTERNS[i].test(text)) return true;
  }
  return false;
}

function parseVariantAxis(variant, axis) {
  if (typeof variant !== "string" || !axis) return null;
  var parts = variant.split(",");
  for (var i = 0; i < parts.length; i++) {
    var kv = parts[i].split("=");
    if (kv.length === 2 && kv[0].trim() === axis) return kv[1].trim();
  }
  return null;
}

function findPropValue(props, propName) {
  if (!props || typeof props !== "object") return undefined;
  if (Object.prototype.hasOwnProperty.call(props, propName))
    return props[propName];
  var keys = Object.keys(props);
  for (var i = 0; i < keys.length; i++) {
    if (keys[i].split("#")[0] === propName) return props[keys[i]];
  }
  return undefined;
}

function findUnmutedChromeRaw(data) {
  var issues = [];
  if (!data || !Array.isArray(data.screens)) return issues;

  var glossary = (data.meta && data.meta._glossary) || {};
  var sidebarActive = glossary.sidebarActive || null;
  var featureContext = [
    (data.meta && data.meta.feature) || "",
    (data.meta && data.meta.flow) || "",
    (data.meta && data.meta.prompt) || "",
  ].join(" ");

  var refToRule = {};
  for (var ri = 0; ri < CHROME_RULES.length; ri++) {
    var r = CHROME_RULES[ri];
    for (var rj = 0; rj < r.refs.length; rj++) refToRule[r.refs[rj]] = r;
  }

  for (var si = 0; si < data.screens.length; si++) {
    var screen = data.screens[si];
    var screenName = screen.name || "Screen " + (si + 1);
    var screenContext = featureContext + " " + screenName;
    if (looksLikeChromeFeature(screenContext)) continue;

    walkInstanceNodes(
      screen.content,
      "screens[" + si + "].content",
      (function (sName) {
        return function (instNode, p) {
          var rule = refToRule[instNode.ref];
          if (!rule) return;
          var stateValue = parseVariantAxis(instNode.variant, rule.variantAxis);
          if (stateValue === rule.mutedVariant) return;

          var labelValue = findPropValue(instNode.props, rule.textProp);
          if (typeof labelValue !== "string" || labelValue === "") return;
          if (rule.defaultText && labelValue === rule.defaultText) return;
          if (
            rule.activeMarker === "sidebarActive" &&
            sidebarActive &&
            labelValue === sidebarActive
          ) {
            return; // canonical active-marker exemption
          }

          issues.push({
            severity: "P1",
            check: "unmuted-chrome",
            screen: sName,
            screenId: screen.id || "",
            path: p,
            ref: instNode.ref,
            value: labelValue,
            suggestion:
              'Set variant="' +
              rule.variantAxis +
              "=" +
              rule.mutedVariant +
              '" or replace with fmPlaceholder',
          });
        };
      })(screenName),
    );
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Check 5d: Intent mismatch (v1.54.0 — Sprint B3 component-context)
// ---------------------------------------------------------------------------
//
// Hifi-tier only (`meta.mode === "hifi"`). Walks INSTANCE nodes via
// walkWithIntent, looks up the per-component rule for the effective intent,
// and flags variant mismatches. FM-tier is silent — intent at FM tier is
// metadata for downstream conversion, not enforcement.

var INTENT_RULES = {
  // ref → intent → { severity, axis, allowed | substringMatch, expectedDescription }
  button: {
    "destructive-action": {
      severity: "error",
      axis: "Type",
      allowed: ["Critical primary", "Critical secondary"],
      expectedDescription: "Type ∈ {Critical primary, Critical secondary}",
    },
    "success-confirmation": {
      severity: "warning",
      axis: "Type",
      allowed: ["Primary"],
      expectedDescription: "Type=Primary",
    },
    "error-state": {
      severity: "warning",
      axis: "Type",
      allowed: ["Critical secondary"],
      expectedDescription: "Type=Critical secondary",
    },
  },
  modal: {
    "destructive-action": {
      severity: "warning",
      axis: "Size & Type",
      substringMatch: ["confirm", "warning"],
      expectedDescription: 'Size & Type contains "confirm" or "warning"',
    },
  },
};

function lookupIntentRule(ref, effectiveIntent) {
  if (!ref || effectiveIntent === "default") return null;
  var refRules = INTENT_RULES[ref];
  if (!refRules) return null;
  return refRules[effectiveIntent] || null;
}

function parseVariantString(variant) {
  if (typeof variant !== "string" || !variant) return {};
  var out = {};
  var parts = variant.split(",");
  for (var i = 0; i < parts.length; i++) {
    var kv = parts[i].split("=");
    if (kv.length === 2) out[kv[0].trim()] = kv[1].trim();
  }
  return out;
}

function variantMatchesRule(variantObj, rule) {
  var actual = variantObj[rule.axis];
  if (!actual) return false;
  if (rule.allowed) return rule.allowed.indexOf(actual) !== -1;
  if (rule.substringMatch) {
    var lower = actual.toLowerCase();
    for (var i = 0; i < rule.substringMatch.length; i++) {
      if (lower.indexOf(rule.substringMatch[i]) !== -1) return true;
    }
    return false;
  }
  return false;
}

function findIntentMismatchRaw(data) {
  if (!data || !Array.isArray(data.screens)) return [];
  if (!data.meta || data.meta.mode !== "hifi") return [];
  var issues = [];

  for (var si = 0; si < data.screens.length; si++) {
    var screen = data.screens[si];
    var screenName = screen.name || "Screen " + (si + 1);
    resolver.walkWithIntent(
      screen.content,
      (function (sName) {
        return function (node, effective, p) {
          if (!node || node.type !== "INSTANCE") return;
          var rule = lookupIntentRule(node.ref, effective);
          if (!rule) return;
          var variantObj = parseVariantString(node.variant);
          if (variantMatchesRule(variantObj, rule)) return;
          issues.push({
            severity: rule.severity === "error" ? "P0" : "P1",
            check: "intent-mismatch",
            screen: sName,
            screenId: screen.id || "",
            path: p,
            ref: node.ref,
            intent: effective,
            actualVariant: node.variant || "(none)",
            expected: rule.expectedDescription,
            value:
              (node.variant || "(none)") +
              " (expected: " +
              rule.expectedDescription +
              ")",
          });
        };
      })(screenName),
      null,
      "screens[" + si + "].content",
    );

    // Sibling pass — destructive-action FRAMEs with 2+ DS button INSTANCEs.
    resolver.walkWithIntent(
      screen.content,
      (function (sName) {
        return function (node, effective, p) {
          if (!node || !node.children || effective !== "destructive-action")
            return;
          var dsButtonChildren = node.children.filter(function (c) {
            return c && c.type === "INSTANCE" && c.ref === "button";
          });
          if (dsButtonChildren.length < 2) return;
          var criticalCount = 0;
          for (var c = 0; c < dsButtonChildren.length; c++) {
            var v = parseVariantString(dsButtonChildren[c].variant);
            if (
              v.Type === "Critical primary" ||
              v.Type === "Critical secondary"
            )
              criticalCount++;
          }
          if (criticalCount === 0) {
            issues.push({
              severity: "P1",
              check: "intent-mismatch",
              screen: sName,
              screenId: screen.id || "",
              path: p,
              ref: node.type,
              intent: effective,
              actualVariant: "(container)",
              expected:
                "sibling rule: destructive-action container should have a Critical primary or Critical secondary button",
              value:
                "destructive-action container with " +
                dsButtonChildren.length +
                " buttons, none Critical",
            });
          } else if (criticalCount === dsButtonChildren.length) {
            issues.push({
              severity: "P1",
              check: "intent-mismatch",
              screen: sName,
              screenId: screen.id || "",
              path: p,
              ref: node.type,
              intent: effective,
              actualVariant: "(container)",
              expected:
                "sibling rule: destructive-action container ambiguous — all buttons are Critical (primary or secondary); consider Tertiary/Secondary cancel buttons for coherent pattern",
              value:
                "destructive-action container with all " +
                criticalCount +
                " buttons Critical (ambiguous)",
            });
          }
        };
      })(screenName),
      null,
      "screens[" + si + "].content",
    );
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Check 6: Severity-tiered soft-deviation checks (Sprint B1 — fallback ladder)
// ---------------------------------------------------------------------------
//
// Hard constraint violations stay "error" at every tier (banned text, invalid
// tokens, missing-justification, etc.). Soft constraint deviations (recipe
// shape mismatch, density misalignment) scale by tier:
//   - tier 1 (recognized) or no tier → "warning"
//   - tier 2 (adapted)               → "warning"
//   - tier 3 (improvised)            → "info"
//
// MVP detector: matches content nodes with `role: "off-recipe"` (a sentinel
// the classifier or future checks can emit). Real recipe-shape deviation
// detection lands in Sprint C+ when fingerprinting infrastructure exists.

var HARD_KINDS = [
  "banned-text",
  "invalid-token",
  "missing-component",
  "schema-violation",
  "missing-justification",
];

function severityForTier(kind, tier) {
  if (HARD_KINDS.indexOf(kind) !== -1) return "error";
  if (tier === "improvised") return "info";
  // tier 1, tier 2, no-tier (pre-tier flow-data) → warning
  return "warning";
}

function checkRecipeAdherence(screen, findings) {
  if (!screen || !Array.isArray(screen.content)) return;
  for (var i = 0; i < screen.content.length; i++) {
    var node = screen.content[i];
    if (node && node.role === "off-recipe") {
      findings.push({
        severity: severityForTier("soft-deviation", screen.tier),
        kind: "soft-deviation",
        screen: screen.id || "",
        message: "Content node deviates from matched recipe shape",
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Aggregator entry point. Returns { findings: [...] } using the unified shape
// { severity, kind, screen, message } plus any extra fields needed by legacy
// adapters. opts.skipTokens and opts.skipTerminology mirror the CLI flags.
//
// All legacy P0/P1 checks are folded in here so validate() is the single
// authoritative runner. Legacy public functions (findBannedText, etc.) are
// thin adapters over validate() — see below.
// ---------------------------------------------------------------------------

function validate(data, opts) {
  opts = opts || {};
  var findings = [];
  if (!data || typeof data !== "object") return { findings: findings };

  // Always-stamp rule (B-refine.1): every screen gets a stable id before
  // any check runs. Idempotent — preserves user-supplied ids; derives
  // <feature-slug>-<index> for missing ones.
  require("../lib/screen-id.js").stampScreenIds(data);

  // Helper: derive screen.id from a finding path like "screens[2].content[3]..."
  function screenIdFromPath(p) {
    if (!p || !Array.isArray(data.screens)) return "";
    var m = /^screens\[(\d+)\]/.exec(p);
    if (!m) return "";
    var s = data.screens[parseInt(m[1], 10)];
    return (s && s.id) || "";
  }

  // Tier-level checks (existing — unchanged behavior)
  if (Array.isArray(data.screens)) {
    for (var si = 0; si < data.screens.length; si++) {
      checkTierJustification(data.screens[si], findings);
      checkRecipeAdherence(data.screens[si], findings);
    }
  }

  // Pass 1: walk INSTANCE nodes, check ref exists + required overrides present
  var registry = getCombinedRegistry();
  if (data.screens) {
    walkInstanceNodes(data.screens, "screens", function (instNode, p) {
      var sId = screenIdFromPath(p);
      var componentDef = registry[instNode.ref];
      if (!componentDef) {
        findings.push({
          kind: "unknown-component",
          severity: "error",
          path: p + ".ref",
          screen: sId,
          message:
            "Component ref '" +
            instNode.ref +
            "' not found in fmkit.json or dskit.json",
        });
        return;
      }
      var required = rules.getRequiredOverrideProps(componentDef);
      var props = instNode.props || {};
      for (var i = 0; i < required.length; i++) {
        if (props[required[i].propName] === undefined) {
          findings.push({
            kind: "missing-required-override",
            severity: "error",
            path: p + ".props",
            screen: sId,
            message:
              "Component '" +
              instNode.ref +
              "' requires override for prop '" +
              required[i].propName +
              "' (default '" +
              required[i].defaultValue +
              "' is a placeholder)",
          });
        }
      }

      // Check for unset default-true booleans (warning severity)
      var defaultTrue = rules.getDefaultTrueBooleans(componentDef);
      for (var b = 0; b < defaultTrue.length; b++) {
        if (props[defaultTrue[b].propName] === undefined) {
          findings.push({
            kind: "default-true-boolean-unset",
            severity: "warning",
            path: p + ".props",
            screen: sId,
            message:
              "Component '" +
              instNode.ref +
              "' has default-true boolean '" +
              defaultTrue[b].propName +
              "' unset. Set explicitly to true or false to suppress this warning.",
          });
        }
      }
    });
  }

  // Pass 2: walk all string values in screens (excludes meta block by design)
  if (data.screens) {
    walkStringValues(data.screens, "screens", function (str, p) {
      if (rules.isPlaceholderDefault(str)) {
        findings.push({
          kind: "placeholder-text",
          severity: "error",
          path: p,
          screen: screenIdFromPath(p),
          message: "Placeholder default leaked: " + JSON.stringify(str),
          value: str,
        });
      }
    });
  }

  // Banned-text check (folded from legacy findBannedTextRaw)
  if (data && Array.isArray(data.screens)) {
    var banned = findBannedTextRaw(data);
    for (var bi = 0; bi < banned.length; bi++) {
      findings.push({
        kind: "banned-text",
        severity: "error",
        path: banned[bi].path,
        screen: banned[bi].screenId,
        message: "Banned placeholder text: " + JSON.stringify(banned[bi].value),
        // preserve legacy fields for adapter reconstruction
        _legacy: banned[bi],
      });
    }
  }

  // Token check (folded from legacy findUnresolvedTokensRaw)
  if (!opts.skipTokens && data && Array.isArray(data.screens)) {
    var tokens = findUnresolvedTokensRaw(data);
    for (var ti = 0; ti < tokens.length; ti++) {
      findings.push({
        kind: "unresolved-token",
        severity: "warning",
        path: tokens[ti].path,
        screen: tokens[ti].screenId,
        message: tokens[ti].value,
        // preserve legacy fields for adapter reconstruction
        _legacy: tokens[ti],
      });
    }
  }

  // Hardcoded color check — flags non-token color literals (hex, rgb, {r,g,b}).
  // Hard error: pushes carrying hardcoded colors break the tokens-only rule.
  if (!opts.skipTokens && data && Array.isArray(data.screens)) {
    var hex = findHardcodedColorsRaw(data);
    for (var hi = 0; hi < hex.length; hi++) {
      findings.push({
        kind: "hardcoded-color",
        severity: "error",
        path: hex[hi].path,
        screen: hex[hi].screenId,
        message:
          "Hardcoded color " +
          JSON.stringify(hex[hi].value) +
          " — replace with var(--zen-…) or var(--fm-…) token",
        _legacy: hex[hi],
      });
    }
  }

  // Unmuted-chrome heuristic — soft warning. FM focus principle: non-feature
  // chrome (nav items, tabs) should use State=Placeholder variant or fmPlaceholder.
  if (data && Array.isArray(data.screens)) {
    var unmuted = findUnmutedChromeRaw(data);
    for (var ui = 0; ui < unmuted.length; ui++) {
      findings.push({
        kind: "unmuted-chrome",
        severity: "warning",
        path: unmuted[ui].path,
        screen: unmuted[ui].screenId,
        message:
          "Chrome '" +
          unmuted[ui].ref +
          "' has real-looking content " +
          JSON.stringify(unmuted[ui].value) +
          " on a non-chrome-feature screen. " +
          unmuted[ui].suggestion,
        _legacy: unmuted[ui],
      });
    }
  }

  // Intent mismatch (hifi tier only) — v1.54.0 / B3
  if (data && Array.isArray(data.screens)) {
    var intentIssues = findIntentMismatchRaw(data);
    for (var ii = 0; ii < intentIssues.length; ii++) {
      findings.push({
        kind: "intent-mismatch",
        severity: intentIssues[ii].severity === "P0" ? "error" : "warning",
        path: intentIssues[ii].path,
        screen: intentIssues[ii].screenId,
        message:
          "DS '" +
          intentIssues[ii].ref +
          "' with intent '" +
          intentIssues[ii].intent +
          "' has variant " +
          JSON.stringify(intentIssues[ii].actualVariant) +
          " — expected " +
          intentIssues[ii].expected,
        _legacy: intentIssues[ii],
      });
    }
  }

  // Terminology check (folded from legacy findTerminologyIssuesRaw)
  if (!opts.skipTerminology && data && Array.isArray(data.screens)) {
    var terms = findTerminologyIssuesRaw(data);
    for (var ri = 0; ri < terms.length; ri++) {
      findings.push({
        kind: "terminology-issue",
        severity: "warning",
        path: terms[ri].path,
        screen: terms[ri].screenId,
        message: terms[ri].value,
        // preserve legacy fields for adapter reconstruction
        _legacy: terms[ri],
      });
    }
  }

  // Stub-aware severity downgrade (v1.64.0+).
  // For any warning-level finding tagged with a component slug that has a
  // stub guideline, downgrade to info. Errors stay errors.
  // Also emit one info-level stub-guideline-used finding per unique stub
  // slug used by this flow, so designers can see backlog candidates.
  var stubSlugsUsed = {};
  var stubKinds = {
    "intent-mismatch": true,
    "missing-required-override": true,
    "default-true-boolean-unset": true,
  };
  findings.forEach(function (f) {
    // Derive slug from finding when available; fall back to scanning data
    var slug = f._legacy && f._legacy.ref ? f._legacy.ref : null;
    if (!slug && f.message) {
      // intent-mismatch / missing-required-override embed the ref in message
      var m = /Component '([^']+)'|DS '([^']+)'/.exec(f.message);
      if (m) slug = m[1] || m[2];
    }
    if (!slug) return;
    if (!stubKinds[f.kind]) return;
    var g = loadGuidelineForSlug(slug, opts);
    if (g && g._stub === true) {
      stubSlugsUsed[_kebab(slug)] = true;
      if (f.severity === "warning") {
        f.severity = "info";
        f.note =
          (f.note ? f.note + " " : "") + "[downgraded — guideline is a stub]";
      }
    }
  });

  // Pass: walk INSTANCE refs to ensure stub-using flows always get a
  // stub-guideline-used finding even when no other check fired.
  if (Array.isArray(data.screens)) {
    walkInstanceNodes(data.screens, "screens", function (instNode) {
      if (!instNode || typeof instNode.ref !== "string") return;
      var g = loadGuidelineForSlug(instNode.ref, opts);
      if (g && g._stub === true) {
        stubSlugsUsed[_kebab(instNode.ref)] = true;
      }
    });
  }
  Object.keys(stubSlugsUsed).forEach(function (slug) {
    findings.push({
      kind: "stub-guideline-used",
      severity: "info",
      message:
        "Component '" +
        slug +
        "' uses a stub guideline. Curated content pending — see vendor/components/guidelines/" +
        slug +
        ".json (in plugin) / components/guidelines/" +
        slug +
        ".json (in actian-ds-knowledge)",
    });
  });

  return { findings: findings };
}

// ---------------------------------------------------------------------------
// Legacy adapters — preserve external CLI shape (P0/P1 arrays). Internally
// these now derive from validate(). Maintained for backwards compatibility
// with existing callers and tests.
// ---------------------------------------------------------------------------

function findBannedText(data) {
  return validate(data, { skipTokens: true, skipTerminology: true })
    .findings.filter(function (f) {
      return f.kind === "banned-text";
    })
    .map(function (f) {
      return f._legacy;
    });
}

function findUnresolvedTokens(data) {
  return validate(data, { skipTerminology: true })
    .findings.filter(function (f) {
      return f.kind === "unresolved-token";
    })
    .map(function (f) {
      return f._legacy;
    });
}

function findHardcodedColors(data) {
  return validate(data, { skipTerminology: true })
    .findings.filter(function (f) {
      return f.kind === "hardcoded-color";
    })
    .map(function (f) {
      return f._legacy;
    });
}

function findUnmutedChrome(data) {
  return validate(data, { skipTokens: true, skipTerminology: true })
    .findings.filter(function (f) {
      return f.kind === "unmuted-chrome";
    })
    .map(function (f) {
      return f._legacy;
    });
}

function findTerminologyIssues(data) {
  return validate(data, { skipTokens: true })
    .findings.filter(function (f) {
      return f.kind === "terminology-issue";
    })
    .map(function (f) {
      return f._legacy;
    });
}

function findMissingJustifications(data) {
  return validate(data, {
    skipTokens: true,
    skipTerminology: true,
  }).findings.filter(function (f) {
    return f.kind === "missing-justification";
  });
}

function findIntentMismatch(data) {
  return validate(data, { skipTokens: true, skipTerminology: true })
    .findings.filter(function (f) {
      return f.kind === "intent-mismatch";
    })
    .map(function (f) {
      return f._legacy;
    });
}

// ---------------------------------------------------------------------------
// Exports (for testing) and CLI
// ---------------------------------------------------------------------------

module.exports = {
  findBannedText: findBannedText,
  findUnresolvedTokens: findUnresolvedTokens,
  findHardcodedColors: findHardcodedColors,
  findUnmutedChrome: findUnmutedChrome,
  findTerminologyIssues: findTerminologyIssues,
  findMissingJustifications: findMissingJustifications,
  findIntentMismatch: findIntentMismatch,
  validate: validate,
  severityForTier: severityForTier,
  checkRecipeAdherence: checkRecipeAdherence,
  // B-refine.1: scope-aware-runner contract
  gateConfig: {
    // Validator never skips — findings are too valuable to drop wholesale.
    // Filter only.
    filterFindingsByScope: function (f, scope) {
      if (scope.kind === "full") return true;
      if (!f.screen) return true; // schema/file-level findings always pass
      return scope.ids.indexOf(f.screen) !== -1;
    },
  },
  run: function (data, opts) {
    return validate(data, opts);
  },
};

if (require.main === module) {
  if (process.argv.length < 3 || process.argv[2] === "--help") {
    var helpObj = {
      name: "validate-flow-data",
      description: "Validate flow-data.json before Figma push",
      usage: "validate-flow-data.js <flow-data.json> [options]",
      flags: [
        {
          name: "--skip-tokens",
          description: "Skip token reference validation",
        },
        { name: "--skip-terminology", description: "Skip terminology check" },
        {
          name: "--scope <s>",
          description:
            "Filter findings by scope: 'full' (default) | 'single-unit:<id>' | 'multi-unit:[<id>,<id>]'",
        },
        { name: "--json", description: "Output issues as JSON" },
        { name: "--help", description: "Show this help" },
      ],
    };
    if (process.argv[2] === "--help") {
      process.stdout.write(JSON.stringify(helpObj, null, 2) + "\n");
      process.exit(0);
    }
    process.stderr.write(
      "Usage: validate-flow-data.js <flow-data.json> [options]\n",
    );
    process.exit(1);
  }

  var dataPath = path.resolve(process.argv[2]);
  var flags = process.argv.slice(3);
  var skipTokens = flags.indexOf("--skip-tokens") !== -1;
  var skipTerminology = flags.indexOf("--skip-terminology") !== -1;
  var jsonOutput = flags.indexOf("--json") !== -1;
  var scopeIdx = flags.indexOf("--scope");
  var scope =
    scopeIdx !== -1 && flags[scopeIdx + 1] ? flags[scopeIdx + 1] : "full";

  var data;
  try {
    data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  } catch (e) {
    process.stderr.write("Error reading " + dataPath + ": " + e.message + "\n");
    process.exit(1);
  }

  // Single validate() call — emits all finding kinds in one traversal.
  // Surfaced in the CLI so designers see actionable findings. Originally
  // this was a back-compat allowlist of 7 kinds (sub-project B, when the
  // dual-API consolidation rolled out); v1.65.x added 5 more so that P0
  // errors (placeholder-text, missing-required-override, unknown-component)
  // stop being silently dropped, soft-deviation surfaces, and info-level
  // findings (stub-guideline-used, added v1.64.0) reach designers as P2
  // informational lines.
  //
  // default-true-boolean-unset stays suppressed: it fires per-fmButton
  // whenever icon-show booleans aren't explicitly set, which is the
  // common case for AI-generated flows. It would dominate the output
  // signal-to-noise. Programmatic consumers can still see it via
  // validate(data).findings[].
  var CLI_VISIBLE_KINDS = {
    "banned-text": true,
    "unresolved-token": true,
    "hardcoded-color": true,
    "unmuted-chrome": true,
    "intent-mismatch": true,
    "terminology-issue": true,
    "missing-justification": true,
    "placeholder-text": true,
    "missing-required-override": true,
    "unknown-component": true,
    "soft-deviation": true,
    "stub-guideline-used": true,
  };

  var runGate = require("../lib/scope-aware-runner.js").runGate;
  var result = runGate(module.exports, data, {
    skipTokens: skipTokens,
    skipTerminology: skipTerminology,
    scope: scope,
  });

  // Severity tier mapping for the legacy CLI shape:
  //   error   → P0 (blocking; exit 1)
  //   warning → P1 (designer attention; exit 2)
  //   info    → P2 (informational; exit 0)
  function mapTier(sev) {
    if (sev === "error") return "P0";
    if (sev === "warning") return "P1";
    return "P2";
  }

  var allIssues = [];
  for (var fi = 0; fi < result.findings.length; fi++) {
    var f = result.findings[fi];
    if (!CLI_VISIBLE_KINDS[f.kind]) continue;
    if (f._legacy) {
      allIssues.push(f._legacy);
    } else {
      allIssues.push({
        severity: mapTier(f.severity),
        check: f.kind,
        screen: f.screen || "(unknown)",
        path: f.path || "tier/justification",
        value: f.message,
      });
    }
  }

  // Report
  if (jsonOutput) {
    process.stdout.write(JSON.stringify(allIssues, null, 2) + "\n");
  } else {
    if (allIssues.length === 0) {
      process.stdout.write("validate-flow-data: 0 issues\n");
    } else {
      process.stderr.write(
        "validate-flow-data: " + allIssues.length + " issue(s) found\n\n",
      );
      for (var i = 0; i < allIssues.length; i++) {
        var issue = allIssues[i];
        process.stderr.write(
          issue.severity +
            " [" +
            issue.check +
            "] " +
            issue.screen +
            " → " +
            issue.path +
            " = " +
            JSON.stringify(issue.value) +
            "\n",
        );
      }
    }
  }

  var hasP0 = allIssues.some(function (issue) {
    return issue.severity === "P0";
  });
  var hasP1 = allIssues.some(function (issue) {
    return issue.severity === "P1";
  });
  // P2 findings (info-level, e.g. stub-guideline-used) are visible but do
  // not fail CI — they're advisory, not blocking.
  process.exit(hasP0 ? 1 : hasP1 ? 2 : 0);
}
