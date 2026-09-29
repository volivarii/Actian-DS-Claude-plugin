#!/usr/bin/env node
"use strict";
// prepare-flow.js: the prototype's brief, one JSON per flow, built from the
// screen list the author wrote and the vendored knowledge. Each step carries
// the pattern it declares, that pattern's components and its captured page
// (when the knowledge captured one for this app); the app's rail and header
// come from the app record. direct-brief.js adds the `direct` block the author
// and assemble-direct.js read. `--direct` is accepted and changes nothing: this
// is the only brief there is.
var fs = require("fs");
var path = require("path");
var PATHS = require("../paths.js");
var appRecord = require("../app-record.js");
var screenId = require("../screen-id.js");
var toDirect = require("./direct-brief.js").toDirect;

function normalize(s) {
  return typeof s === "string" ? s.trim().toLowerCase() : "";
}

function uniq(list) {
  var seen = {},
    out = [];
  list.forEach(function (x) {
    if (x && !seen[x]) {
      seen[x] = 1;
      out.push(x);
    }
  });
  return out;
}

function readAppContext(file) {
  try {
    return JSON.parse(fs.readFileSync(file || PATHS.appContext, "utf8"));
  } catch (e) {
    return null;
  }
}

// The app's patterns as the knowledge writes them, one entry per pattern whose
// `apps` names this app.
function appPatterns(ctx, app) {
  var key = normalize(app);
  var all = (ctx && ctx.patterns) || {};
  return Object.keys(all)
    .filter(function (slug) {
      return Array.isArray(all[slug].apps) && all[slug].apps.indexOf(key) !== -1;
    })
    .map(function (slug) {
      var p = all[slug];
      return {
        slug: slug,
        label: p.label || "",
        description: p.description || "",
        components: uniq(Array.isArray(p.components) ? p.components : []),
      };
    });
}

// The captured page recipes, read once per run. Where the snapshot cannot
// address them, say so once on stderr: no capture offered because the snapshot
// is short is a different fact from the knowledge having captured nothing.
var _captures = null;
function loadCaptures() {
  if (_captures) return _captures;
  var dir;
  try {
    if (typeof PATHS.appContextRecipes !== "function")
      throw new Error("this vendor snapshot declares no recipes collection");
    var probe = PATHS.appContextRecipes("_");
    if (typeof probe !== "string" || !probe)
      throw new Error("the recipes collection cannot address a member");
    dir = path.dirname(probe);
    _captures = fs
      .readdirSync(dir)
      .filter(function (f) {
        return /\.json$/.test(f);
      })
      .map(function (f) {
        try {
          return JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
        } catch (e) {
          process.stderr.write("prepare-flow: skipping unparseable page recipe " + f + " (" + e.message + ")\n");
          return null;
        }
      })
      .filter(Boolean);
  } catch (e) {
    process.stderr.write(
      "prepare-flow: cannot read the captured page recipes (" + e.message + "); no capture will be offered. That is a snapshot problem, not an absence of captures.\n",
    );
    _captures = [];
  }
  return _captures;
}

// The capture of this pattern in this app, or null. A recipe names the patterns
// it composes (`patterns`, falling back to its own slug) and the apps it was
// captured in; two captures claiming one pattern is reported and the first by
// slug is taken, so the pick does not depend on directory order.
function captureFor(patternSlug, app) {
  var key = normalize(app);
  var want = normalize(patternSlug);
  var hits = loadCaptures()
    .filter(function (r) {
      var claims = (Array.isArray(r.patterns) && r.patterns.length ? r.patterns : [r.slug]).map(normalize);
      return (
        claims.indexOf(want) !== -1 &&
        (Array.isArray(r.apps) ? r.apps : []).some(function (a) {
          return normalize(a) === key;
        })
      );
    })
    .sort(function (a, b) {
      return String(a.slug) < String(b.slug) ? -1 : String(a.slug) > String(b.slug) ? 1 : 0;
    });
  if (!hits.length) return null;
  if (hits.length > 1) {
    process.stderr.write(
      "prepare-flow: " + hits.length + " captures claim pattern '" + patternSlug + "' for app '" + key + "' (" +
        hits.map(function (h) { return h.slug; }).join(", ") + "); taking '" + hits[0].slug + "'. One shape, one capture.\n",
    );
  }
  var r = hits[0];
  return {
    slug: r.slug,
    label: r.label,
    slots: r.slots || null,
    renderNotes: r.renderNotes || [],
    skeleton: r.skeleton || null,
    sections: Array.isArray(r.sections) ? r.sections : [],
  };
}

