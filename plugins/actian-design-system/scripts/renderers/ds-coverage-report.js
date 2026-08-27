#!/usr/bin/env node
"use strict";
var fs = require("fs");
var path = require("path");
var { loadAnatomy, passesRatioGate } =
  require("../lib/renderer.js").anatomyRender;
var { isRenderable, countBlankBoxes } = require(
  path.join(__dirname, "renderability.js"),
);
// ds-html-map.js and ds-anatomy-map.js are required LAZILY inside
// measureBlankBoxes(), not at module level. coverage() is the light path (it
// only reads anatomy docs), and render-authoring-table.js imports this module
// for coverage() alone: hoisting the render stack to load time would make that
// tool pull in the whole renderer for nothing. The CommonJS module cache makes
// the in-function require free after the first call.

// Strict mode (no opts): a missing/non-numeric ratio FAILS the gate here,
// matching passesRatioGate's own strict default; see its doc comment in
// anatomy-render.js for how this diverges from buildDsAnatomyDocMap's R2
// floor (ds-anatomy-map.js), which intentionally keeps missing-ratio docs.
function coverage(slugs, opts) {
  opts = opts || {};
  var minRatio = typeof opts.minRatio === "number" ? opts.minRatio : 0.6;
  var built = {};
  (opts.builtSlugs || []).forEach(function (s) {
    built[s] = true;
  });
  return (slugs || []).map(function (slug) {
    // An override does not consult the anatomy doc at all, so a renderability
    // verdict is meaningless for it: report null, not false.
    if (built[slug])
      return {
        slug: slug,
        tier: "override",
        ratio: null,
        renderable: null,
        why: "",
      };
    var spec = loadAnatomy(slug, opts.anatomyLoader);
    if (!spec || !spec.root)
      return {
        slug: slug,
        tier: "chip",
        ratio: null,
        renderable: false,
        why: "no anatomy doc",
      };
    var ratio =
      spec.quality && typeof spec.quality.ratio === "number"
        ? spec.quality.ratio
        : null;
    // tier still reflects what the RENDERER actually does today (the R2 ratio
    // floor). renderable reflects the TRUTH. Reporting both side by side is
    // the whole point: where they disagree, the floor is faking it.
    var tier = passesRatioGate(ratio, minRatio) ? "anatomy" : "degraded";
    var verdict = isRenderable(spec);
    return {
      slug: slug,
      tier: tier,
      ratio: ratio,
      renderable: verdict.ok,
      why: verdict.why,
    };
  });
}

