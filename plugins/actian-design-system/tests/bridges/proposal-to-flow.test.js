"use strict";
var { describe, it, after } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");
var { compose, placeOrder } = require("../../scripts/bridges/proposal-to-flow.js");

var ROOT = path.resolve(__dirname, "..", "..");
var FIXTURE = path.join(ROOT, "tests", "fixtures", "proposal-dip-i-496.json");
function load() { return JSON.parse(fs.readFileSync(FIXTURE, "utf8")); }
function flat(data) { var d = data || load(); delete d.breadboard; return d; }
function sev(findings, s) { return findings.filter(function (f) { return f.severity === s; }); }
function named(screens, name) { return screens.filter(function (s) { return s.name === name; })[0]; }

var MENU = "Explorer catalog, account menu open";
var FORM = "Administration, create a group";

describe("proposal-to-flow: what the picks imply", function () {
  it("composes every pick into two screens, because three picks land on two surfaces", function () {
    var out = compose(flat(), {});
    assert.deepStrictEqual(out.screens.map(function (s) { return s.name; }), [MENU, FORM]);
    assert.deepStrictEqual(sev(out.findings, "P0"), []);
  });

  it("carries every note onto the screen it landed on, attributed when there is more than one", function () {
    var out = compose(flat(), {});
    var menu = named(out.screens, MENU);
    assert.ok(menu.note.indexOf("How does a user see which group they belong to?") !== -1, menu.note);
    assert.ok(menu.note.indexOf("What shows when access differs between catalogs?") !== -1, menu.note);
    assert.ok(menu.note.indexOf("one pill per group under the email") !== -1, menu.note);
    assert.ok(menu.note.indexOf("followed by the catalogs it covers") !== -1, menu.note);

    var form = named(out.screens, FORM);
    assert.strictEqual(form.note, "The group form gains an optional Display name under Name.",
      "one note, so no question prefix: it would be noise");
  });

  it("does not prefix two notes that land on one screen from the same decision", function () {
    var d = {
      meta: { stage: "proposal" },
      answer: "x",
      decisions: [
        {
          id: "d1",
          question: "Q1?",
          pick: { optionId: "o1" },
          options: [
            {
              id: "o1",
              anchor: {},
              screens: [
                { name: "Screen", template: "overlay", app: "explorer", entity: null, note: "note A" },
                { name: "Screen", template: "overlay", app: "explorer", entity: null, note: "note B" },
              ],
            },
          ],
        },
      ],
    };
    var out = compose(d, {});
    assert.strictEqual(out.screens.length, 1);
    assert.strictEqual(out.screens[0].note, "note A note B",
      "one decision, so no question prefix even though the screen carries two notes");
  });

  it("emits the app as template (the chrome name) and keeps the archetype separately", function () {
    var out = compose(flat(), {});
    var menu = named(out.screens, MENU);
    assert.strictEqual(menu.template, "explorer", "template is the chrome name /generate-flow reads");
    assert.strictEqual(menu.archetype, "overlay", "the proposal's archetype is kept, not dropped");
    assert.strictEqual(menu.app, "explorer");
    assert.strictEqual(menu.entity, null);

    var form = named(out.screens, FORM);
    assert.strictEqual(form.template, "administration");
    assert.strictEqual(form.archetype, "form-create");
    assert.strictEqual(form.app, "administration");
    assert.strictEqual(form.entity, "user-group");
  });
});

