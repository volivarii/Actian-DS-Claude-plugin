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
//   stuck    -> raise or update the alarm (a refresh that failed before
//               opening a PR is stuck too, read from the job status first)
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
// The JSON gh really returns for the per-PR read, built from the same fixture
// keys the tests already use. `checks` is still written as a comma string for
// brevity; each token becomes one rollup entry, and an EMPTY token becomes an
// entry shaped like a running CheckRun (`"conclusion": ""`, no .state), which
// is what gh actually sends and what round 8's defect turned on.
function prViewFixture(fx) {
  var raw = fx.checks === undefined ? "SUCCESS" : fx.checks;
  var rollup = raw === "" ? [] : raw.split(",").map(function (c) {
    if (c === "") return { __typename: "CheckRun", conclusion: "", status: "IN_PROGRESS" };
    // A legacy commit status carries .state and no .conclusion.
    if (fx.legacyStatus) return { __typename: "StatusContext", state: c };
    return { __typename: "CheckRun", conclusion: c, status: "COMPLETED" };
  });
  return {
    state: fx.queuedPrState || "OPEN",
    statusCheckRollup: fx.nullRollup ? null : rollup,
    mergeStateStatus:
      fx.mergeStateStatus || (fx.dirty ? "DIRTY" : "CLEAN"),
    autoMergeRequest: fx.noAutoMerge ? null : { enabledAt: "2026-08-28T00:00:00Z" },
  };
}

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
    '  "issue create" | "issue comment")',
    "    " + (fx.issueWriteFails ? 'echo "HTTP 403" >&2; exit 1' : ""),
    "    ;;",
    '  "issue list")',
    "    " + (fx.issueListFails ? 'echo "HTTP 502" >&2; exit 1' : ""),
    "    printf '%b' " + JSON.stringify(fx.blockedIssues || ""),
    "    ;;",
    '  "pr view")',
    // The stub emits FIXTURE JSON and lets the script's own --jq run it, via
    // real jq. It used to answer with the already-joined row, which meant no
    // test ever executed the filter: every semantic element of it could be
    // broken with the suite green, including the fallback that resolves an
    // in-flight check's empty conclusion. A gate that cannot fail on its
    // subject is not a gate, and the filter is exactly where the last defect
    // lived.
    '    filter=""; prev=""',
    '    for a in "$@"; do',
    '      if [ "$prev" = "--jq" ]; then filter="$a"; fi',
    '      prev="$a"',
    '    done',
    '    if [[ "$*" == *statusCheckRollup* ]]; then',
    "      " + (fx.prViewFails ? 'echo "HTTP 502" >&2; exit 1' : ""),
    "      " +
      (fx.prViewFailsFor
        ? 'if [ "$3" = ' +
          JSON.stringify(String(fx.prViewFailsFor)) +
          ' ]; then echo "HTTP 502" >&2; exit 1; fi'
        : ""),
    "      printf '%s' " +
      JSON.stringify(JSON.stringify(prViewFixture(fx))) +
      ' | jq -r "$filter"',
    "      " + (fx.prViewFailsAfterPrinting ? "exit 1" : ""),
    '    elif [[ "$*" == *"--json state"* ]]; then',
    "      printf '%s' " +
      JSON.stringify(
        JSON.stringify({
          state: fx.openedPrState === undefined ? "OPEN" : fx.openedPrState,
        }),
      ) +
      ' | jq -r "$filter"',
    "      " + (fx.openedPrStateFails ? "exit 1" : ""),
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

var DIRS = [];
test.after(function () {
  DIRS.forEach(function (d) {
    fs.rmSync(d, { recursive: true, force: true });
  });
});

function runAlarm(fx) {
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), "vqa-"));
  DIRS.push(dir);
  var log = stubGh(dir, fx || {});
  var summary = path.join(dir, "summary.md");
  var res = spawnSync("bash", [ALARM], {
    encoding: "utf8",
    // The step always passes the job status; a test that wants the absent
    // case passes REFRESH_OUTCOME: "" explicitly. OPENED_PR is empty unless
    // the test says a PR was opened tonight.
    env: Object.assign(
      {},
      process.env,
      { PATH: dir + ":" + process.env.PATH },
      {
        REFRESH_OUTCOME: "success",
        RUN_URL: "https://example/run/0",
        OPENED_PR: "",
        OPENED_OP: "",
        GITHUB_STEP_SUMMARY: summary,
      },
      (fx && fx.env) || {},
    ),
  });
  return {
    status: res.status,
    calls: fs.existsSync(log) ? fs.readFileSync(log, "utf8") : "",
    stdout: String(res.stdout || ""),
    stderr: String(res.stderr || ""),
    summary: fs.existsSync(summary) ? fs.readFileSync(summary, "utf8") : "",
  };
}

