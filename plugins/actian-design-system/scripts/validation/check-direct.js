#!/usr/bin/env node
"use strict";

// check-direct.js: what a script can know about a direct prototype's source,
// in the validator's finding shape. Reads the author's files, not the page -
// except app.js's proto.steps, which no text scan can read reliably (a regex
// literal's own character class, an array built with .map(), and plenty more
// all look enough like object/array syntax to fool a bracket counter). That
// one part is EVALUATED: app.js runs for real, inside a throwaway node:vm
// context with a permissive browser-global stub and a 1-second timeout, and
// checkDirect reads whatever the script actually left on proto.steps.
// checkDirect itself stays synchronous and pure apart from that evaluation.
// Fourteen kinds of finding. Eleven read what the four files declare or omit.
// unsafe-embed reads for the two escape sequences assemble-direct.js does not
// rewrite when it embeds extra.css in a <style> element and app.js in a
// <script> element (it escapes </script, nothing else). steps-unread is the
// warning printed when app.js cannot be run, in place of the step-mismatch
// that cannot then be computed. layer-misplaced names a layer the assembler
// will not dock: another element than <aside>, a kind it does not know, or an
// aside inside <div data-app-frame> (it reads assemble-direct.js's own
// frameEnd and LAYER_KINDS, so both scripts agree on where the frame closes
// and on what a layer is).
//
// Terminology is not checked here on purpose: knowledge #720 shows
// terminology.yml contradicts the running product on "item", so wiring a
// terminology check now would print a false finding on every run. It joins
// once roadmap 323 settles the word.

var fs = require("fs");
var path = require("path");
var vm = require("vm");
var assembleDirect = require("../renderers/assemble-direct.js");
var frameEnd = assembleDirect.frameEnd;
var LAYER_KINDS = assembleDirect.LAYER_KINDS;
var attrInJs = assembleDirect.attrInJs;
var shellCss = require("../renderers/direct-shell.js").CSS;

function finding(sev, check, p, value) {
  return { severity: sev, check: check, path: p, value: value };
}
function uniq(a) {
  return a.filter(function (x, i) {
    return a.indexOf(x) === i;
  });
}
function all(re, s) {
  var out = [],
    m;
  while ((m = re.exec(s))) out.push(m[1]);
  return out;
}

// CSS comments can name a class, a token or a colour that has no real rule
// behind it; masked to spaces (never stripped, so no offset ever shifts -
// this codebase has had CSS-comment stripping break the same parser three
// times), so a mention inside a comment never counts as a definition.
function maskCssComments(s) {
  return String(s || "").replace(/\/\*[\s\S]*?\*\//g, function (m) {
    return m.replace(/[^\n]/g, " ");
  });
}

// Attribute value reader that accepts either quote style, since an author
// may write class='x' as freely as class="x". Two alternatives share one
// capture slot: whichever quote matched is the one with a defined group.
function allAttr(name, s) {
  var re = new RegExp(name + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)')", "g");
  var out = [],
    m;
  while ((m = re.exec(s))) out.push(m[1] !== undefined ? m[1] : m[2]);
  return out;
}

// A permissive stand-in for a browser global this checker does not model
// itself (document, navigator, localStorage, ...): every property read,
// call, or construct on it just returns the same stub, so an author's
// top-level DOM code (document.getElementById(...).addEventListener(...),
// for instance) runs to completion instead of throwing on the first access
// into a plain {}. Symbol.toPrimitive/Symbol.iterator/length/then are given
// harmless real values so the stub is never coerced into something odd or
// mistaken for a promise or a non-empty iterable.
function browserStub() {
  var stub;
  var handler = {
    get: function (target, prop) {
      if (prop === Symbol.toPrimitive)
        return function () {
          return "";
        };
      if (prop === Symbol.iterator)
        return function () {
          return {
            next: function () {
              return { done: true, value: undefined };
            },
          };
        };
      if (prop === "then") return undefined;
      if (prop === "length") return 0;
      return stub;
    },
    apply: function () {
      return stub;
    },
    construct: function () {
      return stub;
    },
  };
  stub = new Proxy(function () {}, handler);
  return stub;
}

