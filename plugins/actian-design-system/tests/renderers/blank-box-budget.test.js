#!/usr/bin/env node
"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");

var {
  measureBlankBoxes,
  compareBlankBoxes,
  summarizeBank,
  authorableSlugs,
  renameIndex,
} = require(
  path.resolve(
    __dirname,
    "..",
    "..",
    "scripts",
    "renderers",
    "ds-coverage-report.js",
  ),
);

// The empty grey placeholder boxes the DS HTML renderer emits across the whole
// authorable vocabulary. For most of this plugin's audience, PMs and others with
// no Figma seat, that HTML render IS the product, so this count is a real
// quality number and not bookkeeping.
//
// It used to be guarded by two literals in this file, BUDGET = 136 and
// CHIP_BUDGET = 4, both baselined 2026-07-13 and described as ceilings that
// "RATCHET DOWN". Neither was ever lowered. By 2026-08-11 the renderer emitted
// 45 boxes and 2 chips, so the gate was carrying 91 boxes of silent headroom:
// the output could have tripled and still passed, and the gray-box programme's
// real win from 136 to 45 was invisible inside the very gate built to track it.
// A hand-maintained number standing in for a fact the data already knows is the
// same defect class as the hand-kept lists behind the 2026-07-25 outage.
//
// So the baseline is a GENERATED record, blank-box-baseline.json, and the rule
// is exact equality rather than a ceiling:
//
//   * a regression is a reviewable diff line (bar-graph 25 became 30), which is
//     louder than a total creeping from 136 to 137
//   * an improvement also fails, until it is banked with
//     `node scripts/renderers/ds-coverage-report.js --write-baseline`, which is
//     what stops the number going stale a second time
//
// The count is deliberately per slug. Today 42 of the 45 boxes are two chart
// components (bar-graph 25, line-graph 17), which a single total hides.
var BASELINE = require("./blank-box-baseline.json");
var { countBlankBoxes } = require(
  path.resolve(
    __dirname,
    "..",
    "..",
    "scripts",
    "renderers",
    "renderability.js",
  ),
);

// measureBlankBoxes() re-parses the authoring markdown, rebuilds the doc map
// over ~72 slugs, and re-renders the unbuilt ones: expensive to repeat, and
// every assertion below wants the identical measurement anyway. Compute once
// and share it instead of calling it fresh from each `it` block.
var cached = null;
function renderAll() {
  if (!cached) cached = measureBlankBoxes();
  return cached;
}

function ratchetHint() {
  // Written as a cd + relative path on purpose: the bare invocation printed by
  // the first version failed when pasted from the repository root, and the one
  // instruction a failure gives has to work as written.
  return (
    "\n\nIf this change is correct, bank it:\n" +
    "  cd plugins/actian-design-system && \\\n" +
    "    node scripts/renderers/ds-coverage-report.js --write-baseline\n" +
    "then commit tests/renderers/blank-box-baseline.json, so the diff records " +
    "which slugs moved and in which direction. It refuses to write only while a " +
    "slug has regressed or demoted to a chip."
  );
}