var WORKFLOW = fs.readFileSync(
  path.join(REPO_ROOT, ".github", "workflows", "vendor-snapshot.yml"),
  "utf8",
);

// One step of the workflow, from its `- name:` to the next one at the same
// indent (or the end of the file).
function sliceStep(name) {
  var start = WORKFLOW.indexOf("- name: " + name);
  assert.ok(start !== -1, "the workflow has a step named " + name);
  // The step's own indent, read from the line it was found on, rather than a
  // hard-coded six spaces. When that guess did not match the file, the search
  // for the next step returned -1 and the slice ran to the END OF THE FILE, so
  // assertions written about one step passed against another step's text. A
  // slice that quietly widens to everything is a gate that asserts nothing.
  var lineStart = WORKFLOW.lastIndexOf("\n", start) + 1;
  var indent = WORKFLOW.slice(lineStart, start);
  assert.match(indent, /^[ ]*$/, "the step name must start its own line");
  var next = WORKFLOW.indexOf("\n" + indent + "- name:", start);
  // From the START OF THE LINE, so the step's own indent is inside the slice
  // and the count below can anchor on it.
  var slice = WORKFLOW.slice(lineStart, next === -1 ? WORKFLOW.length : next);
  assert.equal(
    (slice.match(new RegExp("^" + indent + "- name:", "gm")) || []).length,
    1,
    "sliceStep(" +
      name +
      ") must return exactly one step, not run on into the next",
  );
  return slice;
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
  assert.match(r.calls, /issue create .*--label vendor-blocked/);
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
  // alone let a red legacy status read as healthy. `legacyStatus` makes the
  // fixture that shape: without it the entry is a CheckRun and the .state
  // fallback in the filter could be deleted with every test still green.
  var r = runAlarm({
    openPrs: ONE_PR,
    blockedIssues: "",
    checks: "FAILURE",
    legacyStatus: true,
  });
  assert.match(r.calls, /issue create/);
  assert.match(r.calls, /failing check/);
});