// Parse authorable slugs from the markdown table in ds-components-authoring.md.
// This is the SINGLE parse of that table. Both the CLI report below and the CI
// budget gate (tests/renderers/blank-box-budget.test.js) call this function,
// so the two can never silently disagree on which slugs count as authorable.
function authorableSlugs() {
  var mdPath = path.resolve(
    __dirname,
    "..",
    "..",
    "references",
    "generate-flow",
    "ds-components-authoring.md",
  );
  var mdContent = fs.readFileSync(mdPath, "utf8");
  var slugs = [];
  mdContent.split("\n").forEach(function (line) {
    var m = line.match(/^\|\s*`([^`]+)`/);
    // Once each: the file names most slugs in two tables (plugin #319).
    if (m && slugs.indexOf(m[1]) === -1) slugs.push(m[1]);
  });
  return slugs;
}

// Exported so the CI gate (tests/renderers/blank-box-budget.test.js) measures
// the SAME thing this report prints, by construction rather than by
// coincidence. Two independent measurers would be free to drift, and the gate
// would then guard a number nobody is looking at.
//
// Renders every authorable slug through the REAL seam (the same doc map
// assemble-flow-share builds) and counts the empty grey placeholder boxes it
// emits. This is the number a PM actually sees on a generated flow.
// The chip's root element, after any leading whitespace or comment, with
// ds-component among its class tokens.
var CHIP_ROOT =
  /^(?:\s|<!--[\s\S]*?-->)*<[a-z][^>]*\bclass="(?:[^"]*\s)?ds-component(?:\s[^"]*)?"/;

function measureBlankBoxes(opts) {
  opts = opts || {};
  var renderer = require("../lib/renderer.js");
  var dsMap = renderer.dsHtmlMap;
  var buildDsAnatomyDocMap = renderer.dsAnatomyMap.buildDsAnatomyDocMap;
  var slugs = opts.slugs || authorableSlugs();
  var render =
    opts.render ||
    function (slug) {
      return dsMap.renderDSComponent({
        dsSlug: slug,
        library: "ds",
        props: {},
        variant: "",
      });
    };
  // A positive control on the one input the record cannot re-derive. An empty
  // or missing export is not "nothing is built": it would skip no slug, measure
  // every built one for the first time, and bank a record whose builtSlugs is
  // `[]`. That record still HAS the field, so the fail-closed path in
  // compareBlankBoxes (which triggers on a missing field) would not catch it.
  // Refusing here is the only place the difference is still visible.
  if (!Array.isArray(dsMap.BUILT_SLUGS) || !dsMap.BUILT_SLUGS.length) {
    throw new Error(
      "the vendored renderer exports no BUILT_SLUGS (" +
        (Array.isArray(dsMap.BUILT_SLUGS)
          ? "empty array"
          : typeof dsMap.BUILT_SLUGS) +
        "), so every built slug would be measured as if it had never been built; " +
        "refusing to measure against it. Check the vendored snapshot.",
    );
  }
  var built = {};
  dsMap.BUILT_SLUGS.forEach(function (s) {
    built[s] = true;
  });

  var total = 0;
  var perSlug = {};
  var anyAnatomy = false;
  var chipSlugs = [];
  var warnings = [];

  dsMap.setAnatomyDocMap(buildDsAnatomyDocMap(slugs, {}));
  try {
    slugs.forEach(function (slug) {
      if (built[slug]) return;
      var html = "";
      var nothing = false;
      try {
        var raw = render(slug);
        if (typeof raw !== "string" || !raw) nothing = true;
        else html = raw;
      } catch (e) {
        nothing = true;
      }
      if (html.indexOf('data-ds-slug="') !== -1) anyAnatomy = true;
      // A render that produced nothing (empty, not a string, or thrown)
      // rendered nothing real, which is what a chip is; recorded as a real
      // render at zero boxes it would be refused as a demotion the night it
      // chips. A chip is recognised by its ROOT element: real markup can nest
      // a chip for an unmapped child without being one itself.
      if (nothing || CHIP_ROOT.test(html)) chipSlugs.push(slug);
      var n = countBlankBoxes(html);
      perSlug[slug] = n;
      total += n;
    });
  } finally {
    // Reset module-level state so it never leaks into a later assembly, same
    // convention as assemble-flow-share.js's render loop.
    dsMap.setAnatomyDocMap(null);
  }

  return {
    slugs: slugs,
    total: total,
    perSlug: perSlug,
    chipSlugs: chipSlugs,
    // Built slugs are skipped above, so they have no perSlug row. The baseline
    // records them anyway: it is the only way a later comparison can tell a
    // slug whose leaf was removed (a demotion) from a slug it never saw (a
    // newcomer). See compareBlankBoxes.
    //
    // Scoped to the slugs measured, so the record and the rows describe the
    // same vocabulary. Listed once each: the vocabulary names most slugs twice.
    // What this record cannot show: a leaf keyed to a slug the registry has
    // renamed stays in the vocabulary, because authorableSlugs() also reads the
    // built-leaf props table, which is keyed on the leaves themselves.
    builtSlugs: Object.keys(built).filter(function (slug) {
      return slugs.indexOf(slug) !== -1;
    }),
    // Retired slug -> current slug, from the vendored identity ledger, so the
    // comparison reads a rename instead of guessing at one.
    renames: renameIndex(null, function (line) {
      warnings.push(line);
    }),
    warnings: warnings,
    anyAnatomy: anyAnatomy,
  };
}

// Retired slug -> current slug from the vendored identity ledger. `pathsLike`
// and `note` are injectable so the failure paths can be driven without
// touching the vendored files; the defaults are the real ones.
function renameIndex(pathsLike, note) {
  var PATHS = pathsLike || require("../lib/paths.js");
  var say = note || function () {};
  // BLANK_BOX_LEDGER points the read elsewhere, so a test that drives the
  // command never edits the vendored ledger in place. An injected paths object
  // is explicit and wins over the environment.
  var ledgerPath =
    !pathsLike && process.env.BLANK_BOX_LEDGER
      ? path.resolve(process.env.BLANK_BOX_LEDGER)
      : PATHS.components && PATHS.components.identity;
  // No ledger means no rename is known tonight, and the run says so. A ledger
  // that is there and does not parse is not "no renames": reading it as such
  // would turn every known rename into a departure plus a newcomer chip, so
  // it fails closed.
  if (!ledgerPath) {
    say(
      "Rename index unavailable (the manifest names no identity ledger), so no rename was applied tonight",
    );
    return {};
  }
  if (!fs.existsSync(ledgerPath)) {
    say(
      "Rename index unavailable (no identity ledger at " +
        ledgerPath +
        "), so no rename was applied tonight",
    );
    return {};
  }
  var ledger;
  try {
    ledger = JSON.parse(fs.readFileSync(ledgerPath, "utf8"));
  } catch (e) {
    throw new Error(
      "the vendored identity ledger at " +
        ledgerPath +
        " does not parse (" +
        e.message +
        ")",
    );
  }
  // The reader is the substrate's own, re-exported by paths.js from the
  // vendored client. If a snapshot stops shipping it, renames are not applied
  // and the run says so; halting the intake over a missing helper would be
  // the #318 outage by another route.
  if (typeof PATHS.buildRenameIndex !== "function") {
    say(
      "Rename index unavailable (the vendored client exports no buildRenameIndex), so no rename was applied tonight",
    );
    return {};
  }
  return PATHS.buildRenameIndex(ledger);
}

// Compare a measurement against the committed baseline record.
//
// The rule is exact equality, not a ceiling. The two literal ceilings this
// replaces (BUDGET = 136, CHIP_BUDGET = 4, both dated 2026-07-13) were never
// ratcheted, so by 2026-08-11 they allowed 136 boxes against an actual 45: the
// gate would have passed a tripling of the output, and the programme's real
// progress was invisible inside it. Equality against a generated per-slug
// record cannot drift that way, and it turns a regression into a reviewable
// diff line (25 became 30) instead of a total creeping by one.
//
// Every difference is classified rather than merely counted, because
// "the number moved" is the advice that launders a regression: an improvement
// and a regression need opposite responses, and a rename needs a third one.
// A rename the ledger knows is applied to the BASELINE before anything is
// compared: the row, the chip status and the built status move to the new
// name. After that one set of rules compares name to name, so a rename needs
// no rule of its own (a chip that stayed a chip is nothing, a chip that gained
// anatomy is a promotion, a rise is a regression, a chip where there was real
// markup is a demotion, each under the new name). It is applied even when the
// old name lingers in the measurement: a retired slug can only linger through
// a leaf keyed on it (plugin #319), and then every generated flow uses the new
// name, so what renders under the new name is what the component renders. It
// is not applied when the baseline already carries the new name as a row of
// its own, when the old name is still measured tonight, or when two retired
// names claim one current slug.
function applyRenames(baselineRecord, measured) {
  var record = {
    perSlug: Object.assign(
      {},
      (baselineRecord && baselineRecord.perSlug) || {},
    ),
    chipSlugs: ((baselineRecord && baselineRecord.chipSlugs) || []).slice(),
    builtSlugs: Array.isArray(baselineRecord && baselineRecord.builtSlugs)
      ? baselineRecord.builtSlugs.slice()
      : null,
  };
  var renames = (measured && measured.renames) || {};
  var renamed = [];
  function has(rec, slug) {
    return (
      Object.prototype.hasOwnProperty.call(rec.perSlug, slug) ||
      (rec.builtSlugs || []).indexOf(slug) !== -1
    );
  }
  var now = (measured && measured.perSlug) || {};
  var nowBuilt = (measured && measured.builtSlugs) || [];
  function measuredTonight(slug) {
    return Object.prototype.hasOwnProperty.call(now, slug);
  }
  // What the ledger would do with one retired name, decided against the record
  // as it stands before anything is carried over. Pure on purpose: it is read
  // once per name into a plan, so no decision can depend on a carry-over an
  // earlier key happened to make.
  //
  // "apply": the baseline knows the old name and not the new one, and the new
  // name exists tonight (measured or built), so the row moves.
  // "linger": the old name is ALSO still measured tonight (a stale vocabulary
  // row, plugin #319). Carrying over would double the counts under two names,
  // so the row stays put and the new name is read against it.
  function classify(was, is) {
    if (!has(record, was) || has(record, is)) return "no";
    if (!measuredTonight(is) && nowBuilt.indexOf(is) === -1) return "no";
    if (measuredTonight(was)) {
      return Object.prototype.hasOwnProperty.call(record.perSlug, was)
        ? "linger"
        : "no";
    }
    return "apply";
  }
  var plan = [];
  Object.keys(renames).forEach(function (was) {
    var verdict = classify(was, renames[was]);
    if (verdict !== "no")
      plan.push({ from: was, to: renames[was], verdict: verdict });
  });
  // Two retired names the baseline knows that resolve to one current slug
  // cannot both be it; taking whichever the ledger lists first would make the
  // verdict depend on key order, and the ledger lists them in `previousSlugs`
  // order, which is just the order a component was renamed in.
  //
  // Ambiguity is counted PER CLASS, because the two classes say opposite things
  // about the old name. A name still measured tonight is not a rival claimant:
  // it is still there under its own name, so it cannot also BE the new one, and
  // a single applicable rename alongside it still applies. But two names that
  // both LINGER toward one slug leave no way to say whose row that slug's count
  // belongs to, and taking whichever the ledger listed last made the same night
  // bank or halt depending on `previousSlugs` order (plugin #318 review). Then
  // the slug is simply a newcomer, which is the non-halting reading and the
  // only one that does not depend on the order.
  var applyClaims = Object.create(null);
  var lingerClaims = Object.create(null);
  plan.forEach(function (p) {
    var tally = p.verdict === "apply" ? applyClaims : lingerClaims;
    tally[p.to] = (tally[p.to] || 0) + 1;
  });
  var lingering = [];
  plan.forEach(function (p) {
    if (p.verdict === "linger") {
      if (lingerClaims[p.to] > 1) return;
      lingering.push({ from: p.from, to: p.to });
      return;
    }
    if (applyClaims[p.to] > 1) return;
    if (Object.prototype.hasOwnProperty.call(record.perSlug, p.from)) {
      record.perSlug[p.to] = record.perSlug[p.from];
      delete record.perSlug[p.from];
    }
    record.chipSlugs = record.chipSlugs.map(function (s) {
      return s === p.from ? p.to : s;
    });
    if (record.builtSlugs) {
      record.builtSlugs = record.builtSlugs.map(function (s) {
        return s === p.from ? p.to : s;
      });
    }
    renamed.push({ from: p.from, to: p.to });
  });
  return { record: record, renamed: renamed, lingering: lingering };
}

function compareBlankBoxes(baselineRecord, measured) {
  var applied = applyRenames(baselineRecord, measured);
  var baselineNow = applied.record;
  var base = baselineNow.perSlug;
  var now = (measured && measured.perSlug) || {};
  var baseChips = baselineNow.chipSlugs;
  var nowChips = ((measured && measured.chipSlugs) || []).slice();
  // A record with no builtSlugs field predates the record and cannot vouch for
  // any built slug, so it fails closed: every unlisted chip is a demotion, which
  // is what this comparison did before the field existed.
  var hasBuiltRecord = baselineNow.builtSlugs !== null;
  var baseBuilt = baselineNow.builtSlugs || [];
  // A measurement that says nothing about built slugs reports no change in
  // them, rather than that nothing is built.
  var nowBuilt = Array.isArray(measured && measured.builtSlugs)
    ? measured.builtSlugs
    : baseBuilt;
  var renamedTo = applied.renamed.map(function (r) {
    return r.to;
  });
  var linger = Object.create(null);
  (applied.lingering || []).forEach(function (r) {
    linger[r.to] = r.from;
  });
  var renamedFrom = applied.renamed.map(function (r) {
    return r.from;
  });

  var regressions = [];
  var improvements = [];
  var unlisted = [];
  var disappeared = [];
  var chipPromotions = [];
  var leafDropped = [];
  var lingering = [];

  function baselineKnows(slug) {
    return (
      !hasBuiltRecord ||
      Object.prototype.hasOwnProperty.call(base, slug) ||
      baseBuilt.indexOf(slug) !== -1
    );
  }
  // A measured slug that is built now was promoted, not lost.
  var promotedToBuilt = Object.keys(base).filter(function (slug) {
    return nowBuilt.indexOf(slug) !== -1 && baseBuilt.indexOf(slug) === -1;
  });

  Object.keys(base).forEach(function (slug) {
    if (!Object.prototype.hasOwnProperty.call(now, slug)) {
      if (promotedToBuilt.indexOf(slug) === -1) {
        disappeared.push({ slug: slug, from: base[slug] });
      }
      return;
    }
    if (now[slug] > base[slug]) {
      // A slug that WAS a bare chip and is not one any more went from
      // rendering nothing real to rendering something real, so its boxes went
      // up because it started rendering at all. That is a promotion, not a
      // regression.
      if (baseChips.indexOf(slug) !== -1 && nowChips.indexOf(slug) === -1) {
        chipPromotions.push({ slug: slug, from: base[slug], to: now[slug] });
      } else {
        regressions.push({ slug: slug, from: base[slug], to: now[slug] });
      }
    } else if (now[slug] < base[slug]) {
      // A chip emits no boxes, so a slug that demoted to one reads as a fall
      // in its count. That is the demotion below, not an improvement.
      var demoted =
        nowChips.indexOf(slug) !== -1 && baseChips.indexOf(slug) === -1;
      if (!demoted) {
        improvements.push({ slug: slug, from: base[slug], to: now[slug] });
      }
    }
  });
  Object.keys(now).forEach(function (slug) {
    if (Object.prototype.hasOwnProperty.call(base, slug)) return;
    // A slug the baseline recorded as built is measured now, so its leaf no
    // longer applies (removed, or renamed away while the slug stayed) and the
    // generic renderer has taken over. Named as such, never as an anonymous
    // arrival; a chip is the demotion below instead. Everything else measured
    // for the first time is a newcomer.
    if (baseBuilt.indexOf(slug) !== -1) {
      // The leaf arrives through the vendored renderer, so its retirement is
      // a knowledge event: named with its boxes, banked, never a halt.
      //
      // That holds whether or not an anatomy doc catches the fall. A slug with
      // one renders generically; a slug without one reaches gracefulChip and
      // renders a bare chip. Refusing the second was the #318 outage in a
      // narrower form: the plugin authors no leaf, so "fix the renderer" names
      // nothing a maintainer here can change, and the intake would halt every
      // night on an upstream event, gated on whether knowledge happened to ship
      // an anatomy doc for that one slug. It is a real loss either way, so it
      // is named as a loss (`chip`) rather than refused.
      leafDropped.push({
        slug: slug,
        to: now[slug],
        chip: nowChips.indexOf(slug) !== -1,
      });
    } else if (linger[slug] !== undefined) {
      // The old name still lingers as a measured row, so this count is that
      // slug's own: a rise refuses like any same-name rise.
      if (now[slug] > base[linger[slug]]) {
        regressions.push({
          slug: slug,
          from: base[linger[slug]],
          to: now[slug],
        });
      } else {
        // Every other lingering case, including an unchanged count. It is NOT
        // an arrival: the baseline knows this component under the name the
        // ledger retired, so filing it in `unlisted` had the PR body call a
        // component it has measured for weeks a new one. It gets its own row,
        // which also keeps `clean` honest: the record does gain this name.
        lingering.push({
          slug: slug,
          from: base[linger[slug]],
          to: now[slug],
          was: linger[slug],
          chip:
            nowChips.indexOf(slug) !== -1 &&
            baseChips.indexOf(linger[slug]) === -1,
        });
      }
    } else {
      unlisted.push({ slug: slug, to: now[slug] });
    }
  });
  // A built slug that is neither built nor measured any more left both the
  // leaves and the vocabulary: a deletion upstream, or a rename the ledger does
  // not know. Reported so the record cannot shrink without a row saying so.
  var disappearedBuilt = baseBuilt.filter(function (slug) {
    return (
      nowBuilt.indexOf(slug) === -1 &&
      !Object.prototype.hasOwnProperty.call(now, slug)
    );
  });
  // A leaf the baseline never knew: a row, so the record cannot grow without
  // a line. A leaf still answering to a name a rename retired is not new.
  var newlyBuilt = nowBuilt.filter(function (slug) {
    return (
      baseBuilt.indexOf(slug) === -1 &&
      !Object.prototype.hasOwnProperty.call(base, slug) &&
      renamedFrom.indexOf(slug) === -1
    );
  });

  // A chip the baseline had not listed is one of two opposite things. If the
  // baseline knew the slug (a row, a built record, or a rename applied above)
  // it used to render something real and now renders a chip: a demotion,
  // which must be fixed. If the baseline had never seen the slug, it is a
  // newcomer whose leaf has not been written yet: nothing got worse.
  // Reporting the second as the first halted the vendor sync on 2026-08-27
  // (plugin #318) when `dropdown` arrived from knowledge v0.34.155.
  // A chip under a name the ledger carried over is a rename whose leaf or
  // anatomy still answers to the old name: named, never a halt. Only a
  // same-name change refuses.
  var renamedChips = nowChips.filter(function (s) {
    return baseChips.indexOf(s) === -1 && renamedTo.indexOf(s) !== -1;
  });
  // A slug whose hand-authored leaf was retired upstream is the leafDropped row
  // above, whatever it fell back to. It is not a same-name demotion the plugin
  // could fix, so it never reaches the refusal.
  var retiredLeaf = Object.create(null);
  leafDropped.forEach(function (x) {
    retiredLeaf[x.slug] = true;
  });
  var newChips = nowChips.filter(function (s) {
    return (
      baseChips.indexOf(s) === -1 &&
      renamedTo.indexOf(s) === -1 &&
      !retiredLeaf[s] &&
      linger[s] === undefined &&
      baselineKnows(s)
    );
  });
  var newcomerChips = nowChips.filter(function (s) {
    return (
      baseChips.indexOf(s) === -1 &&
      renamedTo.indexOf(s) === -1 &&
      !retiredLeaf[s] &&
      linger[s] === undefined &&
      !baselineKnows(s)
    );
  });
  var retiredChips = baseChips.filter(function (s) {
    return nowChips.indexOf(s) === -1;
  });

  function sum(o) {
    return Object.keys(o).reduce(function (t, k) {
      return t + o[k];
    }, 0);
  }
  var totalFrom = sum(base);
  var totalTo = sum(now);

  var out = {
    regressions: regressions,
    improvements: improvements,
    // Measured for the first time and never built: the newcomers. A chip among
    // them is also in newcomerChips.
    unlisted: unlisted,
    disappeared: disappeared,
    leafDropped: leafDropped,
    disappearedBuilt: disappearedBuilt,
    promotedToBuilt: promotedToBuilt,
    newlyBuilt: newlyBuilt,
    renamed: applied.renamed,
    renamedChips: renamedChips,
    // A name the ledger retired that is STILL measured tonight, so the rename
    // could not be carried over. Each row names the retired name it answers to.
    lingering: lingering,
    // For each carried-over rename, whether the RETIRED name still answers to a
    // built leaf tonight. Only then is "the leaf still answers to the old name"
    // a true sentence about it.
    oldNameStillBuilt: applied.renamed.reduce(function (acc, r) {
      acc[r.to] = nowBuilt.indexOf(r.from) !== -1;
      return acc;
    }, Object.create(null)),
    // The boxes the baseline recorded under the retired name, carried over to
    // the new one, so a rename that lost markup can report the fall.
    renamedFrom: applied.renamed.reduce(function (acc, r) {
      if (Object.prototype.hasOwnProperty.call(base, r.to))
        acc[r.to] = base[r.to];
      return acc;
    }, Object.create(null)),
    newChips: newChips,
    newcomerChips: newcomerChips,
    retiredChips: retiredChips,
    chipPromotions: chipPromotions,
    totalFrom: totalFrom,
    totalTo: totalTo,
    // Reported on its own because it is the one bound that does NOT depend on
    // slug identity: a rename-immune check on the whole count.
    totalRose: totalTo > totalFrom,
    // The ledger resolves a rename by identity; a re-key replaces the identity
    // and leaves no trail (knowledge #587). So when a slug vanished and a
    // newcomer chip arrived in the same refresh with no rename applied, the
    // pair is flagged for a reader: if it is one component re-keyed, the
    // component demoted and nothing refused it.
    possibleRenamedDemotion:
      (disappeared.length > 0 || disappearedBuilt.length > 0) &&
      newcomerChips.length > 0,
    // A record that predates builtSlugs fails closed (every unlisted chip is a
    // demotion), and the refusal says so rather than only "demoted".
    builtRecordMissing: !hasBuiltRecord,
  };
  // Clean means no row of any kind, derived from the rows themselves so a row
  // added later can never be left out of the verdict.
  out.clean = Object.keys(out).every(function (k) {
    return !Array.isArray(out[k]) || out[k].length === 0;
  });
  return out;
}

// Which differences may be written into the baseline, and which must be fixed.
//
// One rule: only a SAME-NAME loss refuses, either a slug emitting more boxes
// than recorded or a slug that rendered real markup under that name and renders
// a bare chip now. The drift failure prints the bank command, so without that
// refusal an author following the instruction would bank a regression riding
// along in the same change.
//
// Same-name is the whole of it. A retired hand-authored leaf is an upstream
// event with no fix in this repo, so it is a named row whichever way the slug
// falls; a rename the ledger carries over is compared under its new name.

function bankable(diff) {
  if (diff.regressions.length) {
    return {
      ok: false,
      why:
        "these slugs regressed and must be fixed, not recorded: " +
        diff.regressions
          .map(function (r) {
            return r.slug + " " + r.from + " -> " + r.to;
          })
          .join(", "),
    };
  }
  if (diff.newChips.length) {
    return {
      ok: false,
      why:
        "these slugs used to render something real and now render a bare chip, " +
        "so this is not a state to record: " +
        diff.newChips.join(", ") +
        (diff.builtRecordMissing
          ? ". The record has no builtSlugs field, so every chip it never listed reads as a demotion; re-bank it from a healthy renderer first"
          : ""),
    };
  }
  // Everything else, a newcomer with or without blank boxes, a dropped leaf,
  // a vanished built slug, a rename, banks. Each is a named row in the diff
  // and in the run summary; silence was the concern, and a refusal here is
  // the #318 outage (the vendor job cannot answer a prompt).
  return { ok: true, why: "" };
}

// What a bank recorded that a reader should still see: each line names the
// slugs of one class. Printed to stdout by --write-baseline and appended to the
// job summary in CI, from this one place.
function summarizeBank(diff) {
  var lines = [];
  function slugs(list, pick) {
    return list
      .map(function (x) {
        return "`" + (pick ? pick(x) : x) + "`";
      })
      .join(", ");
  }
  if (diff.newcomerChips.length) {
    lines.push(
      "New components with no render leaf yet, drawn as a bare chip: " +
        slugs(diff.newcomerChips),
    );
  }
  var lingering = diff.lingering || [];
  var lingeringKept = lingering.filter(function (x) {
    return !x.chip;
  });
  if (lingeringKept.length) {
    lines.push(
      "Renamed, NOT carried over because the retired name is still measured: " +
        lingeringKept
          .map(function (x) {
            return (
              "`" +
              x.slug +
              "` (was `" +
              x.was +
              "`, " +
              x.from +
              " to " +
              x.to +
              ")"
            );
          })
          .join(", "),
    );
  }
  var blankNewcomers = diff.unlisted.filter(function (u) {
    return u.to > 0 && diff.newcomerChips.indexOf(u.slug) === -1;
  });
  if (blankNewcomers.length) {
    lines.push(
      "New components drawn from anatomy with blank boxes: " +
        blankNewcomers
          .map(function (u) {
            return "`" + u.slug + "` (" + u.to + ")";
          })
          .join(", "),
    );
  }
  var cleanNewcomers = diff.unlisted.filter(function (u) {
    return u.to === 0 && diff.newcomerChips.indexOf(u.slug) === -1;
  });
  if (cleanNewcomers.length) {
    lines.push(
      "New components drawn from anatomy cleanly: " +
        slugs(cleanNewcomers, function (u) {
          return u.slug;
        }),
    );
  }
  if (diff.improvements.length) {
    lines.push(
      "Fewer blank boxes: " +
        diff.improvements
          .map(function (x) {
            return "`" + x.slug + "` (" + x.from + " to " + x.to + ")";
          })
          .join(", "),
    );
  }
  if (diff.chipPromotions.length) {
    lines.push(
      "No longer a bare chip, real markup now: " +
        slugs(diff.chipPromotions, function (x) {
          return x.slug;
        }),
    );
  }
  // A chip that is measured tonight and is not a chip any more; one that
  // vanished or was built has its own line.
  var retiredQuietly = diff.retiredChips.filter(function (s) {
    return (
      !diff.chipPromotions.some(function (x) {
        return x.slug === s;
      }) &&
      !diff.disappeared.some(function (x) {
        return x.slug === s;
      }) &&
      diff.promotedToBuilt.indexOf(s) === -1
    );
  });
  if (retiredQuietly.length) {
    lines.push("No longer a bare chip: " + slugs(retiredQuietly));
  }
  // Banked because the plugin authors no leaf and halting the intake over an
  // upstream retirement is the #318 outage. A fall onto an anatomy doc and a
  // fall onto a bare chip are the same event with different damage, so they get
  // different words: the second is a loss and is worded as one.
  // A renamed slug whose new name is a chip is already worded by the "Renamed,
  // carried over" line below, which says the leaf still answers to the old
  // name. Wording it here too produced two lines about one event that
  // contradicted each other: one saying the leaf no longer applies, the other
  // saying it still answers to the old name.
  //
  // That is only true while something DOES still answer to the old name. When
  // the rename and the leaf's retirement land in the same refresh, nothing
  // does, and suppressing this line left the reader one sentence asserting a
  // leaf that is in neither builtSlugs nor perSlug.
  var stillBuilt = diff.oldNameStillBuilt || {};
  var fellToAnatomy = diff.leafDropped.filter(function (x) {
    return !x.chip;
  });
  if (fellToAnatomy.length) {
    lines.push(
      "Hand-authored leaf no longer applies, generic renderer took over: " +
        fellToAnatomy
          .map(function (x) {
            return "`" + x.slug + "` (" + x.to + ")";
          })
          .join(", "),
    );
  }
  if (diff.newlyBuilt.length) {
    lines.push(
      "Built tonight with a hand-authored leaf: " + slugs(diff.newlyBuilt),
    );
  }
  if (diff.disappearedBuilt.length) {
    lines.push(
      "Built components gone from the vocabulary: " +
        slugs(diff.disappearedBuilt),
    );
  }
  if (diff.disappeared.length) {
    lines.push(
      "Measured components gone from the vocabulary: " +
        slugs(diff.disappeared, function (x) {
          return x.slug;
        }),
    );
  }
  if (diff.promotedToBuilt.length) {
    lines.push(
      "Now drawn from a hand-authored leaf: " + slugs(diff.promotedToBuilt),
    );
  }
  // ONE line per component that lost real markup, whatever route it took here.
  //
  // The same event reaches summarizeBank up to three ways at once: a retired
  // leaf that fell to a chip, a carried-over rename whose new name is a chip,
  // and a rename the ledger could not carry over because the retired name is
  // still measured. Wording them independently printed two LOST REAL MARKUP
  // lines about one component, and left the commonest shape of all (an ordinary
  // rename whose new name has no leaf) reported as a routine rename note with
  // no counts at all: the same-name path suppresses that fall as a demotion and
  // newChips excludes a renamed slug, so it appeared nowhere.
  //
  // Keyed by slug so one component is named once, with the most specific cause
  // that applies.
  var lost = Object.create(null);
  function loseIt(slug, was, from, why) {
    if (lost[slug]) return;
    lost[slug] = { slug: slug, was: was, from: from, why: why };
  }
  diff.renamed.forEach(function (r) {
    if (diff.renamedChips.indexOf(r.to) === -1) return;
    var from =
      diff.renamedFrom && diff.renamedFrom[r.to] !== undefined
        ? diff.renamedFrom[r.to]
        : null;
    var leafGone = diff.leafDropped.some(function (x) {
      return x.slug === r.to && x.chip;
    });
    // Order matters: while the retired name is STILL built, a leaf does exist,
    // it just answers to the old name, which is exactly why the new name draws
    // a chip. Reading that as "the leaf no longer applies" states the opposite
    // of what the record shows.
    loseIt(
      r.to,
      r.from,
      from,
      stillBuilt[r.to]
        ? "the leaf or anatomy still answers to the old name"
        : leafGone
          ? "its hand-authored leaf no longer applies and no anatomy doc caught the fall"
          : "it has no leaf and no anatomy doc under the new name",
    );
  });
  lingering.forEach(function (x) {
    if (!x.chip) return;
    loseIt(
      x.slug,
      x.was,
      x.from,
      "the retired name is still measured, so this is the component's own loss, not an arrival",
    );
  });
  diff.leafDropped.forEach(function (x) {
    if (!x.chip) return;
    loseIt(
      x.slug,
      null,
      null,
      "its hand-authored leaf no longer applies and no anatomy doc caught the fall",
    );
  });
  var lostRows = Object.keys(lost).map(function (k) {
    return lost[k];
  });
  if (lostRows.length) {
    lines.push(
      "LOST REAL MARKUP, now a bare chip: " +
        lostRows
          .map(function (x) {
            var name = "`" + x.slug + "`";
            if (x.was) name += " (was `" + x.was + "`";
            if (x.was && x.from !== null) name += " at " + x.from;
            else if (x.was) name += ", a hand-authored leaf";
            if (x.was) name += ")";
            return name + ": " + x.why;
          })
          .join("; "),
    );
  }
  var renamedKept = diff.renamed.filter(function (r) {
    return diff.renamedChips.indexOf(r.to) === -1;
  });
  if (renamedKept.length) {
    lines.push(
      "Renamed, carried over: " +
        renamedKept
          .map(function (r) {
            return "`" + r.from + "` is now `" + r.to + "`";
          })
          .join(", "),
    );
  }
  if (diff.possibleRenamedDemotion) {
    var gone = diff.disappeared
      .map(function (x) {
        return x.slug;
      })
      .concat(diff.disappearedBuilt);
    lines.push(
      "Check a re-key: " +
        slugs(gone) +
        " vanished while " +
        slugs(diff.newcomerChips) +
        " arrived as a bare chip in the same refresh with no rename recorded; if that is one component re-keyed, it demoted",
    );
  }
  return lines;
}

