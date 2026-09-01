// scripts/renderers/html-renderers/ds-html-map.js
// Hi-fi DS component → HTML mapping. Mirrors fm-html-map.js. Switches on node.dsSlug.
// Works in Node (testing) and browser (inlined, sets window.dsHtmlMap).
//
// Variant values arrive already mapped to the DS side (an upstream transformer
// maps FM→DS), so DS variant values are read directly. Leaf styles live in the
// sibling ds-base.css (100% bound to vendored --zen-* tokens).

(function (exports) {
  "use strict";

  var fm =
    (typeof window !== "undefined" && window.fmHtmlMap) ||
    (typeof require !== "undefined" && require("./fm-html-map")) ||
    {};
  /**
   * resolveSlug(slug) - the retired name a component answers to now, or the
   * slug unchanged.
   *
   * Exported because renderDSComponent is NOT the only place a slug is keyed.
   * ds-anatomy-map's collectDsSlugs and collectDsSlugVariants key the injected
   * doc and variant-style maps by the AUTHORED slug, and the renderer then
   * looks them up under the RESOLVED one, so unless all three agree a renamed
   * anatomy-delegated component renders with no doc and no variant colours: it
   * chips, or it paints the wrong ones, silently. That covers far more slugs
   * than the switch does, so one shared resolver is the only safe shape.
   *
   * hasOwnProperty, not a truthiness test: the generated map is null-prototype,
   * but it can also arrive through window.dsRetiredSlugs as a plain object,
   * where "constructor" or "toString" resolve through Object.prototype to
   * something truthy and put a stringified function in the markup.
   */
  function resolveSlug(slug) {
    if (!slug || typeof slug !== "string") return slug;
    // The ledger this repo owns is consulted first, then whatever the host
    // supplied. A consumer must not be able to repoint a recorded rename from
    // the page: that is the consumer-restates-producer defect wearing a new hat.
    var own = LEDGER_SLUGS;
    if (own && Object.prototype.hasOwnProperty.call(own, slug))
      return own[slug];
    var host = hostSlugs();
    if (host && Object.prototype.hasOwnProperty.call(host, slug))
      return host[slug];
    return slug;
  }

  // Retired slug -> current slug, derived from the identity ledger by
  // scripts/render/derive-retired-slugs.js. Two supply paths, because this file
  // is UMD and there is no fs in the browser.
  //
  // Path one, the sibling module, resolved ONCE at load: a require cannot change
  // under us, and this is the ledger's own answer, so it wins in resolveSlug.
  // The require is WRAPPED because `require` throws on a missing module before
  // `||` can fall through, and this file is vendored into consumers that prune
  // their install trees for size, so an absent sibling would take out the entire
  // renderer at load rather than one component. An absent or empty ledger both
  // fall through to the host in resolveSlug, and deliberately so: an empty map
  // is a legitimate state (no renames recorded yet) and is indistinguishable
  // from a pruned one, so gating the host read on "the ledger is missing" would
  // make a consumer whose ledger simply has no renames ignore its own map,
  // which is #603 again in the one state where it cannot be detected.
  var LEDGER_SLUGS = (function () {
    var supplied = null;
    if (typeof require !== "undefined") {
      try {
        supplied = require("./ds-retired-slugs");
      } catch (e) {
        supplied = null;
      }
    }
    return (supplied && supplied.RETIRED_SLUGS) || null;
  })();

  // Path two, the host's map, read LAZILY on every lookup rather than
  // snapshotted at load. A browser has no require, so window is the only supply
  // path there, and a host inlines its modules in whatever order its list carries.
  // Snapshotting here meant that a host loading this file before the map module
  // held an empty map for the life of the page, with every renamed slug chipping
  // and nothing going red, because an empty map is a legitimate state (no
  // renames recorded yet). Reading late removes the ordering dependency instead
  // of documenting it (#603).
  function hostSlugs() {
    var supplied = typeof window !== "undefined" && window.dsRetiredSlugs;
    return (supplied && supplied.RETIRED_SLUGS) || null;
  }
  // The `esc`/`parseVariant`/`normalizeProps` fallbacks below are intentional
  // inline mirrors of fm-html-map's helpers, kept for the browser-without-
  // preloaded-fm case (no window.fmHtmlMap and no require). Do NOT delete them
  // as "dead code" in a future cleanup — they are the only implementation when
  // `fm` resolves to {}.
  var esc =
    fm.esc ||
    function (s) {
      if (s == null) return "";
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    };
  var parseVariant =
    fm.parseVariant ||
    function (variantString) {
      if (!variantString) return {};
      var result = {};
      variantString.split(",").forEach(function (part) {
        var kv = part.trim().split("=");
        if (kv.length === 2) result[kv[0].trim()] = kv[1].trim();
      });
      return result;
    };
  var normalizeProps =
    fm.normalizeProps ||
    function (p) {
      return p || {};
    };

  // Composite-key helper (anatomyVariantKey) used by the tag-read-only
  // token-injection case below. Same guard-with-inline-fallback shape as fm
  // above: this module runs in BOTH Node (require works) and the browser
  // deliverable (require may be absent), so the fallback body is a verbatim
  // mirror of anatomy-variant-key.js kept here for the browser-without-require
  // case. Do NOT delete it as dead code — it is the only implementation when
  // `require` is unavailable.
  var anatomyKey =
    (typeof require !== "undefined" && require("./anatomy-variant-key.js")) ||
    {};
  var anatomyVariantKey =
    anatomyKey.anatomyVariantKey ||
    function (slug, variant) {
      if (!variant || typeof variant !== "object") return slug;
      var keys = Object.keys(variant).sort();
      if (!keys.length) return slug;
      var parts = [];
      for (var i = 0; i < keys.length; i++) {
        parts.push(keys[i] + "=" + variant[keys[i]]);
      }
      return slug + "|" + parts.join(",");
    };

  // Appearance renderer (Phase 1B): browser global (injected by the
  // assembler) or the sibling module in Node. Same guard-with-fallback shape
  // as `fm`/`anatomyKey`/`dsIcons` above — this file is inlined VERBATIM into
  // browser deliverables, so the require must stay guarded (never a bare
  // top-level `require`). Falls back to {} so the default: case below can
  // check for the method presence and degrade to gracefulChip() instead of
  // throwing.
  var appearanceRender =
    (typeof window !== "undefined" && window.appearanceRender) ||
    (typeof require !== "undefined" && require("../appearance-render.js")) ||
    {};

  // Icon geometry: browser global (injected by the assembler) or the vendored
  // read-surface in Node. Geometry-only { slug: {viewBox, body} }.
  var dsIcons =
    (typeof window !== "undefined" && window.dsIcons) ||
    (typeof require !== "undefined" &&
      (function () {
        try {
          var p = require("../../lib/paths.js").components.icons.svg;
          return p ? require(p).icons : null;
        } catch (e) {
          return null;
        }
      })()) ||
    {};

  // Relocation phase 1: knowledge has no lib/paths, so the module-level dsIcons
  // resolves to {}. An injected icon map (setIcons) takes precedence, mirroring
  // setAnatomyDocMap/setVariantStyleMap. Callers MUST reset with setIcons(null)
  // after rendering to avoid cross-render state leak.
  var injectedIcons = null;
  function setIcons(map) {
    injectedIcons = map || null;
  }

  // Artwork tier (graphics.json) injection, mirroring the dsIcons seam above. The
  // module-level default cannot resolve from a vendored layout, so a consumer
  // injects the map (knowledge's derive, and the plugin via its accessor). A bare
  // <svg class="ds-graphic"> so render.css can size it; unknown slug -> "" (never
  // throws), same contract as renderIcon.
  var injectedGraphics = null;
  function setGraphics(map) {
    injectedGraphics = map || null;
  }
  function renderGraphic(slug) {
    var source = injectedGraphics || {};
    var g = source && source[slug];
    if (!g || !g.viewBox || !g.body) return "";
    return (
      '<svg class="ds-graphic" viewBox="' +
      esc(g.viewBox) +
      '" aria-hidden="true">' +
      g.body +
      "</svg>"
    );
  }

  // renderIcon(slug, {rotate}) -> bare <svg> carrying the ds-icon base class
  // (plus ds-icon--rotN when rotated). Unknown slug -> '' (never throws; the
  // orphan-ref gate prevents shipping one).
  function renderIcon(slug, opts) {
    var source = injectedIcons || dsIcons;
    var icon = source && source[slug];
    if (!icon || !icon.viewBox || !icon.body) return "";
    var iconCls = "ds-icon";
    if (opts && opts.rotate) iconCls += " ds-icon--rot" + opts.rotate;
    return (
      '<svg class="' +
      iconCls +
      '" viewBox="' +
      esc(icon.viewBox) +
      '" aria-hidden="true">' +
      icon.body +
      "</svg>"
    );
  }

  // Captured resolved-appearance colors for digram-item-types' 27 "Item type"
  // values (components/dist/anatomy/digram-item-types.json, root.appearance.variants).
  // Same species of problem as tag-read-only's per-Color palette: many color
  // variants driven by design-tool facts, not a small fixed brand set, but
  // simpler than tag-read-only's build-time variant-style-map injection (no
  // theme-swap requirement here), so this is a plain lookup table instead of
  // a new injection seam. Custom 1 and Custom 15 have no captured entry;
  // DIGRAM_ITEM_TYPE_COLORS falls back to "Category" for any unmapped value.
  var DIGRAM_ITEM_TYPE_COLORS = {
    // capture: root.appearance.variants in anatomy/digram-item-types.json.
    // Topic 1..10 arrived with Figma v2.7.0 and take the axis from 28 to 38
    // values; unlike every other member of this table they are saturated rather
    // than pastel, so falling back to Category painted all ten peach.
    "Topic 1": "#a17ab6",
    "Topic 2": "#8b00e8",
    "Topic 3": "#00b6e1",
    "Topic 4": "#003786",
    "Topic 5": "#75b86b",
    "Topic 6": "#299315",
    "Topic 7": "#eabd34",
    "Topic 8": "#ef8d00",
    "Topic 9": "#a82743",
    "Topic 10": "#b22700",
    Category: "#ffdacf",
    Field: "#d3efcd",
    "Custom 10": "#d3efcd",
    "Custom 11": "#f9ffea",
    "Custom 12": "#e1eacb",
    "Custom 13": "#e1eacb",
    "Custom 14": "#e1eacb",
    "Custom 16": "#e2e4dd",
    "Custom 2": "#ffd6d8",
    "Data process": "#ffd6d8",
    "Custom 3": "#dde6ec",
    "Custom 6": "#dde6ec",
    "Output port": "#dde6ec",
    "Custom 4": "#e1e5ff",
    "Custom 5": "#cadcf7",
    "Data product": "#cadcf7",
    "Custom 7": "#d0efed",
    "Custom 8": "#d0efed",
    "Custom 9": "#d3e7e0",
    Dataset: "#cfeafd",
    "Glossary 1": "#fff9e5",
    "Use case": "#fff9e5",
    "Glossary 2": "#ffebce",
    "Glossary 3": "#fffbef",
    "Glossary 4": "#feeddc",
    "Glossary 5": "#fff5d5",
    Visualization: "#eed7ff",
  };
  var DIGRAM_ITEM_TYPE_TOKENS = {
    Field: "--zen-color-success-50",
  };
  function digramItemTypeStyle(itemType) {
    var bg =
      DIGRAM_ITEM_TYPE_COLORS[itemType] || DIGRAM_ITEM_TYPE_COLORS.Category;
    var token = DIGRAM_ITEM_TYPE_TOKENS[itemType];
    return token
      ? "background:var(" + token + ", " + bg + ")"
      : "background:" + bg;
  }

  // Captured resolved-appearance colors for digram-topic's 10 "Type" values
  // (components/dist/anatomy/digram-topic.json, root.appearance + variants).
  // "Light purple" is the variant default (no explicit variants entry; it's
  // the root-level captured background).
  var DIGRAM_TOPIC_COLORS = {
    "Light purple": "#a17ab6",
    "Dark blue": "#003786",
    "Dark green": "#299315",
    "Dark orange": "#b22700",
    "Dark purple": "#8b00e8",
    "Light blue": "#00b6e1",
    "Light green": "#75b86b",
    Orange: "#ef8d00",
    Red: "#a82743",
    Yellow: "#eabd34",
  };

  // Captured resolved-appearance border colors for metamodel's 5 Type
  // values (components/dist/anatomy/metamodel.json, root.appearance +
  // variants). Border width (1.5px) and radius (6px) are constant across every
  // variant; only the color changes. "Dataset" is the variant default.
  var METAMODEL_TYPE_BORDERS = {
    Dataset: { color: "#0283be", token: "--zen-color-primary-500" },
    "Business Term": { color: "#a76605", token: "--zen-color-warning-800" },
    "Data Process": { color: "#a82743", token: null },
    Field: { color: "#145f04", token: "--zen-color-success-800" },
    Visualisation: { color: "#7900cb", token: null },
  };
  // The Connector group is captured as `{background: null, radius: null,
  // border: null}`: connectors are lines between nodes, not boxes, so the
  // capture is stating an absence rather than failing to record one. Falling
  // through to the Dataset default painted each of the four a 1.5px blue box
  // the design does not have. Returning "" renders no border rule at all.
  var METAMODEL_BORDERLESS = /^Connector /;
  function metamodelBorderStyle(type) {
    if (METAMODEL_BORDERLESS.test(String(type || ""))) return "";
    var b = METAMODEL_TYPE_BORDERS[type] || METAMODEL_TYPE_BORDERS.Dataset;
    return b.token
      ? "border-color:var(" + b.token + ", " + b.color + ")"
      : "border-color:" + b.color;
  }

  // Two-character initials badge, derived from the item type's own name rather
  // than from a hand-maintained list. Derivation, not capture: no anatomy JSON
  // in this family holds an initials layer at all, so there is nothing to quote.
  // Multi-word takes the first letter of the first two words (Business Term ->
  // BT, Data Process -> DP); single-word takes its first two letters (Dataset ->
  // DA, Field -> FI). Uppercase for both shapes, one convention: .ds-item-type
  // applies no text-transform, so the string is exactly what a reader sees, and
  // the badges already rendered into that span read uppercase.
  function itemTypeInitials(type) {
    var words = String(type == null ? "" : type)
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!words.length) return "";
    var letters =
      words.length > 1
        ? words[0].charAt(0) + words[1].charAt(0)
        : words[0].slice(0, 2);
    return letters.toUpperCase();
  }

  // Inline icon glyphs (geometry in raw px — viewBox coords, not design tokens).
  // The button/input/checkbox/tag/card glyphs now come from renderIcon() (real
  // vendored DS icons, orphan-ref gated). The search magnifier stays hardcoded
  // for now — no clean vendored slug match yet.
  var SVG_SEARCH =
    '<svg viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M14 14l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

  // Bell outline — notification button icon (20×20, geometry from anatomy).
  // Stroke-only so it responds to currentColor on the action button.
  var SVG_BELL =
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
    '<path d="M10 2a6 6 0 0 0-6 6v3.5l-1.5 2V15h15v-1.5L16 11.5V8a6 6 0 0 0-6-6z" stroke-linejoin="round"/>' +
    '<path d="M8 15a2 2 0 0 0 4 0" stroke-linecap="round"/>' +
    "</svg>";

  // 3×3 dot/square grid — app-switcher button icon (20×20, fill, geometry from anatomy).
  var SVG_APPS =
    '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">' +
    '<rect x="3" y="3" width="4" height="4" rx="1"/>' +
    '<rect x="8" y="3" width="4" height="4" rx="1"/>' +
    '<rect x="13" y="3" width="4" height="4" rx="1"/>' +
    '<rect x="3" y="8" width="4" height="4" rx="1"/>' +
    '<rect x="8" y="8" width="4" height="4" rx="1"/>' +
    '<rect x="13" y="8" width="4" height="4" rx="1"/>' +
    '<rect x="3" y="13" width="4" height="4" rx="1"/>' +
    '<rect x="8" y="13" width="4" height="4" rx="1"/>' +
    '<rect x="13" y="13" width="4" height="4" rx="1"/>' +
    "</svg>";

  // Parse a comma-separated list prop (nav items, tabs, crumbs) into a trimmed,
  // empty-dropped array. `fallback` is used when raw is falsy (matches the prior
  // inline `String(props.Items || "default")` behavior exactly).
  function parseItems(raw, fallback) {
    return String(raw || fallback || "")
      .split(",")
      .map(function (s) {
        return s.trim();
      })
      .filter(function (s) {
        return s.length > 0;
      });
  }

  // Resolve the active item for a list prop: the trimmed Active value when it
  // matches an item (case-insensitive), else the first item. Falls back to
  // first on absent OR non-matching Active, so a stale/renamed Active never
  // yields zero-active. Case-insensitive matching aligns with flow-renderer.js.
  function resolveActive(items, active) {
    var a = active != null ? String(active).trim().toLowerCase() : "";
    for (var i = 0; i < items.length; i++) {
      if (items[i].toLowerCase() === a) return items[i];
    }
    return items[0];
  }

  // Anatomy DOC map (Phase 1B) for the default: seam — { slug → doc } where
  // doc is the captured-appearance anatomy doc (Task 4's
  // buildDsAnatomyDocMap output), rendered per-instance so the instance's own
  // variant selects the right colors. Two supply paths: window.__dsAnatomyDocs
  // (browser) or setAnatomyDocMap() (server-side Node render). (The former
  // slug→pre-rendered-HTML anatomy map and its setAnatomyMap setter —
  // "path c" — was retired in Group C; this doc map is now the only anatomy
  // supply path.)
  var _serverAnatomyDocs = null;

  /**
   * setAnatomyDocMap(map) — supply the assemble-time anatomy doc map for
   * server-side rendering. Pass a plain object { slug → doc }, or
   * null/undefined to clear it (callers MUST reset after a render so state
   * never leaks).
   */
  function setAnatomyDocMap(map) {
    _serverAnatomyDocs = map && typeof map === "object" ? map : null;
  }

  // Variant-style map for token-injection into delegated hand-authored
  // templates (slice 1: tag-read-only). Same two supply paths as the anatomy
  // map above: window.__dsVariantStyles (browser) or setVariantStyleMap()
  // (server-side Node render).
  var _serverVariantStyleMap = null;

  /**
   * setVariantStyleMap(map) — supply the assemble-time variant-style map for
   * server-side rendering. Pass a plain object
   * { anatomyVariantKey(slug, variant) → inline-style-string }, or
   * null/undefined to clear it (callers MUST reset after a render so state
   * never leaks).
   */
  function setVariantStyleMap(map) {
    _serverVariantStyleMap = map && typeof map === "object" ? map : null;
  }

  /**
   * renderDSComponent(node)
   * node = { type: 'INSTANCE', library: 'ds', dsSlug: 'button', variant: '...', props: {...}, name: '...' }
   * Returns an HTML string. Never throws — degrades to a graceful chip.
   */
  function renderDSComponent(node) {
    node = node || {};
    var slug = node.dsSlug || "";
    // A slug is a NAME, not an identity: Figma renames components and the
    // identity ledger records it. Every consumer that had authored the old name
    // used to break on the refresh carrying the rename, and each repaired
    // itself by hand-editing its own copy of the fact (the v0.34.156 refresh
    // broke 37 tests in the plugin across goldens, worked examples, an fm map
    // and two allowlists, for three renames). This is the one place every
    // consumer's slug passes through and the repo that owns the ledger, so it
    // resolves here, once, for all of them.
    //
    // RETIRED_SLUGS holds only retired names, and buildRenameIndex guarantees a
    // retired name is never also a current one, so this cannot shadow a live
    // slug and needs no guard. A DELETED component is absent from the map and
    // still falls to the chip below, which is the honest answer: it has no
    // successor to resolve to.
    slug = resolveSlug(slug);
    var name = node.name || slug;

    // Graceful labeled chip — used for unmapped slugs (default case) AND as the
    // never-throws fallback if any case throws on a hostile prop shape. A single
    // bad node must never blank the whole preview, so this interpreter (like
    // fm-html-map's) guarantees it never throws.
    function gracefulChip() {
      // Deliberately reports the RESOLVED slug, not the authored one.
      //
      // A review asked for the authored name to ride along, on the grounds that
      // a designer debugging a chip for content authored as `old-card` is told
      // "card", which appears nowhere in their flow. Carrying it breaks the
      // invariant this whole change rests on, that a retired slug renders
      // EXACTLY what its current name renders, and the invariant is worth more:
      // the resolved name is also the one a reader should act on, since it is
      // what the component is called now and what any leaf would be keyed by.
      //
      // The case that argument was really about keeps its own name for free: a
      // DELETED component resolves to nothing, so authored and resolved are the
      // same string and the chip already names what was authored.
      return (
        '<span class="ds-component" data-slug="' +
        esc(slug) +
        '" data-name="' +
        esc(name) +
        '">' +
        esc(name) +
        "</span>"
      );
    }

    try {
      var v = parseVariant(node.variant || "");
      var props = normalizeProps(node.props);

      switch (slug) {
        case "button": {
          // Button taxonomy is Intent×Emphasis as of knowledge v0.34.x. Map the
          // two axes onto the hand-authored emphasis classes; fall back to the
          // legacy single Type axis when Intent/Emphasis are absent (older
          // flow-data + the frozen ds-button goldens still feed Type=).
          var btnType;
          if (v.Intent || v.Emphasis) {
            var isCritical = v.Intent === "Critical";
            var emphasis = v.Emphasis || "Filled";
            if (emphasis === "Outlined") {
              btnType = isCritical ? "critical-secondary" : "secondary";
            } else if (emphasis === "Ghost") {
              btnType = isCritical ? "critical-secondary" : "tertiary";
            } else {
              // Filled or Icon-only (icon styling comes from props, as the
              // legacy Icon type did → primary base class).
              btnType = isCritical ? "critical" : "primary";
            }
          } else {
            var typeMap = {
              Primary: "primary",
              Secondary: "secondary",
              Tertiary: "tertiary",
              "Critical primary": "critical",
              "Critical secondary": "critical-secondary",
              Icon: "primary",
            };
            btnType = typeMap[v.Type] || "primary";
          }
          var btnCls = "ds-button ds-button--" + btnType;
          if (v.Size === "Small") btnCls += " ds-button--small";
          if (v.State === "Disabled") btnCls += " is-disabled";
          var lead = props["Leading icon show"]
            ? '<span class="ds-button__icon">' + renderIcon("add") + "</span>"
            : "";
          var trail = props["Trailing icon show"]
            ? '<span class="ds-button__icon">' +
              renderIcon("arrow-down") +
              "</span>"
            : "";
          var label = esc(props.Label || "");
          return (
            '<button class="' +
            btnCls +
            '"' +
            (v.State === "Disabled" ? " disabled" : "") +
            ">" +
            lead +
            label +
            trail +
            "</button>"
          );
        }

        case "link": {
          // Registry axis: State = Default | Hover | Focus | Pressed |
          // Expanded | Visited | Disabled -- a secondary axis, link has no
          // Intent/Emphasis/Type identity axis. Mirrors the button case's
          // single-element structure with the element swapped to <a>; an
          // <a> has no disabled attribute, so Disabled is conveyed via
          // aria-disabled + the is-disabled class instead. No href, mirroring
          // the breadcrumb case's <a> convention: this is a documentation/
          // gallery render, not a live nav, and an href would trip the
          // bundle's self-contained-card check the same way an <img src=>
          // or <link href=> would.
          var lnkState = v.State || "Default";
          var lnkDisabled = lnkState === "Disabled";
          var lnkCls = "ds-link";
          if (lnkState === "Visited") lnkCls += " ds-link--visited";
          if (lnkState === "Hover") lnkCls += " ds-link--hover";
          if (lnkState === "Focus") lnkCls += " ds-link--focus";
          if (lnkState === "Pressed") lnkCls += " ds-link--pressed";
          if (lnkState === "Expanded") lnkCls += " ds-link--expanded";
          if (lnkDisabled) lnkCls += " is-disabled";
          return (
            '<a class="' +
            lnkCls +
            '"' +
            (lnkDisabled ? ' aria-disabled="true"' : "") +
            ">" +
            esc(props.Label || "Link") +
            "</a>"
          );
        }

        case "text-input": {
          var inLabel = esc(props.Label || "Label");
          var inPlaceholder = esc(
            props["Placeholder text"] || "Placeholder text",
          );
          var fieldCls = "ds-field";
          if (v.States === "Disabled") fieldCls += " is-disabled";
          // Trailing chevron is for selects/dropdowns only — a plain text input
          // must not imply one. Render the icon span only when a trailing-icon
          // prop is present.
          var inTrail = props["Trailing icon"]
            ? '<span class="ds-input__icon">' +
              renderIcon("arrow-down") +
              "</span>"
            : "";
          return (
            '<div class="' +
            fieldCls +
            '">' +
            '<div class="ds-field__label-row"><span class="ds-field__label">' +
            inLabel +
            "</span></div>" +
            '<div class="ds-input"><span class="ds-input__text">' +
            inPlaceholder +
            "</span>" +
            inTrail +
            "</div>" +
            "</div>"
          );
        }

        case "checkbox": {
          var cbCls = "ds-checkbox";
          var cbGlyph = renderIcon("simple-check");
          if (v.Selection === "Checked") {
            cbCls += " ds-checkbox--checked";
          } else if (v.Selection === "Indeterminate") {
            cbCls += " ds-checkbox--indeterminate";
            cbGlyph =
              '<svg class="ds-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="2" rx="1" fill="currentColor"/></svg>';
          }
          if (v.State === "Disabled") cbCls += " is-disabled";
          var cbLabel = esc(props.Label || "Label");
          return (
            '<label class="' +
            cbCls +
            '"><span class="ds-checkbox__box">' +
            '<span class="ds-checkbox__check">' +
            cbGlyph +
            "</span>" +
            '</span><span class="ds-checkbox__label">' +
            cbLabel +
            "</span></label>"
          );
        }

        case "radio": {
          var rbCls = "ds-radio";
          if (v.Selection === "Selected") rbCls += " ds-radio--checked";
          if (v.Format === "Card format") rbCls += " ds-radio--card";
          if (v.State === "Disabled") rbCls += " is-disabled";
          var rbLabel = esc(props.Label || "Label");
          // Optional slot: no helper prop, no helper element. The gallery's
          // helper string lives in matrix.js SPECIMEN_PROPS, not here.
          var rbHelper =
            props["Helper text"] && props["Show Helper text"] !== false
              ? '<span class="ds-radio__helper">' +
                esc(props["Helper text"]) +
                "</span>"
              : "";
          return (
            '<label class="' +
            rbCls +
            '">' +
            '<span class="ds-radio__circle"><span class="ds-radio__dot"></span></span>' +
            '<span class="ds-radio__text"><span class="ds-radio__label">' +
            rbLabel +
            "</span>" +
            rbHelper +
            "</span>" +
            "</label>"
          );
        }

        case "toggle": {
          var tgCls = "ds-toggle";
          if (v.Selection === "On") tgCls += " ds-toggle--on";
          if (v["Toggle location"] === "Right") tgCls += " ds-toggle--right";
          if (v.State === "Disabled") tgCls += " is-disabled";
          var tgLabel = esc(props.Label || "Label");
          // Same as radio: optional slot, omitted when the prop is absent.
          var tgHelper =
            props["Helper text"] && props["Show Helper text"] !== false
              ? '<span class="ds-toggle__helper">' +
                esc(props["Helper text"]) +
                "</span>"
              : "";
          return (
            '<label class="' +
            tgCls +
            '">' +
            '<span class="ds-toggle__switch"><span class="ds-toggle__thumb"></span></span>' +
            '<span class="ds-toggle__text"><span class="ds-toggle__label">' +
            tgLabel +
            "</span>" +
            tgHelper +
            "</span>" +
            "</label>"
          );
        }

        case "read-only-tag": {
          // The 2026-08-12 breaking sync folded tag-shared, tag-catalog,
          // tag-stage, tag-status and tag-glossary-item-type INTO this
          // component: the Color axis is gone and a single `Type` axis carries
          // Default | Catalog | Shared | Stage-1..8 | Status-error/-warning/
          // -success. So the modifier below is keyed off v.Type, and each
          // value's fill/border lives in one .ds-tag--<type> rule in
          // ds-base.css, derived from the capture's own per-Type appearance
          // groups (components/dist/anatomy/read-only-tag.json).
          //
          // TWO CAPTURE FACTS CARRIED, NOT PAPERED OVER. Both are values whose
          // modifier class is emitted with NO ds-base.css rule behind it, so
          // they render as the base pill:
          //  - Type=Default IS the base pill's own paint (the capture's default
          //    variant), so a rule for it would be a no-op restating .ds-tag.
          //  - Type=Stage-1 has NO appearance group in the capture at all, so
          //    per the capture it renders exactly as Default. That is the
          //    honest reading; inventing a Stage-1 hue to fill the gap is not.
          //
          // Token-injection (not anatomy replacement) still applies: the
          // hand-authored .ds-tag template (label + icon) stays intact and the
          // harvested per-variant root style is injected as an inline style
          // attr so a flow instance's own variant colors render without
          // dropping the instance label. See buildDsVariantStyleMap
          // (appearance-sourced); the composite key already carries whatever
          // axis the variant names, so the axis change needs nothing there.
          var tagCls = "ds-tag";
          // SHAPE clamp, not a value list: v.Type is user-supplied flow-data
          // (via parseVariant), and an unclamped value would break out of the
          // class attribute and inject markup (XSS) -- the same discipline the
          // retired tag-stage/tag-catalog-item-type cases applied to their own
          // axes. A shape clamp is used rather than a hardcoded set of the 14
          // published values because such a list is a second copy of a
          // registry fact, and every copy of an axis in this file has gone
          // stale at least once. An unknown-but-well-shaped value emits a
          // modifier no rule matches, so it renders as the base pill -- the
          // same outcome as Default and Stage-1, and never a fabricated colour.
          // Emitted uniformly for every value for the same reason: singling out
          // "default" here would hardcode which value the capture happens to
          // call its default today.
          var tagType = v.Type
            ? String(v.Type).toLowerCase().replace(/\s+/g, "-")
            : "";
          if (tagType && /^[a-z0-9-]+$/.test(tagType)) {
            tagCls += " ds-tag--" + tagType;
          }
          // Leading icon: a default-TRUE registry boolean (Leading icon
          // show#7276:0), and the captured default variant does carry the icon
          // child, so it is shown unless explicitly false -- the file's
          // default-true convention (cf. radio / toggle / tag-interactive:
          // `props[x] !== false`). This read `props["Leading icon show"]`
          // truthily before, so every gallery cell (which passes only a Label)
          // rendered without the icon the capture says the component has.
          //
          // WHICH icon is a capture fact too: the anatomy's leading-icon child
          // swaps slug per Type (folder for Catalog, error-/success-/
          // warning-filled for the Status values, its own `add` otherwise).
          // Hand-copied from the capture's per-Type instance-swap groups in
          // components/dist/anatomy/read-only-tag.json, which is the gap #521
          // names: a colour-only gate cannot check an icon slug. The
          // "leading icon slug follows the anatomy's per-Type instance swap"
          // test reads that capture directly and fails when this map drifts,
          // which is how the Stage entries below arrived.
          //
          // Stage-1..8 -> dot is new in the 2026-08-24 breaking sync (#526).
          // The comment above still says Stage-1 has no appearance group; that
          // was true of the fill, and remains true, but the capture now names
          // an icon for the whole Stage range.
          var TAG_TYPE_ICONS = {
            catalog: "folder",
            "stage-1": "dot",
            "stage-2": "dot",
            "stage-3": "dot",
            "stage-4": "dot",
            "stage-5": "dot",
            "stage-6": "dot",
            "stage-7": "dot",
            "stage-8": "dot",
            "status-error": "error-filled",
            "status-success": "success-filled",
            "status-warning": "warning-filled",
          };
          var tagIcon = "";
          if (props["Leading icon show"] !== false) {
            // NO `ds-tag--with-icon` root modifier here. Unlike the ruleless
            // .ds-tag--default / --stage-1 modifiers noted above, which name
            // real published Type values and so each carry a capture fact, that
            // one named no axis value at all: it had no ds-base.css rule, so it
            // painted nothing, and it only restated that the .ds-tag__icon span
            // below exists. That is the no-op namespace hook this file refuses
            // elsewhere (see search-result-card's App=Studio note, and the
            // .ds-tag--gray drop in the same fold-in). It was not free either:
            // a consumer matches rendered tag HTML exactly, and the class broke
            // that match while meaning nothing.
            tagIcon =
              '<span class="ds-tag__icon">' +
              renderIcon(TAG_TYPE_ICONS[tagType] || "add") +
              "</span>";
          }
          var _styleMap =
            (typeof window !== "undefined" && window.__dsVariantStyles) ||
            _serverVariantStyleMap ||
            {};
          var _tagStyle =
            _styleMap[anatomyVariantKey("read-only-tag", v)] || "";
          var _tagStyleAttr = _tagStyle
            ? ' style="' + esc(_tagStyle) + '"'
            : "";
          return (
            '<span class="' +
            tagCls +
            '"' +
            _tagStyleAttr +
            ">" +
            tagIcon +
            esc(props.Label || "") +
            "</span>"
          );
        }

        case "badge": {
          if (v.Type === "Dot") {
            return '<span class="ds-badge ds-badge--dot"></span>';
          }
          // Number (default): the count/text pill.
          return (
            '<span class="ds-badge ds-badge--number">' +
            esc(props.Label || "") +
            "</span>"
          );
        }

        case "avatar": {
          // Registry axes: Type = Default | One group | Two groups
          // (identity); State is secondary (isSecondaryAxis) -- only
          // State=Disabled is wired here (dims the initials), mirroring
          // the badge case's leaf simplicity. Type=One group / Two groups
          // stack circles with a +N overflow when Count>4 (guideline:
          // "Collapse into +N when a group exceeds four avatars"); this
          // geometry is hand-reasoned -- anatomy captured only the single-
          // circle Default leaf (layoutMode NONE, and the group Types have
          // no isolated variant at all).
          var avType = v.Type || "Default";
          var avDisabled = v.State === "Disabled";
          var avInitials = esc(props.Initials || "AV");
          var avSingleCls =
            "ds-avatar" + (avDisabled ? " ds-avatar--disabled" : "");
          var avSingleHtml =
            '<span class="' +
            avSingleCls +
            '"><span class="ds-avatar__initials">' +
            avInitials +
            "</span></span>";

          if (avType === "One group" || avType === "Two groups") {
            var avCountNum = parseInt(
              String(props.Count || "3").replace(/[^0-9-]/g, ""),
              10,
            );
            if (isNaN(avCountNum) || avCountNum < 1) avCountNum = 3;
            var avShown = avCountNum > 4 ? 4 : avCountNum;
            var avChildren = "";
            for (var avI = 0; avI < avShown; avI++) {
              avChildren += avSingleHtml;
            }
            if (avCountNum > 4) {
              avChildren +=
                '<span class="ds-avatar ds-avatar__overflow">+' +
                (avCountNum - 4) +
                "</span>";
            }
            var avGroupHtml =
              '<div class="ds-avatar-group">' + avChildren + "</div>";
            return avType === "Two groups"
              ? avGroupHtml + avGroupHtml
              : avGroupHtml;
          }

          return avSingleHtml;
        }

        case "search": {
          var searchCls = "ds-search";
          // Accept the kit's typo "Dsiabled" as well as the canonical spelling.
          if (v.State === "Disabled" || v.State === "Dsiabled") {
            searchCls += " is-disabled";
          }
          var searchText = esc(props["Placeholder text"] || "Search");
          return (
            '<div class="' +
            searchCls +
            '"><span class="ds-search__icon">' +
            SVG_SEARCH +
            '</span><span class="ds-search__text">' +
            searchText +
            "</span></div>"
          );
        }

        case "digram-item-types": {
          var itItemType = v["Item type"] || "Category";
          var itCls = "ds-item-type";
          // The captured default is the bare state, and it is named here rather
          // than assumed: the axis used to read Small/Default/Large and now
          // reads XS/SM/MD, so a hardcoded "Default" made the DEFAULT size the
          // one emitting a modifier, and pointed it at a class ds-base.css has
          // no rule for. anatomy/digram-item-types.json's variantDefaults says
          // SM. Every other value gets its own modifier, lowercased.
          if (v.Size && v.Size !== "SM") {
            itCls += " ds-item-type--" + v.Size.toLowerCase();
          }
          return (
            '<span class="' +
            itCls +
            '" style="' +
            digramItemTypeStyle(itItemType) +
            '">' +
            esc(props.Initials || props.Label || "") +
            "</span>"
          );
        }

        case "digram-topic": {
          var dtType = v.Type || "Light purple";
          var dtBg =
            DIGRAM_TOPIC_COLORS[dtType] || DIGRAM_TOPIC_COLORS["Light purple"];
          return (
            '<span class="ds-topic" style="background:' +
            dtBg +
            '">' +
            esc(props.Initials || props.Label || "") +
            "</span>"
          );
        }

        case "lineage": {
          var linCls = "ds-lineage-node";
          // The Type axis went from Main item/Sub item to seven values when the
          // lineage components folded together: Individual/Group x main/sub,
          // plus three Connectors. Matching the retired literal "Sub item" made
          // .ds-lineage-node--sub unreachable and painted every sub item as a
          // main node. Matched on the published value's own words, so a value
          // added to this axis keeps working: both sub shapes end in "sub item".
          //
          // The three Connector values are NOT modelled here. They are lines
          // between nodes rather than nodes, the capture records no appearance
          // for them, and inventing one is how a wrong value ships looking
          // right. They render the base node until the artwork is captured.
          if (/sub item$/i.test(String(v.Type || ""))) {
            linCls += " ds-lineage-node--sub";
          }
          if (v.State === "Selected") linCls += " ds-lineage-node--selected";
          if (v.State === "Disabled") linCls += " ds-lineage-node--disabled";
          if (v.Fields === "Expanded") linCls += " ds-lineage-node--expanded";

          var linItemType = v["Item type"] || "Category";
          var linBadge =
            '<span class="ds-item-type" style="' +
            digramItemTypeStyle(linItemType) +
            '">' +
            // derived: the capture has no initials layer; its nested tag reads "powerbi"
            esc(props["Item type initials"] || "PB") +
            "</span>";

          // powerbi/identification-key have no captured icon or graphic asset
          // yet (components/dist/icons/icons.json / graphics/graphics.json);
          // renderIcon degrades to "" for an unmapped slug, so these two
          // spans simply don't render until the real assets land (a Figma
          // export task tracked separately, not part of this component's
          // own scope).
          var linSourceIcon = renderIcon("powerbi");
          var linKeyIcon = renderIcon("identification-key");
          var linExpandIcon = renderIcon("arrow-down", { rotate: 180 });

          return (
            '<div class="' +
            linCls +
            '">' +
            linBadge +
            '<span class="ds-lineage-node__label">' +
            esc(props.Label || props.Title || "") +
            "</span>" +
            (linSourceIcon
              ? '<span class="ds-lineage-node__source">' +
                linSourceIcon +
                "</span>"
              : "") +
            (linKeyIcon
              ? '<span class="ds-lineage-node__key">' + linKeyIcon + "</span>"
              : "") +
            '<button class="ds-lineage-node__expand" aria-label="' +
            (v.Fields === "Expanded" ? "Collapse" : "Expand") +
            '">' +
            linExpandIcon +
            "</button>" +
            "</div>"
          );
        }

        case "lineage-grouped-node": {
          var lgnCls = "ds-lineage-group";
          if (v.State === "Expanded") lgnCls += " ds-lineage-group--expanded";

          var lgnItemType = v["Item type"] || "Category";
          var lgnBadge =
            '<span class="ds-item-type" style="' +
            digramItemTypeStyle(lgnItemType) +
            '">' +
            // derived: the capture has no initials layer; its nested button reads "2 datasets"
            esc(props["Item type initials"] || "DS") +
            "</span>";

          // Inline lineage-individual-node's own markup for the one
          // representative child row (don't recurse into
          // renderDSComponent, matching card-for-items' precedent); real
          // grouped children are assembled by the caller, this leaf just
          // proves the group chrome renders.
          var lgnChild =
            '<div class="ds-lineage-node ds-lineage-group__child">' +
            '<span class="ds-item-type" style="' +
            digramItemTypeStyle(lgnItemType) +
            '">' +
            esc(props["Child initials"] || "") +
            "</span>" +
            '<span class="ds-lineage-node__label">' +
            esc(props["Child label"] || "") +
            "</span>" +
            "</div>";

          var lgnToggleIcon = renderIcon("arrow-down", { rotate: 180 });

          return (
            '<div class="' +
            lgnCls +
            '">' +
            '<div class="ds-lineage-group__header">' +
            lgnBadge +
            '<span class="ds-lineage-group__label">' +
            esc(props.Label || props.Title || "") +
            "</span>" +
            '<button class="ds-lineage-group__toggle" aria-label="' +
            (v.State === "Expanded" ? "Collapse group" : "Expand group") +
            '">' +
            lgnToggleIcon +
            "</button>" +
            "</div>" +
            (v.State === "Expanded"
              ? '<div class="ds-lineage-group__children">' + lgnChild + "</div>"
              : "") +
            "</div>"
          );
        }

        case "metamodel": {
          var mwType = v.Type || "Dataset";
          var mwItemType = v["Item type"] || "Category";
          var mwBadge =
            '<span class="ds-item-type" style="' +
            digramItemTypeStyle(mwItemType) +
            '">' +
            // derived from the variant, not captured: the anatomy JSON has no
            // initials layer, and this component's Type axis IS the item-type
            // vocabulary (Dataset, Business Term, Data Process, Field,
            // Visualisation), so one fixed string would contradict the title
            // beside it in four of the five cells.
            esc(props["Item type initials"] || itemTypeInitials(mwType)) +
            "</span>";
          var mwSection = props["Show Section"]
            ? '<div class="ds-metamodel__section">' +
              '<button class="ds-metamodel__collapse" aria-label="Collapse section">' +
              renderIcon("arrow-down") +
              "</button>" +
              '<div class="ds-metamodel__section-body">' +
              esc(props["Section body"] || "") +
              "</div>" +
              "</div>"
            : "";
          return (
            '<div class="ds-metamodel" style="' +
            metamodelBorderStyle(mwType) +
            '">' +
            '<div class="ds-metamodel__header">' +
            mwBadge +
            '<span class="ds-metamodel__title">' +
            esc(props.Title || props.Label || "") +
            "</span>" +
            "</div>" +
            mwSection +
            "</div>"
          );
        }

        case "loader-with-logo": {
          var LOADER_WITH_LOGO_APPS = {
            "Actian Data Intelligence": "loader-logo-adi",
            Studio: "loader-logo-studio",
            Explorer: "loader-logo-explorer",
            Admin: "loader-logo-admin",
          };
          var lwlApp = v.App || "Actian Data Intelligence";
          var lwlLogoSlug =
            LOADER_WITH_LOGO_APPS[lwlApp] ||
            LOADER_WITH_LOGO_APPS["Actian Data Intelligence"];
          var lwlLogo = renderGraphic(lwlLogoSlug);
          var lwlLabel = props.Label
            ? '<span class="ds-loader__label">' + esc(props.Label) + "</span>"
            : "";
          return (
            '<div class="ds-loader-with-logo" role="status" aria-live="polite" aria-label="' +
            esc(props.Label || "Loading") +
            '">' +
            (lwlLogo
              ? '<span class="ds-loader-with-logo__mark">' + lwlLogo + "</span>"
              : "") +
            '<span class="ds-loader__spinner" aria-hidden="true"></span>' +
            lwlLabel +
            "</div>"
          );
        }

        case "global-header": {
          // Top app bar (chrome) — real Studio header, authored from Figma anatomy.
          // anatomy: 1440×64, flex space-between, padding 0 24px.
          // Left  = logo mark + app name label.
          // Center = context dropdown + search bar (when props.Search truthy).
          // Right = What's new · divider · notifications · divider · apps · divider · avatar.
          // NO AI/sparkle trigger — Figma anatomy has none.
          var headerApp = esc(props.App || v["App type"] || "Studio");
          var headerAvatar = esc(props.Account || "AU");
          var headerContext = esc(props.Context || "Catalog");
          var headerContextValue = esc(props.ContextValue || "Default");
          var showSearch =
            props.Search !== false &&
            props.Search !== "false" &&
            props.Search !== 0;

          // Left brand block: logo mark + app name label.
          var brandBlock =
            '<div class="ds-header__brand">' +
            '<span class="ds-header__logo" aria-hidden="true">' +
            renderGraphic(props.Logo || "actian-pyramid") +
            "</span>" +
            '<span class="ds-header__app">' +
            headerApp +
            "</span>" +
            "</div>";

          // Context dropdown: micro label (Catalog) + value in --zen-color-primary-500.
          // chevron-up rotated 180° = chevron-down (anatomy: arrow-down).
          var contextBlock =
            '<div class="ds-header__context">' +
            '<span class="ds-header__context-label">' +
            headerContext +
            "</span>" +
            '<span class="ds-header__context-value">' +
            headerContextValue +
            "</span>" +
            renderIcon("arrow-down") +
            "</div>";

          // Search bar: left scope dropdown + magnifier + input + trailing info.
          // anatomy: 568px max-width, left "Default ▾" scope toggle (128px) then
          // the search input with SVG_SEARCH; a tooltip info icon trails the field.
          var searchBlock = showSearch
            ? '<div class="ds-header__search">' +
              '<span class="ds-header__search-scope">' +
              '<span class="ds-header__search-scope-value">' +
              headerContextValue +
              "</span>" +
              renderIcon("arrow-down") +
              "</span>" +
              '<span class="ds-header__search-field">' +
              '<span class="ds-header__search-icon">' +
              SVG_SEARCH +
              "</span>" +
              '<input class="ds-header__search-input" type="search"' +
              ' placeholder="Search items" aria-label="Search items">' +
              "</span>" +
              '<span class="ds-header__search-info" aria-hidden="true">' +
              renderIcon("info-filled") +
              "</span>" +
              "</div>"
            : "";

          var centerBlock =
            '<div class="ds-header__center">' +
            contextBlock +
            searchBlock +
            "</div>";

          // Right actions cluster: What's new · divider · bell · divider · apps · divider · avatar.
          // anatomy: gap 8px, vertical dividers between groups.
          var hdrDivider =
            '<span class="ds-header__divider" aria-hidden="true"></span>';
          var actionsBlock =
            '<div class="ds-header__actions">' +
            '<button class="ds-header__action ds-header__action--whatsnew" type="button">' +
            "What&#39;s new" +
            "</button>" +
            hdrDivider +
            '<button class="ds-header__action ds-header__action--notifications"' +
            ' type="button" aria-label="Notifications">' +
            SVG_BELL +
            "</button>" +
            hdrDivider +
            '<button class="ds-header__action ds-header__action--apps"' +
            ' type="button" aria-label="App switcher">' +
            SVG_APPS +
            "</button>" +
            hdrDivider +
            '<span class="ds-header__avatar">' +
            headerAvatar +
            "</span>" +
            "</div>";

          return (
            '<header class="ds-header">' +
            brandBlock +
            centerBlock +
            actionsBlock +
            "</header>"
          );
        }

        case "side-nav": {
          // Left navigation rail (chrome).
          // Grouped mode (props.Groups JSON string): real Studio sidebar from
          //   Figma anatomy — groups of {items:[{label,icon}]}, separators,
          //   collapse button. resolveActive matches across all group items.
          // Legacy mode (props.Items comma string): back-compat for existing
          //   flows that pass a flat item list with no icons.
          // anatomy: width:240px; padding:16px; flex-direction:column;
          //   justify-content:space-between; bg:--zen-color-bg-default;
          //   border-right:1px solid --zen-border-default.
          var navCls = "ds-sidenav";
          if (v.View === "Collapsed") navCls += " ds-sidenav--collapsed";

          // Helper: render a single nav item row.
          // icon may be null (legacy path) or a slug string (grouped path).
          function renderNavItem(label, icon, isActive) {
            var itemCls = "ds-sidenav__item";
            if (isActive) itemCls += " is-active";
            var iconHtml = icon
              ? '<span class="ds-sidenav__icon">' + renderIcon(icon) + "</span>"
              : '<span class="ds-sidenav__icon"></span>';
            return (
              '<a class="' +
              itemCls +
              '">' +
              iconHtml +
              '<span class="ds-sidenav__label">' +
              esc(label) +
              "</span></a>"
            );
          }

          // Separator bar between groups (and before the collapse button).
          // anatomy: 1px horizontal rule, --zen-border-default, 4px vertical margin.
          var navSeparator =
            '<div class="ds-sidenav__separator" aria-hidden="true"></div>';

          if (props.Groups) {
            // ── Grouped mode (Studio anatomy) ────────────────────────────
            var groups;
            try {
              groups = JSON.parse(props.Groups);
            } catch (e) {
              groups = [];
            }
            if (!Array.isArray(groups)) groups = [];

            // Flatten all group items to run resolveActive across the full set.
            var allLabels = [];
            groups.forEach(function (g) {
              (g.items || []).forEach(function (it) {
                allLabels.push(it.label || "");
              });
            });
            var navActive = resolveActive(allLabels, props.Active);

            // anatomy: primary groups at the top; the LAST group (utilities:
            // Access request / Catalog design / Analytics) is anchored to the
            // rail bottom. With a single group, keep it all at the top.
            var renderGroup = function (g) {
              var groupItems = (g.items || [])
                .map(function (it) {
                  return renderNavItem(
                    it.label || "",
                    it.icon || null,
                    (it.label || "") === navActive,
                  );
                })
                .join("");
              return '<div class="ds-sidenav__group">' + groupItems + "</div>";
            };
            var hasBottomGroup = groups.length >= 2;
            var topGroups = hasBottomGroup ? groups.slice(0, -1) : groups;
            var topHtml = topGroups.map(renderGroup).join(navSeparator);

            // Bottom section: the utilities group (if any) + separator + collapse.
            var bottomInner = "";
            if (hasBottomGroup) {
              bottomInner += renderGroup(groups[groups.length - 1]);
            }
            bottomInner +=
              navSeparator +
              '<button class="ds-sidenav__collapse" type="button" aria-label="Collapse sidebar">' +
              renderIcon("arrow-left") +
              "</button>";
            var collapseHtml =
              '<div class="ds-sidenav__bottom">' + bottomInner + "</div>";

            return (
              '<nav class="' +
              navCls +
              '">' +
              '<div class="ds-sidenav__top">' +
              topHtml +
              "</div>" +
              collapseHtml +
              "</nav>"
            );
          } else {
            // ── Legacy mode (comma Items list, no icons) ──────────────────
            var navItems = parseItems(
              props.Items,
              "Catalog, Pipelines, Connections, Settings",
            );
            var legacyActive = resolveActive(navItems, props.Active);
            var navRows = navItems
              .map(function (item) {
                return renderNavItem(item, null, item === legacyActive);
              })
              .join("");
            return '<nav class="' + navCls + '">' + navRows + "</nav>";
          }
        }

        case "page-header": {
          var phTitle = esc(props.Title || "Page title");
          // Optional slot: a page header with no description is a real page
          // header. The gallery's description lives in matrix.js SPECIMEN_PROPS.
          var phDesc = props.Description
            ? '<p class="ds-page-header__desc">' +
              esc(props.Description) +
              "</p>"
            : "";
          var phActions = "";
          var actionsRaw = props.Actions;
          if (Array.isArray(actionsRaw) && actionsRaw.length) {
            phActions =
              '<div class="ds-page-header__actions">' +
              actionsRaw
                .map(function (a, i) {
                  var label = typeof a === "string" ? a : (a && a.label) || "";
                  var variant =
                    (a && a.variant) || (i === 0 ? "primary" : "secondary");
                  return (
                    '<button class="ds-button ds-button--' +
                    esc(variant) +
                    '">' +
                    esc(label) +
                    "</button>"
                  );
                })
                .join("") +
              "</div>";
          }
          return (
            '<header class="ds-page-header">' +
            '<div class="ds-page-header__text">' +
            '<h1 class="ds-page-header__title">' +
            phTitle +
            "</h1>" +
            phDesc +
            "</div>" +
            phActions +
            "</header>"
          );
        }

        case "breadcrumb": {
          var crumbItems = parseItems(props.Items, "Home, Section, Page");
          var crumbSep =
            '<span class="ds-breadcrumbs__sep">' +
            renderIcon("arrow-left", { rotate: 180 }) +
            "</span>";
          var crumbHtml = crumbItems
            .map(function (label, i) {
              var isLast = i === crumbItems.length - 1;
              var crumbCls = "ds-breadcrumbs__crumb";
              if (isLast) crumbCls += " ds-breadcrumbs__crumb--current";
              var tag = isLast ? "span" : "a";
              return (
                "<" +
                tag +
                ' class="' +
                crumbCls +
                '">' +
                esc(label) +
                "</" +
                tag +
                ">"
              );
            })
            .join(crumbSep);
          return (
            '<nav class="ds-breadcrumbs" aria-label="Breadcrumb">' +
            crumbHtml +
            "</nav>"
          );
        }

        case "tabs": {
          var tabItems = parseItems(props.Items, "Overview, Schema, Lineage");
          var tabActive = resolveActive(tabItems, props.Active);
          var tabHtml = tabItems
            .map(function (label) {
              var tabCls = "ds-tabs__tab";
              if (label === tabActive) tabCls += " is-active";
              return (
                '<button class="' +
                tabCls +
                '" role="tab">' +
                esc(label) +
                "</button>"
              );
            })
            .join("");
          return '<div class="ds-tabs" role="tablist">' + tabHtml + "</div>";
        }

        case "table": {
          var cols = parseItems(props.Columns, "Name, Status, Updated");
          // authored: anatomy/table.json holds no text nodes. Three cells per row so
          // the body matches the Columns default above rather than rendering ragged.
          var rowsRaw =
            props.Rows === undefined
              ? [
                  ["customer_orders", "Published", "Dec 15, 2025"],
                  ["orders_raw", "Draft", "Dec 12, 2025"],
                  ["sales_summary", "Published", "Dec 09, 2025"],
                ]
              : props.Rows;
          var rows = Array.isArray(rowsRaw)
            ? rowsRaw
            : parseItems(rowsRaw, "").map(function (cell) {
                return [cell];
              });
          var thead =
            '<thead><tr class="ds-table__head-row">' +
            cols
              .map(function (c) {
                return '<th class="ds-table__th">' + esc(c) + "</th>";
              })
              .join("") +
            "</tr></thead>";
          var tbody =
            "<tbody>" +
            rows
              .map(function (r) {
                var cells = Array.isArray(r) ? r : [r];
                return (
                  '<tr class="ds-table__row">' +
                  cols
                    .map(function (_c, i) {
                      return (
                        '<td class="ds-table__td">' +
                        esc(cells[i] != null ? cells[i] : "") +
                        "</td>"
                      );
                    })
                    .join("") +
                  "</tr>"
                );
              })
              .join("") +
            "</tbody>";
          return '<table class="ds-table">' + thead + tbody + "</table>";
        }

        case "modal": {
          var modalTitle = esc(props.Title || "Dialog");
          // Optional slot: a confirm dialog with a title and buttons and no body
          // is a real modal. The gallery's body lives in matrix.js SPECIMEN_PROPS.
          var modalBody = props.Body
            ? '<div class="ds-modal__body">' + esc(props.Body) + "</div>"
            : "";
          var modalFooter = "";
          // capture: anatomy/modal.json nested button labels "Cancel" and "Confirm".
          // Confirm is the primary action, so it goes first: the i === 0 branch
          // below renders index 0 as ds-button--primary.
          var modalActionsRaw =
            props.Actions === undefined ? ["Confirm", "Cancel"] : props.Actions;
          if (Array.isArray(modalActionsRaw) && modalActionsRaw.length) {
            modalFooter =
              '<div class="ds-modal__footer">' +
              modalActionsRaw
                .map(function (a, i) {
                  var label = typeof a === "string" ? a : (a && a.label) || "";
                  var variant =
                    (a && a.variant) || (i === 0 ? "primary" : "secondary");
                  return (
                    '<button class="ds-button ds-button--' +
                    esc(variant) +
                    '">' +
                    esc(label) +
                    "</button>"
                  );
                })
                .join("") +
              "</div>";
          } else if (typeof modalActionsRaw === "string" && modalActionsRaw) {
            // String Actions fallback: treat the whole string as a single
            // primary button label (mirrors page-header string-actions idiom).
            modalFooter =
              '<div class="ds-modal__footer">' +
              '<button class="ds-button ds-button--primary">' +
              esc(modalActionsRaw) +
              "</button>" +
              "</div>";
          }
          return (
            '<div class="ds-modal-backdrop">' +
            '<div class="ds-modal" role="dialog" aria-modal="true">' +
            '<h2 class="ds-modal__title">' +
            modalTitle +
            "</h2>" +
            modalBody +
            modalFooter +
            "</div>" +
            "</div>"
          );
        }

        case "empty-state": {
          var esIllus = renderGraphic(
            props.Illustration || "illustration-empty-state",
          );
          var esTitle = esc(
            props.Headline || props.Title || "No policies available",
          );
          var esBody = esc(
            props.Body ||
              "Create policies to define how your platform operates.",
          );
          var esPrimary = esc(props.Cta || props.Primary || "Create policy");
          var esTertiary = esc(props.Secondary || "Learn more");
          return (
            '<div class="ds-empty-state">' +
            (esIllus
              ? '<div class="ds-empty-state__illustration">' +
                esIllus +
                "</div>"
              : "") +
            '<p class="ds-empty-state__headline">' +
            esTitle +
            "</p>" +
            '<p class="ds-empty-state__body">' +
            esBody +
            "</p>" +
            '<div class="ds-empty-state__actions">' +
            '<button class="ds-button ds-button--tertiary ds-empty-state__cta">' +
            esTertiary +
            "</button>" +
            '<button class="ds-button ds-button--primary ds-empty-state__cta">' +
            esPrimary +
            "</button>" +
            "</div></div>"
          );
        }

        case "alert-banner": {
          // Two vocabularies meet here, so the mapping is deliberate:
          //   Figma publishes  Type = Info | Success | Warning | Error
          //   the stylesheet defines .ds-alert--primary|success|warning|danger
          // primary → info-filled icon, role=status
          // success → success-filled icon, role=status
          // warning → warning-filled icon, role=status
          // danger  → error-filled icon,   role=alert
          var alertIconMap = {
            primary: "info-filled",
            success: "success-filled",
            warning: "warning-filled",
            danger: "error-filled",
          };
          // The published vocabulary mapped onto the styled one. Without this,
          // `Error` missed the lookup and hit the clamp below, so an error alert
          // shipped with the info colour, the info glyph and role="status": a
          // silent a11y defect, because a clamp reads exactly like a default.
          //
          // Both spellings keep resolving because v.Type is flow data, not only
          // registry data: a flow authored against the older Primary/Danger
          // spelling (which the registry published for `alert-inline` until the
          // 2026-08-24 sync retired it, so this reason no longer holds on its own; a
          // component with no branch here) would otherwise degrade the same
          // silent way. Retiring the aliases needs those authored flows checked,
          // not just the registry.
          var alertTypeAlias = { info: "primary", error: "danger" };
          // Clamp Type to the known enum BEFORE it reaches the class attribute —
          // v.Type is user-supplied flow-data; an unclamped value would break out
          // of the class attribute and inject markup (XSS). Unknown/crafted values
          // fall back to "primary". Aliasing widens the vocabulary, never the clamp.
          // "Info" and not "Primary": both alias to the same treatment, but Info
          // is the value the registry actually publishes for this component.
          var alertTypeRaw = (v.Type || "Info").toLowerCase();
          var alertTypeKey = alertTypeAlias[alertTypeRaw] || alertTypeRaw;
          var alertType = alertIconMap[alertTypeKey] ? alertTypeKey : "primary";
          var alertIconSlug = alertIconMap[alertType];
          var alertRole = alertType === "danger" ? "alert" : "status";
          var alertCls = "ds-alert ds-alert--" + alertType;
          var alertTitleHtml = props.Title
            ? '<p class="ds-alert__title">' + esc(props.Title) + "</p>"
            : "";
          // capture: anatomy/alert-banner.json layer "Primary" reads "Info" on the
          // default variant (Type=Info), so the message mirrors the type name.
          // matrix.js supplies the per-Type value; this is the no-props fallback.
          var alertMsg = esc(props.Message || "Info");
          return (
            '<div class="' +
            alertCls +
            '" role="' +
            alertRole +
            '">' +
            '<span class="ds-alert__icon">' +
            renderIcon(alertIconSlug) +
            "</span>" +
            '<div class="ds-alert__content">' +
            alertTitleHtml +
            '<p class="ds-alert__message">' +
            alertMsg +
            "</p>" +
            "</div>" +
            "</div>"
          );
        }

        // ── Hi-Fi Slice 1 (Task 4): transform-target leaves ──────────────
        // These 8 slugs chip-degraded before. Each renders a tokens-only leaf
        // from its registry variant axes + Figma anatomy part-tree.

        case "toast": {
          // Registry axis: Type = Default | Critical.
          // Anatomy: container[Type]{ text[message], instance[Button] } — an
          // inline banner with a message + a single action button. Mirrors the
          // alert-banner idiom; Critical → role=alert (like Danger).
          var notifTypeRaw = (v.Type || "Default").toLowerCase();
          var notifCritical = notifTypeRaw === "critical";
          var notifCls =
            "ds-toast" +
            (notifCritical ? " ds-toast--critical" : "");
          var notifRole = notifCritical ? "alert" : "status";
          // capture: anatomy/toast.json text layer "Item deleted"
          var notifMsg = esc(props.Message || "Item deleted");
          // Action button is optional: only render when an Action label exists.
          // The gallery's label lives in matrix.js SPECIMEN_PROPS.
          var notifAction = props.Action
            ? '<button class="ds-button ds-button--tertiary ds-button--small ds-toast__action" type="button">' +
              esc(props.Action) +
              "</button>"
            : "";
          return (
            '<div class="' +
            notifCls +
            '" role="' +
            notifRole +
            '">' +
            '<span class="ds-toast__icon">' +
            renderIcon(notifCritical ? "error-filled" : "info-filled") +
            "</span>" +
            '<p class="ds-toast__message">' +
            notifMsg +
            "</p>" +
            notifAction +
            "</div>"
          );
        }

        case "stepper": {
          // Registry axis: State = Complete | Active | Default (Incomplete) | …
          // Anatomy: container[State]{ container[Status]{number}, container[Text]
          // {Title, Body} } — a numbered status circle + title/body. Complete
          // swaps the number for a check glyph.
          var stepStateRaw = (v.State || "Default").toLowerCase();
          var stepComplete = stepStateRaw === "complete";
          var stepActive = stepStateRaw === "active";
          var stepperCls = "ds-stepper";
          if (stepComplete) stepperCls += " ds-stepper--complete";
          else if (stepActive) stepperCls += " ds-stepper--active";
          var stepStatus = stepComplete
            ? '<span class="ds-stepper__check">' +
              renderIcon("simple-check") +
              "</span>"
            : // capture: anatomy/stepper.json text layer "1"
              esc(props.Step || "1");
          // Optional slot, and the capture says so in words: the layer reads
          // "Optional body". The gallery's body lives in matrix.js SPECIMEN_PROPS.
          var stepBody = props.Body
            ? '<span class="ds-stepper__body">' + esc(props.Body) + "</span>"
            : "";
          return (
            '<div class="' +
            stepperCls +
            '">' +
            '<span class="ds-stepper__status">' +
            stepStatus +
            "</span>" +
            '<span class="ds-stepper__text">' +
            '<span class="ds-stepper__title">' +
            // AUTHORED, and a deliberate exception to this file's "use the
            // Figma capture" policy. anatomy/stepper.json layer "Title" reads
            // "Complete", but that is the name of ONE State value, and the
            // State axis renders four cells (Complete, Active, Default,
            // State5). Quoting the capture makes three of the four say
            // "Complete" while rendering as something else. A stepper's title
            // is the step's NAME and is state-independent, so one authored
            // title reads correctly in every cell.
            esc(props.Title || "Connect source") +
            "</span>" +
            stepBody +
            "</span>" +
            "</div>"
          );
        }

        case "collapse": {
          // Registry variant State=[Collapsed, "Expanede"] -- "Expanede" is
          // a literal registry typo (misspelling of "Expanded"); match via
          // a prefix test so both the typo and a future-fixed spelling
          // resolve. State is a secondary axis (isSecondaryAxis in
          // matrix.js), so MATRIX_OVERRIDES["collapse"] supplies
          // real Title/Body -- the generic derivation would only ever feed
          // props:{Label:"Collapsed"|"Expanede"}. The caret is arrow-down,
          // which points down as drawn, so the EXPANDED state is the one
          // that rotates 180deg. (Before the 2026-07-23 icon rework this was
          // chevron-up with the rotation on the collapsed state; chevron-up
          // was deleted upstream with no successor, and arrow-down is the
          // same glyph pointing the other way.)
          var accExpanded =
            String(v.State || "")
              .toLowerCase()
              .indexOf("expan") === 0;
          var accCls =
            "ds-collapse" +
            (accExpanded ? " ds-collapse--expanded" : "");
          var accBody = accExpanded
            ? '<div class="ds-collapse__body">' +
              esc(props.Body || "") +
              "</div>"
            : "";
          return (
            '<div class="' +
            accCls +
            '">' +
            '<div class="ds-collapse__header">' +
            '<span class="ds-collapse__title">' +
            esc(props.Title || "Advanced settings") +
            "</span>" +
            '<span class="ds-collapse__toggle" aria-hidden="true">' +
            renderIcon("arrow-down", accExpanded ? { rotate: 180 } : {}) +
            "</span>" +
            "</div>" +
            accBody +
            "</div>"
          );
        }

        case "tooltip-default": {
          // Registry axis: Type = Default. Anatomy: container[Type]{ text[Body] }
          // — a small text bubble. role=tooltip for assistive tech.
          return (
            '<div class="ds-tooltip-default" role="tooltip">' +
            '<span class="ds-tooltip-default__body">' +
            // capture: anatomy/tooltip.json layer "Body"
            esc(
              props.Body ||
                "Body line text lorem ipsum dolor sit amet, consectetur",
            ) +
            "</span>" +
            '<span class="ds-tooltip-default__arrow" aria-hidden="true"></span>' +
            "</div>"
          );
        }

        case "calendar-date-input": {
          // Registry axes: Type = Single date | Date range; States = Enabled |
          // Disabled | Error | … . Anatomy: container{ container[Label]{text},
          // container[Input + icon button]{ inputfield, instance[Button] } } —
          // a labeled date input with a trailing calendar icon button. Mirrors
          // the .ds-field/.ds-input idiom; Date range adds a second input.
          var dateRange = v.Type === "Date range";
          var dateDisabled = v.States === "Disabled";
          var dateCls = "ds-calendar-date-input";
          if (dateRange) dateCls += " ds-calendar-date-input--range";
          if (dateDisabled) dateCls += " is-disabled";
          var datePlaceholder = esc(props["Placeholder text"] || "MM/DD/YYYY");
          function dateInput() {
            return (
              '<div class="ds-calendar-date-input__field">' +
              '<span class="ds-calendar-date-input__value">' +
              datePlaceholder +
              "</span>" +
              '<span class="ds-calendar-date-input__calendar" aria-hidden="true">' +
              renderIcon("calendar") +
              "</span>" +
              "</div>"
            );
          }
          var dateInputs = dateRange
            ? dateInput() +
              '<span class="ds-calendar-date-input__sep">–</span>' +
              dateInput()
            : dateInput();
          // Optional slot: the capture holds no helper layer at all. The
          // gallery's helper string lives in matrix.js SPECIMEN_PROPS.
          var dateHelper = props.Helper
            ? '<span class="ds-calendar-date-input__helper">' +
              esc(props.Helper) +
              "</span>"
            : "";
          return (
            '<div class="' +
            dateCls +
            '">' +
            '<div class="ds-calendar-date-input__label-row"><span class="ds-calendar-date-input__label">' +
            esc(props.Label || "Date") +
            "</span></div>" +
            '<div class="ds-calendar-date-input__inputs">' +
            dateInputs +
            "</div>" +
            dateHelper +
            "</div>"
          );
        }

        case "rich-text": {
          // Registry axis: State = Default | Expanded. Anatomy: container[State]{
          // container[Toolbar]{ container[Left toolbar], container[Right toolbar]
          // } } — an editor toolbar shell with grouped controls. Expanded shows
          // a content area below the toolbar.
          var rtExpanded = v.State === "Expanded";
          var rtCls =
            "ds-rich-text" + (rtExpanded ? " ds-rich-text--expanded" : "");
          function rtBtn(iconSlug, label) {
            return (
              '<button class="ds-rich-text__btn" type="button" aria-label="' +
              esc(label) +
              '">' +
              renderIcon(iconSlug) +
              "</button>"
            );
          }
          var rtLeft =
            '<div class="ds-rich-text__group ds-rich-text__group--left">' +
            rtBtn("text-type", "Text style") +
            rtBtn("list-bullets", "Bulleted list") +
            rtBtn("list-numbers", "Numbered list") +
            "</div>";
          var rtRight =
            '<div class="ds-rich-text__group ds-rich-text__group--right">' +
            rtBtn("link-type", "Insert link") +
            "</div>";
          var rtBody = rtExpanded
            ? '<div class="ds-rich-text__content" aria-label="Editor"></div>'
            : "";
          return (
            '<div class="' +
            rtCls +
            '">' +
            '<div class="ds-rich-text__toolbar">' +
            rtLeft +
            rtRight +
            "</div>" +
            rtBody +
            "</div>"
          );
        }

        case "dropdown-select-default": {
          // Registry axes: Type = Default | Search/Multiple | …; State = Default |
          // Disabled | Focus | … . Anatomy: container{ container[Label + desc],
          // container[input field]{ value, chevron }, text[helper] } — a labeled
          // select with an input field + optional helper. Mirrors .ds-field idiom.
          var ddDisabled = v.State === "Disabled";
          var ddCls = "ds-dropdown-select";
          if (ddDisabled) ddCls += " is-disabled";
          // Optional slot. The gallery's description lives in matrix.js
          // SPECIMEN_PROPS.
          var ddDesc = props.Description
            ? '<span class="ds-dropdown-select__desc">' +
              esc(props.Description) +
              "</span>"
            : "";
          var ddValueText = props.Value;
          var ddValueCls =
            "ds-dropdown-select__value" +
            (ddValueText ? "" : " ds-dropdown-select__value--placeholder");
          var ddValue = esc(ddValueText || props.Placeholder || "Select…");
          // Optional slot. The gallery's helper string lives in matrix.js
          // SPECIMEN_PROPS.
          var ddHelper = props.Helper
            ? '<span class="ds-dropdown-select__helper">' +
              esc(props.Helper) +
              "</span>"
            : "";
          return (
            '<div class="' +
            ddCls +
            '">' +
            '<div class="ds-dropdown-select__label-row">' +
            '<span class="ds-dropdown-select__label">' +
            esc(props.Label || "Label") +
            "</span>" +
            ddDesc +
            "</div>" +
            '<div class="ds-dropdown-select__field">' +
            '<span class="' +
            ddValueCls +
            '">' +
            ddValue +
            "</span>" +
            '<span class="ds-dropdown-select__chevron" aria-hidden="true">' +
            renderIcon("arrow-down") +
            "</span>" +
            "</div>" +
            ddHelper +
            "</div>"
          );
        }

        case "progress-bar-small": {
          // Registry axes: Size = Default | Large; Completeness = 0% | 50% | 100%.
          // Anatomy: container{ container[Bar]{ vector[fill] }, text[percent] } —
          // a track with a clamped fill + a percent label. Completeness drives the
          // default fill width; an explicit Percent prop overrides it.
          var pbLarge = v.Size === "Large";
          var pbCls = "ds-progress" + (pbLarge ? " ds-progress--large" : "");
          // Resolve percent: explicit prop wins, else the Completeness variant,
          // else 0. Parse to a number and clamp to [0, 100].
          var pbRaw =
            props.Percent != null && props.Percent !== ""
              ? props.Percent
              : v.Completeness;
          var pbNum = parseInt(
            String(pbRaw || "0").replace(/[^0-9.-]/g, ""),
            10,
          );
          if (isNaN(pbNum)) pbNum = 0;
          if (pbNum < 0) pbNum = 0;
          if (pbNum > 100) pbNum = 100;
          return (
            '<div class="' +
            pbCls +
            '">' +
            '<div class="ds-progress__track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' +
            pbNum +
            '">' +
            '<span class="ds-progress__fill" style="width:' +
            pbNum +
            '%"></span>' +
            "</div>" +
            '<span class="ds-progress__percent">' +
            pbNum +
            "%</span>" +
            "</div>"
          );
        }

        case "scroll-bar": {
          // Registry variants are a degenerate {"Property 1":["Default"]}
          // placeholder -- no real identity axis. Orientation is a USAGE-doc
          // concept (not a registry axis), exposed as an optional prop
          // modifier defaulting vertical. Position/Length are clamped to
          // [0,100] with the same parse-and-clamp progress-bar-small uses.
          // Label is an accessible name only -- guideline: "Scroll bars
          // carry no copy" -- never rendered as visible text.
          var sbHorizontal =
            (props.Orientation || v.Orientation) === "Horizontal";
          var sbCls =
            "ds-scroll-bar" +
            (sbHorizontal ? " ds-scroll-bar--horizontal" : "");

          var sbPosRaw =
            props.Position != null && props.Position !== ""
              ? props.Position
              : "0";
          var sbPosNum = parseInt(
            String(sbPosRaw || "0").replace(/[^0-9.-]/g, ""),
            10,
          );
          if (isNaN(sbPosNum)) sbPosNum = 0;
          if (sbPosNum < 0) sbPosNum = 0;
          if (sbPosNum > 100) sbPosNum = 100;

          var sbLenRaw =
            props.Length != null && props.Length !== "" ? props.Length : "40";
          var sbLenNum = parseInt(
            String(sbLenRaw || "40").replace(/[^0-9.-]/g, ""),
            10,
          );
          if (isNaN(sbLenNum)) sbLenNum = 40;
          if (sbLenNum < 0) sbLenNum = 0;
          if (sbLenNum > 100) sbLenNum = 100;

          var sbStyle = sbHorizontal
            ? "left:" + sbPosNum + "%;width:" + sbLenNum + "%"
            : "top:" + sbPosNum + "%;height:" + sbLenNum + "%";

          return (
            '<div class="' +
            sbCls +
            '" role="scrollbar" aria-orientation="' +
            (sbHorizontal ? "horizontal" : "vertical") +
            '" aria-label="' +
            esc(props.Label || "Scroll region") +
            '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' +
            sbPosNum +
            '">' +
            '<span class="ds-scroll-bar__thumb" style="' +
            sbStyle +
            '"></span>' +
            "</div>"
          );
        }

        case "interactive-tag": {
          // Registry axis: State = Default | Hovered | Selected | Disabled | …
          // Anatomy: container[State]{ instance[Leading icon], text[Tag-Name],
          // instance[Trailing icon] } — a tag/chip with optional leading + a
          // removable trailing control. Mirrors the .ds-tag idiom + state mods.
          var tiStateRaw = (v.State || "Default").toLowerCase();
          var tiCls = "ds-interactive-tag";
          if (tiStateRaw === "selected")
            tiCls += " ds-interactive-tag--selected";
          if (tiStateRaw === "disabled") tiCls += " is-disabled";
          // Leading icon defaults on (anatomy shows one); honor an explicit false.
          var tiShowLead = props["Leading icon show"] !== false;
          var tiLead = tiShowLead
            ? '<span class="ds-interactive-tag__icon ds-interactive-tag__icon--lead">' +
              renderIcon("catalog") +
              "</span>"
            : "";
          // Trailing control defaults on (interactive = removable); honor false.
          var tiShowTrail = props["Trailing icon show"] !== false;
          var tiTrail = tiShowTrail
            ? '<button class="ds-interactive-tag__remove" type="button" aria-label="Remove">' +
              renderIcon("close") +
              "</button>"
            : "";
          return (
            '<span class="' +
            tiCls +
            '">' +
            tiLead +
            '<span class="ds-interactive-tag__label">' +
            esc(props.Label || "") +
            "</span>" +
            tiTrail +
            "</span>"
          );
        }

        // ---- Tag family: the 2026-08-12 fold-in ----
        //
        // tag-shared, tag-catalog, tag-stage, tag-status and
        // tag-glossary-item-type were RETIRED upstream: Figma folded their
        // treatments into "Tag, Default"'s new single `Type` axis (see the
        // tag-read-only case above) and into "Tag, Item type" below. Their cases
        // are gone rather than left rendering plausible markup for components
        // the design system no longer publishes -- a stale case is invisible,
        // because its output cannot be told apart from a real component's.
        //
        // .ds-tag--shared / .ds-tag--catalog / .ds-tag--status-* survive in
        // ds-base.css, but as tag-read-only Type modifiers now, re-grounded
        // against the fold-in capture. .ds-tag-stage and .ds-tag-stage__dot
        // also survive: search-result-card reuses them for its stage pill.

        case "item-type-tag": {
          // The registry publishes one axis, `Type`, carrying 28 values:
          // Glossary-1..5, Category, Custom-1..15, and the six data-catalog
          // names. The axis name is read here as a literal because this
          // renderer has no registry access, which is the one restatement in
          // this block -- an axis rename in Figma lands as every instance
          // clamping to the base class with no modifier, and
          // tests/render/ds-html-map.test.js catches exactly that by deriving
          // the axis name from the registry instead of repeating it.
          //
          // Dedicated block (NOT base .ds-tag): the anatomy has no border,
          // unlike .ds-tag's 1px border -- reusing the base class would leak
          // one. Each value's fill and its label colour come from that value's
          // own appearance group in components/dist/anatomy/item-type-tag.json.
          //
          // Shape clamp, not a value list, for the same reason as tag-read-only
          // above: v.Type is user-supplied flow-data and an unclamped value
          // would break out of the class attribute (XSS), while a hardcoded
          // copy of a 28-value axis is the restatement this block exists to
          // avoid.
          var titRaw = v.Type || "";
          var titSlug = String(titRaw).toLowerCase().replace(/\s+/g, "-");
          var titCls = "ds-item-type-tag";
          if (titSlug && /^[a-z0-9-]+$/.test(titSlug)) {
            titCls += " ds-item-type-tag--" + titSlug;
          }
          // Two spellings of the same boolean exist in the registry
          // ("Show counter#14128:0" and "Show Counter#21221:38", both default
          // false) -- the glossary component's own prop name survived the
          // fold-in beside the catalog one. Honour either.
          var titCounter =
            props["Show counter"] || props["Show Counter"]
              ? '<span class="ds-item-type-tag__counter">' +
                esc(props.Counter || "00") +
                "</span>"
              : "";
          return (
            '<span class="' +
            titCls +
            '">' +
            '<span class="ds-item-type-tag__name">' +
            esc(props.Label || titRaw) +
            "</span>" +
            titCounter +
            "</span>"
          );
        }

        // ---- Hi-Fi A1 (narrow) — degraded-slug overrides. Batch 1: overlays ----

        case "popover": {
          // Registry axis: Type = Interaction guide | Advanced search; prop
          // "Show info icon". A floating card: optional info icon + title +
          // body + arrow. role=dialog for assistive tech.
          var poAdvanced = v.Type === "Advanced search";
          var poCls =
            "ds-popover" + (poAdvanced ? " ds-popover--advanced-search" : "");
          // "Show info icon" is a default-TRUE registry boolean → shown unless
          // explicitly false (the file's default-true convention, cf. radio /
          // toggle / tag-interactive: `props[x] !== false`).
          var poInfo =
            props["Show info icon"] !== false
              ? '<span class="ds-popover__info" aria-hidden="true">' +
                renderIcon("help-circle") +
                "</span>"
              : "";
          // Both slots are optional: a popover may carry a body with no title,
          // or neither. The gallery's strings live in matrix.js SPECIMEN_PROPS.
          var poTitle = props.Title
            ? '<span class="ds-popover__title">' + esc(props.Title) + "</span>"
            : "";
          var poBody = props.Body
            ? '<span class="ds-popover__body">' + esc(props.Body) + "</span>"
            : "";
          return (
            '<div class="' +
            poCls +
            '" role="dialog" aria-label="' +
            esc(props.Title || "Popover") +
            '">' +
            '<div class="ds-popover__header">' +
            poInfo +
            poTitle +
            "</div>" +
            poBody +
            '<span class="ds-popover__arrow" aria-hidden="true"></span>' +
            "</div>"
          );
        }

        case "global-header-account-dropdown": {
          // No registry variants/props (single-import; nested help-bubble /
          // arrow-down / exit baked into the Figma component). Render an account
          // menu overlay: identity header + default items (Items prop overrides).
          var acName = esc(props.Name || "Account user");
          // Optional slot: the menu renders name-only when no address is given.
          // The gallery's address lives in matrix.js SPECIMEN_PROPS.
          var acEmail = props.Email
            ? '<span class="ds-account-menu__email">' +
              esc(props.Email) +
              "</span>"
            : "";
          var acIcons = {
            "account settings": "settings",
            help: "help-bubble",
            "sign out": "exit",
          };
          var acList = parseItems(props.Items, "Account settings,Help,Sign out")
            .map(function (label) {
              var ico = acIcons[label.toLowerCase()];
              var g = ico
                ? '<span class="ds-account-menu__icon" aria-hidden="true">' +
                  renderIcon(ico) +
                  "</span>"
                : "";
              return (
                '<span class="ds-account-menu__item" role="menuitem">' +
                g +
                '<span class="ds-account-menu__label">' +
                esc(label) +
                "</span></span>"
              );
            })
            .join("");
          return (
            '<div class="ds-account-menu" role="menu" aria-label="Account">' +
            '<div class="ds-account-menu__header">' +
            '<span class="ds-account-menu__name">' +
            acName +
            "</span>" +
            acEmail +
            "</div>" +
            '<div class="ds-account-menu__items">' +
            acList +
            "</div>" +
            "</div>"
          );
        }

        case "notification-dropdown": {
          // Registry axis: Property 1 = Empty | List. Menu overlay mirroring
          // account-dropdown: header + a mapped list of notification rows.
          // Compute the modifier class into a variable first (never inline a
          // ternary in the class attribute -- the css-staleness extractor
          // mis-parses that, see the segmented-control comment below).
          var ndIsEmpty = v["Property 1"] === "Empty";
          var ndCls =
            "ds-notification-menu" +
            (ndIsEmpty ? " ds-notification-menu--empty" : "");
          var ndHeader = esc(props.Header || "Notifications");
          var ndBody;
          if (ndIsEmpty) {
            ndBody =
              '<div class="ds-notification-menu__empty">' +
              esc(props.Empty || "You're all caught up.") +
              "</div>";
          } else {
            var ndList = parseItems(
              props.Items,
              "New items inventoried from PowerBi Online V1 at 7/11/25 12:42 AM.,New items inventoried from PowerBi Online V1 at 7/6/25 12:42 AM.,New items inventoried from PowerBi Online V1 at 7/3/25 4:47 PM.",
            )
              .map(function (label) {
                return (
                  '<span class="ds-notification-menu__item" role="menuitem">' +
                  '<span class="ds-notification-menu__icon" aria-hidden="true">' +
                  renderIcon("info-filled") +
                  "</span>" +
                  '<span class="ds-notification-menu__label">' +
                  esc(label) +
                  "</span></span>"
                );
              })
              .join("");
            ndBody =
              '<div class="ds-notification-menu__items">' + ndList + "</div>";
          }
          return (
            '<div class="' +
            ndCls +
            '" role="menu" aria-label="Notifications">' +
            '<div class="ds-notification-menu__header">' +
            ndHeader +
            "</div>" +
            ndBody +
            "</div>"
          );
        }

        case "search-dropdown-menu": {
          // Registry axis: Type = No result | Before typed | After typed |
          // Explorer home. REFUTES the assigned "popover" reuse pattern
          // (popover is role=dialog: info-icon+title+body+arrow, which does
          // not fit) -- this is a floating menu overlay, mirroring
          // account-dropdown's header+row-list shape. Class root is
          // ds-search-menu (NOT ds-search -- that is the separate `search`
          // field case above; kept distinct). Compute the modifier class
          // into a variable first (never inline a ternary in the class
          // attribute -- see the segmented-control comment below).
          var sdmType = v.Type || "After typed";
          var sdmMod;
          if (sdmType === "No result") sdmMod = "no-result";
          else if (sdmType === "Before typed") sdmMod = "before-typed";
          else if (sdmType === "Explorer home") sdmMod = "explorer-home";
          else sdmMod = "after-typed";
          // Root modifier class is emitted ONLY for the two real CSS
          // deltas (no-result collapses to a centered line; explorer-home
          // widens the menu). after-typed IS the captured anatomy default
          // and before-typed differs from it only via markup (heading text
          // + row content) -- no CSS delta, so no modifier class (see
          // ds-base.css). sdmMod still drives all content branching below.
          var sdmCls =
            sdmMod === "no-result" || sdmMod === "explorer-home"
              ? "ds-search-menu ds-search-menu--" + sdmMod
              : "ds-search-menu";
          var sdmBody;
          if (sdmMod === "no-result") {
            sdmBody =
              '<div class="ds-search-menu__empty">No matches for &quot;' +
              esc(props.Query || "orders") +
              "&quot;</div>";
          } else {
            var sdmHeadingDefault =
              sdmMod === "before-typed" ? "Recent" : "Suggestions";
            var sdmHeading = esc(props.Heading || sdmHeadingDefault);
            var sdmRows = parseItems(
              props.Results || props.Items,
              "transmitting,transmitter,transmit,transparent",
            )
              .map(function (label) {
                return (
                  '<div class="ds-search-menu__item" role="menuitem">' +
                  '<span class="ds-search-menu__thumb" aria-hidden="true"></span>' +
                  '<span class="ds-search-menu__label">' +
                  esc(label) +
                  "</span></div>"
                );
              })
              .join("");
            sdmBody =
              '<div class="ds-search-menu__group">' +
              '<div class="ds-search-menu__heading">' +
              sdmHeading +
              "</div>" +
              sdmRows +
              "</div>";
          }
          return (
            '<div class="' +
            sdmCls +
            '" role="menu" aria-label="Search results">' +
            sdmBody +
            "</div>"
          );
        }

        case "whats-new-dropdown": {
          // Registry axis: Property 1 = Drilldown1 | Drilldown2 | Empty |
          // List. Static menu-overlay leaf, same shape as account-dropdown
          // / app-switcher-dropdown -- mirror those. The guideline collapses
          // Drilldown1+Drilldown2 into one "Drilldown" concept, so
          // normalize both onto a single wnMode before it ever touches the
          // class attribute (never inline a ternary in the class attribute
          // literal -- the css-staleness extractor mis-parses that, see the
          // segmented-control comment below).
          var wnRaw = v["Property 1"] || "List";
          var wnMode = /^Drilldown/.test(wnRaw)
            ? "drilldown"
            : String(wnRaw).toLowerCase();
          if (wnMode !== "drilldown" && wnMode !== "empty") wnMode = "list";
          // Root modifier class is emitted only for modes with a real CSS
          // delta (list scrolls past a handful of items; drilldown widens
          // the panel). empty IS the captured anatomy default -- the base
          // rule already matches it, so no modifier class (see
          // ds-base.css). wnMode still drives all content branching below.
          var wnCls =
            wnMode === "empty"
              ? "ds-whatsnew"
              : "ds-whatsnew ds-whatsnew--" + wnMode;
          var wnBack =
            wnMode === "drilldown"
              ? '<button class="ds-whatsnew__back" type="button" aria-label="Back">' +
                renderIcon("arrow-left") +
                "</button>"
              : "";
          var wnHeader =
            '<div class="ds-whatsnew__header">' +
            wnBack +
            '<span class="ds-whatsnew__title">' +
            esc(props.Title || "What's new") +
            "</span></div>";
          var wnDefaultItems =
            "Added support for bulk dataset import.,Fixed an issue where filters were not preserved on page reload.";
          var wnBody;
          if (wnMode === "list") {
            var wnItems = parseItems(props.Items, wnDefaultItems)
              .map(function (label) {
                return (
                  '<div class="ds-whatsnew__item" role="menuitem">' +
                  esc(label) +
                  "</div>"
                );
              })
              .join("");
            wnBody = '<div class="ds-whatsnew__items">' + wnItems + "</div>";
          } else if (wnMode === "empty") {
            wnBody =
              '<div class="ds-whatsnew__empty">' +
              esc(props.EmptyLabel || "No release updates") +
              "</div>";
          } else {
            var wnFirstItem = parseItems(props.Items, wnDefaultItems)[0] || "";
            wnBody =
              '<div class="ds-whatsnew__detail">' +
              esc(
                props.Detail ||
                  wnFirstItem ||
                  "New items inventoried from PowerBI Online V1.",
              ) +
              "</div>";
          }
          return (
            '<div class="' +
            wnCls +
            '" role="menu" aria-label="What\'s new">' +
            wnHeader +
            wnBody +
            "</div>"
          );
        }

        case "drawer": {
          // Registry axis: App = Studio | Explorer -- the only captured
          // non-secondary axis. CORRECTS the pre-triage: this is an
          // Overlays component (sibling of modal/popover), NOT a dropdown,
          // despite the family-4 assignment; the originally-assigned
          // "popover" reuse pattern is also refuted (popover is a tiny
          // floating info card, not a fits-content detail panel). Mirror
          // `modal` instead: same Overlays category, a bordered panel
          // shell, role="dialog". Only the Studio anatomy tree was
          // captured (quality.ratio 1); Explorer differences are recorded
          // only as childCount deltas in structuralVariants, so the
          // Explorer cell stays a MINIMAL chrome-accent modifier rather
          // than invented structure (see the ds-base.css comment).
          var drIsExplorer = v.App === "Explorer";
          var drCls =
            "ds-drawer" + (drIsExplorer ? " ds-drawer--explorer" : "");
          var drName = esc(props.Name || "Name");

          // "Show Back" is a default-TRUE registry boolean -> shown unless
          // explicitly false (the file's default-true convention, cf.
          // popover "Show info icon" / toolbar "Show View scale").
          var drShowBack = props["Show Back"] !== false;
          var drBack = drShowBack
            ? '<button class="ds-drawer__back" type="button" aria-label="Back">' +
              renderIcon("arrow-left") +
              "</button>"
            : "";

          // Item-type badge: clamp Type against the known set
          // before it touches the class attribute -- props.Type is
          // user-supplied flow-data; an unclamped value would break out of
          // the class attribute (XSS), same discipline as the
          // tag-item-type case above. Reuses THAT case's EXISTING
          // .ds-item-type-tag(--<slug>) classes verbatim (a static
          // pill, not a recursive renderDSComponent call), same idiom as
          // search-result-card's tag reuse. The class names followed the
          // 2026-08-12 rename of tag-catalog-item-type -> tag-item-type; the
          // eight values below are this drawer's own captured badge set, which
          // is a subset of the renamed component's 28-value axis.
          var DR_TYPE_SLUGS = {
            category: "category",
            dataset: "dataset",
            "data process": "data-process",
            "data product": "data-product",
            field: "field",
            "output port": "output-port",
            "use case": "use-case",
            visualization: "visualization",
          };
          var drTypeRaw = props.Type || "Dataset";
          var drTypeSlug =
            DR_TYPE_SLUGS[String(drTypeRaw).toLowerCase()] || "dataset";
          var drTags =
            '<div class="ds-drawer__tags">' +
            '<span class="ds-item-type-tag ds-item-type-tag--' +
            drTypeSlug +
            '"><span class="ds-item-type-tag__name">' +
            esc(drTypeRaw) +
            "</span></span>" +
            '<span class="ds-drawer__tag-shared">Shared</span>' +
            "</div>";

          var drActions =
            '<div class="ds-drawer__actions">' +
            '<button type="button" aria-label="Add to favorites">' +
            renderIcon("favorite") +
            "</button>" +
            '<button type="button" aria-label="Close">' +
            renderIcon("close") +
            "</button>" +
            "</div>";

          var drHeader =
            '<div class="ds-drawer__header">' +
            drBack +
            drTags +
            '<span class="ds-drawer__title">' +
            drName +
            "</span>" +
            drActions +
            "</div>";

          // Body 1 + Body 2 merged (the anatomy splits identical metadata
          // across two sibling containers): technical name,
          // catalog/category/connection, and the Last updated / Fields /
          // Completion meta row. The registry exposes no content props for
          // these -- hardcoded faithful default copy from the captured
          // Studio anatomy, same idiom as modal/card-for-grouped-content's
          // default text. The progress bar reuses progress-bar-small's
          // EXISTING .ds-progress/__track/__fill markup verbatim (already
          // has ds-base.css rules) rather than recursing into
          // renderDSComponent, same idiom as card-for-perimeter above.
          var drBody =
            '<div class="ds-drawer__body">' +
            "<p>Technical name: able_agency</p>" +
            "<p>Catalog: Finance / Category: 24/7 / Connection: Powerbi</p>" +
            '<div class="ds-drawer__meta">' +
            '<span class="ds-drawer__meta-item">Last updated<br>Dec 15, 2025</span>' +
            '<span class="ds-drawer__meta-item">Fields<br>10 Fields</span>' +
            '<span class="ds-drawer__meta-item">Completion' +
            '<div class="ds-progress">' +
            '<div class="ds-progress__track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">' +
            '<span class="ds-progress__fill" style="width:50%"></span>' +
            "</div></div>" +
            "</span>" +
            "</div>" +
            "</div>";

          // Static tab strip (do not recurse into the tabs component);
          // registry exposes no tab-label content props, so hardcoded
          // plausible defaults.
          var drTabs =
            '<div class="ds-drawer__tabs" role="tablist">' +
            '<span class="ds-drawer__tab is-active" role="tab" aria-selected="true">Overview</span>' +
            '<span class="ds-drawer__tab" role="tab" aria-selected="false">Lineage</span>' +
            '<span class="ds-drawer__tab" role="tab" aria-selected="false">Quality</span>' +
            "</div>";

          // Body 3: three labeled sections captured in the Studio anatomy
          // (Glossary items, Description, Source description). Registry
          // exposes no content props -- hardcoded faithful default copy,
          // same idiom as card-for-grouped-content's Body above. The
          // glossary multi-select renders as a static, non-interactive
          // placeholder (do not recurse into dropdown-select-default).
          var drSections =
            '<div class="ds-drawer__section">' +
            '<div class="ds-drawer__section-title">Glossary items (2)</div>' +
            '<div class="ds-drawer__section-body">Search or select glossary items</div>' +
            "</div>" +
            '<div class="ds-drawer__section">' +
            '<div class="ds-drawer__section-title">Description</div>' +
            '<div class="ds-drawer__section-body">A short description of this dataset, including its purpose and key characteristics.</div>' +
            "</div>" +
            '<div class="ds-drawer__section">' +
            '<div class="ds-drawer__section-title">Source description</div>' +
            '<div class="ds-drawer__section-body">A short description carried over from the source system.</div>' +
            "</div>";

          return (
            '<div class="' +
            drCls +
            '" role="dialog" aria-label="' +
            drName +
            '">' +
            drHeader +
            drBody +
            drTabs +
            drSections +
            "</div>"
          );
        }

        case "app-switcher-dropdown": {
          // No registry variants/props (single-import; nested settings /
          // arrow-down baked in). Render an app-switcher menu overlay: an app
          // list + a settings row (Items prop overrides the app list).
          var asList = parseItems(
            props.Items,
            "Data Studio,Data Catalog,Data Integration",
          )
            .map(function (label) {
              return (
                '<span class="ds-app-switcher__app" role="menuitem">' +
                '<span class="ds-app-switcher__tile" aria-hidden="true"></span>' +
                '<span class="ds-app-switcher__label">' +
                esc(label) +
                "</span></span>"
              );
            })
            .join("");
          return (
            '<div class="ds-app-switcher" role="menu" aria-label="Switch app">' +
            '<div class="ds-app-switcher__apps">' +
            asList +
            "</div>" +
            '<span class="ds-app-switcher__settings" role="menuitem">' +
            '<span class="ds-app-switcher__icon" aria-hidden="true">' +
            renderIcon("settings") +
            "</span>" +
            '<span class="ds-app-switcher__label">Settings</span></span>' +
            "</div>"
          );
        }

        // ---- Hi-Fi A1 (narrow) — degraded-slug overrides. Batch 2: controls ----

        case "segmented-control": {
          // Registry axis: Type = Default (no content props). Render a segmented
          // toggle from Segments/Items (comma list; Active picks the selected
          // segment, else the first). role=tablist for assistive tech.
          var segItems = parseItems(
            props.Segments || props.Items,
            "Option A,Option B",
          );
          var segActive = resolveActive(segItems, props.Active);
          var segList = segItems
            .map(function (label) {
              var on = label === segActive;
              // Compute the class into a variable (never inline a ternary inside
              // the class attribute literal — the css-staleness extractor scans
              // raw source and mis-parses an inline ternary there).
              var segCls = "ds-segmented__item" + (on ? " is-active" : "");
              return (
                '<span class="' +
                segCls +
                '" role="tab" aria-selected="' +
                (on ? "true" : "false") +
                '">' +
                esc(label) +
                "</span>"
              );
            })
            .join("");
          return (
            '<div class="ds-segmented" role="tablist">' + segList + "</div>"
          );
        }

        case "toolbar": {
          // Registry axes: Type = Single | Combined | Group; Orientation =
          // Horizontal | Vertical; prop "Show View scale". Representative action
          // bar (no content props) — a group of icon buttons + an optional
          // zoom/view-scale control. role=toolbar.
          var tbVertical = v.Orientation === "Vertical";
          var tbCls = "ds-toolbar";
          tbCls += tbVertical
            ? " ds-toolbar--vertical"
            : " ds-toolbar--horizontal";
          function tbBtn(iconSlug, label) {
            return (
              '<button class="ds-toolbar__btn" type="button" aria-label="' +
              esc(label) +
              '">' +
              renderIcon(iconSlug) +
              "</button>"
            );
          }
          var tbGroup =
            '<div class="ds-toolbar__group">' +
            tbBtn("filter", "Filter") +
            tbBtn("chevron-sort", "Sort") +
            tbBtn("view", "View") +
            tbBtn("more", "More") +
            "</div>";
          // "Show View scale" is a default-TRUE registry boolean → shown unless
          // explicitly false (the file's default-true convention).
          var tbScale =
            props["Show View scale"] !== false
              ? '<div class="ds-toolbar__scale">' +
                tbBtn("zoom-out", "Zoom out") +
                '<span class="ds-toolbar__scale-value">100%</span>' +
                tbBtn("zoom-in", "Zoom in") +
                "</div>"
              : "";
          return (
            '<div class="' +
            tbCls +
            '" role="toolbar">' +
            tbGroup +
            tbScale +
            "</div>"
          );
        }

        case "action-bar": {
          // Registry axis: Property 1 = Default (no content props). Persistent
          // bottom action bar; right-aligned DS buttons (reuses .ds-button) —
          // defaults Cancel (secondary) + Save (primary); Primary/Secondary
          // props override the labels.
          var sfPrimary = esc(props.Primary || "Save");
          var sfSecondary = esc(props.Secondary || "Cancel");
          return (
            '<div class="ds-action-bar">' +
            '<div class="ds-action-bar__actions">' +
            '<button class="ds-button ds-button--secondary">' +
            sfSecondary +
            "</button>" +
            '<button class="ds-button ds-button--primary">' +
            sfPrimary +
            "</button>" +
            "</div>" +
            "</div>"
          );
        }

        // ---- Hi-Fi A1 (narrow) — degraded-slug overrides. Batch 3: feedback + date ----

        case "loader": {
          // Registry axis: Percent (auto-named variants). "loader" is the
          // indeterminate activity spinner (determinate progress is the
          // progress-bar-small leaf). Optional visible Label; role=status +
          // aria-live for assistive tech.
          var ldLabel = props.Label
            ? '<span class="ds-loader__label">' + esc(props.Label) + "</span>"
            : "";
          return (
            '<div class="ds-loader" role="status" aria-live="polite" aria-label="' +
            esc(props.Label || "Loading") +
            '">' +
            '<span class="ds-loader__spinner" aria-hidden="true"></span>' +
            ldLabel +
            "</div>"
          );
        }

        case "spinner": {
          // Registry axes: Color mode = On light bg | On dark bg (identity);
          // Complete = 25%|50%|75%|100% is the animation's own arc-fill
          // cycle, not a chooseable variant (usage guideline), so it is
          // ignored here. Near-clone of the "loader" case above with its own
          // BEM prefix + a dark-bg color modifier.
          var spDark = v["Color mode"] === "On dark bg";
          var spCls = "ds-spinner" + (spDark ? " ds-spinner--on-dark" : "");
          var spLabel = props.Label
            ? '<span class="ds-spinner__label">' + esc(props.Label) + "</span>"
            : "";
          return (
            '<div class="' +
            spCls +
            '" role="status" aria-live="polite" aria-label="' +
            esc(props.Label || "Loading") +
            '">' +
            '<span class="ds-spinner__ring" aria-hidden="true"></span>' +
            spLabel +
            "</div>"
          );
        }

        case "loading-skeleton": {
          // Registry axis: Transition = 1 | 2 -- an animation/shimmer-fill
          // frame, NOT a structural identity axis (guideline: "no type or
          // size variants"). VISUAL-ONLY: guideline forbids any text/copy
          // inside skeleton blocks, so every block is an empty aria-hidden
          // span; the human-readable status lives only on the container's
          // role/aria-busy/aria-label.
          var lsTransition2 = String(v.Transition || "") === "2";
          var lsCls =
            "ds-loading-skeleton" + (lsTransition2 ? " is-transition-2" : "");
          var lsBlock = function (extra) {
            return (
              '<span class="ds-loading-skeleton__block' +
              (extra ? " " + extra : "") +
              '" aria-hidden="true"></span>'
            );
          };
          return (
            '<div class="' +
            lsCls +
            '" role="status" aria-busy="true" aria-live="polite" aria-label="Loading">' +
            lsBlock("ds-loading-skeleton__block--title") +
            lsBlock() +
            lsBlock() +
            lsBlock("ds-loading-skeleton__block--short") +
            "</div>"
          );
        }

        case "calendar-data-selector": {
          // Registry axes: Type = Single date select | Date | Month | Single;
          // Selection = Single | Range | Year. A static month grid
          // (DETERMINISTIC — no Date()): header (month/year + prev/next nav) +
          // weekday row + day cells. Range renders a start→end band; else a
          // single selected day. Month label is overridable via props.Month.
          var calRange = v.Selection === "Range";
          var calMonth = esc(props.Month || "June 2026");
          var calWeek = ["S", "M", "T", "W", "T", "F", "S"]
            .map(function (d) {
              return (
                '<span class="ds-calendar-data-selector__weekday" aria-hidden="true">' +
                d +
                "</span>"
              );
            })
            .join("");
          // Static month layout: 2 leading blanks, then days 1..30.
          var calCells = [
            '<span class="ds-calendar-data-selector__day is-blank" aria-hidden="true"></span>',
            '<span class="ds-calendar-data-selector__day is-blank" aria-hidden="true"></span>',
          ];
          for (var cd = 1; cd <= 30; cd++) {
            var cdCls = "ds-calendar-data-selector__day";
            var cdSel = false; // selected → aria-pressed (non-visual selection state)
            if (calRange) {
              if (cd >= 12 && cd <= 16) {
                cdCls += " is-range";
                cdSel = true;
              }
              if (cd === 12) cdCls += " is-range-start";
              if (cd === 16) cdCls += " is-range-end";
            } else if (cd === 15) {
              cdCls += " is-selected";
              cdSel = true;
            }
            calCells.push(
              '<button class="' +
                cdCls +
                '" type="button"' +
                (cdSel ? ' aria-pressed="true"' : "") +
                ">" +
                cd +
                "</button>",
            );
          }
          return (
            '<div class="ds-calendar-data-selector">' +
            '<div class="ds-calendar-data-selector__header">' +
            '<button class="ds-calendar-data-selector__nav" type="button" aria-label="Previous month">' +
            renderIcon("arrow-left") +
            "</button>" +
            '<span class="ds-calendar-data-selector__month">' +
            calMonth +
            "</span>" +
            '<button class="ds-calendar-data-selector__nav" type="button" aria-label="Next month">' +
            renderIcon("arrow-left", { rotate: 180 }) +
            "</button>" +
            "</div>" +
            '<div class="ds-calendar-data-selector__weekdays">' +
            calWeek +
            "</div>" +
            // No role="grid": a real grid requires row/gridcell descendants,
            // which this static month strip does not provide; claiming the role
            // without them is invalid ARIA (axe aria-required-children). Left as
            // a styled group of day buttons; selection carried via aria-pressed.
            '<div class="ds-calendar-data-selector__grid">' +
            calCells.join("") +
            "</div>" +
            "</div>"
          );
        }

        case "error-state": {
          // Registry variant axis: Size (secondary) = Large | Medium. Clamp
          // BEFORE it touches the class attribute -- v.Size is user-supplied
          // flow-data; an unclamped value would break out of the class
          // attribute and inject markup (XSS). Unknown/crafted values fall
          // back to "large" (no modifier), same discipline as the
          // alert-banner case's Type clamp above.
          var errSizeRaw = (v.Size || "Large").toLowerCase();
          var errSize = { large: 1, medium: 1 }[errSizeRaw]
            ? errSizeRaw
            : "large";
          var errCls =
            "ds-error-state" +
            (errSize === "medium" ? " ds-error-state--medium" : "");
          var errIllus = renderGraphic(
            props.Illustration || "illustration-error-state",
          );
          var errTitle = esc(props.Title || "Something went wrong");
          var errBody = esc(
            props.Body ||
              "There was an error creating your item. Please try again in a moment.",
          );
          var errPrimary = esc(props.Primary || props.Cta || "Try again");
          var errSecondary = esc(props.Secondary || "Go back");
          return (
            '<div class="' +
            errCls +
            '">' +
            (errIllus
              ? '<div class="ds-error-state__illustration">' +
                errIllus +
                "</div>"
              : "") +
            '<div class="ds-error-state__text">' +
            '<p class="ds-error-state__title">' +
            errTitle +
            "</p>" +
            '<p class="ds-error-state__body">' +
            errBody +
            "</p>" +
            "</div>" +
            '<div class="ds-error-state__actions">' +
            '<button class="ds-button ds-button--tertiary ds-error-state__cta">' +
            errSecondary +
            "</button>" +
            '<button class="ds-button ds-button--primary ds-error-state__cta">' +
            errPrimary +
            "</button>" +
            "</div></div>"
          );
        }

        case "maintenance-state": {
          // Structural twin of empty-state (its captured anatomy page is
          // literally "Empty state"); dedicated ds-maintenance-state__*
          // classes rather than reusing .ds-empty-state* so the CEM derive
          // has its own honest token surface for this slug. Only axis
          // (Size=Large) is secondary, so there is no identity axis / no
          // modifier class here.
          var maintIllus = renderGraphic(
            props.Illustration || "illustration-maintenance",
          );
          var maintHeadline = esc(
            props.Headline ||
              props.Title ||
              "Scheduled maintenance in progress until 12:00 PM EST",
          );
          var maintBody = esc(
            props.Body ||
              "Reports may be unavailable. Refresh or check back when the maintenance window is complete.",
          );
          var maintPrimary = esc(props.Cta || props.Primary || "Create policy");
          var maintTertiary = esc(props.Secondary || "Learn more");
          return (
            '<div class="ds-maintenance-state">' +
            (maintIllus
              ? '<div class="ds-maintenance-state__illustration">' +
                maintIllus +
                "</div>"
              : "") +
            '<p class="ds-maintenance-state__headline">' +
            maintHeadline +
            "</p>" +
            '<p class="ds-maintenance-state__body">' +
            maintBody +
            "</p>" +
            '<div class="ds-maintenance-state__actions">' +
            '<button class="ds-button ds-button--tertiary ds-maintenance-state__cta">' +
            maintTertiary +
            "</button>" +
            '<button class="ds-button ds-button--primary ds-maintenance-state__cta">' +
            maintPrimary +
            "</button>" +
            "</div></div>"
          );
        }

        case "confirmation": {
          // Content/anatomy divergence (see build notes): the guideline
          // prose describes a destructive Delete/Cancel confirmation
          // dialog, but the captured Figma anatomy for this slug is a
          // SUCCESS-confirmation state (illustration Success + "Success!" +
          // "Open the catalog" CTA, page "Empty state"). Built from the
          // anatomy, not the modal prose. Structural twin of empty-state;
          // dedicated ds-confirmation__* classes so the CEM derive has its
          // own honest token surface for this slug.
          var confIllus = renderGraphic(
            props.Illustration || "illustration-success",
          );
          var confTitle = esc(props.Title || props.Headline || "Success!");
          var confBody = esc(
            props.Body ||
              "The selected items will be imported into the catalog. You will be notified once the import is complete.",
          );
          var confPrimary = esc(
            props.Cta || props.Primary || "Open the catalog",
          );
          var confSecondary = esc(props.Secondary || "Learn more");
          return (
            '<div class="ds-confirmation">' +
            (confIllus
              ? '<div class="ds-confirmation__illustration">' +
                confIllus +
                "</div>"
              : "") +
            '<p class="ds-confirmation__title">' +
            confTitle +
            "</p>" +
            '<p class="ds-confirmation__body">' +
            confBody +
            "</p>" +
            '<div class="ds-confirmation__actions">' +
            '<button class="ds-button ds-button--tertiary ds-confirmation__cta">' +
            confSecondary +
            "</button>" +
            '<button class="ds-button ds-button--primary ds-confirmation__cta">' +
            confPrimary +
            "</button>" +
            "</div></div>"
          );
        }

        // ---- Gray-box-to-zero, family 3 (card family) ----

        case "card-for-perimeter": {
          // Horizontal row card: item-type badge + name/counter + inline
          // progress bar. Single "Property 1=Default" variant (no State/Size
          // axis) -- one static appearance, no modifier classes. Inlines the
          // existing digram-item-types badge (via digramItemTypeStyle) and
          // the progress-bar-small track/fill/percent markup verbatim
          // (both already have ds-base.css rules) rather than recursing into
          // renderDSComponent, same idiom as card-for-items. Anatomy
          // captures background+radius only for the root -- no border/
          // shadow -- so none is added here.
          var cfpItemType = props["Item type"] || "Dataset";
          var cfpInitials = esc(
            props["Item type initials"] || props.Initials || props.Label || "",
          );
          var cfpName = esc(props.Name || "Dataset");
          var cfpCounter = esc(props.Counter || "23");
          // Same clamp-to-[0,100] discipline as the progress-bar-small case
          // above: Completeness is user-supplied flow-data, parsed defensively.
          var cfpPct = parseInt(
            String(props.Completeness || "50").replace(/[^0-9.-]/g, ""),
            10,
          );
          if (isNaN(cfpPct)) cfpPct = 0;
          if (cfpPct < 0) cfpPct = 0;
          if (cfpPct > 100) cfpPct = 100;
          return (
            '<div class="ds-card-perimeter">' +
            '<span class="ds-item-type" style="' +
            digramItemTypeStyle(cfpItemType) +
            '">' +
            cfpInitials +
            "</span>" +
            '<div class="ds-card-perimeter__body">' +
            '<div class="ds-card-perimeter__header">' +
            '<span class="ds-card-perimeter__name">' +
            cfpName +
            "</span>" +
            '<span class="ds-card-perimeter__counter">' +
            cfpCounter +
            "</span>" +
            "</div>" +
            '<div class="ds-progress">' +
            '<div class="ds-progress__track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' +
            cfpPct +
            '">' +
            '<span class="ds-progress__fill" style="width:' +
            cfpPct +
            '%"></span>' +
            "</div>" +
            '<span class="ds-progress__percent">' +
            cfpPct +
            "%</span>" +
            "</div>" +
            "</div>" +
            "</div>"
          );
        }

        case "card-for-grouped-content": {
          // Vertical card: header (title + optional info icon) + divider +
          // a content slot. Single "Property 1=Default" variant (no State/
          // Size axis) -- one static appearance, no modifier classes. The
          // header's inner instance is unresolved in the captured anatomy
          // and the slot is empty, so the placeholder body takes the same
          // posture card-for-items takes for its placeholder title/body.
          var cgcTitle = esc(props.Title || "Grouped content");
          var cgcInfo =
            props["Show info icon"] !== false
              ? '<span class="ds-card-grouped__info">' +
                renderIcon("info") +
                "</span>"
              : "";
          var cgcBody = esc(props.Body || "");
          return (
            '<div class="ds-card-grouped">' +
            '<div class="ds-card-grouped__header">' +
            '<span class="ds-card-grouped__title">' +
            cgcTitle +
            "</span>" +
            cgcInfo +
            "</div>" +
            '<div class="ds-card-grouped__divider"></div>' +
            '<div class="ds-card-grouped__slot">' +
            '<p class="ds-card-grouped__body">' +
            cgcBody +
            "</p>" +
            "</div>" +
            "</div>"
          );
        }

        case "search-result-card": {
          // Rich result card. Identity axis App = Explorer (default) |
          // Studio; State is a secondary axis, only Selected/Focus mapped
          // to a visible modifier (Hover/Pressed are transient interaction
          // states, not rendered statically -- same discipline as
          // tag-interactive's Selected/Disabled-only handling above). The
          // fidelity oracle only captures App=Explorer/State=Default, so
          // that default stays faithful; Studio's structural swaps (button
          // -> progress-bar-small, digram -> tag-read-only) are intentionally
          // NOT built here, per the spec. App=Studio therefore renders the
          // BASE card with no root modifier -- there is no built CSS delta
          // for it, and a modifier class must not be emitted without one
          // (no no-op namespace-hook markers; see ds-base.css). Inlines the
          // eyebrow/stage/catalog tags and the glossary item-type badge
          // reusing EXISTING shared classes (.ds-tag / .ds-tag-stage /
          // .ds-tag--catalog / .ds-item-type) rather than
          // recursing into renderDSComponent, same idiom as card-for-items.
          // The stage pill carried a `.ds-tag--gray` modifier until the
          // 2026-08-12 fold-in retired tag-read-only's Color axis; Gray was
          // never a value with a rule of its own (it equalled Color=Default),
          // so the class named a value the design system no longer has and
          // painted nothing. Dropped rather than left dangling. This card's
          // OWN capture agrees with where that leaves the pill: its stage
          // child is a tag-read-only instance captured at bg #fcfcfc / border
          // #ebebeb (--zen-color-neutral-50) / radius 4px, which is base
          // .ds-tag's re-grounded Type=Default paint in this card's theme
          // mode, and its catalog child is captured at #ecffff / #d0efed,
          // which is exactly Type=Catalog.
          var srcCls = "ds-search-result-card";
          if (v.State === "Selected")
            srcCls += " ds-search-result-card--selected";
          if (v.State === "Focus") srcCls += " ds-search-result-card--focus";

          var srcTitle = esc(props.Title || "Financial Summary EY2024");
          var srcTech = esc(props["Tech name"] || "[Financial Summary EY2024]");
          var srcType = esc(props.Type || "Category");
          var srcStage = esc(props.Stage || "Stage");
          var srcCatalog = esc(props.Catalog || "Catalog");
          var srcDesc = esc(
            props.Description ||
              props.Body ||
              "A product is anything that can be offered to a market that might satisfy a want or need by potential customers.",
          );
          var srcProp1 = esc(
            props["Featured property 1"] || "Business Domain: IT",
          );
          var srcProp2 = esc(
            props["Featured property 2"] || "Source Application: App 120",
          );
          var srcGlossaryLabel = esc(props["Glossary label"] || "Vehicle");
          var srcGlossaryInitials = esc(props["Glossary initials"] || "VH");
          // The captured anatomy's Glossary badge resolves to #fff9e5 --
          // that is DIGRAM_ITEM_TYPE_COLORS["Glossary 1"] (also shared by
          // "Use case"), NOT "Category" (#ffdacf); "Glossary 1" is the
          // itemType that actually reproduces the captured color.
          var srcGlossaryBadge = digramItemTypeStyle("Glossary 1");

          return (
            '<div class="' +
            srcCls +
            '">' +
            '<div class="ds-search-result-card__header">' +
            '<div class="ds-search-result-card__name">' +
            '<span class="ds-tag ds-search-result-card__type">' +
            srcType +
            "</span>" +
            '<span class="ds-search-result-card__title">' +
            srcTitle +
            "</span>" +
            '<span class="ds-search-result-card__tech">' +
            srcTech +
            "</span>" +
            "</div>" +
            '<span class="ds-tag ds-tag-stage ds-search-result-card__stage">' +
            '<span class="ds-tag-stage__dot"></span>' +
            srcStage +
            "</span>" +
            "</div>" +
            '<div class="ds-search-result-card__details">' +
            '<span class="ds-tag ds-tag--catalog ds-search-result-card__catalog">' +
            srcCatalog +
            "</span>" +
            '<p class="ds-search-result-card__desc">' +
            srcDesc +
            "</p>" +
            '<div class="ds-search-result-card__props">' +
            '<span class="ds-search-result-card__prop">' +
            srcProp1 +
            "</span>" +
            '<span class="ds-search-result-card__prop">' +
            srcProp2 +
            "</span>" +
            "</div>" +
            '<div class="ds-search-result-card__glossary">' +
            '<span class="ds-item-type" style="' +
            srcGlossaryBadge +
            '">' +
            srcGlossaryInitials +
            "</span>" +
            '<span class="ds-search-result-card__glossary-label">' +
            srcGlossaryLabel +
            "</span>" +
            "</div>" +
            "</div>" +
            "</div>"
          );
        }

        default: {
          // Phase 1B: PREFER rendering the component per-instance from its
          // captured appearance doc so the instance's own variant selects the
          // right colors. Docs are injected server-side via setAnatomyDocMap()
          // and embedded as window.__dsAnatomyDocs in browser deliverables.
          var docs =
            (typeof window !== "undefined" && window.__dsAnatomyDocs) ||
            _serverAnatomyDocs ||
            {};
          var doc = docs[slug];
          if (
            doc &&
            appearanceRender &&
            appearanceRender.renderAppearanceComponent
          ) {
            var out = appearanceRender.renderAppearanceComponent(doc, {
              variant: v,
              props: props,
            });
            if (out) return out;
          }
          // No appearance doc for this slug (or it rendered empty): a clean
          // labeled chip. Total tolerance — this seam never throws. (The
          // legacy slug→pre-rendered-HTML anatomy map fallback — "path c",
          // formerly exposed as a window global — was retired in Group C.)
          return gracefulChip();
        }
      }
    } catch (e) {
      // Defense in depth: any case throwing on a hostile prop shape degrades to
      // the same graceful chip rather than propagating. The seam never throws.
      return gracefulChip();
    }
  }

  // Slugs with a real leaf (everything else chip-degrades). Gated against the
  // switch cases by tests/renderers/ds-built-slugs.test.js — update BOTH.
  var BUILT_SLUGS = [
    "button",
    "text-input",
    "checkbox",
    "radio",
    "toggle",
    "read-only-tag",
    "badge",
    "search",
    "global-header",
    "side-nav",
    "page-header",
    "breadcrumb",
    "tabs",
    "table",
    "modal",
    "empty-state",
    "alert-banner",
    // Hi-Fi Slice 1 (Task 4): transform-target leaves
    "toast",
    "stepper",
    "tooltip-default",
    "calendar-date-input",
    "rich-text",
    "dropdown-select-default",
    "progress-bar-small",
    "interactive-tag",
    // Hi-Fi A1 (narrow) — degraded-slug overrides. Batch 1: overlays.
    "popover",
    "global-header-account-dropdown",
    "app-switcher-dropdown",
    // Hi-Fi A1 (narrow) — degraded-slug overrides. Batch 2: controls.
    "segmented-control",
    "toolbar",
    "action-bar",
    // Hi-Fi A1 (narrow) — degraded-slug overrides. Batch 3: feedback + date.
    "loader",
    "calendar-data-selector",
    "digram-item-types",
    "digram-topic",
    "lineage",
    "lineage-grouped-node",
    "metamodel",
    "loader-with-logo",
    // Gray-box-to-zero, family 1 (feedback states).
    "confirmation",
    "error-state",
    "maintenance-state",
    // Gray-box-to-zero, family 2 (tag family). The 2026-08-12 sync folded
    // tag-shared, tag-catalog, tag-stage, tag-status and
    // tag-glossary-item-type into tag-read-only's Type axis and renamed
    // tag-catalog-item-type, so one entry is left where six were.
    "item-type-tag",
    // Gray-box-to-zero, family 3 (card family).
    "card-for-perimeter",
    "card-for-grouped-content",
    "search-result-card",
    // Gray-box-to-zero, family 4 (dropdowns / overlays).
    "notification-dropdown",
    "search-dropdown-menu",
    "whats-new-dropdown",
    "drawer",
    // Gray-box-to-zero, family 5 (primitives).
    "spinner",
    "loading-skeleton",
    "scroll-bar",
    "link",
    "avatar",
    "collapse",
  ];

  exports.renderDSComponent = renderDSComponent;
  exports.resolveSlug = resolveSlug;
  exports.setAnatomyDocMap = setAnatomyDocMap;
  exports.setVariantStyleMap = setVariantStyleMap;
  exports.renderIcon = renderIcon;
  exports.setIcons = setIcons;
  exports.renderGraphic = renderGraphic;
  exports.setGraphics = setGraphics;
  exports.esc = esc;
  exports.parseVariant = parseVariant;
  exports.normalizeProps = normalizeProps;
  exports.BUILT_SLUGS = BUILT_SLUGS;
})(
  typeof module !== "undefined"
    ? module.exports
    : (window.dsHtmlMap = window.dsHtmlMap || {}),
);
