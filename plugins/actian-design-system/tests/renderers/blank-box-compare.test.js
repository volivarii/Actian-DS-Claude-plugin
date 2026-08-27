"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var path = require("path");

var R = require(
  path.resolve(
    __dirname,
    "..",
    "..",
    "scripts",
    "renderers",
    "ds-coverage-report.js",
  ),
);

// Why this comparison exists at all.
//
// The blank-box gate shipped on 2026-07-13 with two literals in the test file:
// BUDGET = 136 and CHIP_BUDGET = 4, described as ceilings that "RATCHET DOWN".
// Neither was ever lowered. Measured on 2026-08-11 the renderer emits 45 boxes
// and 2 chips, so the gate carried 91 boxes of silent headroom: output could
// have tripled and still passed, while the gray-box programme's real win from
// 136 to 45 was invisible in the very gate built to track it.
//
// A hand-maintained number standing in for a fact the data already knows is the
// same defect class as the hand-kept lists behind the 2026-07-25 outage. So the
// baseline is now a generated per-slug record, and the rule is exact equality:
// the committed baseline must equal what the renderer actually emits. A
// regression shows up as a diff line saying 25 became 30, which is louder than
// a total creeping from 136 to 137, and an improvement has to be recorded to go
// green, which is what keeps the number true.

// Both sides of the comparison are the same record shape; a baseline is a
// measurement that was banked. builtSlugs defaults to the empty record, not
// to absence: a record with no builtSlugs field predates it and is tested on
// its own.
function record(perSlug, chipSlugs, builtSlugs, renames) {
  var r = {
    perSlug: perSlug,
    chipSlugs: chipSlugs || [],
    builtSlugs: builtSlugs || [],
  };
  // Only a measurement carries the rename index (retired slug -> current
  // slug), read from the vendored identity ledger.
  if (renames) r.renames = renames;
  return r;
}
var baseline = record;
var measured = record;

test("compareBlankBoxes: an exact match is clean", function () {
  var d = R.compareBlankBoxes(
    baseline({ "bar-graph": 25, "checkbox-card": 2 }, ["scroll-bar"]),
    {
      perSlug: { "bar-graph": 25, "checkbox-card": 2 },
      chipSlugs: ["scroll-bar"],
    },
  );
  assert.equal(d.clean, true);
  assert.deepEqual(d.regressions, []);
  assert.deepEqual(d.improvements, []);
});

test("compareBlankBoxes: a slug emitting MORE boxes than recorded is a regression", function () {
  var d = R.compareBlankBoxes(baseline({ "bar-graph": 25 }), {
    perSlug: { "bar-graph": 30 },
    chipSlugs: [],
  });
  assert.equal(d.clean, false);
  assert.deepEqual(d.regressions, [{ slug: "bar-graph", from: 25, to: 30 }]);
});

test("compareBlankBoxes: a slug emitting FEWER boxes is an improvement, and still has to be recorded", function () {
  var d = R.compareBlankBoxes(baseline({ "bar-graph": 25 }), {
    perSlug: { "bar-graph": 4 },
    chipSlugs: [],
  });
  assert.equal(d.clean, false, "an unrecorded improvement is not clean");
  assert.deepEqual(d.improvements, [{ slug: "bar-graph", from: 25, to: 4 }]);
  assert.deepEqual(d.regressions, []);
});

test("compareBlankBoxes: a slug the baseline has never seen is reported as unlisted", function () {
  var d = R.compareBlankBoxes(baseline({ "bar-graph": 25 }), {
    perSlug: { "bar-graph": 25, "pie-graph": 9 },
    chipSlugs: [],
  });
  assert.deepEqual(d.unlisted, [{ slug: "pie-graph", to: 9 }]);
});

test("compareBlankBoxes: a recorded slug that vanished is reported, since a rename must not pass silently", function () {
  // radio-button-card becomes radio-card in the held tag sync, so this is the
  // live case, not a hypothetical.
  var d = R.compareBlankBoxes(baseline({ "radio-button-card": 1 }), {
    perSlug: { "radio-card": 1 },
    chipSlugs: [],
  });
  assert.deepEqual(d.disappeared, [{ slug: "radio-button-card", from: 1 }]);
  assert.deepEqual(d.unlisted, [{ slug: "radio-card", to: 1 }]);
});

test("compareBlankBoxes: a new graceful-degradation chip is a regression", function () {
  // The loophole the separate chip ceiling was written to close: a slug that
  // used to render real markup can demote to a bare chip, which makes the box
  // count look better while the output got worse.
  // The baseline measured notification-dropdown rendering real markup (3
  // boxes, no chip); now it is a chip. That is the demotion.
  var d = R.compareBlankBoxes(
    baseline({ "notification-dropdown": 3 }, ["scroll-bar"]),
    {
      perSlug: { "notification-dropdown": 0 },
      chipSlugs: ["scroll-bar", "notification-dropdown"],
    },
  );
  assert.equal(d.clean, false);
  assert.deepEqual(d.newChips, ["notification-dropdown"]);
});

// ---------------------------------------------------------------------------
// Plugin #318, 2026-08-27. A slug the baseline had never seen arrived as a bare
// chip (`dropdown`, new in knowledge v0.34.155) and was reported as "demoted",
// which halted the vendor sync and, with it, all knowledge consumption. A
// newcomer and a demotion are opposites: one is work not yet done, the other is
// work undone. The baseline must know which slugs it had measured, and which
// were built, to tell them apart.
// ---------------------------------------------------------------------------