test("alarm: a PASSING legacy commit status is read as passing, not as unreported", function () {
  // The other side of the same fallback: dropping it makes every legacy status
  // read PENDING, so a green legacy PR reads unknown and the alarm never
  // clears. One test on the red side alone cannot see that.
  var r = runAlarm({
    openPrs: ONE_HEALTHY_PR,
    blockedIssues: "272\n",
    checks: "SUCCESS",
    legacyStatus: true,
  });
  assert.match(r.calls, /issue close 272/);
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
  // Pinned against the --json FIELD LIST, not against the command line as a
  // whole. Every one of these names also appears in the --jq filter, so a bare
  // /autoMergeRequest/ match stays green when the field is dropped from --json
  // while jq still mentions it. jq then reads the absent field as null for
  // every PR, so every healthy vendor PR reports "auto-merge not enabled" and
  // the alarm fires every single night. The stub answers on the subcommand and
  // never runs jq, so this assertion is the only thing standing between that
  // and a green suite.
  var jsonList = (r.calls.match(/pr view [0-9]+ --json (\S+)/) || [])[1];
  assert.ok(jsonList, "the per-PR read must pass a --json field list");
  [
    "state",
    "statusCheckRollup",
    "mergeStateStatus",
    "autoMergeRequest",
  ].forEach(function (field) {
    assert.ok(
      jsonList.split(",").indexOf(field) !== -1,
      field + " must be in the --json field list, got: " + jsonList,
    );
  });
  assert.match(
    r.calls,
    /\.conclusion/,
    "check state must come from .conclusion first",
  );
  assert.match(
    r.calls,
    /\.state/,
    "and fall back to .state so a legacy commit status counts",
  );
  // The load-bearing part: the fallback picks the first NON-EMPTY value. jq's
  // `//` does not fall through on "", and gh reports a running check as
  // `"conclusion": ""`, so a `//` chain yielded "" for every in-flight check.
  assert.match(
    r.calls,
    /select\(\. != ""\)/,
    "the fallback must skip empty values, or a running check reads as passing",
  );
  // The three answers come back as one row, and the delimiter is load-bearing:
  // a tab is whitespace, which `read` collapses, so the fields would shift.
  assert.match(
    r.calls,
    /join\("\|"\)/,
    "the three fields must be joined on a non-whitespace delimiter",
  );
  // One call, not three: three tripled the exposure to a transient 502 on
  // exactly the flaky nights this script exists for.
  assert.equal(
    (r.calls.match(/pr view /g) || []).length,
    1,
    "each PR's state must be read in a single gh call",
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

// --- plugin #317, 2026-08-27 --------------------------------------------------
//
// The refresh died at "Re-record the blank-box baseline", so the steps that
// open the PR were skipped and the queue this script inspects was empty. It
// read empty as drained and reported success, on the one night the plugin had
// stopped consuming knowledge. A queue cannot show a PR that was never opened,
// so the script must also read WHY it is running: the job's own status.

var DIED = {
  REFRESH_OUTCOME: "failure",
  RUN_URL:
    "https://github.com/volivarii/Actian-DS-Claude-plugin/actions/runs/33064557503",
};

test("alarm: a refresh that died before opening a PR raises the alarm, whatever the queue says", function () {
  var r = runAlarm({ openPrs: "", blockedIssues: "", env: DIED });
  assert.match(r.calls, /issue create .*--label vendor-blocked/);
  assert.match(r.calls, /33064557503/, "the alarm names the run that died");
  assert.doesNotMatch(r.calls, CLOSE_CALL);
});

test("alarm: a dead refresh with the alarm already open comments on it, and does not clear it on the empty queue it left behind", function () {
  var r = runAlarm({ openPrs: "", blockedIssues: "272\n", env: DIED });
  assert.match(r.calls, /issue comment 272/);
  assert.doesNotMatch(r.calls, /issue create/);
  assert.doesNotMatch(r.calls, CLOSE_CALL);
});

test("alarm: the workflow hands the script the job status and the run URL", function () {
  // The script can only read why it is running if the step passes it in. A
  // stub that answers on env alone would stay green if the workflow stopped
  // setting it, so the contract is asserted against the YAML itself.
  var step = sliceStep("Raise the alarm if the vendor queue is blocked");
  assert.match(
    step,
    /if: always\(\)/,
    "without always() the step never runs on the failed night it exists for",
  );
  assert.match(step, /REFRESH_OUTCOME:\s*\$\{\{\s*job\.status\s*\}\}/);
  assert.match(
    step,
    /RUN_URL:\s*\$\{\{\s*github\.server_url\s*\}\}\/\$\{\{\s*github\.repository\s*\}\}\/actions\/runs\/\$\{\{\s*github\.run_id\s*\}\}/,
  );
  assert.match(
    step,
    /OPENED_PR:\s*\$\{\{\s*steps\.cpr\.outputs\.pull-request-number\s*\}\}/,
  );
  assert.match(
    step,
    /OPENED_OP:\s*\$\{\{\s*steps\.cpr\.outputs\.pull-request-operation\s*\}\}/,
  );
});

test("alarm: the script writes the failure line of the run summary, and the Summarize step no longer guesses at one", function () {
  // One writer of "what happened tonight" on a failed night: the script, which
  // holds the status, the run and the PR. The step keeps the two success
  // lines, guarded on success, so a dead run cannot summarise as "no changes".
  var r = runAlarm({ openPrs: "", blockedIssues: "", env: DIED });
  assert.match(r.summary, /### Vendor refresh FAILED/);
  assert.match(r.summary, /33064557503/);
  var step = sliceStep("Summarize");
  assert.match(
    step,
    /if: (success\(\)|\$\{\{\s*job\.status == 'success'\s*\}\})/,
  );
  assert.doesNotMatch(step, /FAILED/);
});

// --- round 1 of the #317 review -----------------------------------------------

test("alarm: a cancelled refresh with no PR is a failed refresh, not a quiet night", function () {
  // `cancelled` was its own verdict that raised nothing, on the reading that it
  // means a human pressed stop. It equally means a timeout, a concurrency
  // cancel or a lost runner, so a nightly that hangs every single night went
  // silent under a status word while the plugin consumed nothing. It is
  // non-success like any other, and it still never clears.
  var r = runAlarm({
    openPrs: "",
    blockedIssues: "272\n",
    env: { REFRESH_OUTCOME: "cancelled", RUN_URL: "https://example/run/2" },
  });
  // An alarm is already open, so the raise is a comment on it rather than a
  // duplicate.
  assert.match(r.calls, /issue comment 272/);
  assert.match(r.calls, /status: cancelled/);
  assert.doesNotMatch(r.calls, CLOSE_CALL);
  assert.match(r.summary, /cancelled/i);
});

test("alarm: a cancelled refresh with no alarm open raises a new one", function () {
  var r = runAlarm({
    openPrs: "",
    blockedIssues: "",
    env: { REFRESH_OUTCOME: "cancelled", RUN_URL: "https://example/run/2" },
  });
  assert.match(r.calls, /issue create .*--label vendor-blocked/);
  assert.doesNotMatch(r.calls, CLOSE_CALL);
});

test("alarm: a cancelled run still reads the queue, so a stuck pile is raised whatever happened tonight", function () {
  var r = runAlarm({
    openPrs: ONE_PR,
    blockedIssues: "",
    checks: "FAILURE",
    env: { REFRESH_OUTCOME: "cancelled", RUN_URL: "https://example/run/2" },
  });
  assert.match(r.calls, /issue create/);
  assert.match(r.calls, /#271/);
});

test("alarm: with no job status at all the queue is read but nothing may clear", function () {
  // The env contract fails closed: a caller that forgot to pass the status
  // cannot produce the false all-clear this script exists to prevent.
  var r = runAlarm({
    openPrs: "",
    blockedIssues: "272\n",
    env: { REFRESH_OUTCOME: "" },
  });
  assert.doesNotMatch(r.calls, CLOSE_CALL);
  assert.match(r.stdout, /UNKNOWN/);
});

test("alarm: a failed refresh still inspects the queue, so a stuck older PR is named alongside the failure", function () {
  // job.status is failure for a failure at ANY step, including one after the
  // PR exists, so the alarm must not claim the queue is empty.
  var r = runAlarm({
    openPrs: ONE_PR,
    blockedIssues: "",
    checks: "FAILURE",
    env: DIED,
  });
  assert.match(r.calls, /issue create/);
  assert.match(r.calls, /pr view 271/);
  assert.match(r.calls, /33064557503/);
  assert.match(r.calls, /#271/);
  assert.equal(
    (r.calls.match(/issue create/g) || []).length,
    1,
    "one alarm, not one per cause",
  );
  // Worded as what is KNOWN. create-pull-request sets its outputs last, so an
  // empty OPENED_PR is not proof no PR exists, and "no PR was opened, so the
  // plugin consumed nothing" would be a fabricated certainty on a night a PR
  // may well have been created before a later step failed.
  assert.match(r.calls, /The PR step reported no PR tonight/i);
  assert.doesNotMatch(r.calls, /no PR was opened/i);
});

test("alarm: when gh cannot list the open alarms, a failed refresh raises nothing rather than a duplicate", function () {
  var r = runAlarm({
    openPrs: "",
    blockedIssues: "",
    issueListFails: true,
    env: DIED,
  });
  assert.doesNotMatch(r.calls, /issue create/);
  assert.doesNotMatch(r.calls, CLOSE_CALL);
  assert.match(r.stdout, /UNKNOWN/);
  // and the night is not silent: the run summary carries the reason
  assert.match(r.summary, /could not/i);
  assert.match(r.summary, /33064557503/);
});

// --- round 2 of the #317 review -----------------------------------------------

test("alarm: a failure after the PR was opened names that PR and does not claim nothing was consumed", function () {
  // job.status is failure for a failure at ANY step. When "Enable auto-merge"
  // fails, tonight's PR exists with real content; the alarm must say so.
  var r = runAlarm({
    openPrs: ONE_HEALTHY_PR,
    blockedIssues: "",
    checks: "PENDING",
    env: Object.assign({}, DIED, { OPENED_PR: "274", OPENED_OP: "created" }),
  });
  assert.match(r.calls, /issue create/);
  assert.match(r.calls, /PR #274 carries tonight's refresh/);
  // The no-PR branch's real sentence. Naming a string the script cannot emit
  // made this inert; this one it emits whenever OPENED_PR is empty, so wiring
  // the branches the wrong way round turns it red.
  assert.doesNotMatch(r.calls, /The PR step reported no PR tonight/);
  assert.doesNotMatch(r.calls, CLOSE_CALL);
});

test("alarm: a comment on the open alarm does not recreate the label", function () {
  var r = runAlarm({ openPrs: "", blockedIssues: "272\n", env: DIED });
  assert.match(r.calls, /issue comment 272/);
  assert.doesNotMatch(r.calls, /label create/);
});

test("alarm: the failure line of the run summary names the PR carrying tonight's refresh", function () {
  var r = runAlarm({
    openPrs: ONE_HEALTHY_PR,
    blockedIssues: "",
    checks: "PENDING",
    env: Object.assign({}, DIED, { OPENED_PR: "274", OPENED_OP: "created" }),
  });
  assert.match(r.summary, /### Vendor refresh FAILED.*PR #274/);
});

// --- round 3 of the #317 review -----------------------------------------------

test("alarm: a failed refresh names the PRs it could not read instead of calling the queue clear", function () {
  var r = runAlarm({
    openPrs: ONE_PR,
    blockedIssues: "",
    prViewFails: true,
    env: DIED,
  });
  assert.match(r.calls, /issue create/);
  assert.match(r.calls, /#271: gh could not report its state/);
  assert.doesNotMatch(r.calls, /No open vendor PR is stuck\./);
});

test("alarm: when gh cannot create or comment, the run summary carries the reason", function () {
  var r = runAlarm({
    openPrs: "",
    blockedIssues: "",
    issueWriteFails: true,
    env: DIED,
  });
  assert.equal(r.status, 0);
  assert.match(r.summary, /could not/i);
  assert.match(r.summary, /33064557503/);
});

test("alarm: with no job status, a healthy-looking non-empty queue still clears nothing", function () {
  var r = runAlarm({
    openPrs: ONE_HEALTHY_PR,
    blockedIssues: "272\n",
    checks: "SUCCESS",
    env: { REFRESH_OUTCOME: "" },
  });
  assert.doesNotMatch(r.calls, CLOSE_CALL);
});

test("alarm: the PR this run just opened cannot be stuck yet, so its pending checks do not hold the alarm open", function () {
  // Every successful night opens a PR seconds before this step runs, so
  // "pending" is the normal state here; without this a transient alarm only
  // clears on a night the knowledge repo published nothing.
  var r = runAlarm({
    openPrs: ONE_HEALTHY_PR,
    blockedIssues: "272\n",
    checks: "PENDING",
    env: { OPENED_PR: "274", OPENED_OP: "created" },
  });
  assert.match(r.calls, /issue close 272/);
});

test("alarm: a re-pushed existing PR is not tonight's newcomer, so its pending checks still hold the alarm", function () {
  // create-pull-request reports the existing PR's number with operation
  // "updated" when it force-pushes a re-used branch; that PR was stuck before
  // tonight, and a reset to PENDING must not read as fresh.
  var r = runAlarm({
    openPrs: ONE_HEALTHY_PR,
    blockedIssues: "272\n",
    checks: "PENDING",
    env: { OPENED_PR: "274", OPENED_OP: "updated" },
  });
  assert.doesNotMatch(r.calls, CLOSE_CALL);
});

test("alarm: a green vendor PR with auto-merge not enabled will never merge, so it is stuck", function () {
  var r = runAlarm({
    openPrs: ONE_PR,
    blockedIssues: "",
    checks: "SUCCESS",
    noAutoMerge: true,
  });
  assert.match(r.calls, /issue create/);
  assert.match(r.calls, /auto-merge not enabled/);
  assert.doesNotMatch(r.calls, CLOSE_CALL);
});

test("alarm: a failed run whose PR already merged raises nothing and says so in the run summary", function () {
  // A failure in a step after the merge (Summarize, say) is not a night the
  // plugin consumed nothing; the alarm's title would be false.
  var r = runAlarm({
    openPrs: "",
    blockedIssues: "",
    openedPrState: "MERGED",
    env: Object.assign({}, DIED, { OPENED_PR: "274", OPENED_OP: "created" }),
  });
  assert.doesNotMatch(r.calls, /issue create|issue comment/);
  assert.match(r.summary, /merged/i);
});

test("alarm: a failed refresh whose queue cannot be read is still RAISED, not just logged", function () {
  // The refresh is known to have failed whatever the queue says, so this night
  // is not a summary line: it is the alarm. Recording it only in the run
  // summary put the one signal that the plugin had stopped consuming knowledge
  // on a page nobody opens, on exactly the nights the API was also flaky.
  var r = runAlarm({ openPrs: "", prListFails: true, env: DIED });
  assert.match(r.calls, /issue create .*--label vendor-blocked/);
  assert.match(r.calls, /33064557503/);
  assert.doesNotMatch(r.calls, CLOSE_CALL);
});

test("alarm: a failed refresh whose queue AND issue list both fail still reaches the run summary", function () {
  // raise_alarm cannot list, so it cannot know whether an alarm is already
  // open; creating one could duplicate. The night must not go silent, so the
  // reason lands in the run summary instead.
  var r = runAlarm({
    openPrs: "",
    prListFails: true,
    issueListFails: true,
    env: DIED,
  });
  assert.doesNotMatch(r.calls, /issue create/);
  assert.match(r.summary, /could not/i);
  assert.match(r.summary, /33064557503/);
});

test("alarm: a PR opened on an earlier night with pending checks still holds the alarm open", function () {
  var r = runAlarm({
    openPrs: ONE_PR,
    blockedIssues: "272\n",
    checks: "PENDING",
    env: { OPENED_PR: "274" },
  });
  assert.doesNotMatch(r.calls, CLOSE_CALL);
});

// --- round 6 of the #317 review -----------------------------------------------

test("alarm: a failed refresh whose PR state cannot be read does not claim the PR merged", function () {
  // The MERGED probe used to ignore gh's exit code, so a 502 read as "not
  // merged". That is the safe direction for the title, but the guard was
  // unverified: removing the exit-code check left every test green. A failed
  // read is unknown, so the run is described as a failure carrying that PR.
  var r = runAlarm({
    openPrs: "",
    blockedIssues: "",
    openedPrState: "MERGED",
    openedPrStateFails: true,
    env: {
      REFRESH_OUTCOME: "failure",
      OPENED_PR: "281",
      RUN_URL: "https://example/run/9",
    },
  });
  assert.match(r.calls, /issue create .*--label vendor-blocked/);
  assert.doesNotMatch(
    r.summary,
    /merged/i,
    "an unreadable state must not be reported as merged",
  );
});

test("alarm: a PR that merged between the queue listing and its own read is not stuck", function () {
  // A vendor PR carries auto-merge, so it can merge in the seconds between
  // `gh pr list` and this PR's own read. It then reports no auto-merge request
  // (it is spent) and no conflicts, and was called "auto-merge not enabled":
  // a false alarm for doing exactly what it was built to do.
  var r = runAlarm({
    openPrs: ONE_PR,
    blockedIssues: "272\n",
    queuedPrState: "MERGED",
    noAutoMerge: true,
  });
  assert.doesNotMatch(r.calls, /issue create|issue comment/);
  assert.match(
    r.calls,
    /issue close 272/,
    "the queue is drained, so the alarm clears",
  );
});

test("alarm: the clear does not claim a reading of tonight's unmeasured PR", function () {
  // Tonight's own PR is exempt from "pending is unknown", so when it is the
  // only open one NOTHING was measured. Claiming "every open vendor PR reports
  // healthy" would be a false all-clear dressed as a reading, and claiming its
  // checks "have not reported" is equally a claim: it was skipped for being too
  // new, and they may have reported success.
  var r = runAlarm({
    openPrs: ONE_PR,
    blockedIssues: "272\n",
    env: { OPENED_PR: "271", OPENED_OP: "created" },
  });
  assert.match(r.calls, /issue close 272/);
  assert.match(r.calls, /drained apart from tonight's PR #271/);
  assert.doesNotMatch(r.calls, /Every open vendor PR reports healthy/);
  // The whole clear comment, so a reworded claim about the unmeasured PR fails
  // here rather than sliding through a doesNotMatch on a string that is gone.
  assert.match(
    r.calls,
    /issue close 272 --comment .*drained apart from tonight's PR #271, which is too new to judge/,
  );
});

test("sliceStep: a slice is bounded by the next step, not by the end of the file", function () {
  // The "exactly one step" count inside sliceStep is 1 by construction once the
  // indent is derived, so it guards the derivation but cannot itself prove the
  // slice stops where it should. This asserts the boundary directly, against
  // two steps that really do follow one another in the workflow.
  var summarize = sliceStep("Summarize");
  assert.doesNotMatch(
    summarize,
    /Raise the alarm if the vendor queue is blocked/,
    "the Summarize slice must not run on into the alarm step",
  );
  assert.ok(
    summarize.length < WORKFLOW.length,
    "a slice that is the whole file asserts nothing",
  );
});

// --- round 7 of the #317 review -----------------------------------------------

test("alarm: SKIPPED and NEUTRAL are passing, so a PR carrying one can still clear the alarm", function () {
  // Health as "SUCCESS only" looks like the safe reading and is the wrong one.
  // GitHub counts SKIPPED and NEUTRAL as passing for a required check, so
  // auto-merge fires on them; calling them unknown would leave a vendor PR
  // reading unknown every night and the alarm unable to clear, which is defect
  // 1 from the script's own header.
  var r = runAlarm({
    openPrs: ONE_HEALTHY_PR,
    blockedIssues: "272\n",
    checks: "SUCCESS,SKIPPED,NEUTRAL",
  });
  assert.match(r.calls, /issue close 272/);
});

test("alarm: STALE is not passing, so it is unknown and cannot clear the alarm", function () {
  // STALE means the answer describes an older commit, so it says nothing about
  // the head this PR would merge.
  var r = runAlarm({
    openPrs: ONE_HEALTHY_PR,
    blockedIssues: "272\n",
    checks: "SUCCESS,STALE",
  });
  assert.doesNotMatch(r.calls, CLOSE_CALL);
  assert.doesNotMatch(r.calls, /issue create|issue comment/);
  assert.match(r.stdout, /UNKNOWN/i);
});

test("alarm: a conclusion GitHub has not invented yet is unknown, not healthy", function () {
  // The allow-list is stated positively so a new conclusion is unknown by
  // default. A deny-list of pending states let anything unlisted read as
  // healthy and clear a real alarm.
  var r = runAlarm({
    openPrs: ONE_HEALTHY_PR,
    blockedIssues: "272\n",
    checks: "SUCCESS,SOME_NEW_CONCLUSION",
  });
  assert.doesNotMatch(r.calls, CLOSE_CALL);
});

test("alarm: a failed refresh whose PR merged does not call its own status unknown", function () {
  // may_clear is empty for two different reasons. Tonight's PR merged, so
  // nothing is raised, but the status is `failure` and perfectly well known;
  // reporting it as unknown misdescribes the one night a reader is looking at.
  var r = runAlarm({
    openPrs: ONE_HEALTHY_PR,
    blockedIssues: "",
    openedPrState: "MERGED",
    checks: "SUCCESS",
    env: {
      REFRESH_OUTCOME: "failure",
      OPENED_PR: "281",
      RUN_URL: "https://example/run/7",
    },
  });
  assert.match(r.stdout, /did not succeed \(status: failure\)/);
  // Targets the string the script really emits on the unknown-status path, so
  // this can fail. The old wording it named no longer exists anywhere, which
  // made it an assertion nothing could break.
  assert.doesNotMatch(r.stdout, /no job status was passed in/);
});

test("alarm: with no job status, the queue's own verdict still raises", function () {
  // An absent status is not a fourth verdict that silences everything: it
  // blocks CLEARING, because nothing says the refresh completed, while a stuck
  // PR found in the queue is still stuck.
  var r = runAlarm({
    openPrs: ONE_PR,
    blockedIssues: "",
    checks: "FAILURE",
    env: { REFRESH_OUTCOME: "" },
  });
  assert.match(r.calls, /issue create .*--label vendor-blocked/);
});

// --- round 8 of the #317 review -----------------------------------------------

test("alarm: a check still running reports an EMPTY conclusion, which is not passing", function () {
  // gh reports an in-flight CheckRun as `"conclusion": ""` with no .state key
  // at all, and jq's `//` falls through on null and false but NOT on "". So the
  // fallback chain yielded "" per check, three running checks joined to ",,",
  // which is not empty (the -z guard misses it) and contains no non-passing
  // token (the allow-list misses it too). The PR read healthy and CLEARED the
  // alarm while its checks were still running: defect 2 from the script header.
  var r = runAlarm({
    openPrs: ONE_HEALTHY_PR,
    blockedIssues: "272\n",
    checks: ",,",
  });
  assert.doesNotMatch(
    r.calls,
    CLOSE_CALL,
    "checks that have not concluded must never clear the alarm",
  );
  assert.match(r.stdout, /UNKNOWN/i);
});

test("alarm: one empty conclusion among successes is still not passing", function () {
  var r = runAlarm({
    openPrs: ONE_HEALTHY_PR,
    blockedIssues: "272\n",
    checks: "SUCCESS,,SUCCESS",
  });
  assert.doesNotMatch(r.calls, CLOSE_CALL);
});

test("alarm: a measured healthy PR alongside tonight's exempt one is counted, and the clear says so", function () {
  // The branch where healthy > 0 AND tonight's PR is pending had no test at
  // all: the counter could be frozen at zero and every test stayed green.
  var r = runAlarm({
    openPrs:
      ONE_PR + "299\t2026-08-28\tvendor(knowledge): refresh to v0.34.156\n",
    blockedIssues: "272\n",
    checks: "SUCCESS",
    env: { OPENED_PR: "299", OPENED_OP: "created" },
  });
  assert.match(r.calls, /issue close 272/);
  assert.match(
    r.calls,
    /1 open vendor PR\(s\) report healthy, and tonight's PR #299 is too new to judge/,
  );
});

test("alarm: the stuck alarm body names the PRs it could not read, not only the stuck ones", function () {
  // One stuck PR plus one unreadable PR reported only the stuck one, so a
  // reader acting on the alarm would fix half the queue and believe it drained.
  // The line that fixes it had no gate: replacing it with `:` stayed green.
  var r = runAlarm({
    openPrs:
      ONE_PR + "288\t2026-08-20\tvendor(knowledge): refresh to v0.34.150\n",
    blockedIssues: "",
    checks: "FAILURE",
    prViewFailsFor: "288",
  });
  assert.match(r.calls, /issue create/);
  assert.match(r.calls, /#271.*failing check/, "the stuck PR is named");
  assert.match(r.calls, /These could not be read/);
  assert.match(r.calls, /#288: gh could not report its state/);
});

// --- round 9 of the #317 review -----------------------------------------------

test("alarm: a PR GitHub will not merge is stuck, however green its checks are", function () {
  // mergeStateStatus was reduced to DIRTY / not-DIRTY, so BLOCKED (a required
  // check that never reported, or a required review) cleared the alarm with
  // every check green. `gh pr merge --auto` queues silently on BLOCKED and
  // never fires, so that PR sits forever: the false all-clear this file calls
  // worse than the silence it replaced, on the frequently-taken path.
  ["BLOCKED", "DRAFT"].forEach(function (state) {
    var r = runAlarm({
      openPrs: ONE_PR,
      blockedIssues: "",
      checks: "SUCCESS",
      mergeStateStatus: state,
    });
    assert.match(r.calls, /issue create/, state + " must raise");
    assert.doesNotMatch(r.calls, CLOSE_CALL, state + " must not clear");
  });
});

test("alarm: a merge state that is neither mergeable nor stuck is unknown", function () {
  // BEHIND needs an update and UNKNOWN is still being computed. Neither says
  // the plugin is consuming knowledge, and neither says it has stopped.
  ["BEHIND", "UNKNOWN"].forEach(function (state) {
    var r = runAlarm({
      openPrs: ONE_HEALTHY_PR,
      blockedIssues: "272\n",
      checks: "SUCCESS",
      mergeStateStatus: state,
    });
    assert.doesNotMatch(r.calls, CLOSE_CALL, state + " must not clear");
    assert.doesNotMatch(r.calls, /issue create/, state + " must not raise");
  });
});

test("alarm: a mergeable state GitHub already uses does clear", function () {
  // The allow-list has to admit the states a healthy vendor PR really sits in,
  // or the alarm can never clear and that is defect 1 again.
  ["CLEAN", "HAS_HOOKS", "UNSTABLE"].forEach(function (state) {
    var r = runAlarm({
      openPrs: ONE_HEALTHY_PR,
      blockedIssues: "272\n",
      checks: "SUCCESS",
      mergeStateStatus: state,
    });
    assert.match(r.calls, /issue close 272/, state + " must clear");
  });
});

test("alarm: tonight's own PR is exempt from EVERY stuck test, not only pending checks", function () {
  // `gh pr merge --auto` runs in the step immediately before this one, so
  // autoMergeRequest can lag. Exempting tonight's PR from the pending-checks
  // reading only meant that lag raised an alarm titled "the plugin is not
  // consuming knowledge" on the very night it did, which is what the header
  // has always said must not happen.
  var r = runAlarm({
    openPrs: "299\t2026-08-28\tvendor(knowledge): refresh to v0.34.156\n",
    blockedIssues: "",
    checks: "SUCCESS",
    noAutoMerge: true,
    env: { OPENED_PR: "299", OPENED_OP: "created" },
  });
  assert.doesNotMatch(r.calls, /issue create|issue comment/);
});

test("alarm: the queue is read past gh's default page of 30", function () {
  // The pile IS the signal, and a pile is exactly when it exceeds the default
  // window. Newest-first, so past 30 the OLDEST and most stuck fall outside it.
  var r = runAlarm({ openPrs: "", blockedIssues: "" });
  assert.match(r.calls, /pr list .*--limit 100/);
});

test("alarm: a successful quiet night writes no bare heading to the run summary", function () {
  var r = runAlarm({ openPrs: "", blockedIssues: "272\n" });
  assert.doesNotMatch(
    r.summary,
    /^###\s*Run:/m,
    "a headline-less night must not emit an empty heading",
  );
});
