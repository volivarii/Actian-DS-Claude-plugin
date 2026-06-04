#!/usr/bin/env node
"use strict";

/**
 * render-node-figma.js — Deterministic Figma Plugin API code emitter for
 * component-node trees (the `content[]` array from a screen spec).
 *
 * Mirrors the CLI contract of figma-table/render-figma.js exactly so the AI
 * can call both the same way (capture stdout, pass to use_figma).
 *
 * Usage:
 *   echo '{"content":[...]}' | node render-node-figma.js [--parent-id <id>]
 *   node render-node-figma.js --spec spec.json --parent-id <contentSlotId>
 *
 * Output:
 *   - On success: stdout is Plugin API JS code; stderr is JSON manifest; exit 0.
 *   - On invalid spec: stdout is empty; stderr is JSON error report; exit 1.
 *
 * Tasks 3-7 fill in the emit() function. This scaffold wires the CLI + gate.
 */

var fs = require("fs");
var validateNode = require("./validate-node.js");

// ---------------------------------------------------------------------------
// CLI — copied verbatim from figma-table/render-figma.js lines 38-70
// ---------------------------------------------------------------------------

function parseArgv(argv) {
  var args = { parentId: null, specPath: null };
  for (var i = 2; i < argv.length; i++) {
    if (argv[i] === "--parent-id") args.parentId = argv[++i];
    else if (argv[i] === "--spec") args.specPath = argv[++i];
    else if (argv[i] === "--help" || argv[i] === "-h") {
      process.stderr.write(
        "Usage: render-node-figma.js [--spec <file>] [--parent-id <id>]\n",
      );
      process.exit(0);
    }
  }
  return args;
}

function readSpecSync(specPath) {
  if (specPath) return fs.readFileSync(specPath, "utf8");
  // stdin
  var data = "";
  var buf = Buffer.alloc(4096);
  var fd = 0;
  while (true) {
    try {
      var n = fs.readSync(fd, buf, 0, buf.length, null);
      if (!n) break;
      data += buf.toString("utf8", 0, n);
    } catch (e) {
      if (e.code === "EAGAIN") continue;
      break;
    }
  }
  return data;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  var args = parseArgv(process.argv);
  var raw = readSpecSync(args.specPath);
  var spec;
  try {
    spec = JSON.parse(raw);
  } catch (e) {
    process.stderr.write(
      JSON.stringify({ ok: false, errors: [{ path: "", message: "invalid JSON: " + e.message }] }),
    );
    process.exit(1);
  }

  var nodes = Array.isArray(spec.content) ? spec.content : [spec];

  var errors = [];
  nodes.forEach(function (n, i) {
    validateNode.validateTree(n, "content[" + i + "]").forEach(function (e) {
      errors.push(e);
    });
  });

  if (errors.length) {
    process.stderr.write(JSON.stringify({ ok: false, errors: errors }));
    process.exit(1);
  }

  var out = emit(nodes, args.parentId);
  process.stdout.write(out.code);
  process.stderr.write(JSON.stringify({ ok: true, manifest: out.manifest }));
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Emitter — placeholder until Tasks 3+: returns an empty atomic script.
// ---------------------------------------------------------------------------

function emit(nodes, parentId) {
  return { code: "", manifest: { nodeCount: 0 } };
}

if (require.main === module) main();
module.exports = { emit: emit };