describe("blank-box budget", function () {
  it("POSITIVE CONTROL: the anatomy doc map is actually live", function () {
    // Without this, a broken/unset doc map chips every slug, emits zero blank
    // boxes, and the budget below passes while measuring NOTHING. Assert the
    // anatomy marker attribute (data-ds-slug=) is present in real output.
    var r = renderAll();
    assert.ok(
      r.anyAnatomy,
      "no slug rendered anatomy markup, so the doc map is not live and the " +
        "blank-box budget would pass vacuously",
    );
  });

  it("the authorable vocabulary is non-empty (guards a silent parse break)", function () {
    var r = renderAll();
    assert.ok(
      r.slugs.length > 50,
      "expected the ds-components-authoring.md table to parse to >50 slugs, got " +
        r.slugs.length,
    );
  });

  it("no slug emits more blank grey boxes than the recorded baseline", function () {
    var d = compareBlankBoxes(BASELINE, renderAll());
    assert.deepEqual(
      d.regressions,
      [],
      "blank-box count REGRESSED (total " +
        d.totalFrom +
        " -> " +
        d.totalTo +
        "). These slugs emit more empty boxes than they did:\n" +
        d.regressions
          .map(function (x) {
            return "  " + x.slug + ": " + x.from + " -> " + x.to;
          })
          .join("\n") +
        "\nFix the renderer. This one does not get banked: offering to " +
        "regenerate the baseline here is exactly how a regression would be " +
        "laundered into a green check.",
    );
  });

  it("the recorded baseline still describes the real output, in both directions", function () {
    var d = compareBlankBoxes(BASELINE, renderAll());
    // summarizeBank() is the one place these classes are worded. It already
    // covers every improvement, newcomer, promotion and departure, so the
    // separate IMPROVED / NEW TO THE BASELINE / PROMOTED / GONE blocks that
    // used to live here said each of them a second time under a different
    // heading, in the one message an author actually reads.
    var parts = summarizeBank(d).slice();
    assert.equal(
      parts.length,
      0,
      "the baseline no longer matches what the renderer emits (total " +
        d.totalFrom +
        " -> " +
        d.totalTo +
        ").\n" +
        parts.join("\n") +
        ratchetHint(),
    );
  });

  it("SANITY: the blank-box detector still recognises a blank box", function () {
    // The false-zero control used to be `r.total > 0`, then briefly
    // `BASELINE.total > 0` gating that same check. A review found the second
    // form self-disarming: BASELINE.total is written by the very bank command
    // the sibling failures print, so banking one broken measurement would zero
    // it and skip this control for good.
    //
    // Assert the detector against markup instead of against the corpus. This
    // cannot be banked away, cannot go stale, and does not need retiring when
    // the real count legitimately reaches zero.
    var blank = '<div class="ds-appearance__vector" style="width:8px"></div>';
    assert.equal(countBlankBoxes(blank), 1, "a blank vector box must count");
    assert.equal(
      countBlankBoxes('<div class="ds-appearance__vector">real content</div>'),
      0,
      "a box with content in it is not blank",
    );
    assert.equal(countBlankBoxes(blank + blank), 2, "counts every occurrence");
  });

  it("the committed baseline is internally consistent", function () {
    // total is a separate field from perSlug, so a hand edit or a bad merge can
    // leave the two halves of the record disagreeing with each other while
    // nothing says so.
    var summed = Object.keys(BASELINE.perSlug).reduce(function (t, k) {
      return t + BASELINE.perSlug[k];
    }, 0);
    assert.equal(
      BASELINE.total,
      summed,
      "blank-box-baseline.json's total does not match its own perSlug sum, so " +
        "it was edited by hand rather than regenerated",
    );
  });

  it("the total number of blank boxes never rises, whatever the slugs are called", function () {
    // The rename-immune bound. The crude ceiling this replaced could not be
    // dodged by renaming a slug; a name-keyed comparison can be, and the held
    // knowledge tag sync renames radio-button-card to radio-card. A newly
    // authorable unbuilt slug lands here too.
    var d = compareBlankBoxes(BASELINE, renderAll());
    assert.equal(
      d.totalRose,
      false,
      "blank boxes rose from " +
        d.totalFrom +
        " to " +
        d.totalTo +
        ". Contributors:\n" +
        d.regressions
          .concat(
            d.unlisted.map(function (u) {
              return { slug: u.slug + " (new)", from: 0, to: u.to };
            }),
            // A lingering rename's boxes stopped arriving in `unlisted`, so the
            // one class that most often causes a rise named nobody at all here.
            (d.lingering || []).map(function (x) {
              return {
                slug: x.slug + " (renamed from " + x.was + ")",
                from: x.from,
                to: x.to,
              };
            }),
            (d.leafDropped || []).map(function (x) {
              return { slug: x.slug + " (leaf dropped)", from: 0, to: x.to };
            }),
          )
          .map(function (x) {
            return "  " + x.slug + ": " + x.from + " -> " + x.to;
          })
          .join("\n") +
        "\nA slug rename cannot hide inside this assertion, which is why it is " +
        "kept alongside the per-slug ones." +
        ratchetHint(),
    );
  });

  it("emits no new bare graceful-degradation chips", function () {
    // A bare chip means the slug renders nothing real, so a LOWER blank-box
    // total from that slug is a demotion, not an improvement. This is the
    // loophole the separate chip ceiling existed to close, kept as its own
    // assertion because its failure reads differently from a box count.
    var d = compareBlankBoxes(BASELINE, renderAll());
    assert.deepEqual(
      d.newChips,
      [],
      "these slugs demoted to a bare chip: " +
        d.newChips.join(", ") +
        ". They render nothing real now, so fix the renderer rather than " +
        "recording it.",
    );
  });

  it("records which slugs were built, so a leaf removal reads as a demotion and not a newcomer", function () {
    // Built slugs are never measured, so the baseline has no per-slug row for
    // them. Without this record a slug whose leaf was removed would arrive as
    // a chip the baseline "never saw" and bank as a newcomer (plugin #318).
    var r = renderAll();
    assert.ok(
      Array.isArray(r.builtSlugs) && r.builtSlugs.length > 0,
      "measurement reports the built slugs",
    );
    assert.equal(
      new Set(r.builtSlugs).size,
      r.builtSlugs.length,
      "builtSlugs lists a slug once; the authorable vocabulary names some twice",
    );
    assert.deepEqual(
      BASELINE.builtSlugs,
      r.builtSlugs.slice().sort(),
      "the committed baseline's builtSlugs differ from what is built now." +
        ratchetHint(),
    );
  });

  // Drives the real --write-baseline against a COPY of the committed record,
  // via BLANK_BOX_BASELINE, so the committed file is never touched, and
  // removes the copy afterwards.
  function runBank(edit, env) {
    var spawnSync = require("node:child_process").spawnSync;
    var fs = require("node:fs");
    var os = require("node:os");
    var dir = fs.mkdtempSync(path.join(os.tmpdir(), "bbs-"));
    var copy = path.join(dir, "baseline.json");
    var summary = path.join(dir, "summary.md");
    var output = path.join(dir, "output.txt");
    var record = JSON.parse(JSON.stringify(BASELINE));
    var written = edit(record);
    if (written !== false)
      fs.writeFileSync(
        copy,
        typeof written === "string"
          ? written
          : JSON.stringify(record, null, 2) + "\n",
      );
    var before = fs.existsSync(copy) ? fs.readFileSync(copy, "utf8") : null;
    try {
      var res = spawnSync(
        process.execPath,
        [
          path.resolve(
            __dirname,
            "..",
            "..",
            "scripts",
            "renderers",
            "ds-coverage-report.js",
          ),
          "--write-baseline",
        ],
        {
          encoding: "utf8",
          env: Object.assign({}, process.env, env || {}, {
            GITHUB_STEP_SUMMARY: summary,
            GITHUB_OUTPUT: output,
            BLANK_BOX_BASELINE: copy,
          }),
        },
      );
      return {
        status: res.status,
        stdout: String(res.stdout || ""),
        stderr: String(res.stderr || ""),
        before: before,
        after: fs.existsSync(copy) ? fs.readFileSync(copy, "utf8") : null,
        summary: fs.existsSync(summary) ? fs.readFileSync(summary, "utf8") : "",
        output: fs.existsSync(output) ? fs.readFileSync(output, "utf8") : "",
      };
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  it("names a banked newcomer chip in the job summary and the step output, since the bank step runs before any test can", function () {
    // Plugin #318. The vendor job rewrites the baseline before the tests run,
    // so a newcomer never reaches a failing assertion; the run summary and the
    // PR body (fed from the step output) are where a reader sees it.
    var chip = BASELINE.chipSlugs[0];
    assert.ok(chip, "the committed baseline lists at least one chip to forget");
    var r = runBank(function (record) {
      delete record.perSlug[chip];
      record.chipSlugs = record.chipSlugs.filter(function (s) {
        return s !== chip;
      });
    });
    assert.equal(r.status, 0, r.stderr);
    assert.ok(
      r.stdout.indexOf("bare chip") !== -1 &&
        r.stdout.indexOf("`" + chip + "`") !== -1,
      r.stdout,
    );
    assert.ok(r.summary.indexOf("`" + chip + "`") !== -1, r.summary);
    assert.ok(
      r.output.indexOf("notes<<") !== -1 &&
        r.output.indexOf("`" + chip + "`") !== -1,
      r.output,
    );
    assert.deepEqual(
      JSON.parse(r.after).chipSlugs,
      BASELINE.chipSlugs,
      "the copy was rewritten with the chip banked",
    );
  });

  it("refuses a regression through the real command, leaves the record untouched, and exits 1", function () {
    var slug = Object.keys(BASELINE.perSlug).filter(function (s) {
      return BASELINE.perSlug[s] > 0;
    })[0];
    assert.ok(
      slug,
      "the committed baseline has a slug with blank boxes to under-record",
    );
    var r = runBank(function (record) {
      record.perSlug[slug] = 0;
      record.total -= BASELINE.perSlug[slug];
    });
    assert.equal(r.status, 1, r.stdout);
    assert.match(r.stderr, /REFUSING/);
    assert.ok(r.stderr.indexOf(slug) !== -1, r.stderr);
    assert.equal(r.after, r.before, "a refused bank writes nothing");
    // A refusal fails the job before any PR exists, so the run summary is the
    // one place a reader sees why.
    assert.match(r.summary, /refused/i);
    assert.ok(r.summary.indexOf(slug) !== -1, r.summary);
  });

  it("refuses a record it cannot parse, rather than overwriting it", function () {
    var r = runBank(function () {
      return "{ not json";
    });
    assert.equal(r.status, 1, r.stdout);
    assert.match(r.stderr, /parse|JSON/i);
    assert.match(r.summary, /refused/i);
    assert.equal(
      r.after,
      "{ not json",
      "an unreadable record is left for a human",
    );
  });

  it("writes a first record when none exists, and still says when no rename could be applied", function () {
    var fs = require("node:fs");
    var os = require("node:os");
    var dir = fs.mkdtempSync(path.join(os.tmpdir(), "bbl-"));
    try {
      var r = runBank(function () {
        return false;
      });
      assert.equal(r.status, 0, r.stderr);
      assert.equal(JSON.parse(r.after).total, BASELINE.total);
      var r2 = runBank(
        function () {
          return false;
        },
        { BLANK_BOX_LEDGER: path.join(dir, "missing.json") },
      );
      assert.equal(r2.status, 0, r2.stderr);
      assert.match(r2.stdout, /Not applied tonight:.*no rename/i);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("names each authorable slug once, so a slug is measured once", function () {
    var slugs = authorableSlugs();
    assert.equal(
      new Set(slugs).size,
      slugs.length,
      "authorableSlugs() lists a slug once",
    );
    var r = renderAll();
    assert.equal(r.chipSlugs.length, new Set(r.chipSlugs).size);
    assert.equal(
      r.total,
      Object.keys(r.perSlug).reduce(function (t, k) {
        return t + r.perSlug[k];
      }, 0),
    );
  });

  it("classifies a chip by its root element, not by a chip nested in real markup", function () {
    var slug = Object.keys(BASELINE.perSlug)[0];
    var nested =
      '<div class="ds-appearance" data-ds-slug="x"><span class="ds-component" data-slug="y">y</span></div>';
    assert.deepEqual(
      measureBlankBoxes({
        slugs: [slug],
        render: function () {
          return nested;
        },
      }).chipSlugs,
      [],
    );
    var chip =
      '<span class="ds-component" data-slug="x" data-name="x">x</span>';
    assert.deepEqual(
      measureBlankBoxes({
        slugs: [slug],
        render: function () {
          return chip;
        },
      }).chipSlugs,
      [slug],
    );
    var commented =
      '<!-- fallback -->\n<span class="ds-component ds-component--chip" data-slug="x">x</span>';
    assert.deepEqual(
      measureBlankBoxes({
        slugs: [slug],
        render: function () {
          return commented;
        },
      }).chipSlugs,
      [slug],
    );
    assert.deepEqual(
      renderAll().chipSlugs.slice().sort(),
      BASELINE.chipSlugs.slice().sort(),
      "the real renderer's chips are recognised",
    );
    var frame = '<div class="ds-component-frame" data-ds-slug="x"></div>';
    assert.deepEqual(
      measureBlankBoxes({
        slugs: [slug],
        render: function () {
          return frame;
        },
      }).chipSlugs,
      [],
      "the class is a whole token",
    );
  });

  it("records a render that produces nothing, empty or thrown, as a chip", function () {
    // Banked as a real render at zero boxes, it would be refused as a demotion
    // the night it chips. The real renderer never throws, so the seam is how
    // the empty case is driven.
    var slug = Object.keys(BASELINE.perSlug)[0]; // unbuilt, so it is rendered
    assert.deepEqual(
      measureBlankBoxes({
        slugs: [slug],
        render: function () {
          return "";
        },
      }).chipSlugs,
      [slug],
    );
    assert.deepEqual(
      measureBlankBoxes({
        slugs: [slug],
        render: function () {
          throw new Error("boom");
        },
      }).chipSlugs,
      [slug],
    );
    assert.deepEqual(
      measureBlankBoxes({
        slugs: [slug],
        render: function () {
          return null;
        },
      }).chipSlugs,
      [slug],
    );
  });

  it("carries a rename the vendored ledger knows through the real measurement", function (t) {
    // Every rename in the ledger whose new name is measured or built today:
    // a baseline recorded under the OLD name must compare as carried over,
    // never as a departure plus an arrival.
    var r = renderAll();
    var pairs = Object.keys(r.renames).filter(function (was) {
      var is = r.renames[was];
      return is in r.perSlug || r.builtSlugs.indexOf(is) !== -1;
    });
    if (!pairs.length)
      return t.skip(
        "no rename in the vendored ledger targets a measured or built slug",
      );
    pairs.forEach(function (was) {
      var is = r.renames[was];
      var old = JSON.parse(JSON.stringify(BASELINE));
      if (is in old.perSlug) {
        old.perSlug[was] = old.perSlug[is];
        delete old.perSlug[is];
      }
      old.chipSlugs = old.chipSlugs.map(function (s) {
        return s === is ? was : s;
      });
      old.builtSlugs = old.builtSlugs.map(function (s) {
        return s === is ? was : s;
      });
      var d = compareBlankBoxes(old, r);
      assert.deepEqual(d.renamed, [{ from: was, to: is }]);
      assert.deepEqual(
        d.disappeared.filter(function (x) {
          return x.slug === was;
        }),
        [],
      );
      assert.equal(d.disappearedBuilt.indexOf(was), -1);
      assert.equal(
        d.unlisted.filter(function (x) {
          return x.slug === is;
        }).length,
        0,
      );
    });
  });

  it("refuses to bank on a ledger that does not parse, rather than reading it as no renames", function () {
    var fs = require("node:fs");
    var os = require("node:os");
    var dir = fs.mkdtempSync(path.join(os.tmpdir(), "bbl-"));
    try {
      var broken = path.join(dir, "identity.json");
      fs.writeFileSync(broken, "{ broken");
      var r = runBank(function () {}, { BLANK_BOX_LEDGER: broken });
      assert.equal(r.status, 1, r.stdout);
      assert.match(r.stderr, /identity|ledger/i);
      assert.match(
        r.summary,
        /refused/i,
        "every refusal reaches the run summary",
      );
      assert.equal(r.after, r.before, "nothing was written");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("applies no rename, and says so, when the vendored reader is missing", function () {
    var fs = require("node:fs");
    var os = require("node:os");
    var dir = fs.mkdtempSync(path.join(os.tmpdir(), "bbl-"));
    try {
      var ledger = path.join(dir, "identity.json");
      fs.writeFileSync(ledger, JSON.stringify({ entries: {} }));
      var notes = [];
      var idx = renameIndex(
        { components: { identity: ledger } },
        function (line) {
          notes.push(line);
        },
      );
      assert.deepEqual(idx, {});
      assert.equal(notes.length, 1);
      assert.match(notes[0], /rename/i);
      var notes2 = [];
      assert.deepEqual(
        renameIndex(
          {
            components: {},
            buildRenameIndex: function () {
              return {};
            },
          },
          function (l) {
            notes2.push(l);
          },
        ),
        {},
      );
      assert.equal(
        notes2.length,
        1,
        "a manifest with no identity name is noted, not read as no ledger",
      );
      var prev = process.env.BLANK_BOX_LEDGER;
      process.env.BLANK_BOX_LEDGER = path.join(dir, "nope.json");
      try {
        var notes3 = [];
        renameIndex({ components: { identity: ledger } }, function (l) {
          notes3.push(l);
        });
        // Reading the note's TEXT, not just counting it. The env path does not
        // exist either, so reading THAT also emits exactly one note: counting
        // to 1 passed whichever path won, and the assertion could not fail on
        // the defect it names.
        assert.equal(notes3.length, 1);
        assert.doesNotMatch(
          notes3[0],
          /no identity ledger at/,
          "the injected ledger was read, not the non-existent env path",
        );
      } finally {
        if (prev === undefined) delete process.env.BLANK_BOX_LEDGER;
        else process.env.BLANK_BOX_LEDGER = prev;
      }
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("banks only on a night the vendor changed, so a bank that no PR carries is never announced", function () {
    var fs = require("node:fs");
    var wf = fs.readFileSync(
      path.resolve(
        __dirname,
        "..",
        "..",
        "..",
        "..",
        ".github",
        "workflows",
        "vendor-snapshot.yml",
      ),
      "utf8",
    );
    var detect = wf.indexOf("- name: Detect changes");
    var bank = wf.indexOf("- name: Re-record the blank-box baseline");
    var open = wf.indexOf("- name: Open pull request");
    assert.ok(detect !== -1 && bank !== -1 && open !== -1);
    assert.ok(
      detect < bank && bank < open,
      "the bank step sits between Detect changes and Open pull request",
    );
    var step = wf.slice(bank, wf.indexOf("\n      - name:", bank + 10));
    assert.match(step, /if: steps\.diff\.outputs\.changed == 'true'/);
  });

  it("feeds the vendor PR body from the bank step's output", function () {
    // Nothing on an auto-merged PR carried what the bank recorded; the step
    // output is what the body can read.
    var fs = require("node:fs");
    var wf = fs.readFileSync(
      path.resolve(
        __dirname,
        "..",
        "..",
        "..",
        "..",
        ".github",
        "workflows",
        "vendor-snapshot.yml",
      ),
      "utf8",
    );
    var start = wf.indexOf("- name: Re-record the blank-box baseline");
    var step = wf.slice(start, wf.indexOf("- name:", start + 10));
    assert.match(step, /id: bank/);
    assert.match(wf, /steps\.bank\.outputs\.notes/);
  });

  it("records a chip that gained real anatomy", function () {
    var d = compareBlankBoxes(BASELINE, renderAll());
    assert.deepEqual(
      d.retiredChips,
      [],
      "these slugs are no longer bare chips, which is progress: " +
        d.retiredChips.join(", ") +
        ratchetHint(),
    );
  });
});

describe("the built-slug record's own input", function () {
  it("POSITIVE CONTROL: measuring refuses when the vendored renderer exports no BUILT_SLUGS", function () {
    // builtSlugs is the one field the record cannot re-derive from itself, and
    // it is read straight off the vendored renderer. An empty export is not
    // "nothing is built": it would skip no slug, measure every built one as if
    // it had never been built, and bank a record whose builtSlugs is `[]`. That
    // record still HAS the field, so compareBlankBoxes's fail-closed path (which
    // triggers on a MISSING field) would not catch it. Refusing at the measure
    // is the only place the difference is still visible.
    var dsMap = require(
      path.resolve(__dirname, "..", "..", "scripts", "lib", "renderer.js"),
    ).dsHtmlMap;
    var real = dsMap.BUILT_SLUGS;
    assert.ok(
      Array.isArray(real) && real.length > 0,
      "the real export must be non-empty, or this control proves nothing",
    );
    var stub = { slugs: ["button"], render: function () { return "<div></div>"; } };
    try {
      dsMap.BUILT_SLUGS = [];
      assert.throws(
        function () { measureBlankBoxes(stub); },
        /no BUILT_SLUGS \(empty array\)/,
        "an empty export must refuse, not measure",
      );
      dsMap.BUILT_SLUGS = undefined;
      assert.throws(
        function () { measureBlankBoxes(stub); },
        /no BUILT_SLUGS \(undefined\)/,
        "a missing export must refuse too",
      );
    } finally {
      dsMap.BUILT_SLUGS = real;
    }
    assert.equal(dsMap.BUILT_SLUGS, real, "the real export is put back");
  });
});