describe("proposal-to-flow: selection", function () {
  it("--decision draws that decision's pick alone", function () {
    var out = compose(flat(), { decision: "where-the-readable-name-comes-from" });
    assert.deepStrictEqual(out.screens.map(function (s) { return s.name; }), [FORM]);
    assert.deepStrictEqual(sev(out.findings, "P0"), []);
  });

  it("the two explorer decisions each produce the same screen name with a different note", function () {
    var a = compose(flat(), { decision: "how-a-user-sees-their-group" }).screens;
    var b = compose(flat(), { decision: "access-scoped-per-catalog" }).screens;
    assert.deepStrictEqual(a.map(function (s) { return s.name; }), [MENU]);
    assert.deepStrictEqual(b.map(function (s) { return s.name; }), [MENU]);
    assert.notStrictEqual(a[0].note, b[0].note);
  });

  it("--option draws a rejected option, and the note is how you can tell", function () {
    var pick = compose(flat(), { decision: "how-a-user-sees-their-group" }).screens[0];
    var out = compose(flat(), { decision: "how-a-user-sees-their-group", option: "c" });
    assert.deepStrictEqual(sev(out.findings, "P0"), []);
    assert.ok(out.screens[0].note.indexOf("My access row") !== -1, out.screens[0].note);
    assert.notStrictEqual(out.screens[0].note, pick.note);
  });

  it("P0s a --decision that names no decision, an --option that names none, and --option alone", function () {
    var a = compose(flat(), { decision: "no-such-decision" });
    assert.strictEqual(sev(a.findings, "P0").length, 1, JSON.stringify(a.findings));
    assert.deepStrictEqual(a.screens, []);
    assert.ok(a.findings[0].suggestion.indexOf("how-a-user-sees-their-group") !== -1, a.findings[0].suggestion);

    var b = compose(flat(), { decision: "how-a-user-sees-their-group", option: "zzz" });
    assert.strictEqual(sev(b.findings, "P0").length, 1, JSON.stringify(b.findings));
    assert.ok(b.findings[0].suggestion.indexOf("a, b, c") !== -1, b.findings[0].suggestion);

    var c = compose(flat(), { option: "b" });
    assert.strictEqual(sev(c.findings, "P0").length, 1, JSON.stringify(c.findings));
    assert.ok(c.findings[0].value.indexOf("without naming its decision") !== -1, c.findings[0].value);
  });

  it("P1s a picked option that draws no screens", function () {
    var d = flat();
    d.decisions[1].options.forEach(function (o) { if (o.id === "optional-display-name") o.screens = []; });
    var out = compose(d, {});
    var p1 = sev(out.findings, "P1");
    assert.strictEqual(p1.length, 1, JSON.stringify(out.findings));
    assert.strictEqual(p1[0].check, "screens");
    assert.deepStrictEqual(out.screens.map(function (s) { return s.name; }), [MENU],
      "the other two picks still build");
  });

  it("P0s a composed seed that draws no screens at all, instead of seeding nothing quietly", function () {
    var d = flat();
    d.decisions.forEach(function (dec) {
      dec.options.forEach(function (o) { o.screens = []; });
    });
    var out = compose(d, {});
    var p0 = sev(out.findings, "P0").filter(function (f) { return f.check === "screens"; });
    assert.strictEqual(p0.length, 1, JSON.stringify(out.findings));
    assert.deepStrictEqual(out.screens, []);
    assert.strictEqual(out.brief, "");
  });
});

describe("proposal-to-flow: what it refuses", function () {
  it("refuses an evaluation in one finding, and names the resume", function () {
    var d = flat();
    d.meta.stage = "evaluation";
    var out = compose(d, {});
    assert.strictEqual(out.findings.length, 1, JSON.stringify(out.findings));
    assert.strictEqual(out.findings[0].severity, "P0");
    assert.strictEqual(out.findings[0].check, "stage");
    assert.ok(out.findings[0].suggestion.indexOf("--from") !== -1, out.findings[0].suggestion);
    assert.deepStrictEqual(out.screens, []);
    assert.strictEqual(out.brief, "");
  });

  it("P0s two picks that name one screen with different templates, and names both decisions", function () {
    var d = flat();
    d.decisions[2].options.forEach(function (o) {
      if (o.id === "group-with-catalog") o.screens[0].template = "detail-view";
    });
    var out = compose(d, {});
    var p0 = sev(out.findings, "P0");
    assert.strictEqual(p0.length, 1, JSON.stringify(out.findings));
    assert.strictEqual(p0[0].check, "merge");
    assert.ok(p0[0].value.indexOf("how-a-user-sees-their-group") !== -1, p0[0].value);
    assert.ok(p0[0].value.indexOf("access-scoped-per-catalog") !== -1, p0[0].value);
    assert.deepStrictEqual(out.screens, [], "a P0 refuses instead of guessing which side wins");
    assert.strictEqual(out.brief, "", "no brief either: the whole seed is wrong, not thin");
  });

  it("treats a missing entity and a null entity as the same absence, not a conflict", function () {
    var d = flat();
    d.decisions[0].options.forEach(function (o) { if (o.id === "b") delete o.screens[0].entity; });
    var out = compose(d, {});
    assert.deepStrictEqual(sev(out.findings, "P0"), [], JSON.stringify(out.findings));
    assert.strictEqual(named(out.screens, MENU).entity, null);
  });

  it("P0s a file with no decisions instead of seeding nothing, for both an absent and an empty list", function () {
    var a = flat();
    delete a.decisions;
    var outA = compose(a, {});
    assert.strictEqual(outA.findings.length, 1, JSON.stringify(outA.findings));
    assert.strictEqual(outA.findings[0].severity, "P0");
    assert.strictEqual(outA.findings[0].check, "selection");
    assert.deepStrictEqual(outA.screens, []);

    var b = flat();
    b.decisions = [];
    var outB = compose(b, {});
    assert.strictEqual(outB.findings.length, 1, JSON.stringify(outB.findings));
    assert.strictEqual(outB.findings[0].severity, "P0");
    assert.strictEqual(outB.findings[0].check, "selection");
    assert.deepStrictEqual(outB.screens, []);
  });
});

