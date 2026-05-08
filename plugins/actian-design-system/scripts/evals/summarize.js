#!/usr/bin/env node
/**
 * summarize.js — read grading.json files in an iteration directory and
 * report per-assertion pass-rate per fixture.
 *
 * Supports both directory shapes:
 *   - New (multi-run): <iter>/eval-<fixture>/run-<N>/with_skill/grading.json
 *   - Old (single-run): <iter>/eval-<fixture>/with_skill/grading.json
 *     (treated as run-1 for backwards compat with v1.72.0/v1.72.1
 *     iterations created before --runs landed.)
 *
 * Output: a markdown summary printed to stdout AND saved to
 * <iter>/summary.md for archival.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const iterDir = process.argv[2];
if (!iterDir) {
  console.error("usage: summarize.js <iteration-dir>");
  process.exit(1);
}
if (!fs.existsSync(iterDir) || !fs.statSync(iterDir).isDirectory()) {
  console.error(`not a directory: ${iterDir}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Discover grading.json files for each fixture
// ---------------------------------------------------------------------------

function discoverRuns(iterDir) {
  const fixtures = {};
  const evalDirs = fs
    .readdirSync(iterDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith("eval-"))
    .map((e) => e.name);

  for (const evalDir of evalDirs) {
    const fixture = evalDir.replace(/^eval-/, "");
    const evalPath = path.join(iterDir, evalDir);
    const runs = [];

    // New shape: eval-<fixture>/run-<N>/with_skill/grading.json
    const runDirs = fs
      .readdirSync(evalPath, { withFileTypes: true })
      .filter((e) => e.isDirectory() && /^run-\d+$/.test(e.name))
      .map((e) => e.name)
      .sort((a, b) => parseInt(a.slice(4), 10) - parseInt(b.slice(4), 10));

    for (const runName of runDirs) {
      const gradingPath = path.join(
        evalPath,
        runName,
        "with_skill",
        "grading.json",
      );
      if (fs.existsSync(gradingPath)) {
        runs.push({ run: runName, gradingPath });
      }
    }

    // Old shape: eval-<fixture>/with_skill/grading.json (treat as run-1)
    if (runs.length === 0) {
      const gradingPath = path.join(evalPath, "with_skill", "grading.json");
      if (fs.existsSync(gradingPath)) {
        runs.push({ run: "run-1", gradingPath });
      }
    }

    if (runs.length > 0) {
      fixtures[fixture] = runs;
    }
  }

  return fixtures;
}

// ---------------------------------------------------------------------------
// Aggregate per-assertion pass-rates
// ---------------------------------------------------------------------------

function assertionId(text) {
  // assertion text starts with "An: ..." per grader.md convention
  const m = /^(A\d+):/.exec(text);
  return m ? m[1] : text.slice(0, 30);
}

function aggregate(fixtureRuns) {
  // Map<assertionId, { text, results: [{ run, passed, evidence }] }>
  const byAssertion = new Map();

  for (const { run, gradingPath } of fixtureRuns) {
    let grading;
    try {
      grading = JSON.parse(fs.readFileSync(gradingPath, "utf8"));
    } catch (e) {
      console.error(`failed to parse ${gradingPath}: ${e.message}`);
      continue;
    }
    const expectations = grading.expectations || [];
    for (const exp of expectations) {
      const id = assertionId(exp.text || "");
      if (!byAssertion.has(id)) {
        byAssertion.set(id, { text: exp.text, results: [] });
      }
      byAssertion.get(id).results.push({
        run,
        passed: !!exp.passed,
        evidence: exp.evidence || "",
      });
    }
  }

  return byAssertion;
}

// ---------------------------------------------------------------------------
// Format markdown
// ---------------------------------------------------------------------------

function formatVerdict(passed, total) {
  if (total === 0) return "no data";
  if (passed === total) return total === 1 ? "PASS" : `${passed}/${total} pass`;
  if (passed === 0) return total === 1 ? "FAIL" : `0/${total} pass`;
  return `${passed}/${total} pass — flaky`;
}

function format(fixtures, iterName) {
  const lines = [];
  lines.push(`# Component-brief eval summary`);
  lines.push("");
  lines.push(`**Iteration:** \`${iterName}\``);
  lines.push("");

  const fixtureNames = Object.keys(fixtures).sort();
  if (fixtureNames.length === 0) {
    lines.push("(no grading.json files found in any eval-*/run-*/with_skill/)");
    return lines.join("\n");
  }

  for (const fixture of fixtureNames) {
    const runs = fixtures[fixture];
    const byAssertion = aggregate(runs);
    lines.push(`## ${fixture} (${runs.length} run${runs.length === 1 ? "" : "s"})`);
    lines.push("");
    lines.push("| Assertion | Verdict | Per-run |");
    lines.push("|---|---|---|");

    const ids = Array.from(byAssertion.keys()).sort((a, b) => {
      // sort A1, A2, A3 ...
      const an = parseInt(a.replace(/^A/, ""), 10);
      const bn = parseInt(b.replace(/^A/, ""), 10);
      return an - bn;
    });

    for (const id of ids) {
      const { text, results } = byAssertion.get(id);
      const passed = results.filter((r) => r.passed).length;
      const total = results.length;
      const verdict = formatVerdict(passed, total);
      const perRun = results.map((r) => (r.passed ? "✓" : "✗")).join(" ");
      lines.push(`| ${text || id} | ${verdict} | ${perRun} |`);
    }
    lines.push("");
  }

  // Add a flaky-assertion callout if any
  const flaky = [];
  for (const fixture of fixtureNames) {
    const byAssertion = aggregate(fixtures[fixture]);
    for (const [id, { text, results }] of byAssertion.entries()) {
      const passed = results.filter((r) => r.passed).length;
      const total = results.length;
      if (total > 1 && passed > 0 && passed < total) {
        flaky.push({ fixture, id, text, passed, total });
      }
    }
  }

  if (flaky.length > 0) {
    lines.push(`## Flaky assertions`);
    lines.push("");
    lines.push(
      "These assertions passed on some runs and failed on others against identical input. This is inter-run variance — a doc-level fix can't reliably stabilize them; treat as harness territory per `MIGRATIONS.md` and `project_deterministic_harness_architecture.md`.",
    );
    lines.push("");
    for (const f of flaky) {
      lines.push(`- **${f.fixture} ${f.id}**: ${f.passed}/${f.total} (${f.text})`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const fixtures = discoverRuns(iterDir);
const iterName = path.basename(iterDir);
const md = format(fixtures, iterName);

const outPath = path.join(iterDir, "summary.md");
fs.writeFileSync(outPath, md + "\n");

process.stdout.write(md + "\n");
process.stderr.write(`\nSaved: ${outPath}\n`);
