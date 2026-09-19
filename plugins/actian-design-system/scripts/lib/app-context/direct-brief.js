"use strict";

// The direct route's brief: everything prepare-flow already joins, plus one
// `direct` block naming every vendored file an author needs to draw the
// prototype as HTML. No skeleton: a captured page reaches the author as its
// screenshot, its `slots` prose and its renderNotes. Pure apart from the
// injected fs reads.

var fs = require("fs");
var path = require("path");
var PATHS = require("../paths");
var cssPaths = require("../renderer.js").cssPaths;

// The stylesheets the app frame renders with, in the order the flow renderer
// documents: tokens first, then FLOW_CSS. assemble-shared.js owns that list
// and look.js reads the same one to render a screen standalone, so the brief
// names it rather than restating a set of its own. The three single-file
// entries beside it in `assets` are what an author READS (token names, DS
// class names); this is what the page inlines.
var FLOW_CSS = require("../../renderers/assemble-shared.js").FLOW_CSS;

// No manifest entry resolves terminology.yml: the manifest's own appContextSrc
// collection note says "Terminology lives in terminology.yml (not covered by
// this collection)", and validate-flow-data.js's loadTerminology reads the
// derived app-context.json instead of this source file. Built from PATHS.vendor,
// the same root every other overlay in paths.js joins from, rather than a
// literal vendor path with no PATHS underneath it at all.
var TERMINOLOGY_SRC = path.join(
  PATHS.vendor,
  "app-context",
  "src",
  "terminology.yml",
);

// Where each kind of layer sits. Widths are the ones flow-renderer.js docks
// at; a toast's place is the global-toast usage note's to say.
var LAYERS = {
  drawer: {
    width: 550,
    dock: "right edge, below the app header, no scrim, the page behind stays live",
  },
  panel: {
    width: 420,
    dock: "right edge of the content area, below the app header",
  },
  modal: { width: null, dock: "centred on a scrim" },
  toast: { width: null, dock: "as the global-toast usage note says" },
};

// The component each kind of layer is drawn with. A panel is a drawer at the
// panel's width.
var LAYER_COMPONENT = { drawer: "drawer", panel: "drawer", modal: "modal", toast: "toast" };

function abs(p) {
  return p ? path.resolve(p) : null;
}

function slugsIn(tree, into) {
  (function walk(n) {
    if (Array.isArray(n)) return n.forEach(walk);
    if (!n || typeof n !== "object") return;
    if (n.dsSlug) into[n.dsSlug] = true;
    (n.children || []).forEach(walk);
  })(tree);
}

function captureOf(screen, deps) {
  var pr = screen.pageRecipe;
  if (!pr || !pr.slug) return null;
  var shot = null;
  try {
    var recipe = deps.readRecipe(pr.slug);
    var rel = recipe && recipe.derivedFrom && recipe.derivedFrom.screenshot;
    if (rel) {
      var p = path.join(path.dirname(PATHS.appContextRecipesSrc(pr.slug)), rel);
      if (deps.exists(p)) shot = abs(p);
    }
  } catch (e) {
    shot = null;
  }
  return {
    slug: pr.slug,
    label: pr.label,
    slots: pr.slots || {},
    renderNotes: pr.renderNotes || [],
    sections: pr.sections || [],
    screenshot: shot,
  };
}

function directBrief(brief, opts) {
  opts = opts || {};
  var d = opts.deps || {};
  var deps = {
    exists: d.exists || fs.existsSync,
    readRecipe:
      d.readRecipe ||
      function (slug) {
        return JSON.parse(
          fs.readFileSync(PATHS.appContextRecipes(slug), "utf8"),
        );
      },
  };
  var chrome = (brief.glossary && brief.glossary.chrome) || {};
  var found = {};
  var steps = (brief.screens || []).map(function (s, i) {
    (s.components || []).forEach(function (c) {
      found[c] = true;
    });
    if (s.pageRecipe && s.pageRecipe.skeleton)
      slugsIn(s.pageRecipe.skeleton.content || s.pageRecipe.skeleton, found);
    if (s.layer && LAYER_COMPONENT[s.layer.kind])
      found[LAYER_COMPONENT[s.layer.kind]] = true;
    var f = (brief.flow || [])[i] || {};
    return {
      n: i + 1,
      id: f.id,
      name: s.name,
      nav: (opts.navByScreen && opts.navByScreen[i]) || opts.nav || null,
      pattern: s.pattern || null,
      layer: s.layer || null,
      exit: s.exit || null,
      capture: captureOf(s, deps),
    };
  });
  var components = Object.keys(found)
    .sort()
    .map(function (slug) {
      return {
        slug: slug,
        fragment: abs(PATHS.components.render.fragments(slug)),
        usageNotes: abs(PATHS.components.render.usageNotes(slug)),
      };
    })
    .filter(function (c) {
      return deps.exists(c.fragment);
    })
    .map(function (c) {
      return deps.exists(c.usageNotes)
        ? c
        : { slug: c.slug, fragment: c.fragment, usageNotes: null };
    });
  // A copy, never the exported LAYERS itself: other code may hold that
  // reference, and a toast's usage note is only known here, per call.
  var globalToastNotes = PATHS.components.render.usageNotes("global-toast");
  var layers = Object.assign({}, LAYERS, {
    toast: Object.assign({}, LAYERS.toast, {
      usageNotes: deps.exists(globalToastNotes) ? abs(globalToastNotes) : null,
    }),
  });
  return {
    app: {
      slug: chrome.app || (brief.app && brief.app.slug) || null,
      headerType: (chrome.header && chrome.header.type) || null,
      rail: chrome.sidebar || [],
      activeNav: opts.nav || null,
    },
    steps: steps,
    components: components,
    assets: {
      renderContract: abs(PATHS.components.render.contract),
      icons: abs(PATHS.components.icons.svg),
      tokensCss: abs(PATHS.tokens.css),
      baseCss: abs(cssPaths.base),
      fontsCss: abs(cssPaths.fonts),
      frameCss: [abs(PATHS.tokens.css)].concat(FLOW_CSS.map(abs)),
      terminology: abs(TERMINOLOGY_SRC),
      content: {
        writing: abs(PATHS.content.writingMd),
        patterns: abs(PATHS.content.patternsMd),
        product: abs(PATHS.content.productMd),
      },
    },
    layers: layers,
  };
}

function toDirect(brief, opts) {
  var out = JSON.parse(JSON.stringify(brief));
  out.direct = directBrief(brief, opts);
  (out.screens || []).forEach(function (s) {
    delete s.archetype;
    delete s.propertyRules;
    if (s.pageRecipe) delete s.pageRecipe.skeleton;
  });
  return out;
}

module.exports = {
  directBrief: directBrief,
  toDirect: toDirect,
  LAYERS: LAYERS,
  LAYER_COMPONENT: LAYER_COMPONENT,
};
