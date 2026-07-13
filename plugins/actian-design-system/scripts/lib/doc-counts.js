"use strict";

/**
 * doc-counts.js — single source of truth for the plugin's human-facing
 * inventory counts and which managed docs must state them.
 *
 * Consumed by BOTH:
 *   - tests/integration/doc-counts.test.js  (GUARD — asserts each doc states
 *     the derived counts; fails loudly on drift)
 *   - scripts/vendor/sync-doc-counts.js     (FIXER — rewrites the doc strings
 *     to match the derived counts; run in the vendor-snapshot workflow so a
 *     count-changing refresh self-heals instead of failing CI)
 *
 * Because both sides read the same `buildChecks()`, the guard and the fixer
 * can never disagree.
 *
 * Each `contains` entry is { str, fixRx? }:
 *   - `str`   is the canonical phrase the guard asserts is present AND the
 *             string the fixer writes.
 *   - `fixRx` (optional, MUST be /g) matches the same phrase with the numbers
 *             wildcarded, anchored tightly enough that replacing it with `str`
 *             is unambiguous and idempotent. Literal phrases (e.g. "WCAG 2.2
 *             AA") have no fixRx — the guard checks them, the fixer ignores
 *             them. `str` is written as a literal (no $-pattern expansion).
 *
 * Zero dependencies — Node.js built-ins only.
 */

var fs = require("fs");
var path = require("path");
// Vendor reads route through PATHS (the indirection layer), never bare
// vendor-path string literals — guarded by no-bare-vendor-paths.test.js.
var PATHS = require("./paths.js");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");

// ---------------------------------------------------------------------------
// Derive canonical counts from ground truth (filesystem + vendored registries)
// ---------------------------------------------------------------------------

function listDirs(p) {
  if (!fs.existsSync(p)) return [];
  return fs.readdirSync(p).filter(function (e) {
    return fs.statSync(path.join(p, e)).isDirectory();
  });
}

function deriveSkills() {
  return listDirs(path.join(PLUGIN_ROOT, "skills")).filter(function (d) {
    return fs.existsSync(path.join(PLUGIN_ROOT, "skills", d, "SKILL.md"));
  }).length;
}

function deriveAgents() {
  var dir = path.join(PLUGIN_ROOT, "agents");
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(function (f) {
    return f.endsWith(".md");
  }).length;
}

function deriveRecipes() {
  var root = path.join(PLUGIN_ROOT, "recipes");
  var total = 0;
  listDirs(root).forEach(function (kind) {
    fs.readdirSync(path.join(root, kind)).forEach(function (f) {
      if (f.endsWith(".json") && f !== "_index.json") total++;
    });
  });
  return total;
}

function deriveRegistry(lib) {
  // lib is "dskit" | "fmkit" | "metakit" — keyed directly in PATHS.
  var p = PATHS.components.registries[lib];
  var reg = JSON.parse(fs.readFileSync(p, "utf8"));
  var keys = Object.keys(reg.components || {});
  var sets = keys.filter(function (k) {
    return reg.components[k].importMethod === "set";
  }).length;
  var count =
    typeof reg.componentCount === "number" ? reg.componentCount : keys.length;
  return { count: count, sets: sets, keyCount: keys.length };
}

function deriveGuidelines() {
  // Derive the guidelines dir from a PATHS-resolved guideline-doc path
  // (rather than a hardcoded vendor-path literal) so the indirection layer
  // stays the single source of vendor locations.
  var docs = PATHS.components.guidelineDoc;
  // guidelineDoc maps slug -> path but also carries a byKey() helper; pick the
  // first string-valued entry so we never path.dirname() a function if the
  // manifest key order ever changes.
  var firstPath = Object.keys(docs)
    .map(function (k) {
      return docs[k];
    })
    .find(function (v) {
      return typeof v === "string";
    });
  var dir = path.dirname(firstPath);
  var files = fs.readdirSync(dir).filter(function (f) {
    return f.endsWith(".json") && f !== "guidelines.bundle.json";
  });
  var aliases = files.filter(function (f) {
    var j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    return Object.prototype.hasOwnProperty.call(j, "_alias_of");
  }).length;
  return {
    total: files.length,
    canonical: files.length - aliases,
    aliases: aliases,
  };
}