test("compareBlankBoxes: a chip the baseline never measured is a newcomer, not a demotion", function () {
  var d = R.compareBlankBoxes(baseline({}, []), {
    perSlug: { dropdown: 0 },
    chipSlugs: ["dropdown"],
  });
  assert.deepEqual(d.newcomerChips, ["dropdown"]);
  assert.deepEqual(d.newChips, []);
  assert.equal(d.clean, false, "a newcomer still has to be recorded");
});

test("compareBlankBoxes: a slug the baseline measured rendering something that now renders a chip is a demotion", function () {
  var d = R.compareBlankBoxes(baseline({ "scroll-bar": 0 }, []), {
    perSlug: { "scroll-bar": 0 },
    chipSlugs: ["scroll-bar"],
  });
  assert.deepEqual(d.newChips, ["scroll-bar"]);
  assert.deepEqual(d.newcomerChips, []);
});

test("compareBlankBoxes: a slug the baseline recorded as built that now renders a chip is a named loss, not an anonymous newcomer", function () {
  // Built slugs are not measured, so without the record a leaf removal would
  // read as a newcomer and bank silently. It is named instead.
  var d = R.compareBlankBoxes(
    baseline({}, [], ["tabs"]),
    measured({ tabs: 0 }, ["tabs"], []),
  );
  assert.deepEqual(d.leafDropped, [{ slug: "tabs", to: 0, chip: true }]);
  assert.deepEqual(d.newcomerChips, [], "not an anonymous arrival");
  assert.deepEqual(d.unlisted, [], "and not an anonymous unlisted row");
  assert.match(
    R.summarizeBank(d).join("\n"),
    /LOST REAL MARKUP.*`tabs`/,
    "the loss is worded as a loss",
  );
});

test("compareBlankBoxes: a retired leaf banks whichever way it falls, because the plugin authors no leaf", function () {
  // The same upstream event (knowledge retires a hand-authored leaf) used to
  // halt or bank depending only on whether knowledge happened to ship an
  // anatomy doc for that slug: with one it was a `leafDropped` row that banked
  // at 8 blank boxes, without one it reached gracefulChip and refused. The
  // refusal said "fix the renderer", which names nothing a maintainer of THIS
  // repo can change, so the nightly would have halted every night on it. That
  // is the #318 outage in a narrower form.
  var ontoAnatomy = R.compareBlankBoxes(
    baseline({}, [], ["widget"]),
    measured({ widget: 8 }, [], []),
  );
  var ontoChip = R.compareBlankBoxes(
    baseline({}, [], ["widget"]),
    measured({ widget: 0 }, ["widget"], []),
  );
  assert.equal(R.bankable(ontoAnatomy).ok, true);
  assert.equal(
    R.bankable(ontoChip).ok,
    true,
    "the same upstream event must not halt the intake just because no anatomy doc caught the fall",
  );
  // Banked is not the same as unremarked: the worse fall is worded worse.
  assert.match(R.summarizeBank(ontoChip).join("\n"), /LOST REAL MARKUP/);
  assert.doesNotMatch(
    R.summarizeBank(ontoAnatomy).join("\n"),
    /LOST REAL MARKUP/,
  );
});

test("compareBlankBoxes: a measured slug that demotes to a chip is not also an improvement", function () {
  // Round 2: a chip emits zero boxes, so a slug going from 3 boxes to a chip
  // read as both "improved 3 -> 0, record it" and "demoted, fix it", two
  // opposite instructions for one event.
  var d = R.compareBlankBoxes(
    baseline({ x: 3 }, []),
    measured({ x: 0 }, ["x"]),
  );
  assert.deepEqual(d.newChips, ["x"]);
  assert.deepEqual(d.improvements, []);
});

test("compareBlankBoxes: a baseline with no builtSlugs record fails closed, so an unlisted chip is a demotion", function () {
  // A record that predates the field cannot vouch for any built slug, so it
  // must not wave a chip through as a newcomer.
  var old = { perSlug: {}, chipSlugs: [] };
  var d = R.compareBlankBoxes(old, measured({ tabs: 0 }, ["tabs"]));
  assert.deepEqual(d.newChips, ["tabs"]);
  assert.deepEqual(d.newcomerChips, []);
});

test("bankable: a newcomer chip is bankable, because nothing got worse", function () {
  var newcomer = R.compareBlankBoxes(baseline({}, []), {
    perSlug: { dropdown: 0 },
    chipSlugs: ["dropdown"],
  });
  assert.equal(R.bankable(newcomer).ok, true);
});

test("compareBlankBoxes: a chip that gained real anatomy is an improvement", function () {
  var d = R.compareBlankBoxes(
    baseline({}, ["scroll-bar", "lineage-connecting-line"]),
    {
      perSlug: {},
      chipSlugs: ["scroll-bar"],
    },
  );
  assert.deepEqual(d.retiredChips, ["lineage-connecting-line"]);
  assert.deepEqual(d.newChips, []);
});

test("compareBlankBoxes: the totals both ways are reported, so the message can state direction", function () {
  var d = R.compareBlankBoxes(baseline({ a: 10, b: 5 }), {
    perSlug: { a: 10, b: 1 },
    chipSlugs: [],
  });
  assert.equal(d.totalFrom, 15);
  assert.equal(d.totalTo, 11);
});

// ---------------------------------------------------------------------------
// Review findings, 2026-08-11. The first version of this comparison replaced a
// total-based ceiling with a name-keyed one, and a review found that trade let
// three things through that the crude old number caught.
// ---------------------------------------------------------------------------