// Reads proto.steps by actually RUNNING app.js, not by scanning its text -
// see the file header for why a text scan cannot do this reliably. Runs in
// a throwaway node:vm context stocked with a real proto object and window
// pointing at the same sandbox (so window.proto and the bare identifier
// proto are the same object, matching how the assembled page's own runtime
// script sets window.proto before app.js runs - see direct-shell.js's
// RUNTIME), plus a permissive stub for whatever other browser globals
// top-level code touches. A 1-second timeout keeps a script that loops
// forever from hanging the checker.
//
// Returns PLAIN data only, never a sandbox object: every read off proto.steps
// (including each step's own .id, which can be a getter written by the
// author's script) happens inside the same try this function's evaluation
// runs in, so a throwing getter - or any other surprise a live object from
// the sandbox could spring on its caller - becomes this function's own
// { error } result instead of an exception checkDirect would have to catch
// a second time. checkDirect never touches proto or its steps directly.
function evaluateProtoSteps(js) {
  var proto = { steps: [], current: 0, go: function () {} };
  var sandbox = {};
  sandbox.proto = proto;
  sandbox.window = sandbox;
  sandbox.document = browserStub();
  sandbox.location = { search: "", pathname: "/" };
  sandbox.localStorage = browserStub();
  sandbox.navigator = browserStub();
  sandbox.console = {
    log: function () {},
    warn: function () {},
    error: function () {},
    info: function () {},
    debug: function () {},
  };
  sandbox.setTimeout = function () {
    return 0;
  };
  sandbox.setInterval = function () {
    return 0;
  };
  sandbox.clearTimeout = function () {};
  sandbox.clearInterval = function () {};
  sandbox.requestAnimationFrame = function () {
    return 0;
  };
  sandbox.URLSearchParams = URLSearchParams;
  try {
    vm.runInNewContext(js, sandbox, { timeout: 1000 });
    var steps = Array.isArray(proto.steps) ? proto.steps : [];
    var ids = steps.map(function (s) {
      var id = s && s.id; // the property read stays inside this try
      if (id === undefined || id === null) return "";
      return String(id);
    });
    return { ids: ids };
  } catch (e) {
    return { error: e && e.message ? e.message : String(e) };
  }
}

