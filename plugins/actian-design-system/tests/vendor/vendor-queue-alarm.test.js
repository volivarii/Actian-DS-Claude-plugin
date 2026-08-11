"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("node:fs");
var os = require("node:os");
var path = require("node:path");
var spawnSync = require("node:child_process").spawnSync;

var REPO_ROOT = path.resolve(__dirname, "../../../..");
var ALARM = path.join(REPO_ROOT, ".github", "scripts", "vendor-queue-alarm.sh");

// This alarm tells a human that the plugin has stopped consuming knowledge. It
// spent 2026-08-03 to 2026-08-11 saying so about a queue that had already
// drained, because its body claims "this issue auto-closes when the queue
// drains" and the only close path required ZERO open vendor PRs. The same
// workflow opens a fresh vendor PR every night, so at the moment this step runs
// the queue is almost never empty, and a stale alarm could survive forever.
//
// An alarm that cannot clear itself is worse than no alarm: it trains the
// reader to ignore the label, which is the exact failure the queue alarm was
// written to prevent.
//
// THE SECOND LESSON, from the review of the first fix: an affirmative clear is
// far more dangerous than a no-op. The first fix read "gh told me nothing is
// stuck" and "gh could not tell me" as the same state, so an expired token or a
// rate limit closed a real alarm claiming the plugin was consuming knowledge
// again. This ecosystem had just lost 11 nights to an expired PAT. So the script
// is now explicitly three-state:
//
//   stuck    -> raise or update the alarm
//   healthy  -> clear it
//   unknown  -> touch nothing, and say why
//
// Only a positive healthy reading clears. Everything the API could not answer
// is unknown, never healthy.
//
// The step used to be inline shell in vendor-snapshot.yml, which is why nothing
// tested it. It is a script now so these branches can actually be exercised.

// A stub gh. It answers on the subcommand and records every invocation, so the
// tests can assert both the DECISION the script reached and the QUESTIONS it
// asked. Asserting the questions matters because a stub that answers on the
// subcommand alone would stay green if the real --json fields or --jq filters
// were wrong, which would silence the alarm with no red test.
function stubGh(dir, fx) {
  var log = path.join(dir, "gh.log");
  var lines = [
    "#!/usr/bin/env bash",
    'printf "%s\\n" "$*" >> ' + JSON.stringify(log),
    'case "$1 $2" in',
    '  "pr list")',
    "    " + (fx.prListFails ? 'echo "HTTP 502" >&2; exit 1' : ""),
    "    printf '%b' " + JSON.stringify(fx.openPrs || ""),
    "    ;;",
    '  "issue list")',
    "    printf '%b' " + JSON.stringify(fx.blockedIssues || ""),
    "    ;;",
    '  "pr view")',
    '    if [[ "$*" == *statusCheckRollup* ]]; then',
    "      " + (fx.prViewFails ? 'echo "HTTP 502" >&2; exit 1' : ""),
    "      printf '%b' " +
      JSON.stringify(fx.checks === undefined ? "SUCCESS" : fx.checks),
    // Printed a plausible answer, then failed. Only the exit code distinguishes
    // this from a healthy read.
    "      " + (fx.prViewFailsAfterPrinting ? "exit 1" : ""),
    "    else",
    "      " + (fx.prViewFails ? "exit 1" : ""),
    "      printf '%b' " + JSON.stringify(fx.dirty || ""),
    "      " + (fx.prViewFailsAfterPrinting ? "exit 1" : ""),
    "    fi",
    "    ;;",
    "esac",
    "exit 0",
    "",
  ];
  fs.writeFileSync(path.join(dir, "gh"), lines.join("\n"), { mode: 0o755 });
  return log;
}

// A close is `gh issue close <number>`. Matching the bare words would also hit
// the alarm body's own sentence about closing automatically, which is prose,
// not a call.
var CLOSE_CALL = /issue close [0-9]/;

function runAlarm(fx) {
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), "vqa-"));
  var log = stubGh(dir, fx || {});
  var res = spawnSync("bash", [ALARM], {
    encoding: "utf8",
    env: Object.assign({}, process.env, { PATH: dir + ":" + process.env.PATH }),
  });
  return {
    status: res.status,
    calls: fs.existsSync(log) ? fs.readFileSync(log, "utf8") : "",
    stdout: String(res.stdout || ""),
    stderr: String(res.stderr || ""),
  };
}

var ONE_HEALTHY_PR =
  "274\t2026-08-11\tvendor(knowledge): refresh to v0.34.122\n";
var ONE_PR = "271\t2026-07-25\tvendor(knowledge): refresh to v0.34.122\n";

test("alarm: an empty vendor queue closes the open blocked issue", function () {
  var r = runAlarm({ openPrs: "", blockedIssues: "272\n" });
  assert.match(r.calls, CLOSE_CALL);
  assert.match(r.calls, /issue close 272/);
});

test("alarm: a queue whose PRs are all healthy ALSO closes the open blocked issue", function () {
  // The original defect. There is an open vendor PR, because this very
  // workflow just opened tonight's, and nothing about it is stuck. The plugin
  // IS consuming knowledge again, so the alarm must clear. Before the fix this
  // branch exited without touching the issue, and #272 outlived its own cause
  // by eight days.
  var r = runAlarm({
    openPrs: ONE_HEALTHY_PR,
    blockedIssues: "272\n",
    checks: "SUCCESS,SUCCESS",
  });
  assert.match(r.calls, /issue close 272/);
});

test("alarm: a genuinely stuck PR still raises a new alarm", function () {
  var r = runAlarm({ openPrs: ONE_PR, blockedIssues: "", checks: "FAILURE" });
  assert.match(r.calls, /issue create/);
  assert.match(r.calls, /vendor-blocked/);
  assert.doesNotMatch(r.calls, CLOSE_CALL);
});

