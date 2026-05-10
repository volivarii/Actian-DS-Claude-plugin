"use strict";

/**
 * paths.js — Single source of truth for vendor subtree paths.
 *
 * Plugin reads DS knowledge from the vendored snapshot of
 * volivarii/actian-ds-knowledge under plugins/actian-design-system/vendor/.
 * Centralizing the leaf paths here means a future folder rename in the
 * upstream knowledge repo (e.g., src/+dist/ split per the 2026-05-10
 * restructure design) becomes a 1-file edit, not a 64-file edit across
 * skills/agents/refs/recipes/scripts.
 *
 * Markdown prose (skills, agents, references, recipes) keeps literal
 * path strings — those don't import from this module — but every
 * runtime script that builds a vendor path SHOULD import from here.
 *
 * Pre-restructure paths shown below; constants will be updated to
 * point at vendor/<domain>/{src,dist}/... once Phase B/C lands.
 */

const path = require("path");

const PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
const VENDOR = path.join(PLUGIN_ROOT, "vendor");

const PATHS = {
  pluginRoot: PLUGIN_ROOT,
  vendor: VENDOR,
  foundations: {
    md: path.join(VENDOR, "foundations", "foundations.md"),
    authoring: path.join(VENDOR, "foundations", "AUTHORING.md"),
    dist: path.join(VENDOR, "foundations"),
    color: path.join(VENDOR, "foundations", "color.json"),
    borders: path.join(VENDOR, "foundations", "borders.json"),
    elevation: path.join(VENDOR, "foundations", "elevation.json"),
    spacing: path.join(VENDOR, "foundations", "spacing.json"),
    typography: path.join(VENDOR, "foundations", "typography.json"),
    motion: path.join(VENDOR, "foundations", "interaction-motion.json"),
    icons: path.join(VENDOR, "foundations", "icons.json"),
    breakpointGridStructure: path.join(
      VENDOR,
      "foundations",
      "breakpoint-grid-structure.json",
    ),
  },
  tokens: {
    json: path.join(VENDOR, "tokens", "tokens.json"),
    css: path.join(VENDOR, "tokens", "tokens.css"),
    reference: path.join(VENDOR, "tokens", "token-reference.md"),
  },
  components: {
    guidelinesDir: path.join(VENDOR, "components", "guidelines"),
    guidelinesIndex: path.join(
      VENDOR,
      "components",
      "guidelines",
      "_index.json",
    ),
    guideline: function (slug) {
      return path.join(VENDOR, "components", "guidelines", slug + ".json");
    },
    registries: {
      dskit: path.join(VENDOR, "components", "registries", "dskit.json"),
      fmkit: path.join(VENDOR, "components", "registries", "fmkit.json"),
      metakit: path.join(VENDOR, "components", "registries", "metakit.json"),
      styles: path.join(
        VENDOR,
        "components",
        "registries",
        "meta-kit",
        "styles.json",
      ),
      byKit: function (kit) {
        // kit: "ds" | "fm" | "meta"
        if (kit === "ds")
          return path.join(VENDOR, "components", "registries", "dskit.json");
        if (kit === "fm")
          return path.join(VENDOR, "components", "registries", "fmkit.json");
        if (kit === "meta")
          return path.join(VENDOR, "components", "registries", "metakit.json");
        throw new Error(
          'paths.components.registries.byKit: unknown kit "' + kit + '"',
        );
      },
    },
    mirrors: {
      ds: path.join(VENDOR, "components", "dskit-components.md"),
      fm: path.join(VENDOR, "components", "fm-components.md"),
      metaKit: path.join(VENDOR, "components", "meta-kit", "components.md"),
      textStyles: path.join(VENDOR, "components", "text-styles.md"),
      effectStyles: path.join(VENDOR, "components", "effect-styles.md"),
    },
  },
  content: path.join(VENDOR, "content", "content.md"),
  accessibility: path.join(VENDOR, "accessibility", "accessibility.md"),
  presentation: path.join(VENDOR, "presentation", "presentation-guide.md"),
  appContext: path.join(VENDOR, "app-context", "app-context.json"),
  fmToDsMap: path.join(VENDOR, "fm-to-ds-map", "fm-to-ds-map.json"),
};

module.exports = PATHS;
