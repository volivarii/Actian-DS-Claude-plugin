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
// The step used to be inline shell in vendor-snapshot.yml, which is why nothing
// tested it. It is a script now so these branches can actually be exercised.

function stubGh(dir, fixtures) {
  var log = path.join(dir, "gh.log");
  // `%b` and not `%s`: the PR-list fixture is TSV, and with `%s` the \t and \n
  // reach the script as literal backslash-t, so the production loop's
  // `IFS=$'\t' read` sees one unsplittable field. The first version of this
  // stub did exactly that and made a correct script look broken.
  var script = [
    "#!/usr/bin/env bash",
    'printf "%s\\n" "$*" >> ' + JSON.stringify(log),
    'case "$1 $2" in',
    '  "pr list")',
    "    printf '%b' " + JSON.stringify(fixtures.openPrs || ""),
    "    ;;",
    '  "issue list")',
    "    printf '%b' " + JSON.stringify(fixtures.blockedIssues || ""),
    "    ;;",
    '  "pr view")',
    // Which of the two `pr view` calls this is, by the field asked for.
    '    if [[ "$*" == *statusCheckRollup* ]]; then',
    "      printf '%b' " + JSON.stringify(String(fixtures.failedChecks || 0)),
    "    else",
    "      printf '%b' " + JSON.stringify(fixtures.dirty || ""),
    "    fi",
    "    ;;",
    "esac",
    "exit 0",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(dir, "gh"), script, { mode: 0o755 });
  return log;
}

// A close is `gh issue close <number>`. Matching the bare words would also hit
// the alarm body's own sentence about closing automatically, which is prose,
// not a call.
var CLOSE_CALL = /issue close [0-9]/;

function runAlarm(fixtures) {
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), "vqa-"));
  var log = stubGh(dir, fixtures);
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

test("alarm: an empty vendor queue closes the open blocked issue", function () {
  var r = runAlarm({ openPrs: "", blockedIssues: "272\n" });
  assert.match(r.calls, CLOSE_CALL);
  assert.match(r.calls, /issue close 272/);
});

test("alarm: a queue whose PRs are all healthy ALSO closes the open blocked issue", function () {
  // The defect. There is an open vendor PR, because this very workflow just
  // opened tonight's, and nothing about it is stuck. The plugin IS consuming
  // knowledge again, so the alarm must clear. Before the fix this branch
  // exited without touching the issue, and #272 outlived its own cause by
  // eight days.
  var r = runAlarm({
    openPrs: "274\t2026-08-11\tvendor(knowledge): refresh to v0.34.122\n",
    blockedIssues: "272\n",
    failedChecks: 0,
  });
  assert.match(r.calls, CLOSE_CALL);
  assert.match(r.calls, /issue close 272/);
});

test("alarm: a genuinely stuck PR still raises a new alarm", function () {
  var r = runAlarm({
    openPrs: "271\t2026-07-25\tvendor(knowledge): refresh to v0.34.122\n",
    blockedIssues: "",
    failedChecks: 1,
  });
  assert.match(r.calls, /issue create/);
  assert.match(r.calls, /vendor-blocked/);
  assert.doesNotMatch(r.calls, CLOSE_CALL);
});

test("alarm: a stuck PR with the alarm already open comments instead of duplicating it", function () {
  var r = runAlarm({
    openPrs: "271\t2026-07-25\tvendor(knowledge): refresh to v0.34.122\n",
    blockedIssues: "272\n",
    failedChecks: 1,
  });
  assert.match(r.calls, /issue comment 272/);
  assert.doesNotMatch(r.calls, /issue create/);
  assert.doesNotMatch(r.calls, CLOSE_CALL);
});

test("alarm: never fails the refresh it runs inside", function () {
  // It is a best-effort reporter attached to a job that has real work to
  // protect. Whatever it finds, it exits 0.
  var r = runAlarm({
    openPrs: "271\t2026-07-25\tsomething\n",
    blockedIssues: "",
    failedChecks: 1,
  });
  assert.equal(r.status, 0, r.stderr);
});
