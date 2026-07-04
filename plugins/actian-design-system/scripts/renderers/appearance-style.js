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

  // appearance: { background?, border?:{color,width}, radius?, text?:{...} }
  function appearanceToDecls(appearance) {
    var d = [];
    if (!appearance || typeof appearance !== "object") return d;

    if (has(appearance.background)) d.push("background:" + appearance.background);

    var b = appearance.border;
    if (b && typeof b === "object" && has(b.color)) {
      var w = has(b.width) ? b.width : "1px";
      d.push("border:" + w + " solid " + b.color);
    }

    if (has(appearance.radius)) d.push("border-radius:" + appearance.radius);

    var t = appearance.text;
    if (t && typeof t === "object") {
      if (has(t.color)) d.push("color:" + t.color);
      if (has(t.size)) d.push("font-size:" + t.size);
      if (has(t.weight)) d.push("font-weight:" + t.weight);
      if (has(t.lineHeight)) d.push("line-height:" + t.lineHeight);
      if (has(t.letterSpacing)) d.push("letter-spacing:" + t.letterSpacing);
    }

    return d;
  }

  exports.appearanceToDecls = appearanceToDecls;
})(
  typeof module !== "undefined"
    ? module.exports
    : (window.appearanceStyle = window.appearanceStyle || {}),
);