describe("proposal-to-flow: the brief", function () {
  it("opens on the answer, then each decision's question, its reasons and its cost", function () {
    var d = flat();
    var out = compose(d, { decision: "where-the-readable-name-comes-from" });
    var dec = d.decisions[1];
    assert.ok(out.brief.indexOf(d.answer) === 0, out.brief);
    assert.ok(out.brief.indexOf(dec.question) !== -1, out.brief);
    dec.pick.reasons.forEach(function (r) {
      assert.ok(out.brief.indexOf(r.text) !== -1, "missing reason: " + r.text);
    });
    assert.ok(out.brief.indexOf("Cost: " + dec.pick.cost) !== -1, out.brief);
  });

  it("leaves the pick's reasons out when --option draws something else, and says what it drew", function () {
    var d = flat();
    var out = compose(d, { decision: "how-a-user-sees-their-group", option: "c" });
    var dec = d.decisions[0];
    var drawn = dec.options.filter(function (o) { return o.id === "c"; })[0];
    assert.ok(out.brief.indexOf("Drawn instead of the pick: " + drawn.name) !== -1, out.brief);
    assert.ok(out.brief.indexOf(drawn.whatItIs) !== -1, out.brief);
    dec.pick.reasons.forEach(function (r) {
      assert.strictEqual(out.brief.indexOf(r.text), -1, "argues for an option this run is not drawing: " + r.text);
    });
    assert.strictEqual(out.brief.indexOf(d.answer), -1,
      "the run draws no pick at all, so the answer that argues for the pick stays out too");
  });
});

describe("proposal-to-flow: order", function () {
  it("walks the breadboard, so a place fed by another comes after it", function () {
    var d = load();
    // The walk is [account-menu, group-form, group-record]: both of the first two start
    // with no arrow into them, and declaration order breaks that tie. So put the decision
    // that draws the form FIRST, and declaration order says [form, menu] while the walk
    // says [menu, form]. Without this the two orders agree and the test proves nothing.
    d.decisions.unshift(d.decisions.splice(1, 1)[0]);
    assert.strictEqual(d.decisions[0].id, "where-the-readable-name-comes-from");
    var out = compose(d, {});
    assert.deepStrictEqual(out.screens.map(function (s) { return s.name; }),
      ["Explorer catalog, account menu open", "Administration, create a group"],
      "the walk orders these, not the file: declaration order here is the other way round");
    assert.deepStrictEqual(sev(out.findings, "P0"), [], JSON.stringify(out.findings));
  });

  it("keeps declaration order with no breadboard, and draws no advisory about one", function () {
    var out = compose(flat(), {});
    assert.deepStrictEqual(out.screens.map(function (s) { return s.name; }),
      ["Explorer catalog, account menu open", "Administration, create a group"]);
    assert.deepStrictEqual(out.findings.filter(function (f) { return f.check === "anchor"; }), [],
      "no terrain, so there is no ordering it could have degraded from");
  });

  it("P0s an anchor.place that names no place, and still composes the rest", function () {
    var d = load();
    d.decisions[1].options.forEach(function (o) {
      if (o.id === "optional-display-name") o.anchor.place = "nowhere";
    });
    var out = compose(d, {});
    var p0 = sev(out.findings, "P0");
    assert.strictEqual(p0.length, 1, JSON.stringify(out.findings));
    assert.strictEqual(p0[0].check, "anchor");
    assert.ok(p0[0].value.indexOf("nowhere") !== -1, p0[0].value);
  });

  it("P1s an absent anchor.place while a breadboard is drawn", function () {
    var d = load();
    d.decisions[0].options.forEach(function (o) { delete o.anchor.place; });
    var out = compose(d, { decision: "how-a-user-sees-their-group" });
    var p1 = sev(out.findings, "P1").filter(function (f) { return f.check === "anchor"; });
    assert.strictEqual(p1.length, 1, JSON.stringify(out.findings));
    assert.ok(p1[0].suggestion.indexOf("declaration order") !== -1, p1[0].suggestion);
  });

  it("composes a cycle instead of throwing or refusing it", function () {
    var d = load();
    d.breadboard.connections = [
      { from: "account-menu", to: "group-form" },
      { from: "group-form", to: "account-menu" },
    ];
    var out = compose(d, {});
    assert.deepStrictEqual(out.screens.map(function (s) { return s.name; }),
      ["Explorer catalog, account menu open", "Administration, create a group"]);
    assert.deepStrictEqual(sev(out.findings, "P0"), [], JSON.stringify(out.findings));
  });
});

