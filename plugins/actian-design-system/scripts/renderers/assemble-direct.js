#!/usr/bin/env node
"use strict";

// assemble-direct.js: the author's four files in, one self-contained
// prototype out. Draws what a script can know: the stylesheet, the app frame
// (through the renderer that draws it for every flow), the icons, the strip.
//
// CLI: assemble-direct.js <brief.json> --author <dir> -o <file.html>

var fs = require("fs");
var path = require("path");
var assembleShared = require("./assemble-shared");
var shell = require("./direct-shell.js");

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
  var m = html.match(new RegExp("<([a-z0-9]+)[^>]*>\\s*" + MARK + "\\s*</\\1>"));
  if (!m)
    throw new Error("assemble-direct: the frame did not render the content marker");
  return { before: html.slice(0, m.index), after: html.slice(m.index + m[0].length) };
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

function dockLayers(html) {
  return html.replace(
    /<aside([^>]*?)\sdata-layer="(drawer|panel|modal|toast)"([^>]*)>/g,
    function (all, a, kind, b) {
      return '<aside class="proto-layer proto-layer--' + kind + '"' + a + b + ">";
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

function assemble(o) {
  var frame = renderFrame(o.brief);
  var body = dockLayers(inlineIcons(o.body, o.icons));
  var open = body.match(/<div[^>]*\sdata-app-frame[^>]*>/);
  if (!open)
    throw new Error("assemble-direct: body.html has no <div data-app-frame>");
  // The frame wraps what sits inside data-app-frame; layers stay outside it.
  var start = open.index + open[0].length;
  var end = body.lastIndexOf(
    "</div>",
    body.indexOf("<aside") === -1 ? body.length : body.indexOf("<aside"),
  );
  var inside = body.slice(start, end);
  var rest = body.slice(0, open.index) + body.slice(end + "</div>".length);
  // dockLayers has already classed every layer, so this asks the docked body
  // whether any of them is a modal rather than re-reading the author's syntax.
  var scrim = body.indexOf("proto-layer--modal") !== -1 ? shell.SCRIM : "";
  var steps = o.brief.direct.steps;
  var hints = steps.map(function (s) {
    return s.exit ? "Next: " + s.exit.via : "";
  });
  return (
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
    "<script>window.PROTO_HINTS=" +
    assembleShared.escapeJsonForScript(JSON.stringify(hints)) +
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
      "usage: assemble-direct.js <brief.json> --author <dir> -o <file.html>\n",
    );
    return 1;
  }
  var dir = argv[a + 1],
    out = argv[oi + 1];
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
        "assemble-direct: " + as.icons + " has no '.icons' map (found: " +
          Object.keys(iconDoc).join(", ") + ")",
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
  main: main,
};
if (require.main === module) process.exitCode = main(process.argv.slice(2));
