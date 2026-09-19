#!/usr/bin/env node
"use strict";

// assemble-direct.js: the author's four files in, one self-contained
// prototype out. Draws what a script can know: the stylesheet, the app frame
// (through the renderer that draws it for every flow), the icons, the strip.
//
// CLI: assemble-direct.js <brief.json> --author <dir> -o <file.html> [--run <run.json>]

var fs = require("fs");
var path = require("path");
var assembleShared = require("./assemble-shared");
var shell = require("./direct-shell.js");
var maskComment = require("./assemble-flow-share.js").maskComment;

var MARK = "@@DIRECT-CONTENT@@";

// Render an empty screen with the app's chrome and split it at a marker, so
// the author's content lands exactly where a generated screen's content does.
function renderFrame(brief) {
  var d = brief.direct;
  var rail = d.app.rail || [];
  var active = rail.filter(function (r) {
    return r.id === d.app.activeNav;
  })[0];
  var screen = {
    name: "frame",
    template: brief.screens[0].template,
    library: "ds",
    navItems: rail.map(function (r) {
      return r.id === d.app.activeNav
        ? { label: r.label, state: "On" }
        : { label: r.label };
    }),
    activeNavItem: active ? active.label : undefined,
    content: [{ type: "TEXT", content: MARK }],
  };
  var flowRenderer = require("./html-renderers/flow-renderer.js");
  var html = assembleShared.withDsMaps(
    { meta: { hifi: true }, screens: [screen] },
    function () {
      return flowRenderer.renderScreen(screen);
    },
  );
  var m = html.match(
    new RegExp("<([a-z0-9]+)[^>]*>\\s*" + MARK + "\\s*</\\1>"),
  );
  if (!m)
    throw new Error(
      "assemble-direct: the frame did not render the content marker",
    );
  return {
    before: html.slice(0, m.index),
    after: html.slice(m.index + m[0].length),
  };
}

function inlineIcons(html, icons) {
  return html.replace(
    /<span([^>]*?)\sdata-icon="([^"]+)"([^>]*)><\/span>/g,
    function (all, a, slug, b) {
      var ic = icons[slug];
      if (!ic) return all; // check-direct reports unknown-icon
      return (
        '<svg class="proto-icon" viewBox="' +
        ic.viewBox +
        '" aria-hidden="true">' +
        ic.body +
        "</svg>"
      );
    },
  );
}

// Reads a class attribute (either quote style) out of an attribute string and
// returns { value, rest }: rest is the string with that one attribute cut out,
// so the author's own class survives instead of becoming a second, ignored
// class="" duplicate.
var LAYER_CLASS_ATTR = /\s*class\s*=\s*(?:"([^"]*)"|'([^']*)')/;
function takeClassAttr(s) {
  var m = s.match(LAYER_CLASS_ATTR);
  if (!m) return { value: null, rest: s };
  return {
    value: m[1] !== undefined ? m[1] : m[2],
    rest: s.slice(0, m.index) + s.slice(m.index + m[0].length),
  };
}

// The four kinds of layer this assembler docks. check-direct.js reads the same
// list, so a kind one script docks is a kind the other accepts.
var LAYER_KINDS = ["drawer", "panel", "modal", "toast"];
var LAYER_TAG = new RegExp(
  "<aside([^>]*?)\\sdata-layer\\s*=\\s*([\"'])(" +
    LAYER_KINDS.join("|") +
    ")\\2([^>]*)>",
  "g",
);