module.exports = {
  coverage: coverage,
  summarizeBank: summarizeBank,
  renameIndex: renameIndex,
  authorableSlugs: authorableSlugs,
  measureBlankBoxes: measureBlankBoxes,
  compareBlankBoxes: compareBlankBoxes,
  bankable: bankable,
};

if (require.main === module) {
  // Same lazy require as measureBlankBoxes(): the render stack is only needed
  // when this file runs as a CLI, never when it is imported for coverage().
  var BUILT_SLUGS = require("../lib/renderer.js").dsHtmlMap.BUILT_SLUGS;

  // `--write-baseline` records what the renderer emits right now, which is how
  // an improvement is banked. The gate compares against this file, so the file
  // is the only place the number lives: nothing restates it in a test.
  if (process.argv.indexOf("--write-baseline") !== -1) {
    var fsW = require("fs");
    var pathW = require("path");
    // Every refusal fails the job before any PR exists, so each one reaches
    // the run summary as well as stderr.
    function refuse(why) {
      process.stderr.write("REFUSING to write the baseline: " + why + "\n");
      if (process.env.GITHUB_STEP_SUMMARY) {
        fsW.appendFileSync(
          process.env.GITHUB_STEP_SUMMARY,
          "**Bank refused:** " + why + "\n",
        );
      }
      process.exit(1);
    }
    var m;
    try {
      m = measureBlankBoxes();
    } catch (e) {
      refuse(e.message);
    }
    // BLANK_BOX_BASELINE points the read and the write elsewhere, so a test
    // that drives this command never touches the committed record.
    var out = process.env.BLANK_BOX_BASELINE
      ? pathW.resolve(process.env.BLANK_BOX_BASELINE)
      : pathW.resolve(
          __dirname,
          "..",
          "..",
          "tests",
          "renderers",
          "blank-box-baseline.json",
        );

    // REFUSE to bank a regression.
    //
    // The gate's failure messages print this command, so without a refusal an
    // author following that instruction would write any regression or chip
    // demotion riding along in the same change into the record as the new
    // truth. The hand-edited ceilings this replaced could not be raised
    // silently: someone had to type a bigger number. A review found that
    // banking freely gave back exactly the laundering path the change removed.
    // No record yet is a first bank. A record that cannot be parsed is not:
    // overwriting it would make the bank an unconditional write with exit 0,
    // which is the laundering the refusal below exists to prevent.
    var current = null;
    if (fsW.existsSync(out)) {
      try {
        current = JSON.parse(fsW.readFileSync(out, "utf8"));
      } catch (e) {
        refuse(
          out +
            " exists but does not parse as JSON (" +
            e.message +
            "). Fix or remove the record by hand.",
        );
      }
    }
    var notes = [];
    if (current) {
      var diff = compareBlankBoxes(current, m);
      notes = summarizeBank(diff);
      var verdict = bankable(diff);
      if (!verdict.ok) {
        refuse(
          verdict.why +
            "\n\nFix the renderer. Recording this would make the regression the " +
            "new normal, which is what the pinned ceilings could not do quietly either.",
        );
      }
    }
    notes = notes.concat(
      (m.warnings || []).map(function (w) {
        return "Not applied tonight: " + w;
      }),
    );
    var ordered = {};
    Object.keys(m.perSlug)
      .sort()
      .forEach(function (k) {
        ordered[k] = m.perSlug[k];
      });
    fsW.writeFileSync(
      out,
      JSON.stringify(
        {
          _meta: {
            auto_generated: true,
            source: "scripts/renderers/ds-coverage-report.js --write-baseline",
            do_not_edit:
              "Regenerate with `node scripts/renderers/ds-coverage-report.js --write-baseline`. Hand-editing this file is how the old pinned ceilings went stale.",
          },
          total: m.total,
          perSlug: ordered,
          chipSlugs: m.chipSlugs.slice().sort(),
          builtSlugs: m.builtSlugs.slice().sort(),
        },
        null,
        2,
      ) + "\n",
    );
    process.stdout.write(
      "wrote " +
        out +
        ": " +
        m.total +
        " blank boxes across " +
        Object.keys(m.perSlug).length +
        " unbuilt slugs, " +
        m.chipSlugs.length +
        " chip(s)\n" +
        notes
          .map(function (n) {
            return n + "\n";
          })
          .join(""),
    );
    // The vendor job rewrites the baseline before the tests run, so nothing
    // banked here ever reaches a failing assertion; the run's summary is the
    // one place a reader sees it without opening the log.
    if (notes.length) {
      var bullets = notes
        .map(function (n) {
          return "- " + n + "\n";
        })
        .join("");
      if (process.env.GITHUB_STEP_SUMMARY) {
        fsW.appendFileSync(
          process.env.GITHUB_STEP_SUMMARY,
          "**Banked, worth a look:**\n" + bullets,
        );
      }
      // The vendor PR body reads this output, so what was banked reaches the
      // one page a reader opens.
      if (process.env.GITHUB_OUTPUT) {
        fsW.appendFileSync(
          process.env.GITHUB_OUTPUT,
          "notes<<BANK_NOTES\n**Banked, worth a look:**\n" +
            bullets +
            "BANK_NOTES\n",
        );
      }
    }
    process.exit(0);
  }

  var slugs = authorableSlugs();
  var rows = coverage(slugs, { builtSlugs: BUILT_SLUGS });
  var measured;
  try {
    measured = measureBlankBoxes({ slugs: slugs });
  } catch (e) {
    process.stderr.write("ds-coverage-report: " + e.message + "\n");
    process.exit(1);
  }
  var blanks = measured.perSlug;
  var blankTotal = measured.total;

  // Print table
  var col1 = Math.max(
    "slug".length,
    rows.length
      ? Math.max.apply(
          null,
          rows.map(function (r) {
            return r.slug.length;
          }),
        )
      : "slug".length,
  );
  var col2 = 8; // "degraded".length

  function pad(s, n) {
    return (
      String(s == null ? "" : s) +
      " ".repeat(Math.max(0, n - String(s == null ? "" : s).length))
    );
  }

  console.log(
    pad("slug", col1) +
      "  " +
      pad("tier", col2) +
      "  " +
      pad("ratio", 6) +
      "  " +
      pad("renders?", 9) +
      "  " +
      pad("blanks", 6) +
      "  why",
  );
  console.log(
    "-".repeat(col1) +
      "  " +
      "-".repeat(col2) +
      "  " +
      "-".repeat(6) +
      "  " +
      "-".repeat(9) +
      "  " +
      "-".repeat(6) +
      "  ---",
  );
  rows.forEach(function (r) {
    var ratioStr = r.ratio != null ? r.ratio.toFixed(2) : "—";
    var rend = r.renderable == null ? "—" : r.renderable ? "yes" : "NO";
    console.log(
      pad(r.slug, col1) +
        "  " +
        pad(r.tier, col2) +
        "  " +
        pad(ratioStr, 6) +
        "  " +
        pad(rend, 9) +
        "  " +
        pad(String(blanks[r.slug] || 0), 6) +
        "  " +
        (r.why || ""),
    );
  });

  // Counts summary
  var counts = { override: 0, anatomy: 0, degraded: 0, chip: 0 };
  rows.forEach(function (r) {
    if (counts[r.tier] != null) counts[r.tier]++;
  });
  console.log("\n--- Counts ---");
  console.log("override: " + counts.override);
  console.log("anatomy:  " + counts.anatomy);
  console.log("degraded: " + counts.degraded);
  console.log("chip:     " + counts.chip);
  console.log("total:    " + rows.length);

  var fakingIt = rows.filter(function (r) {
    return r.tier === "anatomy" && r.renderable === false;
  }).length;
  console.log("\n--- Fidelity ---");
  console.log("BLANK BOXES (total):      " + blankTotal);
  console.log(
    "slugs emitting blanks:    " +
      rows.filter(function (r) {
        return (blanks[r.slug] || 0) > 0;
      }).length,
  );
  console.log(
    "anatomy-tier but NOT renderable (the floor is faking these): " + fakingIt,
  );
}
