// scripts/renderers/appearance-render.js
// Pure "anatomy + appearance -> HTML" interpreter (Phase 1B), VALUES-ONLY.
// Walks the vendored anatomy `root` tree, resolves per-node appearance for the
// active variant (base delta merged with every matching variants[] delta), and
// emits raw-value CSS. No fs, no token-bindings sidecar, never throws.
(function (exports) {
  "use strict";

  var style =
    typeof require !== "undefined"
      ? require("./appearance-style.js")
      : window.appearanceStyle;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Ported from anatomy-render.js (retired in Group C).
  function mapAlign(v) {
    return (
      {
        center: "center",
        end: "flex-end",
        "flex-end": "flex-end",
        "space-between": "space-between",
        start: "flex-start",
        "flex-start": "flex-start",
      }[v] || "flex-start"
    );
  }

  function flexStyle(layout) {
    if (!layout || typeof layout !== "object") return "";
    var p = layout.padding || {};
    var parts = [
      "display:flex",
      "flex-direction:" + (layout.axis === "row" ? "row" : "column"),
    ];
    if (layout.gap) parts.push("gap:" + layout.gap);
    parts.push(
      "padding:" +
        [p.top || "0", p.right || "0", p.bottom || "0", p.left || "0"].join(" "),
    );
    var a = layout.align || {};
    if (a.main) parts.push("justify-content:" + mapAlign(a.main));
    if (a.cross) parts.push("align-items:" + mapAlign(a.cross));
    return parts.join(";");
  }

  var APPEARANCE_KEYS = ["background", "border", "radius", "text"];

  // Base appearance (minus variants) with every MATCHING variant delta merged
  // over it. A delta matches when variant[entry.prop] is in entry.values.
  // Base already equals the default variant, so no variantDefaults lookup is
  // needed. Multiple matching axes merge additively (later wins per key).
  function resolveNodeAppearance(node, variant) {
    var ap = node && node.appearance;
    if (!ap || typeof ap !== "object") return null;
    var out = {};
    APPEARANCE_KEYS.forEach(function (k) {
      if (ap[k] !== undefined) out[k] = ap[k];
    });
    var variants = Array.isArray(ap.variants) ? ap.variants : [];
    for (var i = 0; i < variants.length; i++) {
      var e = variants[i];
      if (!e || !e.prop || !Array.isArray(e.values)) continue;
      var target = variant ? variant[e.prop] : undefined;
      if (target != null && e.values.indexOf(target) !== -1) {
        APPEARANCE_KEYS.forEach(function (k) {
          if (e[k] !== undefined) out[k] = e[k];
        });
      }
    }
    return out;
  }

  function renderAppearanceNode(node, variant) {
    if (!node || typeof node !== "object") return "";
    var kind = node.kind || "node";
    var cls = "ds-appearance__" + kind;
    var decls = style.appearanceToDecls(resolveNodeAppearance(node, variant));

    if (kind === "text") {
      var ts = decls.length ? ' style="' + esc(decls.join(";")) + '"' : "";
      return '<span class="' + cls + '"' + ts + ">" + esc(node.text || "") + "</span>";
    }
    if (kind === "image" || kind === "vector") {
      var ls = decls.length ? ' style="' + esc(decls.join(";")) + '"' : "";
      return '<div class="' + cls + '"' + ls + ' aria-hidden="true"></div>';
    }

    var kids = Array.isArray(node.children)
      ? node.children
          .map(function (c) {
            return renderAppearanceNode(c, variant);
          })
          .join("")
      : "";
    var layout = flexStyle(node.layout);
    var combined = layout
      ? decls.length
        ? layout + ";" + decls.join(";")
        : layout
      : decls.join(";");
    var st = combined ? ' style="' + esc(combined) + '"' : "";
    return '<div class="' + cls + '"' + st + ">" + kids + "</div>";
  }

  // doc = the parsed anatomy JSON ({ slug, root, variantDefaults, ... }).
  // opts.variant = the parsed axis object (from parseVariant at the seam).
  function renderAppearanceComponent(doc, opts) {
    if (!doc || !doc.root || typeof doc.root !== "object") return "";
    opts = opts || {};
    var variant = opts.variant || null;
    var slug = doc.slug || "";
    return (
      '<div class="ds-appearance ds-appearance--' +
      esc(slug) +
      '" data-ds-slug="' +
      esc(slug) +
      '">' +
      renderAppearanceNode(doc.root, variant) +
      "</div>"
    );
  }

  exports.resolveNodeAppearance = resolveNodeAppearance;
  exports.renderAppearanceNode = renderAppearanceNode;
  exports.renderAppearanceComponent = renderAppearanceComponent;
})(
  typeof module !== "undefined"
    ? module.exports
    : (window.appearanceRender = window.appearanceRender || {}),
);
