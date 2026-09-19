// tests/renderers/look-direct.test.js
"use strict";
const { describe, it } = require("node:test");
const assert = require("node:assert");
const look = require("../../scripts/renderers/look-direct.js");

describe("look-direct", () => {
  it("plans one shot per step per width", () => {
    const s = look.shots(2, [1440, 1280]);
    assert.deepStrictEqual(s.map((x) => x.file), ["step-1-1440.png", "step-1-1280.png", "step-2-1440.png", "step-2-1280.png"]);
  });
  it("asks Chrome for ?step=<n> at the width, with time for arrive() to run", () => {
    const a = look.chromeArgs({ url: "file:///p.html?step=3", outPng: "/o/s.png", width: 1280, height: 900 });
    assert.ok(a.includes("--window-size=1280,900"));
    assert.ok(a.includes("--screenshot=/o/s.png"));
    assert.ok(a.some((x) => /^--virtual-time-budget=\d+$/.test(x)));
    assert.strictEqual(a[a.length - 1], "file:///p.html?step=3");
  });
  it("exits 2 and says why when there is no browser", () => {
    let err = "";
    const code = look.main(["/p.html", "--steps", "2", "-o", "/o"], {
      resolveChrome: () => { throw new Error("Chrome/Chromium (set CHROME_BIN, or install Google Chrome)"); },
      stderr: (m) => { err += m; }, exec: () => assert.fail("must not run"), mkdir: () => {},
    });
    assert.strictEqual(code, 2);
    assert.ok(/not looked at/.test(err) && /CHROME_BIN/.test(err));
  });
  it("runs one Chrome per shot and exits 0", () => {
    const calls = [];
    const code = look.main(["/p.html", "--steps", "2", "-o", "/o", "--widths", "1440"], {
      resolveChrome: () => "/chrome", exec: (bin, args) => calls.push([bin, args[args.length - 1]]),
      stderr: () => {}, mkdir: () => {},
    });
    assert.strictEqual(code, 0);
    assert.deepStrictEqual(calls.map((c) => c[1]), ["file:///p.html?step=1", "file:///p.html?step=2"]);
  });
});