test("alarm: a stuck PR with the alarm already open comments instead of duplicating it", function () {
  var r = runAlarm({
    openPrs: ONE_PR,
    blockedIssues: "272\n",
    checks: "FAILURE",
  });
  assert.match(r.calls, /issue comment 272/);
  assert.doesNotMatch(r.calls, /issue create/);
  assert.doesNotMatch(r.calls, CLOSE_CALL);
});

test("alarm: never fails the refresh it runs inside", function () {
  var r = runAlarm({ openPrs: ONE_PR, blockedIssues: "", checks: "FAILURE" });
  assert.equal(r.status, 0, r.stderr);
});

// --- the review findings -----------------------------------------------------

test("alarm: a gh API error while reading a PR leaves the alarm exactly as it was", function () {
  // The worst finding. gh failing is NOT evidence that nothing is stuck, and
  // this is the precise state of an expired token, which cost this ecosystem 11
  // nights. Closing here would be a false all-clear the script never measured.
  var r = runAlarm({
    openPrs: ONE_PR,
    blockedIssues: "272\n",
    prViewFails: true,
  });
  assert.doesNotMatch(r.calls, CLOSE_CALL, "must not clear on an API error");
  assert.doesNotMatch(r.calls, /issue create/, "must not cry wolf either");
  assert.match(
    r.stdout + r.stderr,
    /could not|unknown/i,
    "must say why it did nothing",
  );
});

test("alarm: gh printing a plausible answer AND failing is unknown, not healthy", function () {
  // This test exists because a mutation check caught a gap in the one above it:
  // deleting the exit-code guard entirely left the whole suite green, since a
  // failing `gh` that prints NOTHING is already caught by the no-checks branch.
  // So the exit code was being read by unverified code. A partial or cached
  // answer alongside a non-zero exit is the case only the exit code can catch,
  // and misreading it clears a real alarm.
  var r = runAlarm({
    openPrs: ONE_HEALTHY_PR,
    blockedIssues: "272\n",
    checks: "SUCCESS",
    prViewFailsAfterPrinting: true,
  });
  assert.doesNotMatch(
    r.calls,
    CLOSE_CALL,
    "a non-zero gh exit is unknown even when it printed something that parses",
  );
});

test("alarm: a gh API error while listing the queue leaves the alarm exactly as it was", function () {
  // An empty PR list and a failed PR list are the same empty string.
  var r = runAlarm({ prListFails: true, blockedIssues: "272\n" });
  assert.doesNotMatch(r.calls, CLOSE_CALL);
  assert.doesNotMatch(r.calls, /issue create/);
});

test("alarm: a PR whose checks have not reported yet is unknown, not healthy", function () {
  // This step runs in the same workflow that just opened tonight's PR, so
  // pending is the NORMAL state moments after opening. Reading it as healthy
  // would clear a real alarm on nothing more than timing.
  var r = runAlarm({
    openPrs: ONE_HEALTHY_PR,
    blockedIssues: "272\n",
    checks: "PENDING,SUCCESS",
  });
  assert.doesNotMatch(r.calls, CLOSE_CALL);
});

test("alarm: a PR with no checks at all is unknown, not healthy", function () {
  var r = runAlarm({
    openPrs: ONE_HEALTHY_PR,
    blockedIssues: "272\n",
    checks: "",
  });
  assert.doesNotMatch(r.calls, CLOSE_CALL);
});

test("alarm: a failing legacy commit status counts as stuck", function () {
  // A StatusContext carries `.state`, not `.conclusion`. Reading conclusion
  // alone let a red legacy status read as healthy.
  var r = runAlarm({ openPrs: ONE_PR, blockedIssues: "", checks: "FAILURE" });
  assert.match(r.calls, /issue create/);
});

test("alarm: merge conflicts are stuck even when every check passed", function () {
  var r = runAlarm({
    openPrs: ONE_PR,
    blockedIssues: "",
    checks: "SUCCESS",
    dirty: "conflicts",
  });
  assert.match(r.calls, /issue create/);
});

test("alarm: it asks the right questions, not just reaches the right verdict", function () {
  // A stub answers whatever it is asked, so the decision tests above would all
  // stay green if the queries themselves were wrong. These assertions pin the
  // queries, which is the part a stub cannot validate on its own.
  var r = runAlarm({
    openPrs: ONE_HEALTHY_PR,
    blockedIssues: "",
    checks: "SUCCESS",
  });
  assert.match(
    r.calls,
    /pr list .*--state open .*--label vendor/,
    "the queue query must be open vendor-labelled PRs",
  );
  assert.match(
    r.calls,
    /statusCheckRollup/,
    "check state must come from the rollup",
  );
  assert.match(
    r.calls,
    /\.state/,
    "the rollup filter must fall back to .state so a legacy commit status counts",
  );
  assert.match(
    r.calls,
    /mergeStateStatus/,
    "conflicts must still be consulted",
  );
});

test("alarm: it only closes its own tracking issue, not every issue wearing the label", function () {
  // clear_alarm is now reached on the frequently-taken healthy path, so closing
  // everything with the label would auto-close a human's issue with a claim the
  // script never measured about it.
  var r = runAlarm({ openPrs: "", blockedIssues: "272\n" });
  assert.match(
    r.calls,
    /issue list .*--json number,title/,
    "it must read titles so the close can be scoped to its own tracking issue",
  );
  assert.match(
    r.calls,
    /issue list .*Vendor refresh is blocked/,
    "the close is scoped by the alarm's own title rather than by the label alone. " +
      "An identity filter is deliberately avoided: if --author @me failed to " +
      "resolve under a CI token, the alarm would silently stop clearing again, " +
      "which is the bug this file exists for.",
  );
});
