// tests/renderers/look-direct.test.js
"use strict";
const { describe, it } = require("node:test");
const assert = require("node:assert");
const look = require("../../plugins/actian-design-system/scripts/renderers/look-direct.js");

describe("look-direct", () => {
  it("plans one shot per step per width", () => {
    const s = look.shots(2, [1440, 1280]);
    assert.deepStrictEqual(s.map((x) => x.file), ["step-1-1440.png", "step-1-1280.png", "step-2-1440.png", "step-2-1280.png"]);
  });
  it("passes url (ending in ?step=<n>), outPng, width and chrome to the injected screenshot function", () => {
    const calls = [];
    const code = look.main(["/p.html", "--steps", "1", "-o", "/o", "--widths", "1280"], {
      resolveChrome: () => "/chrome", screenshot: (opts) => calls.push(opts),
      stderr: () => {}, mkdir: () => {},
    });
    assert.strictEqual(code, 0);
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0].chrome, "/chrome");
    assert.ok(/\?step=1$/.test(calls[0].url));
    assert.strictEqual(calls[0].outPng, require("path").join("/o", "step-1-1280.png"));
    assert.strictEqual(calls[0].width, 1280);
  });
  it("exits 2 and says why when there is no browser", () => {
    let err = "";
    const code = look.main(["/p.html", "--steps", "2", "-o", "/o"], {
      resolveChrome: () => { throw new Error("Chrome/Chromium (set CHROME_BIN, or install Google Chrome)"); },
      stderr: (m) => { err += m; }, screenshot: () => assert.fail("must not run"), mkdir: () => {},
    });
    assert.strictEqual(code, 2);
    assert.ok(/not looked at/.test(err) && /CHROME_BIN/.test(err));
  });
  it("runs one shot per step and exits 0", () => {
    const calls = [];
    const code = look.main(["/p.html", "--steps", "2", "-o", "/o", "--widths", "1440"], {
      resolveChrome: () => "/chrome", screenshot: (opts) => calls.push(opts.url),
      stderr: () => {}, mkdir: () => {},
    });
    assert.strictEqual(code, 0);
    assert.deepStrictEqual(calls, ["file:///p.html?step=1", "file:///p.html?step=2"]);
  });
  it("stops at the first shot the browser does not answer, and tries no further shot", () => {
    let err = "";
    const calls = [];
    const code = look.main(["/p.html", "--steps", "2", "-o", "/o", "--widths", "1440"], {
      resolveChrome: () => "/chrome",
      screenshot: (opts) => { calls.push(opts.url); throw new Error("Command failed: timed out after 60000ms\nstderr noise"); },
      stderr: (m) => { err += m; }, mkdir: () => {},
    });
    assert.strictEqual(code, 2);
    assert.strictEqual(calls.length, 1);
    assert.ok(/not looked at/.test(err));
    assert.ok(/the browser did not answer/.test(err));
    assert.ok(/Command failed: timed out after 60000ms/.test(err));
    assert.ok(!/stderr noise/.test(err));
  });
});