describe("proposal-to-flow: placeOrder", function () {
  it("keeps every place through a cycle: the feeder first, the cycle in declaration order", function () {
    var board = {
      places: [
        { id: "feeder" },
        { id: "cycle-a" },
        { id: "cycle-b" },
        { id: "cycle-c" },
      ],
      connections: [
        { from: "feeder", to: "cycle-a" },
        { from: "cycle-a", to: "cycle-b" },
        { from: "cycle-b", to: "cycle-c" },
        { from: "cycle-c", to: "cycle-a" },
      ],
    };
    var out = placeOrder(board);
    assert.strictEqual(out.length, board.places.length,
      "every place should come back: " + JSON.stringify(out));
    assert.strictEqual(new Set(out).size, board.places.length,
      "no place dropped or repeated: " + JSON.stringify(out));
    var feederIndex = out.indexOf("feeder");
    ["cycle-a", "cycle-b", "cycle-c"].forEach(function (id) {
      assert.ok(feederIndex < out.indexOf(id),
        "the feeder should precede " + id + ": " + JSON.stringify(out));
    });
    assert.deepStrictEqual(
      out.filter(function (id) { return id !== "feeder"; }),
      ["cycle-a", "cycle-b", "cycle-c"],
      "the cycle should keep declaration order: " + JSON.stringify(out));
  });
});

