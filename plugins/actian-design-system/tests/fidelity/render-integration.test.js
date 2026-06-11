// tests/fidelity/render-integration.test.js
// Integration test (needs Chrome) — proves a real leaf renders STYLED, not blank.
// Self-skips where Chrome isn't resolvable so the pure unit suite stays binary-free.
"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("node:fs");
var os = require("node:os");
var path = require("node:path");
var R = require("../../scripts/fidelity/resolve-binaries");
var H = require("../../scripts/fidelity/render-leaf");
var P = require("../../scripts/fidelity/pixel-diff");

var chrome = R.resolveChrome();

test(
  "a rendered button leaf has a small, non-full-frame content box (tokens applied)",
  { skip: chrome ? false : "Chrome not resolvable" },
  function () {
    var tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fid-it-"));
    try {
      var hp = path.join(tmp, "button.html");
      fs.writeFileSync(hp, H.buildLeafHtml("button", H.renderLeafFragment("button")));
      var png = path.join(tmp, "button.png");
      H.screenshot({ chrome: chrome, htmlPath: hp, outPng: png, width: 1280, height: 400 });
      var img = P.decodePng(fs.readFileSync(png));
      var box = P.contentBox(img.data, img.width, img.height);
      // A real styled button is ~26×32. If tokens.css were missing, the leaf would
      // render blank and contentBox would fall back to the full frame (1280×400).
      assert.ok(box.w > 0 && box.h > 0, "content box is non-empty: " + JSON.stringify(box));
      assert.ok(
        box.w < 400 && box.h < 200,
        "content box is component-sized, not full-frame: " + JSON.stringify(box),
      );
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  },
);