function checkDirect(o) {
  var f = [];
  var body = o.body || "",
    js = o.appJs || "",
    extra = o.extraCss || "";
  var cssM = maskCssComments(o.css || "");
  var extraM = maskCssComments(extra);
  var defined = {};
  all(/(--[a-z0-9-]+)\s*:/gi, cssM).forEach(function (t) {
    defined[t] = true;
  });
  all(/(--[a-z0-9-]+)\s*:/gi, extraM).forEach(function (t) {
    defined[t] = true;
  });
  // direct-shell.js's own CSS defines a handful of tokens the assembler
  // draws with (--proto-app-header, the header offset a layer legitimately
  // docks against with top:var(--proto-app-header)): those ship on every
  // page exactly like frameCss and extra.css do, so an author using one is
  // not using an unknown token.
  all(/(--[a-z0-9-]+)\s*:/gi, maskCssComments(shellCss)).forEach(function (t) {
    defined[t] = true;
  });
  var classes = {};
  all(/\.(ds-[a-z0-9_-]+)/gi, cssM).forEach(function (c) {
    classes[c] = true;
  });
  // The design system's own markup carries classes the stylesheet has no rule
  // for (hooks such as ds-tag--default): a class a named fragment carries is
  // known, rule or no rule. An author is told to keep a fragment's classes.
  (o.fragments || []).forEach(function (html) {
    allAttr("class", html)
      .join(" ")
      .split(/\s+/)
      .forEach(function (c) {
        if (/^ds-/.test(c)) classes[c] = true;
      });
  });

  [
    ["body.html", body],
    ["app.js", js],
    ["extra.css", extra],
  ].forEach(function (pair) {
    if (
      /\b(?:src|href)\s*=\s*["']?(?:https?:)?\/\//i.test(pair[1]) ||
      /url\(\s*["']?https?:/i.test(pair[1])
    )
      f.push(
        finding(
          "error",
          "external-url",
          pair[0],
          "an external URL: the page must open offline",
        ),
      );
    if (pair[1].indexOf("{{") !== -1)
      f.push(
        finding(
          "error",
          "unfilled-token",
          pair[0],
          "a {{placeholder}} was left in",
        ),
      );
  });
  // app.js draws icons from state as a matter of course (the agent file
  // tells the author to), so a slug it names is read the same as one
  // body.html names, and reported against the file it was found in.
  [
    [uniq(allAttr("data-icon", body)), "body.html"],
    [uniq(attrInJs("data-icon", js)), "app.js"],
  ].forEach(function (pair) {
    pair[0].forEach(function (slug) {
      if (!(o.icons || {})[slug])
        f.push(
          finding(
            "error",
            "unknown-icon",
            pair[1],
            'no icon "' + slug + '" in icons.json',
          ),
        );
    });
  });
  // Scanned per file, not on the two joined, so a bad var() is reported
  // against the file it actually sits in rather than always "extra.css".
  [
    ["body.html", body],
    ["extra.css", extraM],
  ].forEach(function (pair) {
    uniq(all(/var\(\s*(--[a-z0-9-]+)/gi, pair[1])).forEach(function (t) {
      if (!defined[t])
        f.push(
          finding(
            "error",
            "unknown-token",
            pair[0],
            t + " is not a design system token",
          ),
        );
    });
  });
  uniq(
    allAttr("class", body)
      .join(" ")
      .split(/\s+/)
      .filter(function (c) {
        return /^ds-/.test(c);
      }),
  ).forEach(function (c) {
    if (!classes[c])
      f.push(
        finding(
          "error",
          "unknown-ds-class",
          "body.html",
          "." + c + " is in no stylesheet rule and no component fragment",
        ),
      );
  });
  if (/#[0-9a-f]{3,8}\b|rgba?\(/i.test(extraM.replace(/var\([^)]*\)/g, "")))
    f.push(
      finding(
        "warning",
        "raw-colour",
        "extra.css",
        "a colour typed by hand: use a token",
      ),
    );
  if (!/<div[^>]*\sdata-app-frame/.test(body))
    f.push(
      finding(
        "error",
        "frame-missing",
        "body.html",
        "no <div data-app-frame> around the content area",
      ),
    );
  var redrawnTokens = allAttr("class", body)
    .join(" ")
    .split(/\s+/)
    .filter(function (c) {
      return (
        c === "ds-header" ||
        c === "ds-sidenav" ||
        /^ds-header__/.test(c) ||
        /^ds-header--/.test(c) ||
        /^ds-sidenav__/.test(c) ||
        /^ds-sidenav--/.test(c)
      );
    });
  if (redrawnTokens.length)
    f.push(
      finding(
        "error",
        "frame-redrawn",
        "body.html",
        "the header and the side navigation are drawn by the assembler",
      ),
    );
  // A layer is docked by assemble-direct.js's dockLayers, which matches an
  // <aside> whose data-layer is one of LAYER_KINDS. Any other element carrying
  // data-layer, or any other kind, is never docked; an aside carrying it
  // INSIDE the frame div stays in the content area, where position:absolute
  // docks it against the wrong box.
  var openFrame = body.match(/<div[^>]*\sdata-app-frame[^>]*>/);
  var frameStart = openFrame ? openFrame.index + openFrame[0].length : null;
  var frameCloseIdx = null;
  if (frameStart !== null) {
    try {
      frameCloseIdx = frameEnd(body, frameStart);
    } catch (e) {
      frameCloseIdx = null;
    }
  }
  var layerTagRe =
    /<([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*\sdata-layer\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>/g;
  var lm;
  while ((lm = layerTagRe.exec(body))) {
    var tag = lm[1];
    if (tag.toLowerCase() !== "aside") {
      f.push(
        finding(
          "error",
          "layer-misplaced",
          "body.html",
          "a layer is an <aside data-layer>: " + tag + " is never docked",
        ),
      );
    } else if (
      LAYER_KINDS.indexOf(lm[2] !== undefined ? lm[2] : lm[3]) === -1
    ) {
      f.push(
        finding(
          "error",
          "layer-misplaced",
          "body.html",
          '"' +
            (lm[2] !== undefined ? lm[2] : lm[3]) +
            '" is not a kind of layer (' +
            LAYER_KINDS.join(", ") +
            "): it is never docked",
        ),
      );
    } else if (
      frameStart !== null &&
      frameCloseIdx !== null &&
      lm.index >= frameStart &&
      lm.index < frameCloseIdx
    ) {
      f.push(
        finding(
          "error",
          "layer-misplaced",
          "body.html",
          "a layer inside <div data-app-frame>: write it after the frame closes",
        ),
      );
    }
  }
  var want = ((o.brief.direct && o.brief.direct.steps) || []).map(function (s) {
    return s.id;
  });
  var evaluated = evaluateProtoSteps(js);
  if (evaluated.error) {
    f.push(
      finding(
        "warning",
        "steps-unread",
        "app.js",
        "app.js could not be evaluated to read proto.steps: " + evaluated.error,
      ),
    );
  } else {
    var got = evaluated.ids;
    if (JSON.stringify(got) !== JSON.stringify(want))
      f.push(
        finding(
          "error",
          "step-mismatch",
          "app.js",
          "proto.steps ids are [" +
            got.join(", ") +
            "], the screen list's are [" +
            want.join(", ") +
            "]",
        ),
      );
  }
  // app.js draws content from state as a matter of course, so a data-new it
  // writes with innerHTML is the normal case, not an edge: reading body.html
  // alone reports it, falsely, as unplaced.
  var placedInBody = uniq(allAttr("data-new", body));
  var placedInJs = uniq(attrInJs("data-new", js));
  var declared = ((o.meta || {}).adds || []).map(function (a) {
    return a.name;
  });
  [
    [placedInBody, "body.html"],
    [placedInJs, "app.js"],
  ].forEach(function (pair) {
    pair[0].forEach(function (n) {
      if (declared.indexOf(n) === -1)
        f.push(
          finding(
            "warning",
            "new-undeclared",
            pair[1],
            'data-new "' + n + '" has no entry in meta.adds',
          ),
        );
    });
  });
  declared.forEach(function (n) {
    if (placedInBody.indexOf(n) === -1 && placedInJs.indexOf(n) === -1)
      f.push(
        finding(
          "warning",
          "add-unplaced",
          "meta.json",
          'meta.adds "' + n + '" marks nothing on the page',
        ),
      );
  });
  if (/<\/style/i.test(extra))
    f.push(
      finding(
        "error",
        "unsafe-embed",
        "extra.css",
        "a literal </style would close the assembler's style element early",
      ),
    );
  if (js.indexOf("<!--") !== -1)
    f.push(
      finding(
        "error",
        "unsafe-embed",
        "app.js",
        "a literal <!-- is left unescaped inside the assembler's script element",
      ),
    );
  return f;
}

function main(argv) {
  var a = argv.indexOf("--author");
  if (!argv[0] || a === -1) {
    process.stderr.write(
      "usage: check-direct.js <brief.json> --author <dir>\n",
    );
    return 1;
  }
  var dir = argv[a + 1];
  var rd = function (p) {
    return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
  };
  var brief;
  try {
    brief = JSON.parse(fs.readFileSync(argv[0], "utf8"));
  } catch (e) {
    process.stderr.write(
      "check-direct: " + argv[0] + " could not be read: " + e.message + "\n",
    );
    return 1;
  }
  if (!brief || !brief.direct) {
    process.stderr.write(
      "check-direct: " +
        argv[0] +
        " has no direct block (run prepare-flow.js --direct)\n",
    );
    return 1;
  }
  var as = brief.direct.assets;
  var meta = rd(path.join(dir, "meta.json"));
  // The page's own stylesheet is every file in assets.frameCss joined, so
  // "defined token" and "defined ds-* class" mean "defined in what the page
  // ships" (assemble-direct.js reads the same list, in the same order).
  // Older briefs that predate frameCss fall back to the two single-file
  // entries an author reads.
  var css =
    Array.isArray(as.frameCss) && as.frameCss.length
      ? as.frameCss
          .map(function (p) {
            return rd(p);
          })
          .join("\n")
      : rd(as.tokensCss) + "\n" + rd(as.baseCss);
  // icons.json is {_schema_version, _meta, icons: {<slug>: {...}}}; unwrap to
  // the flat slug map checkDirect takes. A file that is already a flat map
  // (no top-level "icons" key) is accepted as-is.
  var iconDoc = JSON.parse(rd(as.icons) || "{}");
  var icons =
    iconDoc.icons && typeof iconDoc.icons === "object"
      ? iconDoc.icons
      : iconDoc;
  var findings = checkDirect({
    brief: brief,
    body: rd(path.join(dir, "body.html")),
    appJs: rd(path.join(dir, "app.js")),
    extraCss: rd(path.join(dir, "extra.css")),
    meta: meta ? JSON.parse(meta) : {},
    css: css,
    icons: icons,
    fragments: (brief.direct.components || []).map(function (c) {
      return rd(c.fragment);
    }),
  });
  findings.forEach(function (x) {
    process.stdout.write(
      (x.severity === "error" ? "P0" : "P1") +
        " [" +
        x.check +
        "] " +
        x.path +
        " → " +
        x.value +
        "\n",
    );
  });
  process.stdout.write(findings.length ? "" : "check-direct: clean\n");
  return findings.some(function (x) {
    return x.severity === "error";
  })
    ? 1
    : 0;
}

module.exports = { checkDirect: checkDirect, main: main };
if (require.main === module) process.exitCode = main(process.argv.slice(2));
