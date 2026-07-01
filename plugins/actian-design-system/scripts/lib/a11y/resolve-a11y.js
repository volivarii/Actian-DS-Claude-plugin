#!/usr/bin/env node
"use strict";

// resolve-a11y.js — per-component accessibility rulesets from the vendored
// knowledge graph + accessibility bundle. Mirrors scripts/lib/app-context/
// resolve-*.js (injection seams + thin CLI). For a component slug it unions
// two graph a11y_ref sources: the component's OWN direct edge (its specific
// a11y section, e.g. component:button -> a11y:buttons) and its category's
// edges (cross-cutting concerns, e.g. category:action -> a11y:focus-keyboard).

var fs = require("fs");
var path = require("path");
var PATHS = require(path.join(__dirname, "..", "paths.js"));

// Injection seam (testing): a pre-loaded graph object, a path string, or
// default -> PATHS.graph.bundle.
function loadGraph(g) {
  if (g && typeof g === "object") return g;
  var p = g && typeof g === "string" ? g : PATHS.graph.bundle;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    return null;
  }
}

// Injection seam (testing): a pre-loaded a11y bundle object, a path string,
// or default -> PATHS.accessibility.bundle.
function loadA11yBundle(b) {
  if (b && typeof b === "object") return b;
  var p = b && typeof b === "string" ? b : PATHS.accessibility.bundle;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    return null;
  }
}

// "a11y:buttons" -> "buttons"; "buttons" -> "buttons".
function a11yId(nodeId) {
  return typeof nodeId === "string" ? nodeId.replace(/^a11y:/, "") : "";
}

// WCAG list: prefer the graph node's wcag[], else parse the bundle section
// body ("WCAG criteria: 2.1.1, 2.4.3, ...").
function wcagFrom(node, section) {
  if (node && Array.isArray(node.wcag) && node.wcag.length) {
    return node.wcag.slice();
  }
  var body = section && typeof section.body === "string" ? section.body : "";
  var m = body.match(/WCAG criteria:\s*(.+)/i);
  if (!m) return [];
  return m[1]
    .split(",")
    .map(function (s) {
      return s.trim();
    })
    .filter(Boolean);
}

// Flatten a bundle section's blocks to rule strings (list items + paragraph
// text).
function rulesFrom(section) {
  var out = [];
  var blocks = section && Array.isArray(section.blocks) ? section.blocks : [];
  blocks.forEach(function (bl) {
    if (bl && Array.isArray(bl.items)) {
      bl.items.forEach(function (it) {
        if (typeof it === "string" && it.trim()) out.push(it.trim());
      });
    } else if (bl && typeof bl.text === "string" && bl.text.trim()) {
      out.push(bl.text.trim());
    }
  });
  return out;
}

// Index the graph: component slug id -> [category ids]; any source id
// (component OR category) -> [{ a11y, note }]; node id -> node.
function indexGraph(graph) {
  var inCat = {};
  var a11yBySrc = {};
  var nodeById = {};
  var nodes = (graph && graph.nodes) || [];
  var edges = (graph && graph.edges) || [];
  nodes.forEach(function (n) {
    if (n && n.id) nodeById[n.id] = n;
  });
  edges.forEach(function (e) {
    if (!e || typeof e.source !== "string") return;
    if (e.type === "in_category" && e.source.indexOf("component:") === 0) {
      (inCat[e.source] = inCat[e.source] || []).push(e.target);
    }
    if (e.type === "a11y_ref") {
      (a11yBySrc[e.source] = a11yBySrc[e.source] || []).push({
        a11y: e.target,
        note: e.note || "",
      });
    }
  });
  return { inCat: inCat, a11yBySrc: a11yBySrc, nodeById: nodeById };
}

// Resolve a11y rulesets for a list of DS component slugs.
function resolveA11y(slugs, opts) {
  opts = opts || {};
  var graph = loadGraph(opts.graph);
  var bundle = loadA11yBundle(opts.bundle);
  var idx = indexGraph(graph);
  var comps = (bundle && bundle.components) || {};

  function sectionFor(sectionId) {
    // component-category section first, else a topical top-level section
    return comps[sectionId] || (bundle ? bundle[sectionId] : null) || null;
  }

  var slugsOut = {};
  var categories = {};
  (Array.isArray(slugs) ? slugs : []).forEach(function (slug) {
    var cid = "component:" + slug;
    var sources = [cid].concat(idx.inCat[cid] || []); // direct + via-category
    var a11y = [];
    var seen = {};
    sources.forEach(function (src) {
      (idx.a11yBySrc[src] || []).forEach(function (ref) {
        var sectionId = a11yId(ref.a11y);
        if (!sectionId || seen[sectionId]) return;
        seen[sectionId] = true;
        var section = sectionFor(sectionId);
        var node = idx.nodeById[ref.a11y];
        var entry = {
          section: sectionId,
          wcag: wcagFrom(node, section),
          rules: rulesFrom(section),
          note: ref.note || "",
        };
        a11y.push(entry);
        if (!categories[sectionId]) {
          categories[sectionId] = {
            wcag: entry.wcag,
            rules: entry.rules,
            note: entry.note,
          };
        }
      });
    });
    slugsOut[slug] = { slug: slug, resolved: a11y.length > 0, a11y: a11y };
  });

  return { slugs: slugsOut, categories: categories };
}

module.exports = {
  resolveA11y: resolveA11y,
  indexGraph: indexGraph,
  wcagFrom: wcagFrom,
  rulesFrom: rulesFrom,
  a11yId: a11yId,
};

// Thin CLI: resolve-a11y.js --slugs button,modal,card
if (require.main === module) {
  var args = process.argv.slice(2);
  var i = args.indexOf("--slugs");
  if (i !== -1 && args[i + 1]) {
    var list = args[i + 1]
      .split(",")
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
    var res = resolveA11y(list);
    process.stdout.write(JSON.stringify(res, null, 2) + "\n");
    var any = Object.keys(res.slugs).some(function (k) {
      return res.slugs[k].resolved;
    });
    process.exit(any ? 0 : 1);
  }
  process.stderr.write("usage: resolve-a11y.js --slugs <slug,slug,...>\n");
  process.exit(2);
}
