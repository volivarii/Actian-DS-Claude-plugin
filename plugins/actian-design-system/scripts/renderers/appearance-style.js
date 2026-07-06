// scripts/renderers/appearance-style.js
// Pure appearance -> CSS-declarations mapper. Each color declaration is the
// raw resolved value captured in the anatomy `appearance`; when that slot also
// carries the published --zen-* name it is bound to (P2 name layer), the value
// is wrapped as var(<token>, <value>) at this single emit point — the value
// stays the fallback (fidelity), the name enables theming. No token present ->
// value-only (byte-identical to Phase 1B). radius carries no token yet
// (radiusToken deferred upstream until the REST bind shape is verified).
(function (exports) {
  "use strict";

  function has(v) {
    return v !== null && v !== undefined && v !== "";
  }

  // Defense-in-depth CSS-value gate (C3). The anatomy schema does not constrain
  // the SHAPE of a captured appearance value, so a hand-edited or future dist
  // value could smuggle extra declarations. This is a conservative DENYLIST
  // (not an allowlist, which would risk dropping legit values like `400`,
  // `rgba(0, 0, 0, 0.05)`, `9999px`, `0.3px`): a value is rejected only if it
  // carries a declaration/rule terminator (`;` `{` `}`) or a URL / expression /
  // markup escape. Rejected values drop their whole declaration rather than
  // emit a poisoned one. Non-string values (e.g. numeric font-weight) pass.
  function safeValue(v) {
    if (typeof v !== "string") return true;
    if (/[;{}]/.test(v)) return false;
    if (/url\(|expression\(|<\//i.test(v)) return false;
    return true;
  }

  // P2 name layer. A token is a CSS custom-property NAME; accept only a strict
  // `--` identifier so nothing (a `)` closing the var(), a `;`/`{`/`}`, a
  // hand-edited/future-dist smuggle) can break out of the var() wrapper. Any
  // other shape degrades to value-only, never a poisoned declaration.
  function safeToken(t) {
    return typeof t === "string" && /^--[A-Za-z0-9-]+$/.test(t);
  }

  // Wrap an ALREADY-safeValue'd value as var(<token>, <value>) when a valid
  // token name rides alongside it. The value is the FALLBACK: an unpublished
  // name degrades to the correct value (no washout), a published name themes.
  // No/invalid token -> the raw value (byte-identical to Phase 1B).
  function tokenized(token, value) {
    return safeToken(token) ? "var(" + token + ", " + value + ")" : value;
  }

  // appearance: { background?, border?:{color,width}, radius?, text?:{...} }
  function appearanceToDecls(appearance) {
    var d = [];
    if (!appearance || typeof appearance !== "object") return d;

    if (has(appearance.background) && safeValue(appearance.background))
      d.push(
        "background:" +
          tokenized(appearance.backgroundToken, appearance.background),
      );

    var b = appearance.border;
    if (b && typeof b === "object" && has(b.color) && safeValue(b.color)) {
      var w = has(b.width) && safeValue(b.width) ? b.width : "1px";
      d.push("border:" + w + " solid " + tokenized(b.colorToken, b.color));
    }

    if (has(appearance.radius) && safeValue(appearance.radius))
      d.push("border-radius:" + appearance.radius);

    var t = appearance.text;
    if (t && typeof t === "object") {
      if (has(t.color) && safeValue(t.color))
        d.push("color:" + tokenized(t.colorToken, t.color));
      if (has(t.size) && safeValue(t.size)) d.push("font-size:" + t.size);
      if (has(t.weight) && safeValue(t.weight))
        d.push("font-weight:" + t.weight);
      if (has(t.lineHeight) && safeValue(t.lineHeight))
        d.push("line-height:" + t.lineHeight);
      if (has(t.letterSpacing) && safeValue(t.letterSpacing))
        d.push("letter-spacing:" + t.letterSpacing);
    }

    return d;
  }

  // Icon glyph color (F2). A resolved glyph draws via `currentColor`, so it
  // needs a single `color:` declaration (never background/border/radius,
  // which would repaint the neutral-box background behind a transparent
  // glyph, precisely the washout-bug class appearanceToDecls's other callers
  // already guard against). Only text.color qualifies (a glyph nested under
  // a text-colored composite, e.g. an icon matching an alert's message
  // color): appearance.background on an instance node is always the
  // instance root frame's own surface fill, never the glyph color, so
  // falling back to it would paint glyph surface-on-surface, the very
  // washout this function exists to prevent. Reuses the same has/safeValue
  // gate as appearanceToDecls so an icon color can never smuggle a
  // declaration/rule terminator or url()/expression() either. Returns "" when
  // no safe color is present, so the caller omits the style attribute and
  // the glyph inherits currentColor from its parent.
  function iconColorDecl(appearance) {
    if (!appearance || typeof appearance !== "object") return "";
    var t = appearance.text;
    if (t && typeof t === "object" && has(t.color) && safeValue(t.color)) {
      return "color:" + tokenized(t.colorToken, t.color);
    }
    return "";
  }

  exports.appearanceToDecls = appearanceToDecls;
  exports.iconColorDecl = iconColorDecl;
})(
  typeof module !== "undefined"
    ? module.exports
    : (window.appearanceStyle = window.appearanceStyle || {}),
);
