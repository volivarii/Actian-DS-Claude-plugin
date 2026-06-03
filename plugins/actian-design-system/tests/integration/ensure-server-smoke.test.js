#!/usr/bin/env node
"use strict";

/**
 * ensure-server-smoke.test.js — Cold-shell smoke test for ensure-server.sh.
 *
 * Reproduces the cold-caller scenario: a fresh tester (or the skill's own
 * documented command) invokes ensure-server.sh WITHOUT pre-exporting NODE_BIN.
 * The author's machine masks the bug because NODE_BIN is already exported in
 * their interactive shell; here we DELETE NODE_BIN from the child env so the
 * script must resolve node itself (sourcing resolve-node.sh from the right
 * place + the self-healing fallback).
 *
 * Asserts: exit 0 (no throw) and stdout contains the served base URL.
 * Always tears down: kills whatever is listening on the port and removes the
 * temp dir, leaving no server running and no temp dir behind.
 */

var { test } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var os = require("os");
var path = require("path");
var { execFileSync, execSync } = require("child_process");

var SCRIPT_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "scripts",
  "renderers",
  "ensure-server.sh",
);

var PORT = 8791;

test(
  "ensure-server.sh starts cold (NODE_BIN scrubbed) and prints the URL",
  { timeout: 20000 },
  function () {
    var tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ens-"));

    // Scrubbed env: a COPY of process.env with NODE_BIN DELETED (PATH kept).
    // This reproduces the cold caller — the author's exported NODE_BIN is what
    // masks the broken `source` path.
    var scrubbedEnv = Object.assign({}, process.env);
    delete scrubbedEnv.NODE_BIN;

    try {
      var stdout = execFileSync(
        "bash",
        [SCRIPT_PATH, tempDir, String(PORT)],
        { env: scrubbedEnv, encoding: "utf8" },
      );

      assert.ok(
        stdout.indexOf("http://localhost:" + PORT) !== -1,
        "expected stdout to contain http://localhost:" +
          PORT +
          " — got: " +
          stdout,
      );
    } finally {
      // Always tear down: kill anything still listening on the port, then
      // remove the temp dir. Ignore errors (nothing to kill / already gone).
      try {
        execSync("lsof -ti :" + PORT + " | xargs kill", {
          stdio: "ignore",
        });
      } catch (e) {
        // no listener / kill failed — fine
      }
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        // already gone — fine
      }
    }
  },
);
