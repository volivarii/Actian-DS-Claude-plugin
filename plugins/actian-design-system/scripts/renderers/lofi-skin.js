"use strict";
function hexToRgb(h) { var s = h.replace("#", ""); if (s.length === 3) s = s.split("").map(function (c) { return c + c; }).join(""); return [0, 2, 4].map(function (i) { return parseInt(s.slice(i, i + 2), 16); }); }
function lin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function toSrgb(y) { var v = y <= 0.0031308 ? y * 12.92 : 1.055 * Math.pow(y, 1 / 2.4) - 0.055; return Math.max(0, Math.min(255, Math.round(v * 255))); }
function gray(hex) { var r = hexToRgb(hex); var y = 0.2126 * lin(r[0]) + 0.7152 * lin(r[1]) + 0.0722 * lin(r[2]); var g = toSrgb(y).toString(16).padStart(2, "0"); return "#" + g + g + g; }

// The FM palette is the reference (fm-base.css; the Figma FatMarker page uses
// exactly these: text #101828, bars #e2e7f0, fills #f5f5fa, borders #cbd2e0).
// A DS token is mapped by the ROLE in its name; anything unmapped becomes a
// luminance gray so no brand colour survives.
var FM_MAP = [
  [/^--zen-color-text-(default|primary)$/, "var(--fm-text-primary)"],
  [/^--zen-color-text-secondary$/, "var(--fm-text-secondary)"],
  [/^--zen-color-text-(tertiary|muted|placeholder)$/, "var(--fm-text-tertiary)"],
  [/^--zen-color-text-error$/, "var(--fm-text-error)"],
  [/^--zen-color-background-(default|white)$/, "var(--fm-base-white)"],
  [/^--zen-color-background-(subtle|grey|gray|secondary)$/, "var(--fm-base-100)"],
  [/^--zen-color-border-/, "var(--fm-border)"],
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
  var re = /(--zen-color-[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\b/g, m, out = [];
  while ((m = re.exec(tokensCss || ""))) out.push("  " + m[1] + ": " + fmValueFor(m[1], m[2]) + ";");
  return '[data-skin="lofi"] {\n' + out.join("\n") + "\n}\n" + PLACEHOLDER_RULES.join("\n") + "\n";
}
module.exports = { lofiSkinCss: lofiSkinCss, gray: gray, FM_MAP: FM_MAP, PLACEHOLDER_RULES: PLACEHOLDER_RULES };