test("compareBlankBoxes: a rename is not a hiding place for a box-count increase", function () {
  // The old total ceiling was rename-immune; keying on slug names alone was not.
  // radio-button-card becomes radio-card in the held knowledge tag sync, so this
  // is the live case: 1 box becomes 8 and nothing was classified a regression.
  var d = R.compareBlankBoxes(baseline({ "radio-button-card": 1 }), {
    perSlug: { "radio-card": 8 },
    chipSlugs: [],
  });
  assert.equal(
    d.totalRose,
    true,
    "the total rising must be reported on its own, independent of slug identity",
  );
  assert.equal(d.totalFrom, 1);
  assert.equal(d.totalTo, 8);
});

test("compareBlankBoxes: a newly authorable slug that emits boxes makes the total rise", function () {
  var d = R.compareBlankBoxes(baseline({ "bar-graph": 25 }), {
    perSlug: { "bar-graph": 25, "pie-graph": 9 },
    chipSlugs: [],
  });
  assert.equal(d.totalRose, true);
  assert.deepEqual(d.unlisted, [{ slug: "pie-graph", to: 9 }]);
});

test("compareBlankBoxes: a chip that gained real anatomy is progress, not a regression", function () {
  // A bare chip renders NOTHING real, so going from 0 boxes to some boxes is a
  // promotion. Classifying it as a regression made the one assertion that
  // refuses to be banked block a genuine improvement and tell the author to
  // revert it.
  var d = R.compareBlankBoxes(
    baseline({ "lineage-connecting-line": 0 }, ["lineage-connecting-line"]),
    { perSlug: { "lineage-connecting-line": 3 }, chipSlugs: [] },
  );
  assert.deepEqual(d.regressions, [], "not a regression");
  assert.deepEqual(d.chipPromotions, [
    { slug: "lineage-connecting-line", from: 0, to: 3 },
  ]);
  assert.deepEqual(d.retiredChips, ["lineage-connecting-line"]);
});

test("compareBlankBoxes: a real regression on a slug that is still a chip is still a regression", function () {
  var d = R.compareBlankBoxes(baseline({ x: 2 }, ["x"]), {
    perSlug: { x: 9 },
    chipSlugs: ["x"],
  });
  assert.deepEqual(d.regressions, [{ slug: "x", from: 2, to: 9 }]);
  assert.deepEqual(d.chipPromotions, []);
});

test("compareBlankBoxes: a falling total is not flagged as a rise", function () {
  var d = R.compareBlankBoxes(baseline({ a: 10 }), {
    perSlug: { a: 2 },
    chipSlugs: [],
  });
  assert.equal(d.totalRose, false);
});

test("bankable: a regression may not be banked, so --write-baseline must refuse", function () {
  // The drift failure prints the bank command. Without a refusal, an author
  // following that instruction banks any regression or demotion riding along in
  // the same change, which the old hand-edited ceilings could not do silently.
  var withRegression = R.compareBlankBoxes(baseline({ a: 5 }), {
    perSlug: { a: 9 },
    chipSlugs: [],
  });
  assert.equal(R.bankable(withRegression).ok, false);
  assert.match(R.bankable(withRegression).why, /regress/i);
});

test("bankable: a new chip demotion may not be banked either", function () {
  var withDemotion = R.compareBlankBoxes(baseline({ "scroll-bar": 0 }, []), {
    perSlug: { "scroll-bar": 0 },
    chipSlugs: ["scroll-bar"],
  });
  assert.equal(R.bankable(withDemotion).ok, false);
  assert.match(R.bankable(withDemotion).why, /chip/i);
});

test("bankable: an improvement, a rename and a chip promotion are all bankable", function () {
  var improvement = R.compareBlankBoxes(baseline({ a: 10 }), {
    perSlug: { a: 2 },
    chipSlugs: [],
  });
  assert.equal(R.bankable(improvement).ok, true);

  var promotion = R.compareBlankBoxes(baseline({ c: 0 }, ["c"]), {
    perSlug: { c: 4 },
    chipSlugs: [],
  });
  assert.equal(R.bankable(promotion).ok, true);
});

// --- round 3 of the #318 review -----------------------------------------------
//
// One rule, stated once: only a demotion to a bare chip refuses to bank. Every
// other change is reported by name and banks. A newcomer, a leaf that stopped
// applying, a built slug that vanished: each is a row with its own label, none
// halts the nightly, because a halt before the PR opens is the #318 outage.

test("bankable: a newcomer that arrives emitting blank boxes banks, and is reported as a newcomer", function () {
  // The old refusal wanted a reason flag that a cron job can never supply, so
  // a new Figma component with one empty box would freeze the plugin exactly
  // as the chip did. Silence was the concern; a named row answers it.
  var d = R.compareBlankBoxes(baseline({}, []), measured({ fresh: 2 }, []));
  assert.deepEqual(d.unlisted, [{ slug: "fresh", to: 2 }]);
  assert.equal(R.bankable(d).ok, true);
});

test("compareBlankBoxes: a built slug that is now measured has dropped its leaf, and says so", function () {
  // The leaf was removed or renamed away and the slug falls back to the
  // generic renderer. Banks (the nightly vendors the renderer, so this can
  // arrive from upstream), but never as an anonymous unlisted row.
  var d = R.compareBlankBoxes(
    baseline({}, [], ["tabs"]),
    measured({ tabs: 0 }, [], []),
  );
  assert.deepEqual(d.leafDropped, [{ slug: "tabs", to: 0, chip: false }]);
  assert.deepEqual(d.unlisted, []);
  assert.equal(d.clean, false);
  assert.equal(R.bankable(d).ok, true);
});