function deriveCounts() {
  return {
    SKILLS: deriveSkills(),
    AGENTS: deriveAgents(),
    RECIPES: deriveRecipes(),
    DS: deriveRegistry("dskit"),
    FM: deriveRegistry("fmkit"),
    META: deriveRegistry("metakit"),
    GUIDE: deriveGuidelines(),
  };
}

// ---------------------------------------------------------------------------
// Managed doc surfaces (repo-root-relative paths) + the strings each must
// contain / must not contain, built FROM the derived counts.
// ---------------------------------------------------------------------------

function buildChecks(c) {
  return [
    {
      file: "README.md",
      contains: [
        { str: c.SKILLS + " skills", fixRx: /\d+ skills/g },
        { str: c.AGENTS + " agents", fixRx: /\d+ agents/g },
        { str: c.RECIPES + " recipes", fixRx: /\d+ recipes/g },
        { str: "WCAG 2.2 AA" },
        {
          str:
            c.DS.count +
            " DS Kit + " +
            c.FM.count +
            " FM Kit + " +
            c.META.count +
            " Meta Kit",
          fixRx: /\d+ DS Kit \+ \d+ FM Kit \+ \d+ Meta Kit/g,
        },
        {
          str: c.DS.count + " DS Kit components (" + c.DS.sets + " sets)",
          fixRx: /\d+ DS Kit components \(\d+ sets\)/g,
        },
        // Per-kit SET breakdown, both phrasings ("… component sets" and
        // "(… sets)"). A vendor refresh that grows a kit can move these.
        {
          str:
            c.DS.sets +
            " / " +
            c.FM.sets +
            " / " +
            c.META.sets +
            " component sets",
          fixRx: /\d+ \/ \d+ \/ \d+ component sets/g,
        },
        {
          str: c.DS.sets + " / " + c.FM.sets + " / " + c.META.sets + " sets",
          fixRx: /\d+ \/ \d+ \/ \d+ sets/g,
        },
        {
          str: c.GUIDE.total + " per-component guideline docs",
          fixRx: /\d+ per-component guideline docs/g,
        },
        // Guideline canonical/alias split. fixRx matches only the "<n>
        // components + <n>" prefix so the trailing "(registry-key) aliases"
        // wording is preserved regardless of which phrasing the doc uses.
        {
          str: c.GUIDE.canonical + " components + " + c.GUIDE.aliases,
          fixRx: /\d+ components \+ \d+/g,
        },
      ],
      // Stale-phrasing denylist. Keep these to WORDING that is wrong regardless
      // of the numbers ("WCAG 2.1 AA"), not to literal counts: a count denylist
      // eventually collides with the truth. It just did — the DS Kit set count
      // drifted 80 → 82 with knowledge v0.34.89, so "82 sets" and "82 / 33 / 11"
      // are now exactly what sync-doc-counts.js derives and writes, and banning
      // them fired the guard against the correct value. Removed for that reason;
      // do not add new count literals here.
      notContains: [
        "WCAG 2.1 AA",
        "322 DS Kit",
        "85 per-component",
        "41 auto-stub",
        "44 fully curated",
      ],
    },
    {
      file: ".claude-plugin/marketplace.json",
      contains: [
        {
          str: c.SKILLS + " skills, " + c.AGENTS + " agents",
          fixRx: /\d+ skills, \d+ agents/g,
        },
        {
          str: c.SKILLS + " skills + " + c.AGENTS + " agents",
          fixRx: /\d+ skills \+ \d+ agents/g,
        },
        { str: c.RECIPES + " recipes", fixRx: /\d+ recipes/g },
        { str: "WCAG 2.2 AA" },
        { str: "brief-researcher" },
      ],
      notContains: ["WCAG 2.1 AA", "sync-design-system", "24 recipes"],
    },
    {
      file: "plugins/actian-design-system/.claude-plugin/plugin.json",
      contains: [
        { str: c.SKILLS + " skills", fixRx: /\d+ skills/g },
        { str: c.AGENTS + " agents", fixRx: /\d+ agents/g },
        { str: "WCAG 2.2 AA" },
      ],
      notContains: ["WCAG 2.1 AA"],
    },
    {
      file: "llms.txt",
      contains: [
        { str: c.SKILLS + " skills", fixRx: /\d+ skills/g },
        {
          str: c.DS.count + " DS Kit components",
          fixRx: /\d+ DS Kit components/g,
        },
        {
          str: c.FM.count + " FM Kit wireframe components",
          fixRx: /\d+ FM Kit wireframe components/g,
        },
        {
          str: c.META.count + " Meta Kit components",
          fixRx: /\d+ Meta Kit components/g,
        },
        { str: "WCAG 2.2 AA" },
        // Anchored on ", all curated" so it never clobbers the sibling
        // "Foundations subtree (8 JSON files)" line.
        {
          str: c.GUIDE.total + " JSON files, all curated",
          fixRx: /\d+ JSON files, all curated/g,
        },
      ],
      notContains: [
        "WCAG 2.1 AA",
        "107 DS Kit",
        "107 design system",
        "85 JSON files",
      ],
    },
    {
      file: "USAGE.md",
      contains: [{ str: "WCAG 2.2 AA" }],
      notContains: ["WCAG 2.1 AA"],
    },
    {
      file: "plugins/actian-design-system/references/context/companion-context.md",
      // Each row is anchored on its library label so the three identically
      // shaped "N components (M sets)" cells map to the right registry.
      contains: [
        {
          str:
            "DS Kit | " + c.DS.count + " components (" + c.DS.sets + " sets)",
          fixRx: /DS Kit \| \d+ components \(\d+ sets\)/g,
        },
        {
          str:
            "FM Kit | " + c.FM.count + " components (" + c.FM.sets + " sets)",
          fixRx: /FM Kit \| \d+ components \(\d+ sets\)/g,
        },
        {
          str:
            "Meta Kit | " +
            c.META.count +
            " components (" +
            c.META.sets +
            " sets)",
          fixRx: /Meta Kit \| \d+ components \(\d+ sets\)/g,
        },
        {
          str: c.GUIDE.total + " guideline docs",
          fixRx: /\d+ guideline docs/g,
        },
        {
          str: c.GUIDE.canonical + " components + " + c.GUIDE.aliases,
          fixRx: /\d+ components \+ \d+/g,
        },
      ],
      notContains: ["107 sets", "44 components |", "~41 of 85"],
    },
    {
      file: "plugins/actian-design-system/references/figma/figma-push-patterns.md",
      contains: [
        {
          str: c.DS.count + " design system components",
          fixRx: /\d+ design system components/g,
        },
        {
          str: c.FM.count + " wireframe components",
          fixRx: /\d+ wireframe components/g,
        },
      ],
      notContains: ["107 design system components", "33 wireframe components"],
    },
  ];
}

