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

  // Icon geometry dual-source resolution (F2). Mirrors ds-html-map.js's
  // dsIcons idiom verbatim (browser global set by the assembler's
  // buildDsIconsScript(), injected BEFORE this file's <script> tag runs — see
  // assemble-preview.js TYPE_CONFIGS.flow.renderers ordering — or a guarded
  // require of the vendored read-surface in Node). Geometry-only
  // ({ slug: {viewBox, body} }). Resolved once at module load, same as
  // `style` above; never throws (guarded try/catch degrades to null, then
  // `|| {}`), preserving the interpreter's no-fs purity contract (this module
  // never touches fs directly — any file I/O lives behind PATHS/require).
  var dsIcons =
    (typeof window !== "undefined" && window.dsIcons) ||
    (typeof require !== "undefined" &&
      (function () {
        try {
          var p = require("../lib/paths.js").components.icons.svg;
          return p ? require(p).icons : null;
        } catch (e) {
          return null;
        }
      })()) ||
    {};

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
        [p.top || "0", p.right || "0", p.bottom || "0", p.left || "0"].join(
          " ",
        ),
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
          if (e[k] === undefined) return;
          // C1: `border` and `text` are nested objects. A delta that changes
          // only one sub-key (e.g. border.color, no width) must NOT drop the
          // base sub-keys via whole-object replace, so deep-merge when both
          // sides are plain objects. A null/primitive delta still replaces
          // wholesale (so a variant can remove a border with `border: null`).
          if (
            (k === "border" || k === "text") &&
            isPlainObject(out[k]) &&
            isPlainObject(e[k])
          ) {
            out[k] = Object.assign({}, out[k], e[k]);
          } else {
            out[k] = e[k];
          }
        });
      }
    }
    return out;
  }

  function isPlainObject(v) {
    return v != null && typeof v === "object" && !Array.isArray(v);
  }

  // F2: real icon glyphs. Resolves node.slug against an icon map ({ slug:
  // {viewBox, body} }) — opts.iconMap when the CALLER supplied that key at
  // all (even null/{}, so tests can force the "map absent" branch without
  // fighting Node's always-defined `require`), else the module-level
  // dual-sourced `dsIcons` default (real production behavior). Trust ONLY
  // node.slug — NEVER `name`, which carries decorative Figma layer names
  // like "Vector"/"Column"/"Button" (verified fact from the F2 scouting
  // pass: 289/321 instance nodes have a null slug and must keep falling
  // through to the placeholder). Returns null (never throws) when the slug
  // is absent, unresolved, or the map entry is malformed, so the caller
  // falls through to the existing placeholder/container path unchanged.
  function renderIconGlyph(node, resolved, opts) {
    var slug = node.slug;
    if (typeof slug !== "string" || !slug) return null;
    var iconMap =
      opts && Object.prototype.hasOwnProperty.call(opts, "iconMap")
        ? opts.iconMap
        : dsIcons;
    var icon = iconMap && iconMap[slug];
    if (
      !icon ||
      typeof icon.viewBox !== "string" ||
      typeof icon.body !== "string"
    )
      return null;
    // Styling: NEVER background/border/radius on a resolved glyph — a
    // neutral background behind a transparent glyph is the washout-bug
    // class this task exists to close. A single `color:` decl (if the
    // resolved appearance carries one) lets `currentColor` pick it up;
    // otherwise no style attribute at all (inherit from the parent).
    var colorDecl = style.iconColorDecl(resolved);
    var cs = colorDecl ? ' style="' + esc(colorDecl) + '"' : "";
    return (
      '<svg class="ds-icon"' +
      cs +
      ' viewBox="' +
      esc(icon.viewBox) +
      '" aria-hidden="true">' +
      icon.body +
      "</svg>"
    );
  }

  function renderAppearanceNode(node, variant, opts) {
    if (!node || typeof node !== "object") return "";
    var kind = node.kind || "node";
    var cls = "ds-appearance__" + kind;
    var resolved = resolveNodeAppearance(node, variant);

    // F2: anatomy docs emit real glyph nodes as kind:"instance" (never
    // kind:"icon"/"image" per C2 below); kind==="icon" is accepted too
    // (harmless if a future doc ever emits it) but kind==="vector" must
    // NEVER attempt slug resolution here — decorative vector paths, not
    // icon-component instances. Unresolved -> null -> falls through:
    // "instance" reaches the generic container branch below (byte-identical
    // to pre-F2 behavior), "icon" reaches the placeholder branch next.
    // Tried BEFORE decls are computed: a resolved glyph never uses `decls`
    // (only `resolved`, via iconColorDecl), so an early return here skips
    // appearanceToDecls entirely on the hot path.
    // Ambiguity note (B4): a slug that resolves in icons.json always wins
    // here over any same-named nested component instance (e.g. a Button
    // reused under another component's anatomy). Today that ambiguity never
    // actually arises in the vendored data (see
    // appearance-icon-orphan-gate.test.js's collision tripwire), but if a
    // future vendor sync ever introduces a non-icon component sharing an
    // icon's slug, this call site would silently render the icon glyph
    // instead of falling through to the component placeholder.
    if (kind === "instance" || kind === "icon") {
      var svg = renderIconGlyph(node, resolved, opts);
      if (svg) return svg;
    }

    var decls = style.appearanceToDecls(resolved);

    if (kind === "text") {
      var ts = decls.length ? ' style="' + esc(decls.join(";")) + '"' : "";
      return (
        '<span class="' +
        cls +
        '"' +
        ts +
        ">" +
        esc(node.text || "") +
        "</span>"
      );
    }
    // C2: the anatomy classifier emits "icon" (and "vector"), never "image".
    // These media leaves carry no text children; render an aria-hidden box the
    // CSS floor sizes + fills. ("image" was dead here, so it is dropped.)
    if (kind === "icon" || kind === "vector") {
      var ls = decls.length ? ' style="' + esc(decls.join(";")) + '"' : "";
      return '<div class="' + cls + '"' + ls + ' aria-hidden="true"></div>';
    }

    var kids = Array.isArray(node.children)
      ? node.children
          .map(function (c) {
            return renderAppearanceNode(c, variant, opts);
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
  // opts.iconMap (F2, optional) = an injected icon-geometry map that
  // overrides the module-level dsIcons default — see renderIconGlyph above.
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
      renderAppearanceNode(doc.root, variant, opts) +
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