test("compareBlankBoxes: a built slug gone from both the leaves and the vocabulary is reported, not shrunk away", function () {
  var d = R.compareBlankBoxes(
    baseline({}, [], ["calendar", "button"]),
    measured({}, [], ["button"]),
  );
  assert.deepEqual(d.disappearedBuilt, ["calendar"]);
  assert.equal(d.clean, false);
  assert.equal(R.bankable(d).ok, true);
});

test("compareBlankBoxes: a vanished slug and a newcomer chip in one refresh are flagged together, since the newcomer may be the vanished slug renamed", function () {
  // A rename cannot be resolved here (the vendored registry carries no slug
  // history), so the pairing is named for a reader to judge.
  var d = R.compareBlankBoxes(
    baseline({ "old-name": 3 }, []),
    measured({ "new-name": 0 }, ["new-name"]),
  );
  assert.deepEqual(d.disappeared, [{ slug: "old-name", from: 3 }]);
  assert.deepEqual(d.newcomerChips, ["new-name"]);
  assert.equal(d.possibleRenamedDemotion, true);
});

test("summarizeBank: every banked class a reader should see is one named line", function () {
  var d = R.compareBlankBoxes(
    baseline({ "old-name": 3 }, [], ["tabs", "calendar"]),
    measured({ "new-name": 0, fresh: 2, tabs: 0 }, ["new-name"], []),
  );
  var lines = R.summarizeBank(d);
  assert.equal(lines.length, 6, lines.join("\n"));
  assert.match(lines[0], /bare chip.*`new-name`/);
  assert.match(lines[1], /blank boxes.*`fresh` \(2\)/);
  assert.match(lines[2], /leaf no longer applies.*`tabs`/);
  assert.match(lines[3], /Built.*gone from the vocabulary.*`calendar`/);
  assert.match(lines[4], /Measured.*gone from the vocabulary.*`old-name`/);
  assert.match(lines[5], /re-key.*`old-name`.*`calendar`.*`new-name`/);
  assert.deepEqual(
    R.summarizeBank(
      R.compareBlankBoxes(baseline({ a: 1 }), measured({ a: 1 })),
    ),
    [],
  );
});

// --- rounds 4 and 5 of the #318 review ----------------------------------------
//
// The vendored identity ledger records every slug a component used to carry,
// so a rename is a fact the measurement reads. The comparison applies it by
// rewriting the BASELINE under the new name first (its row, its chip status,
// its built status) and then comparing name to name with the one set of
// rules, so nothing about a rename needs a rule of its own. The rewrite is
// applied only when the measurement no longer carries the old name and the
// baseline does not already carry the new one; otherwise both names are
// compared as they are. A re-key replaces the identity and leaves no trail,
// so an unpaired departure plus a newcomer chip is still flagged for a reader.

test("compareBlankBoxes: a rename the ledger knows is applied to the baseline, so the old name never departs and the new one never arrives", function () {
  var d = R.compareBlankBoxes(
    baseline({ "old-name": 3 }, []),
    measured({ "new-name": 3 }, [], [], { "old-name": "new-name" }),
  );
  assert.deepEqual(d.renamed, [{ from: "old-name", to: "new-name" }]);
  assert.deepEqual(d.disappeared, []);
  assert.deepEqual(d.unlisted, []);
  assert.deepEqual(d.regressions, []);
  assert.equal(
    d.clean,
    false,
    "the record still has to be rewritten under the new name",
  );
  assert.equal(R.bankable(d).ok, true);
});

test("compareBlankBoxes: a chip under a renamed name where the old name rendered something is named as a renamed chip, and banks", function () {
  var d = R.compareBlankBoxes(
    baseline({ "old-name": 3 }, []),
    measured({ "new-name": 0 }, ["new-name"], [], { "old-name": "new-name" }),
  );
  // Carried over by the ledger, so it is neither a newcomer nor a same-name
  // demotion: a rename never refuses on its own, it is named in the PR body
  // as a chip whose leaf or anatomy still answers to the old name.
  assert.deepEqual(d.newChips, []);
  assert.deepEqual(d.newcomerChips, []);
  assert.deepEqual(d.renamedChips, ["new-name"]);
  assert.equal(R.bankable(d).ok, true);
  assert.match(
    R.summarizeBank(d).join("\n"),
    /LOST REAL MARKUP, now a bare chip: `new-name` \(was `old-name` at 3\)/,
  );
});

test("compareBlankBoxes: a renamed built slug arriving as a chip is a renamed chip too, and banks", function () {
  var d = R.compareBlankBoxes(
    baseline({}, [], ["tabs"]),
    measured({ "tab-bar": 0 }, ["tab-bar"], [], { tabs: "tab-bar" }),
  );
  assert.deepEqual(d.renamedChips, ["tab-bar"]);
  assert.deepEqual(d.disappearedBuilt, []);
  assert.equal(R.bankable(d).ok, true);
});

test("compareBlankBoxes: a chip that stays a chip across a rename is nothing worse", function () {
  var d = R.compareBlankBoxes(
    baseline({ "old-name": 0 }, ["old-name"]),
    measured({ "new-name": 0 }, ["new-name"], [], { "old-name": "new-name" }),
  );
  assert.deepEqual(d.newChips, []);
  assert.deepEqual(d.retiredChips, []);
  assert.deepEqual(d.renamed, [{ from: "old-name", to: "new-name" }]);
  assert.equal(R.bankable(d).ok, true);
});