describe("proposal-to-flow: the CLI", function () {
  var { spawnSync } = require("node:child_process");
  var os = require("os");
  var CLI = path.join(ROOT, "scripts", "bridges", "proposal-to-flow.js");
  var made = [];
  function run(args) {
    return spawnSync(process.execPath, [CLI].concat(args), { encoding: "utf8" });
  }
  function tmp() {
    var dir = fs.mkdtempSync(path.join(os.tmpdir(), "proposal-bridge-"));
    made.push(dir);
    return dir;
  }
  function fileAt(dir, name, data) {
    var p = path.join(dir, name);
    fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
    return p;
  }
  after(function () {
    made.forEach(function (dir) { fs.rmSync(dir, { recursive: true, force: true }); });
  });

  it("prints the composed seed as JSON on stdout and exits 0", function () {
    var r = run([FIXTURE]);
    assert.strictEqual(r.status, 0, r.stderr);
    var out = JSON.parse(r.stdout);
    assert.deepStrictEqual(out.screens.map(function (s) { return s.name; }),
      ["Explorer catalog, account menu open", "Administration, create a group"]);
    assert.ok(out.brief.length > 0, "a brief");
    assert.deepStrictEqual(out.findings, []);
  });

  it("writes the seed to -o, and what it writes is the document, not the string undefined", function () {
    var dir = tmp();
    var out = path.join(dir, "seed.json");
    var r = run([FIXTURE, "-o", out]);
    assert.strictEqual(r.status, 0, r.stderr);
    var written = fs.readFileSync(out, "utf8");
    assert.ok(written.length > 200, "wrote " + written.length + " bytes: " + written);
    assert.strictEqual(JSON.parse(written).screens.length, 2);
  });

  it("passes --decision and --option through to the composition", function () {
    var r = run([FIXTURE, "--decision", "how-a-user-sees-their-group", "--option", "c"]);
    assert.strictEqual(r.status, 0, r.stderr);
    var out = JSON.parse(r.stdout);
    assert.strictEqual(out.screens.length, 1);
    assert.ok(out.screens[0].note.indexOf("My access row") !== -1, out.screens[0].note);
  });

  it("exits 1 on a P0 and prints it on stderr, where a piped stdout cannot hide it", function () {
    var r = run([FIXTURE, "--decision", "no-such-decision"]);
    assert.strictEqual(r.status, 1, r.stdout);
    assert.ok(r.stderr.indexOf("P0") !== -1, r.stderr);
    assert.ok(r.stderr.indexOf("no-such-decision") !== -1, r.stderr);
    assert.deepStrictEqual(JSON.parse(r.stdout).screens, [], "still prints the seed it could build");
  });

  it("refuses an evaluation file by name and says how to resume it", function () {
    var dir = tmp();
    var d = load();
    d.meta.stage = "evaluation";
    var r = run([fileAt(dir, "evaluation.json", d)]);
    assert.strictEqual(r.status, 1, r.stdout);
    assert.ok(r.stderr.indexOf("evaluation") !== -1, r.stderr);
    assert.ok(r.stderr.indexOf("--from") !== -1, r.stderr);
  });

  it("refuses to overwrite an existing -o, and says so before composing anything", function () {
    var dir = tmp();
    var out = path.join(dir, "taken.json");
    fs.writeFileSync(out, "keep me\n");
    var r = run([FIXTURE, "-o", out]);
    assert.strictEqual(r.status, 1, r.stdout);
    assert.strictEqual(fs.readFileSync(out, "utf8"), "keep me\n");
  });

  it("refuses to write -o when the composed seed carries a P0, and prints no success line", function () {
    var dir = tmp();
    var out = path.join(dir, "seed.json");
    var d = load();
    d.decisions[2].options.forEach(function (o) {
      if (o.id === "group-with-catalog") o.screens[0].template = "detail-view";
    });
    var r = run([fileAt(dir, "conflict.json", d), "-o", out]);
    assert.strictEqual(r.status, 1, r.stdout);
    assert.ok(!fs.existsSync(out), "should not have written a file when the seed carries a P0");
    assert.strictEqual(r.stdout, "", "no success line when a P0 refuses the write");
    assert.ok(r.stderr.indexOf("P0") !== -1, r.stderr);
  });

  it("refuses to write -o when the picks draw no screens at all", function () {
    var dir = tmp();
    var out = path.join(dir, "seed.json");
    var d = load();
    d.decisions.forEach(function (dec) {
      dec.options.forEach(function (o) { o.screens = []; });
    });
    var r = run([fileAt(dir, "empty.json", d), "-o", out]);
    assert.strictEqual(r.status, 1, r.stdout);
    assert.ok(!fs.existsSync(out), "should not have written a file when the picks draw no screens");
    assert.strictEqual(r.stdout, "", "no success line when a P0 refuses the write");
  });

  it("prints a usage line with no arguments, and exits non-zero", function () {
    var r = run([]);
    assert.notStrictEqual(r.status, 0);
    assert.ok((r.stdout + r.stderr).indexOf("--decision") !== -1, r.stdout + r.stderr);
  });

  it("names the file it could not read instead of printing a stack", function () {
    var r = run([path.join(tmp(), "absent.json")]);
    assert.strictEqual(r.status, 1);
    assert.ok(r.stderr.indexOf("absent.json") !== -1, r.stderr);
    assert.strictEqual(r.stderr.indexOf("at Object."), -1, "a stack trace, not a message: " + r.stderr);
  });

  it("names the path instead of printing a stack when -o points into a directory that does not exist", function () {
    var dir = tmp();
    var out = path.join(dir, "no-such-subdir", "seed.json");
    var r = run([FIXTURE, "-o", out]);
    assert.strictEqual(r.status, 1, r.stdout);
    assert.ok(r.stderr.indexOf(out) !== -1, r.stderr);
    assert.strictEqual(r.stderr.indexOf("at Object."), -1, "a stack trace, not a message: " + r.stderr);
    assert.ok(!fs.existsSync(out), "should not have written anything");
  });

  it("names the flag when --decision is the last argument and has no value after it", function () {
    var r = run([FIXTURE, "--decision"]);
    assert.strictEqual(r.status, 1, r.stdout);
    assert.ok(r.stderr.indexOf("--decision") !== -1, r.stderr);
    assert.strictEqual(r.stdout, "", "should not have composed or printed anything: " + r.stdout);
  });

  it("names -o instead of silently dropping it and printing to stdout when its value starts with a dash", function () {
    var wouldBe = path.resolve(ROOT, "--decision");
    if (fs.existsSync(wouldBe)) { fs.unlinkSync(wouldBe); }
    var r = run([FIXTURE, "-o", "--decision", "how-a-user-sees-their-group"]);
    assert.strictEqual(r.status, 1, r.stdout);
    assert.ok(r.stderr.indexOf("-o") !== -1, r.stderr);
    assert.strictEqual(r.stdout, "", "should not have composed or printed anything: " + r.stdout);
    assert.ok(!fs.existsSync(wouldBe),
      "should not have written a file at the would-be path a wrong rule would resolve -o to");
  });

  it("treats --decision followed by --option as --decision missing its value, not as --option without a decision", function () {
    var r = run([FIXTURE, "--decision", "--option", "b"]);
    assert.strictEqual(r.status, 1, r.stdout);
    assert.ok(r.stderr.indexOf("--decision") !== -1, r.stderr);
    assert.strictEqual(r.stdout, "", "should not have composed or printed anything: " + r.stdout);
  });
});
