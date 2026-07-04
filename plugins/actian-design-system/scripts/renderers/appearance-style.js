// scripts/renderers/appearance-style.js
// Pure appearance -> CSS-declarations mapper. VALUES-ONLY (Phase 1B): each
// declaration is the raw resolved value captured in the anatomy `appearance`.
// Phase 2 will teach this single emit point to wrap known token names as
// var(--name, value) without touching callers.
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

  // appearance: { background?, border?:{color,width}, radius?, text?:{...} }
  function appearanceToDecls(appearance) {
    var d = [];
    if (!appearance || typeof appearance !== "object") return d;

    if (has(appearance.background) && safeValue(appearance.background))
      d.push("background:" + appearance.background);

    var b = appearance.border;
    if (b && typeof b === "object" && has(b.color) && safeValue(b.color)) {
      var w = has(b.width) && safeValue(b.width) ? b.width : "1px";
      d.push("border:" + w + " solid " + b.color);
    }

    if (has(appearance.radius) && safeValue(appearance.radius))
      d.push("border-radius:" + appearance.radius);

    var t = appearance.text;
    if (t && typeof t === "object") {
      if (has(t.color) && safeValue(t.color)) d.push("color:" + t.color);
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

  exports.appearanceToDecls = appearanceToDecls;
})(
  typeof module !== "undefined"
    ? module.exports
    : (window.appearanceStyle = window.appearanceStyle || {}),
);