test("compareBlankBoxes: a chip that gained real anatomy across a rename is a promotion, not a regression", function () {
  var d = R.compareBlankBoxes(
    baseline({ "old-name": 0 }, ["old-name"]),
    measured({ "new-name": 3 }, [], [], { "old-name": "new-name" }),
  );
  assert.deepEqual(d.chipPromotions, [{ slug: "new-name", from: 0, to: 3 }]);
  assert.deepEqual(d.regressions, []);
  assert.equal(R.bankable(d).ok, true);
});

test("compareBlankBoxes: boxes rising across a rename are a regression under the new name", function () {
  var d = R.compareBlankBoxes(
    baseline({ "old-name": 3 }, []),
    measured({ "new-name": 7 }, [], [], { "old-name": "new-name" }),
  );
  assert.deepEqual(d.regressions, [{ slug: "new-name", from: 3, to: 7 }]);
  assert.equal(R.bankable(d).ok, false);
});

test("compareBlankBoxes: a rename is applied even while the old name lingers as a built leaf, so the new name's chip is named as renamed", function () {
  // A retired slug can only linger through the leaf-keyed props table (plugin
  // #319): the leaf still answers to the old name while the registry, and so
  // every generated flow, uses the new one. A chip under the new name is named
  // as such in the PR body; a knowledge rename never halts the intake.
  var d = R.compareBlankBoxes(
    baseline({}, [], ["tabs"]),
    measured({ "tab-bar": 0 }, ["tab-bar"], ["tabs"], { tabs: "tab-bar" }),
  );
  assert.deepEqual(d.renamed, [{ from: "tabs", to: "tab-bar" }]);
  assert.deepEqual(d.renamedChips, ["tab-bar"]);
  assert.deepEqual(d.newlyBuilt, [], "the lingering leaf is not a new leaf");
  assert.equal(
    R.bankable(d).ok,
    true,
    "a knowledge rename never halts the intake; the leaf follows in a plugin PR",
  );
});

test("compareBlankBoxes: the next real refresh banks: renamed built leaves whose new names render from anatomy with a few boxes", function () {
  // knowledge v0.34.156 renames metamodel-widget -> metamodel and input-date
  // -> date-input while the plugin's leaves keep the old names. Named, banked;
  // refusing it would repeat the #318 outage on night one.
  var d = R.compareBlankBoxes(
    baseline({}, [], ["metamodel-widget", "input-date"]),
    measured(
      { metamodel: 2, "date-input": 1 },
      [],
      ["metamodel-widget", "input-date"],
      { "metamodel-widget": "metamodel", "input-date": "date-input" },
    ),
  );
  assert.deepEqual(d.regressions, []);
  assert.deepEqual(
    d.leafDropped
      .map(function (x) {
        return x.slug;
      })
      .sort(),
    ["date-input", "metamodel"],
  );
  assert.equal(R.bankable(d).ok, true);
});

test("compareBlankBoxes: a built slug that now renders generically with blank boxes is a dropped leaf, named with its count, and banks", function () {
  // Built means no blank boxes. A leaf that stops applying and leaves N grey
  // boxes on every flow is the regression the rule already refuses; only a
  // clean fallback is the banked leafDropped row.
  var d = R.compareBlankBoxes(
    baseline({}, [], ["tabs"]),
    measured({ tabs: 8 }, [], []),
  );
  assert.deepEqual(d.leafDropped, [{ slug: "tabs", to: 8, chip: false }]);
  assert.deepEqual(d.regressions, []);
  assert.equal(
    R.bankable(d).ok,
    true,
    "the leaf arrives through the vendored renderer, so its retirement is a knowledge event",
  );
  assert.match(R.summarizeBank(d).join("\n"), /`tabs` \(8\)/);
});

test("compareBlankBoxes: a rename is not applied while the old name is still measured, so a stale table row cannot double a count", function () {
  var d = R.compareBlankBoxes(
    baseline({ a: 3 }, []),
    measured({ a: 3, b: 3 }, [], [], { a: "b" }),
  );
  assert.deepEqual(d.renamed, []);
  // Named as the rename it is, never as an arrival: the baseline knows this
  // component under `a`, so filing it in `unlisted` had the PR body call a
  // component it has measured for weeks a new one.
  assert.deepEqual(d.unlisted, []);
  assert.deepEqual(d.lingering, [
    { slug: "b", from: 3, to: 3, was: "a", chip: false },
  ]);
});

test("compareBlankBoxes: a slug built tonight that the baseline never knew is a row, so the record cannot grow silently", function () {
  var d = R.compareBlankBoxes(
    baseline({}, [], ["button"]),
    measured({}, [], ["button", "brand-new"]),
  );
  assert.deepEqual(d.newlyBuilt, ["brand-new"]);
  assert.equal(d.clean, false);
  assert.match(R.summarizeBank(d).join("\n"), /`brand-new`/);
});

test("compareBlankBoxes: a chip that vanished or was built is not reported as no longer a chip", function () {
  var gone = R.compareBlankBoxes(
    baseline({ c: 0 }, ["c"]),
    measured({}, [], []),
  );
  assert.doesNotMatch(
    R.summarizeBank(gone).join("\n"),
    /No longer a bare chip/,
  );
  var built = R.compareBlankBoxes(
    baseline({ c: 0 }, ["c"]),
    measured({}, [], ["c"]),
  );
  assert.doesNotMatch(
    R.summarizeBank(built).join("\n"),
    /No longer a bare chip/,
  );
  assert.deepEqual(built.promotedToBuilt, ["c"]);
});

