"use strict";
function hexToRgb(h) { var s = h.replace("#", ""); if (s.length === 3) s = s.split("").map(function (c) { return c + c; }).join(""); return [0, 2, 4].map(function (i) { return parseInt(s.slice(i, i + 2), 16); }); }
function lin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function toSrgb(y) { var v = y <= 0.0031308 ? y * 12.92 : 1.055 * Math.pow(y, 1 / 2.4) - 0.055; return Math.max(0, Math.min(255, Math.round(v * 255))); }
function gray(hex) { var r = hexToRgb(hex); var y = 0.2126 * lin(r[0]) + 0.7152 * lin(r[1]) + 0.0722 * lin(r[2]); var g = toSrgb(y).toString(16).padStart(2, "0"); return "#" + g + g + g; }

// The FM palette is the reference (fm-base.css; the Figma FatMarker page uses
// exactly these: text #101828, bars #e2e7f0, fills #f5f5fa, borders #cbd2e0).
// A DS token is mapped by the ROLE in its name; anything unmapped becomes a
// luminance gray so no brand colour survives.
//
// Token family names below were read from vendor/tokens/tokens.css directly
// (2026-09-16), not assumed: the real families are --zen-color-text-*,
// --zen-color-bg-* (NOT "-background-") and --zen-border-* (NOT
// "-color-border-" -- that prefix does not exist in the vendored tokens; it
// is kept below only as a defensive second prefix in case a future token
// generation introduces it). Two real families are folded into an existing
// group because they are direct sub-variants of a family already covered:
// --zen-color-text-placeholder-subtle -> the placeholder group
// (fm-text-tertiary), and --zen-color-bg-muted -> the subtle group
// (fm-base-100), mirroring how "muted" already reads as a subtle/tertiary
// synonym on the text side. --zen-color-text-success is added on its own
// because fm-base.css declares a matching --fm-text-success. Every other
// real family (text-disabled, text-reverse, text-warning,
// bg-disabled/emphasis/error/info/overlay/primary/reverse/selected/success/
// warning) has no FM-palette role counterpart and is left to the gray()
// fallback below, which already satisfies "no brand colour survives" for
// them without inventing a role that doesn't exist in the reference page.
var FM_MAP = [
  [/^--zen-color-text-(default|primary)$/, "var(--fm-text-primary)"],
  [/^--zen-color-text-secondary$/, "var(--fm-text-secondary)"],
  [/^--zen-color-text-(tertiary|muted|placeholder|placeholder-subtle)$/, "var(--fm-text-tertiary)"],
  [/^--zen-color-text-error$/, "var(--fm-text-error)"],
  [/^--zen-color-text-success$/, "var(--fm-text-success)"],
  [/^--zen-color-bg-(default|white)$/, "var(--fm-base-white)"],
  [/^--zen-color-bg-(subtle|secondary|grey|gray|muted)$/, "var(--fm-base-100)"],
  [/^(?:--zen-border-|--zen-color-border-)/, "var(--fm-border)"],
];
function fmValueFor(name, hex) {
  for (var i = 0; i < FM_MAP.length; i++) if (FM_MAP[i][0].test(name)) return FM_MAP[i][1];
  return gray(hex);
}

// Outside a focus subtree, placeholder by TEXT ROLE, as the reference page does:
// heading-weight text (section headers, titles) and text the author marked
// keep:true stay legible; regular text becomes a bar of its own width in the FM
// bar colour; a DS leaf keeps its title and bars its secondary spans. Inside
// .flow-focus nothing is barred by the skin; an author who wants a bar inside
// the feature authors an fmPlaceholder node. quality-tiers.md, "FM focus principle".
var PLACEHOLDER_RULES = [
  '[data-skin="lofi"] .fm-text:not(.flow-focus *):not(.fm-text--heading):not(.fm-text--keep) { color: transparent; background: var(--fm-base-300); border-radius: 4px; }',
  '[data-skin="lofi"] .screen__content-area [class*="ds-"]:not(.flow-focus, .flow-focus *) [class*="__desc"], [data-skin="lofi"] .screen__content-area [class*="ds-"]:not(.flow-focus, .flow-focus *) [class*="__prop"], [data-skin="lofi"] .screen__content-area [class*="ds-"]:not(.flow-focus, .flow-focus *) [class*="__tech"], [data-skin="lofi"] .screen__content-area [class*="ds-"]:not(.flow-focus, .flow-focus *) [class*="__helper"] { color: transparent; background: var(--fm-base-300); border-radius: 4px; }',
  '[data-skin="lofi"] .flow-focus { outline: 1px solid var(--fm-base-400); outline-offset: 6px; }',
];

function lofiSkinCss(tokensCss) {
  // Every --zen-* custom property whose value is a hex literal is a colour
  // (spacing/radius tokens are px and never match #[0-9a-fA-F]); scoping the
  // scan to "--zen-color-*" would miss the real --zen-border-* family
  // entirely, which is exactly the bug this scan used to have.
  var re = /(--zen-[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\b/g, m, out = [];
  while ((m = re.exec(tokensCss || ""))) out.push("  " + m[1] + ": " + fmValueFor(m[1], m[2]) + ";");
  return '[data-skin="lofi"] {\n' + out.join("\n") + "\n}\n" + PLACEHOLDER_RULES.join("\n") + "\n";
}
module.exports = { lofiSkinCss: lofiSkinCss, gray: gray, FM_MAP: FM_MAP, PLACEHOLDER_RULES: PLACEHOLDER_RULES };