// ---------------------------------------------------------------------------
// Fixer core — pure string transform so it's trivially testable.
// ---------------------------------------------------------------------------

/**
 * Rewrite every fixable phrase in `content` to its canonical `str`.
 * Literal items (no fixRx) are left alone. The replacement is a literal
 * (a function is used so `$` sequences in `str` are not interpreted).
 */
function fixContent(content, containsItems) {
  var out = content;
  (containsItems || []).forEach(function (item) {
    if (!item.fixRx) return;
    out = out.replace(item.fixRx, function () {
      return item.str;
    });
  });
  return out;
}

/**
 * Walk every managed doc, rewrite its count phrases to the derived values, and
 * (when opts.write) persist the change. Returns { counts, changed[] } where
 * `changed` is the repo-relative paths whose content the fixer altered.
 *
 * @param {string} repoRoot - absolute path to the repository root
 * @param {{ write?: boolean }} [opts] - write:true persists; otherwise dry-run
 */
function syncDocCounts(repoRoot, opts) {
  opts = opts || {};
  var counts = deriveCounts();
  var checks = buildChecks(counts);
  var changed = [];
  checks.forEach(function (check) {
    var abs = path.join(repoRoot, check.file);
    if (!fs.existsSync(abs)) return;
    var content = fs.readFileSync(abs, "utf8");
    var fixed = fixContent(content, check.contains);
    if (fixed !== content) {
      changed.push(check.file);
      if (opts.write) fs.writeFileSync(abs, fixed, "utf8");
    }
  });
  return { counts: counts, changed: changed };
}

module.exports = {
  deriveCounts: deriveCounts,
  buildChecks: buildChecks,
  fixContent: fixContent,
  syncDocCounts: syncDocCounts,
  // Exposed for any consumer that wants a single registry's numbers.
  deriveRegistry: deriveRegistry,
};