test("compareBlankBoxes: a measurement without builtSlugs reads as no change in what is built", function () {
  var d = R.compareBlankBoxes(baseline({ a: 1 }, [], ["tabs", "button"]), {
    perSlug: { a: 1 },
    chipSlugs: [],
  });
  assert.deepEqual(d.disappearedBuilt, []);
  assert.equal(d.clean, true);
});

test("compareBlankBoxes: two retired names resolving to one current slug apply no rename, whatever the ledger's order", function () {
  ["ab", "ba"].forEach(function (order) {
    var renames = order === "ab" ? { a: "c", b: "c" } : { b: "c", a: "c" };
    var d = R.compareBlankBoxes(
      baseline({ a: 1, b: 2 }, []),
      measured({ c: 2 }, [], [], renames),
    );
    assert.deepEqual(d.renamed, [], order);
    assert.deepEqual(
      d.disappeared
        .map(function (x) {
          return x.slug;
        })
        .sort(),
      ["a", "b"],
      order,
    );
    assert.deepEqual(d.unlisted, [{ slug: "c", to: 2 }], order);
  });
});

test("compareBlankBoxes: a record without builtSlugs says so in the refusal, not only that a chip demoted", function () {
  var old = { perSlug: {}, chipSlugs: [] };
  var d = R.compareBlankBoxes(old, measured({ tabs: 0 }, ["tabs"]));
  assert.equal(d.builtRecordMissing, true);
  assert.match(R.bankable(d).why, /builtSlugs/);
});

test("summarizeBank: every banked class names its slugs, so nothing banks without a line", function () {
  var d = R.compareBlankBoxes(
    baseline(
      {
        better: 5,
        gone: 4,
        lifted: 2,
        "was-chip": 0,
        "old-name": 3,
        "old-chip": 0,
      },
      ["was-chip", "old-chip"],
      ["tabs", "calendar"],
    ),
    measured(
      {
        better: 2,
        "was-chip": 3,
        fresh: 0,
        fresh2: 2,
        tabs: 0,
        "new-name": 3,
        "new-chip": 0,
        "moved-chip": 0,
      },
      ["new-chip", "moved-chip"],
      ["lifted", "brand-new"],
      { "old-name": "new-name", "old-chip": "moved-chip" },
    ),
  );
  var text = R.summarizeBank(d).join("\n");
  [
    "better",
    "gone",
    "lifted",
    "was-chip",
    "fresh",
    "fresh2",
    "tabs",
    "calendar",
    "new-chip",
    "old-name",
    "new-name",
    "old-chip",
    "moved-chip",
    "brand-new",
  ].forEach(function (slug) {
    assert.ok(
      text.indexOf("`" + slug + "`") !== -1,
      slug + " is named:\n" + text,
    );
  });
  assert.equal(R.bankable(d).ok, true);
});

test("compareBlankBoxes: a rename is not applied when the baseline already carries the new name as its own row", function () {
  var d = R.compareBlankBoxes(
    baseline({ "old-name": 2, "new-name": 3 }, []),
    measured({ "new-name": 9 }, [], [], { "old-name": "new-name" }),
  );
  assert.deepEqual(d.renamed, []);
  assert.deepEqual(d.regressions, [{ slug: "new-name", from: 3, to: 9 }]);
  assert.deepEqual(d.disappeared, [{ slug: "old-name", from: 2 }]);
});

test("compareBlankBoxes: a vanished BUILT slug and a newcomer chip the ledger cannot pair are flagged together", function () {
  var d = R.compareBlankBoxes(
    baseline({}, [], ["tabs"]),
    measured({ "tab-bar": 0 }, ["tab-bar"], [], {}),
  );
  assert.deepEqual(d.disappearedBuilt, ["tabs"]);
  assert.equal(d.possibleRenamedDemotion, true);
  assert.match(R.summarizeBank(d).join("\n"), /`tabs`.*`tab-bar`/);
});

test("compareBlankBoxes: a measured slug that gained a leaf is a promotion, never a departure", function () {
  var d = R.compareBlankBoxes(
    baseline({ x: 3 }, []),
    measured({ y: 0 }, ["y"], ["x"]),
  );
  assert.deepEqual(d.promotedToBuilt, ["x"]);
  assert.deepEqual(d.disappeared, []);
  assert.equal(
    d.possibleRenamedDemotion,
    false,
    "x did not vanish, it was built",
  );
  assert.equal(d.clean, false);
  assert.equal(R.bankable(d).ok, true);
});

test("compareBlankBoxes: clean is derived from every row the diff reports, so a new row can never be forgotten", function () {
  var d = R.compareBlankBoxes(baseline({ a: 1 }, []), measured({ a: 1 }, []));
  var rows = Object.keys(d).filter(function (k) {
    return Array.isArray(d[k]);
  });
  assert.ok(
    rows.length >= 10,
    "the diff reports its rows as arrays: " + rows.join(", "),
  );
  assert.equal(d.clean, true);
});