// True when word (case-insensitive, whole word) appears in ANY entry of a use
// case's audience, not just audience[0]: Studio's use cases share "Data
// steward" first, and the role that tells them apart is the second entry.
function matchesUseCaseAudience(uc, word) {
  var audience = uc && Array.isArray(uc.audience) ? uc.audience : [];
  var escaped = word.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var re = new RegExp("\\b" + escaped + "\\b");
  for (var i = 0; i < audience.length; i++) {
    if (re.test(String(audience[i]).toLowerCase())) return true;
  }
  return false;
}

// Every id a nav can name: the rail's top-level items. assemble-direct.js
// marks a step's nav active in the flat top-level rail, so a child's id would
// pass here and then mark nothing.
function railIds(sidebar) {
  return uniq(
    (sidebar || []).map(function (s) {
      return s.id;
    }),
  );
}

var LAYER_KINDS = { panel: 1, drawer: 1, modal: 1, toast: 1 };

// Pure: every problem in a screen list that the brief cannot route around,
// one message per problem, each naming the screen. Empty when the list is
// sound.
function screenListProblems(screens, patterns, opts) {
  var problems = [];
  var slugs = (patterns || []).map(function (p) {
    return p.slug;
  });
  // opts is absent for callers that only check patterns and layers; nav and
  // exit are checked only when the caller says what the app's rail is.
  var sidebarIds = opts && Array.isArray(opts.sidebarIds) ? opts.sidebarIds : null;
  function navProblem(subject, value) {
    if (value == null || !sidebarIds) return;
    if (sidebarIds.length === 0) {
      problems.push(subject + ' "' + value + '": this app has no side rail');
    } else if (sidebarIds.indexOf(value) === -1) {
      problems.push(subject + ' "' + value + "\" is not one of this app's sidebar ids: " + sidebarIds.join(", "));
    }
  }
  navProblem("meta.nav", opts && opts.nav);
  (screens || []).forEach(function (s, i) {
    var label = "screen " + (i + 1) + ' "' + s.name + '"';
    if (s.pattern != null && slugs.indexOf(s.pattern) === -1) {
      problems.push(label + ': pattern "' + s.pattern + "\" is not one of this app's patterns: " + slugs.join(", "));
    }
    if (s.layer != null) {
      var layer = s.layer;
      if (!layer || !LAYER_KINDS[layer.kind]) {
        problems.push(label + ": layer.kind must be panel, drawer, modal or toast");
      }
      var over = layer && layer.over;
      if (!Number.isInteger(over) || over < 1 || over > screens.length) {
        problems.push(label + ": layer.over must be a screen number from 1 to " + screens.length);
      } else if (over === i + 1) {
        problems.push(label + ": layer.over cannot be the screen itself");
      } else if (screens[over - 1].layer != null) {
        problems.push(label + ": layer.over points at screen " + over + ", which is itself a layer");
      }
    }
    navProblem(label + ": nav", s.nav);
    var isLast = i === screens.length - 1;
    if (s.exit != null) {
      if (typeof s.exit !== "string" || !s.exit.trim()) {
        problems.push(label + ": exit must be a short phrase naming what the user does to move on");
      } else if (isLast) {
        problems.push(label + ": exit: nothing follows the last screen");
      }
    } else if (opts && opts.mode === "generate" && !isLast) {
      var next = screens[i + 1];
      problems.push(label + ": exit is required: say what the user does here to reach screen " + (i + 2) + ' "' + next.name + '"');
    }
  });
  return problems;
}