// Reads an attribute's value out of app.js SOURCE, where the same markup
// body.html carries in HTML can appear as a JS string literal: plain when
// the literal's own delimiter is the other quote character, backslash-
// escaped when it is the same one. Four spellings, no more:
// name="x", name='x', name=\"x\", name=\'x\'.
// A value app.js builds at run time ('<span data-icon="' + it.icon + '">',
// or "${it.icon}" in a template literal) reads here as a piece of source, not
// a name: it is dropped, so no caller reports it as a name nobody declared.
var BUILT_VALUE = /\$\{|['"`]\s*\+|\+\s*['"`]/;

function attrInJs(name, js) {
  var re = new RegExp(name + "\\s*=\\s*(?:\"([^\"\\\\]*)\"|'([^'\\\\]*)'|\\\\\"([^\"\\\\]*)\\\\\"|\\\\'([^'\\\\]*)\\\\')", "g");
  var out = [],
    m;
  while ((m = re.exec(js))) {
    var v = m[1];
    if (v === undefined) v = m[2];
    if (v === undefined) v = m[3];
    if (v === undefined) v = m[4];
    if (!BUILT_VALUE.test(v)) out.push(v);
  }
  return out;
}

// The slugs app.js names by data-icon, kept only where the icon map has
// them: {slug: {viewBox, body}}, ready to embed as window.PROTO_ICONS.
// check-direct.js reports a slug this drops as unknown-icon; drawing it
// anyway would draw nothing, silently. A slug app.js keeps in its state
// ({ icon: "edit" }) and writes into data-icon at run time never appears
// beside the attribute, so every quoted string that is exactly an icon's
// slug is carried as well: a word that happens to be one costs its bytes.
var QUOTED_WORD = /(["'`])([a-z0-9][a-z0-9_-]*)\1/gi;

function iconsUsedInJs(js, icons) {
  var out = {};
  var slugs = attrInJs("data-icon", js),
    m;
  QUOTED_WORD.lastIndex = 0;
  while ((m = QUOTED_WORD.exec(js))) slugs.push(m[2]);
  slugs.forEach(function (slug) {
    if (icons && Object.prototype.hasOwnProperty.call(icons, slug))
      out[slug] = { viewBox: icons[slug].viewBox, body: icons[slug].body };
  });
  return out;
}

function dockLayers(html) {
  return html.replace(
    LAYER_TAG,
    function (all, a, quote, kind, b) {
      var proto = "proto-layer proto-layer--" + kind;
      var fromA = takeClassAttr(a);
      var author = fromA.value;
      a = fromA.rest;
      if (author === null) {
        var fromB = takeClassAttr(b);
        author = fromB.value;
        b = fromB.rest;
      }
      var cls = author ? proto + " " + author : proto;
      return (
        '<aside class="' +
        cls +
        '"' +
        a +
        ' data-layer="' +
        kind +
        '"' +
        b +
        ">"
      );
    },
  );
}

// The author's app.js goes into a <script> element, and script data ends at
// the first `</script` the HTML parser sees, wherever it sits: a `"</script>"`
// inside a JS string literal truncates the page with no error anywhere.
//
// assemble-shared.js's escapeJsonForScript is the codebase's answer to this
// and is used below for the hints JSON, but its blanket `</` -> `<\/` is only
// safe where every `/` may be backslash-escaped, which is true of a JSON
// string and not of JS SOURCE: a regex literal ending in `<`, as `/^</` does,
// carries `</` as its last two characters, and escaping those leaves an
// unterminated regex. So the author's source gets the narrow form, which only
// breaks the one sequence the parser looks for. Inside a string, a template
// literal, a regex or a comment `<\/script` reads identically to `</script`;
// outside those four there is no JS in which that sequence is valid.
function escapeScriptSource(src) {
  return String(src == null ? "" : src).replace(/<\/(script)/gi, "<\\/$1");
}

// Finds the index of the "</div" that closes the <div data-app-frame> whose
// open tag ends at `start`, by depth rather than by guessing at the first
// <aside in the body: a page whose content uses an <aside> of its own (a
// filter rail, say) sits INSIDE the frame, ahead of its real close, and a
// nearest-</div>-before-the-first-<aside search cuts the page in two right
// there. Every <div and every </div between `start` and the match counts;
// nothing else does, so an <aside> (matched or not) never perturbs the count.
// HTML comments are masked to spaces first (never stripped, so every offset
// still points into `body`): a comment that mentions a tag is not a tag.
function frameEnd(body, start) {
  var depth = 1;
  var re = /<(\/?)div\b/gi;
  re.lastIndex = start;
  var masked = body.replace(/<!--[\s\S]*?-->/g, function (c) {
    return c.replace(/[^\n]/g, " ");
  });
  var m;
  while ((m = re.exec(masked))) {
    if (m[1]) {
      depth--;
      if (depth === 0) return m.index;
    } else {
      depth++;
    }
  }
  throw new Error("assemble-direct: <div data-app-frame> is never closed");
}

// maskComment (assemble-flow-share.js) defuses "--" so a value can never
// close the comment early; it leaves '<' alone, which is safe for the
// audience-safe meta line its own caller builds (never a raw prompt). A
// run's prompt is free text and can carry a literal "<script>", so this
// also breaks up '<' before the value reaches the comment, without
// changing maskComment's own behavior for its existing caller.
function maskProvenance(s) {
  return maskComment(s).replace(/</g, "<\u200b");
}

function provenanceComment(run) {
  var prompt = String(run.prompt == null ? "" : run.prompt).slice(0, 200);
  return (
    "<!--\n" +
    "  Actian Design System: generate-flow --direct (prototype)\n" +
    "  skill:    " + maskProvenance(run.skill) + "\n" +
    "  feature:  " + maskProvenance(run.feature) + "\n" +
    "  prompt:   " + maskProvenance(prompt) + "\n" +
    "  date:     " + maskProvenance(run.date) + "\n" +
    "  duration: " + maskProvenance(run.duration) + "\n" +
    "  model:    " + maskProvenance(run.model) + "\n" +
    "  plugin:   " + maskProvenance(run.pluginVersion) + "\n" +
    "-->\n"
  );
}

function assemble(o) {
  var frame = renderFrame(o.brief);
  var body = dockLayers(inlineIcons(o.body, o.icons));
  var open = body.match(/<div[^>]*\sdata-app-frame[^>]*>/);
  if (!open)
    throw new Error("assemble-direct: body.html has no <div data-app-frame>");
  // The frame wraps what sits inside data-app-frame; layers stay outside it.
  var start = open.index + open[0].length;
  var end = frameEnd(body, start);
  var inside = body.slice(start, end);
  // The close may be written `</div >`: it ends at its own `>`, not six
  // characters on.
  var rest = body.slice(0, open.index) + body.slice(body.indexOf(">", end) + 1);
  // dockLayers has already classed every layer, so this asks the docked body
  // whether any of them is a modal rather than re-reading the author's syntax.
  var scrim = body.indexOf("proto-layer--modal") !== -1 ? shell.SCRIM : "";
  var steps = o.brief.direct.steps;
  var hints = steps.map(function (s) {
    return s.exit ? "Next: " + s.exit.via : "";
  });
  // The rail is drawn once, active on direct.app.activeNav; a step whose own
  // `nav` names a different rail item needs the runtime to move it there, so
  // each step gets the rail LABEL to move to (direct.app.rail is {id,label}),
  // or null when the step names no nav or names one the rail does not carry.
  var rail = o.brief.direct.app.rail || [];
  var navLabels = steps.map(function (s) {
    if (!s.nav) return null;
    var item = rail.filter(function (r) {
      return r.id === s.nav;
    })[0];
    return item ? item.label : null;
  });
  return (
    (o.run ? provenanceComment(o.run) : "") +
    '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    "<title>" +
    shell.esc((o.brief.direct.app.slug || "") + " prototype") +
    "</title>" +
    "<style>" +
    o.css +
    "</style><style>" +
    shell.CSS +
    "</style><style>" +
    (o.extraCss || "") +
    "</style>" +
    '</head><body data-theme="' +
    shell.esc(o.brief.direct.app.slug || "actian") +
    '">' +
    shell.strip(steps, (o.meta && o.meta.adds) || []) +
    '<div class="proto-stage">' +
    frame.before +
    inside +
    frame.after +
    rest +
    scrim +
    "</div>" +
    "<script>window.PROTO_NAV=" +
    assembleShared.escapeJsonForScript(JSON.stringify(navLabels)) +
    ";window.PROTO_HINTS=" +
    assembleShared.escapeJsonForScript(JSON.stringify(hints)) +
    ";window.PROTO_ICONS=" +
    assembleShared.escapeJsonForScript(
      JSON.stringify(iconsUsedInJs(o.appJs, o.icons)),
    ) +
    ";" +
    shell.RUNTIME +
    "</script>" +
    "<script>" +
    escapeScriptSource(o.appJs) +
    "</script><script>" +
    shell.BOOT +
    "</script>" +
    "</body></html>"
  );
}

function main(argv) {
  var briefPath = argv[0];
  var a = argv.indexOf("--author"),
    oi = argv.indexOf("-o");
  if (!briefPath || a === -1 || oi === -1) {
    process.stderr.write(
      "usage: assemble-direct.js <brief.json> --author <dir> -o <file.html> [--run <run.json>]\n",
    );
    return 1;
  }
  var dir = argv[a + 1],
    out = argv[oi + 1];
  var ri = argv.indexOf("--run");
  var run;
  if (ri !== -1) {
    var runPath = argv[ri + 1];
    try {
      run = JSON.parse(fs.readFileSync(runPath, "utf8"));
    } catch (e) {
      process.stderr.write(
        "assemble-direct: --run " + runPath + " is missing or not valid JSON\n",
      );
      return 1;
    }
  }
  var read = function (f, optional) {
    var p = path.join(dir, f);
    if (!fs.existsSync(p)) {
      if (optional) return "";
      throw new Error("assemble-direct: missing " + p);
    }
    return fs.readFileSync(p, "utf8");
  };
  try {
    var brief = JSON.parse(fs.readFileSync(briefPath, "utf8"));
    if (!brief.direct)
      throw new Error(
        "assemble-direct: " +
          briefPath +
          " has no direct block (run prepare-flow.js --direct)",
      );
    var as = brief.direct.assets;
    // The frame is the flow renderer's own markup, so it takes the flow
    // renderer's own stylesheets, in their documented order: tokens, then
    // FLOW_CSS. The brief names them (assets.frameCss, built from
    // assemble-shared.js's one list) rather than this script picking a set,
    // which is also how look.js renders a screen standalone. The three
    // single-file asset entries beside it are what an AUTHOR reads; they are
    // a subset of this list and not the frame's own answer.
    if (!Array.isArray(as.frameCss) || !as.frameCss.length)
      throw new Error(
        "assemble-direct: " +
          briefPath +
          " names no direct.assets.frameCss (the brief predates the frame stylesheet list)",
      );
    var css = as.frameCss.map(assembleShared.readFileChecked).join("\n");
    // icons.json is {_schema_version, _meta, icons}; the map is the inner
    // one. Asserted, not defaulted: an unknown slug inlines nothing and says
    // nothing, so the whole-file shape would blank every glyph in silence.
    var iconDoc = JSON.parse(fs.readFileSync(as.icons, "utf8"));
    if (!iconDoc.icons || typeof iconDoc.icons !== "object")
      throw new Error(
        "assemble-direct: " +
          as.icons +
          " has no '.icons' map (found: " +
          Object.keys(iconDoc).join(", ") +
          ")",
      );
    var meta = read("meta.json", true);
    fs.writeFileSync(
      out,
      assemble({
        brief: brief,
        body: read("body.html"),
        appJs: read("app.js"),
        extraCss: read("extra.css", true),
        meta: meta ? JSON.parse(meta) : {},
        icons: iconDoc.icons,
        css: css,
        run: run,
      }),
    );
  } catch (e) {
    process.stderr.write(e.message + "\n");
    return 1;
  }
  process.stderr.write("assemble-direct: wrote " + out + "\n");
  return 0;
}

module.exports = {
  assemble: assemble,
  escapeScriptSource: escapeScriptSource,
  renderFrame: renderFrame,
  inlineIcons: inlineIcons,
  dockLayers: dockLayers,
  attrInJs: attrInJs,
  iconsUsedInJs: iconsUsedInJs,
  LAYER_KINDS: LAYER_KINDS,
  frameEnd: frameEnd,
  main: main,
};
if (require.main === module) process.exitCode = main(process.argv.slice(2));