test("summarizeBank: a measured slug gone from the vocabulary and a slug promoted to built are named too", function () {
  var d = R.compareBlankBoxes(
    baseline({ gone: 4, lifted: 2 }, []),
    measured({}, [], ["lifted"]),
  );
  var text = R.summarizeBank(d).join("\n");
  assert.match(text, /gone from the vocabulary.*`gone`/i);
  assert.match(text, /hand-authored leaf.*`lifted`|promoted.*`lifted`/i);
});

// --- round 8 of the #318 review -----------------------------------------------

test("compareBlankBoxes: while the old name still lingers, a rise under the renamed name is that slug's own rise and refuses", function () {
  var d = R.compareBlankBoxes(
    baseline({ a: 1 }, []),
    measured({ a: 1, b: 8 }, [], [], { a: "b" }),
  );
  assert.deepEqual(d.regressions, [{ slug: "b", from: 1, to: 8 }]);
  assert.deepEqual(d.unlisted, []);
  assert.equal(R.bankable(d).ok, false);
});

test("compareBlankBoxes: a rename whose new name is nowhere tonight is not applied, so a lingering leaf does not report the new name as gone every night", function () {
  var d = R.compareBlankBoxes(
    baseline({}, [], ["tabs"]),
    measured({}, [], ["tabs"], { tabs: "tab-bar" }),
  );
  assert.deepEqual(d.renamed, []);
  assert.deepEqual(d.disappearedBuilt, []);
  assert.equal(d.clean, true);
});

test("compareBlankBoxes: a retired name still measured tonight does not count as a claimant, so the one applicable rename applies", function () {
  var d = R.compareBlankBoxes(
    baseline({ a: 1, b: 2 }, []),
    measured({ a: 1, c: 2 }, [], [], { a: "c", b: "c" }),
  );
  assert.deepEqual(d.renamed, [{ from: "b", to: "c" }]);
  assert.deepEqual(d.disappeared, []);
});

// --- round 10 of the #318 review ----------------------------------------------
//
// The ambiguity guard exists so the verdict cannot depend on the order the
// ledger lists retired names in, and that order is just `previousSlugs` order,
// i.e. the order a component happened to be renamed in. The guard counted only
// the names it would CARRY OVER, so two names that both LINGERED toward one
// slug slipped past it: whichever the ledger listed last silently decided which
// baseline row the current slug's count was read against. One order banked, the
// other reported a regression and halted the nightly, which is the #318 outage.

test("compareBlankBoxes: two lingering names claiming one slug give the same verdict in either ledger order", function () {
  // A component renamed twice: the ledger records both old names on the current
  // entry, and both still linger as measured rows (plugin #319).
  function verdict(renames) {
    var d = R.compareBlankBoxes(
      baseline({ a: 10, b: 99 }, []),
      measured({ a: 10, b: 99, c: 50 }, [], [], renames),
    );
    return { regressions: d.regressions, unlisted: d.unlisted, ok: R.bankable(d).ok };
  }
  var ab = verdict({ a: "c", b: "c" });
  var ba = verdict({ b: "c", a: "c" });
  assert.deepEqual(ab, ba, "the verdict must not depend on the ledger's key order");
  assert.equal(ab.ok, true, "and the order-independent reading is the one that does not halt");
  assert.deepEqual(
    ab.unlisted,
    [{ slug: "c", to: 50 }],
    "with no way to say whose row it is, the slug is simply a newcomer",
  );
});

test("compareBlankBoxes: one lingering name alongside one applicable rename still applies that rename", function () {
  // The narrow reading matters: a name still measured tonight is NOT a rival
  // claimant, because it is still there under its own name and so cannot also
  // BE the new one. Widening the guard to count it would undo round 8.
  var d = R.compareBlankBoxes(
    baseline({ a: 1, b: 2 }, []),
    measured({ a: 1, c: 2 }, [], [], { a: "c", b: "c" }),
  );
  assert.deepEqual(d.renamed, [{ from: "b", to: "c" }]);
});

// --- round 11 of the #318 review ----------------------------------------------

test("compareBlankBoxes: a chip under a lingering rename is the component's own loss, not an arrival", function () {
  // The mirror image of round 8's rise. The ledger renames a to b, a still
  // lingers as a measured row, and b renders a bare chip. Reported as a
  // newcomer chip it read as "a new component has no leaf yet, nothing got
  // worse", while the component had in fact gone from 5 boxes of real markup to
  // nothing. It banks (an upstream rename is not fixable here) but it is named.
  var d = R.compareBlankBoxes(
    baseline({ a: 5 }, []),
    measured({ a: 5, b: 0 }, ["b"], [], { a: "b" }),
  );
  assert.deepEqual(d.lingering, [
    { slug: "b", from: 5, to: 0, was: "a", chip: true },
  ]);
  assert.deepEqual(d.newcomerChips, [], "not an arrival");
  assert.deepEqual(d.unlisted, [], "and not an anonymous unlisted row");
  assert.match(
    R.summarizeBank(d).join("\n"),
    /LOST REAL MARKUP, now a bare chip: `b` \(was `a` at 5\)/,
  );
  assert.equal(R.bankable(d).ok, true, "an upstream rename must not halt the intake");
});

