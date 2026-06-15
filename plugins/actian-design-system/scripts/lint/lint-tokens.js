"use strict";

// Token-quality lint for the Actian DS vendored token files.
// Pure + dependency-free so it runs identically in CI and locally.

// Flags `var(--zen-*)` references in tokens.css that have no matching
// `--zen-*:` definition. Catches the class of bug where a manual token
// edit points at a variable that was never declared.
function lintCssVarRefs(cssText) {
  var defined = new Set();
  // Known limitation: a `--zen-*:` pattern inside a block comment counts as a definition (acceptable — real tokens.css never does this; it only risks suppressing a finding, never a false positive).
  var defRe = /^\s*(--zen-[A-Za-z0-9-]+)\s*:/gm;
  var m;
  while ((m = defRe.exec(cssText))) defined.add(m[1]);

  var findings = [];
  var seen = new Set();
  var refRe = /var\(\s*(--zen-[A-Za-z0-9-]+)/g;
  while ((m = refRe.exec(cssText))) {
    var name = m[1];
    if (!defined.has(name) && !seen.has(name)) {
      seen.add(name);
      findings.push({
        rule: "broken-ref",
        severity: "error",
        token: name,
        message: "CSS references var(" + name + ") but it is never defined",
      });
    }
  }
  return findings;
}

function srgbToLinear(channel8bit) {
  var cs = channel8bit / 255;
  return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex) {
  var h = hex.replace("#", "");
  if (h.length !== 6) return NaN;
  var r = parseInt(h.slice(0, 2), 16);
  var g = parseInt(h.slice(2, 4), 16);
  var b = parseInt(h.slice(4, 6), 16);
  return (
    0.2126 * srgbToLinear(r) +
    0.7152 * srgbToLinear(g) +
    0.0722 * srgbToLinear(b)
  );
}

function contrastRatio(hex1, hex2) {
  var l1 = relativeLuminance(hex1);
  var l2 = relativeLuminance(hex2);
  var hi = Math.max(l1, l2);
  var lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

// Resolves a dotted token path (e.g. "color.text.primary") to its value
// for a given theme, preferring the com.actian.themes override and falling
// back to the DTCG $value.
function themeValue(tokensJson, dotPath, theme) {
  var node = dotPath.split(".").reduce(function (o, k) {
    return o ? o[k] : undefined;
  }, tokensJson);
  if (!node) return undefined;
  var themes = node.$extensions && node.$extensions["com.actian.themes"];
  if (themes && themes[theme] != null) return themes[theme];
  return node.$value;
}

// Curated text/background pairs that MUST meet WCAG AA normal-text (4.5:1).
// Intentionally excludes tertiary/placeholder/disabled tokens, which are
// designed to be lower-contrast and carry different requirements.
var CONTRAST_PAIRS = [
  { fg: "color.text.primary", bg: "color.bg.default", min: 4.5 },
  { fg: "color.text.secondary", bg: "color.bg.default", min: 4.5 },
  { fg: "color.text.link.default", bg: "color.bg.default", min: 4.5 },
  { fg: "color.text.error", bg: "color.bg.default", min: 4.5 },
];

var THEMES = ["actian", "studio", "explorer"];

function lintContrast(tokensJson, pairs, themes) {
  pairs = pairs || CONTRAST_PAIRS;
  themes = themes || THEMES;
  var findings = [];
  pairs.forEach(function (p) {
    themes.forEach(function (theme) {
      var fg = themeValue(tokensJson, p.fg, theme);
      var bg = themeValue(tokensJson, p.bg, theme);
      if (!fg || !bg) return;
      var ratio = contrastRatio(fg, bg);
      if (!isFinite(ratio)) return;
      if (ratio < p.min) {
        findings.push({
          rule: "contrast",
          severity: "error",
          token: p.fg + " on " + p.bg + " [" + theme + "]",
          message:
            "contrast " +
            ratio.toFixed(2) +
            ":1 < required " +
            p.min +
            ":1 (" +
            fg +
            " on " +
            bg +
            ")",
        });
      }
    });
  });
  return findings;
}

function lintTokens(opts) {
  opts = opts || {};
  var css = lintCssVarRefs(opts.cssText || "");
  var contrast = lintContrast(opts.tokensJson || {}, opts.pairs, opts.themes);
  return css.concat(contrast);
}

function formatReport(findings) {
  if (!findings.length) return "token-lint: PASS (0 findings)";
  var errors = findings.filter(function (f) {
    return f.severity === "error";
  }).length;
  var lines = findings.map(function (f) {
    return (
      "  [" + f.severity + "] " + f.rule + ": " + f.token + " — " + f.message
    );
  });
  return (
    "token-lint: " +
    findings.length +
    " finding(s), " +
    errors +
    " error(s)\n" +
    lines.join("\n")
  );
}

// Denominators for pass-rate scoring: how many checks the lint actually ran.
// refsChecked = distinct --zen-* vars referenced via var(); contrastChecks =
// resolvable CONTRAST_PAIRS × themes (only pairs whose tokens exist count).
function countChecks(opts) {
  opts = opts || {};
  var cssText = opts.cssText || "";
  var tokensJson = opts.tokensJson || {};
  var pairs = opts.pairs || CONTRAST_PAIRS;
  var themes = opts.themes || THEMES;

  var refs = new Set();
  var refRe = /var\(\s*(--zen-[A-Za-z0-9-]+)/g;
  var m;
  while ((m = refRe.exec(cssText))) refs.add(m[1]);

  var contrastChecks = 0;
  pairs.forEach(function (p) {
    themes.forEach(function (theme) {
      var fg = themeValue(tokensJson, p.fg, theme);
      var bg = themeValue(tokensJson, p.bg, theme);
      if (fg && bg) contrastChecks += 1;
    });
  });

  return { refsChecked: refs.size, contrastChecks: contrastChecks };
}

module.exports = {
  lintCssVarRefs: lintCssVarRefs,
  relativeLuminance: relativeLuminance,
  contrastRatio: contrastRatio,
  themeValue: themeValue,
  lintContrast: lintContrast,
  lintTokens: lintTokens,
  formatReport: formatReport,
  countChecks: countChecks,
  CONTRAST_PAIRS: CONTRAST_PAIRS,
  THEMES: THEMES,
};