// The brief for one flow. options: { app, screens, feature, nav, mode,
// useCase, entity, ctx (a pre-loaded app-context object, for tests) }.
// Throws an Error with code SCREEN_LIST_INVALID, listing every problem, when
// the screen list cannot be routed.
function prepareFlow(options) {
  var app = normalize(options.app);
  var ctx = options.ctx || readAppContext();
  var record = appRecord.readApp(app);
  var sidebar = record ? record.sidebar : [];
  var patterns = appPatterns(ctx, app);
  var list = options.screens || [];
  var problems = screenListProblems(list, patterns, {
    sidebarIds: railIds(sidebar),
    nav: options.nav,
    mode: options.mode,
  });
  if (problems.length) {
    var invalid = new Error(problems.join("\n"));
    invalid.code = "SCREEN_LIST_INVALID";
    throw invalid;
  }

  var appEntry = ctx && ctx.apps && ctx.apps[app];
  var useCases = appEntry && Array.isArray(appEntry.useCases) ? appEntry.useCases : [];
  if (options.useCase) {
    var matched = useCases.filter(function (uc) {
      return matchesUseCaseAudience(uc, options.useCase);
    })[0];
    if (matched) useCases = [matched];
    else process.stderr.write("prepare-flow: no use case matches " + options.useCase + ", keeping all\n");
  }

  var headerType = record && record.header && record.header.type ? record.header.type : "";
  var chrome = {
    app: app,
    header: { type: headerType },
    sidebar: sidebar.map(function (s) {
      return { label: s.label, id: s.id };
    }),
  };

  var flow = list.map(function (s, i) {
    return { n: i + 1, id: screenId.deriveScreenId(options.feature, i), name: s.name };
  });
  // Each declared pattern once, with its capture: two steps on one pattern
  // share the lookup and the glossary lists it once.
  var declared = {};
  list.forEach(function (s) {
    if (!s.pattern || declared[s.pattern]) return;
    var p = patterns.filter(function (x) {
      return x.slug === s.pattern;
    })[0];
    declared[s.pattern] = { pattern: p, capture: captureFor(p.slug, app) };
  });
  var screens = list.map(function (s, i) {
    var d = s.pattern ? declared[s.pattern] : null;
    var p = d ? d.pattern : null;
    var out = {
      name: s.name,
      template: s.template,
      pattern: p ? { slug: p.slug, label: p.label } : null,
      pageRecipe: d ? d.capture : null,
      components: p ? p.components : [],
    };
    // A declared layer rides on the step with its base resolved, and a
    // declared exit with its target, so the author aims each at a real id.
    if (s.layer) {
      var base = flow[s.layer.over - 1];
      out.layer = { kind: s.layer.kind, over: s.layer.over, overId: base.id, overName: base.name };
    }
    if (typeof s.exit === "string" && flow[i + 1]) {
      out.exit = { via: s.exit.trim(), toId: flow[i + 1].id, toName: flow[i + 1].name };
    }
    return out;
  });

  var brief = {
    app: app,
    entity: options.entity || null,
    glossary: {
      chrome: chrome,
      // The patterns the steps declare, as the knowledge writes them.
      patterns: Object.keys(declared).map(function (slug) {
        var d = declared[slug];
        return Object.assign({}, d.pattern, { pageRecipe: d.capture ? d.capture.slug : null });
      }),
      useCases: useCases,
    },
    labels: uniq(chrome.sidebar.map(function (s) { return s.label; }).concat(headerType ? [headerType] : [])),
    screens: screens,
    flow: flow,
  };
  return toDirect(brief, {
    nav: options.nav || null,
    navByScreen: list.map(function (s) {
      return s.nav || null;
    }),
  });
}

// Flags a caller may pass that change nothing: the brief is always this one.
var NO_EFFECT = ["--direct"];
var USAGE =
  "usage: prepare-flow.js --app <app> --screen-list <file> [--use-case <audience>] [--entity <slug>] [-o <out>]\n" +
  "  " + NO_EFFECT.join(", ") + " is accepted and changes nothing.\n";

function main(argv) {
  var args = argv.slice();
  function take(flag) {
    var i = args.indexOf(flag);
    return i !== -1 && i + 1 < args.length ? args[i + 1] : null;
  }
  var app = take("--app"),
    list = take("--screen-list"),
    out = take("-o");
  if (!app || !list) {
    process.stderr.write(USAGE);
    return 1;
  }
  var listJson;
  try {
    listJson = JSON.parse(fs.readFileSync(list, "utf8"));
  } catch (e) {
    process.stderr.write("prepare-flow: cannot read " + list + ": " + e.message + "\n");
    return 1;
  }
  var meta = listJson.meta || {};
  var screens = listJson.screens || [];
  var brief;
  try {
    brief = prepareFlow({
      app: app,
      entity: take("--entity"),
      useCase: take("--use-case"),
      screens: screens,
      feature: meta.feature,
      mode: meta.mode,
      nav: meta.nav,
    });
  } catch (e) {
    if (e.code !== "SCREEN_LIST_INVALID") throw e;
    process.stderr.write("prepare-flow: " + list + " cannot be routed:\n" + e.message + "\n");
    return 1;
  }
  var json = JSON.stringify(brief, null, 2);
  if (!out) {
    process.stdout.write(json + "\n");
    return 0;
  }
  fs.writeFileSync(out, json);
  process.stderr.write("prepare-flow: wrote " + out + " (" + screens.length + " steps)\n");
  return 0;
}

module.exports = {
  prepareFlow: prepareFlow,
  screenListProblems: screenListProblems,
  main: main,
};

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}