test("compareBlankBoxes: a renamed slug whose new name is a chip is worded once, not in two contradictory ways", function () {
  // tabs was built; the ledger renames it to tab-bar; the leaf still answers to
  // tabs, so tab-bar renders a chip. This is both a dropped leaf and a rename,
  // and it used to emit BOTH "the hand-authored leaf no longer applies" AND
  // "the leaf or anatomy still answers to the old name" for the one event.
  var d = R.compareBlankBoxes(
    baseline({}, [], ["tabs"]),
    measured({ "tab-bar": 0 }, ["tab-bar"], ["tabs"], { tabs: "tab-bar" }),
  );
  var text = R.summarizeBank(d);
  // ONE line for the one event. The three routes this reaches summarizeBank by
  // (a retired leaf, a carried-over rename, a rename that could not be carried
  // over) each used to word it separately, so a single component was reported
  // twice in terms that contradicted each other.
  assert.equal(
    text.filter(function (l) {
      return /LOST REAL MARKUP/.test(l);
    }).length,
    1,
    "one loss line per component",
  );
  assert.match(
    text.join("\n"),
    /LOST REAL MARKUP, now a bare chip: `tab-bar` \(was `tabs`, a hand-authored leaf\): the leaf or anatomy still answers to the old name/,
  );
});

// --- round 12 of the #318 review ----------------------------------------------

test("compareBlankBoxes: a chip that was ALREADY a chip under its retired name lost nothing", function () {
  // The lingering-chip row asked only whether the new name is a chip, not
  // whether the retired name had been one, so a chip that was renamed to
  // another chip printed LOST REAL MARKUP into the vendor PR body and turned
  // `clean` false on a night nothing changed. The same-name path always made
  // this check, via baseChips.
  var d = R.compareBlankBoxes(
    baseline({ a: 0 }, ["a"]),
    measured({ a: 0, b: 0 }, ["a", "b"], [], { a: "b" }),
  );
  assert.deepEqual(d.lingering, [
    { slug: "b", from: 0, to: 0, was: "a", chip: false },
  ]);
  assert.doesNotMatch(R.summarizeBank(d).join("\n"), /LOST REAL MARKUP/);
});

test("compareBlankBoxes: when a rename and its leaf's retirement land together, nothing claims the old name still answers", function () {
  // The rename line's parenthetical, and the suppression of the leaf-dropped
  // line, both rest on something still answering to the retired name. When the
  // refresh carries the rename AND retires the leaf, nothing does, and the
  // reader was left one sentence asserting a leaf that is in neither
  // builtSlugs nor perSlug.
  var d = R.compareBlankBoxes(
    baseline({}, [], ["tabs"]),
    measured({ "tab-bar": 0 }, ["tab-bar"], [], { tabs: "tab-bar" }),
  );
  var text = R.summarizeBank(d).join("\n");
  assert.match(text, /LOST REAL MARKUP/, "the loss must still be named");
  assert.doesNotMatch(
    text,
    /still answers to the old name/,
    "nothing answers to the old name in this refresh",
  );
});

test("compareBlankBoxes: a lingering rename that still renders real markup is named as a rename, not as a newcomer", function () {
  var d = R.compareBlankBoxes(
    baseline({ a: 9 }, []),
    measured({ a: 9, b: 3 }, [], [], { a: "b" }),
  );
  assert.deepEqual(d.unlisted, []);
  assert.match(
    R.summarizeBank(d).join("\n"),
    /Renamed, NOT carried over because the retired name is still measured: `b` \(was `a`, 9 to 3\)/,
  );
});

// --- round 13 of the #318 review ----------------------------------------------

test("compareBlankBoxes: an ordinary rename onto a name with no leaf reports the loss and its counts", function () {
  // The commonest shape of "real markup became a bare chip", and the only one
  // that used to report neither. The old name leaves the vocabulary, the new
  // name has no leaf and no anatomy doc. The same-name path suppresses the fall
  // as a demotion, `newChips` excludes a renamed slug, and `lingering` and
  // `leafDropped` are both empty, so the 5-to-0 fall appeared NOWHERE and the
  // one line a reader got in the auto-merged PR body read as a routine rename.
  var d = R.compareBlankBoxes(
    baseline({ a: 5 }, []),
    measured({ b: 0 }, ["b"], [], { a: "b" }),
  );
  assert.deepEqual(d.improvements, [], "a fall to a chip is not an improvement");
  assert.deepEqual(d.newChips, []);
  assert.match(
    R.summarizeBank(d).join("\n"),
    /LOST REAL MARKUP, now a bare chip: `b` \(was `a` at 5\)/,
    "the loss and the count it fell from must both be named",
  );
});

test("compareBlankBoxes: however many routes one loss arrives by, it is reported once", function () {
  // A retired leaf, a carried-over rename and a rename that could not be
  // carried over are three routes to summarizeBank, and a single component can
  // travel more than one at a time. Worded independently they printed two LOST
  // REAL MARKUP lines about one component, in terms that contradicted.
  [
    [baseline({ a: 5 }, []), measured({ b: 0 }, ["b"], [], { a: "b" })],
    [baseline({ a: 5 }, []), measured({ a: 5, b: 0 }, ["b"], [], { a: "b" })],
    [
      baseline({}, [], ["tabs"]),
      measured({ "tab-bar": 0 }, ["tab-bar"], [], { tabs: "tab-bar" }),
    ],
    [
      baseline({}, [], ["tabs"]),
      measured({ "tab-bar": 0 }, ["tab-bar"], ["tabs"], { tabs: "tab-bar" }),
    ],
  ].forEach(function (pair, i) {
    var lines = R.summarizeBank(R.compareBlankBoxes(pair[0], pair[1]));
    assert.equal(
      lines.filter(function (l) {
        return /LOST REAL MARKUP/.test(l);
      }).length,
      1,
      "shape " + i + " must report the loss exactly once",
    );
  });
});
