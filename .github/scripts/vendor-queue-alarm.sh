#!/usr/bin/env bash
#
# Tell a human when the plugin has stopped consuming knowledge.
#
# Vendor refresh PRs are opened with auto-merge, so when their checks fail they
# silently do not merge and each night quietly adds another to the pile. That is
# exactly what happened: five vendor PRs (#237 to #241) stacked up red between
# 2026-07-07 and 2026-07-12 while the plugin consumed no knowledge for five
# days. The pile IS the signal, and nobody was looking at it. This runs nightly
# from vendor-snapshot.yml, so it is the natural place to notice. One tracking
# issue, cleared as soon as nothing is stuck.
#
# It lives in a file rather than inline in the workflow so its branches can be
# tested: see tests/vendor/vendor-queue-alarm.test.js, which runs it against a
# stubbed `gh`. It was inline shell when it shipped, which is why the defect
# below went unnoticed for eight days.
#
# Requires: gh on PATH, GH_TOKEN in the environment.
# Best-effort by contract: it must never fail the refresh it runs inside, so
# every path exits 0.
set +e

# Clear the alarm. Called from BOTH not-stuck paths on purpose.
#
# The original version only cleared when the queue was completely EMPTY, and
# the body it posts promises "this issue auto-closes when the queue drains". It
# does not: this very workflow opens tonight's vendor PR moments before this
# step runs, so the queue is almost never empty here, and the healthy-queue path
# below simply exited. Issue #272 outlived its cause by eight days that way,
# still saying the plugin was not consuming knowledge after the refresh had
# resumed. An alarm that cannot clear itself trains the reader to ignore the
# label, which is the failure this whole script exists to prevent.
clear_alarm() {
  for n in $(gh issue list --state open --label vendor-blocked --json number --jq '.[].number' 2>/dev/null); do
    gh issue close "$n" --comment "$1" 2>/dev/null
  done
}

open_prs=$(gh pr list --state open --label vendor --json number,title,createdAt --jq '.[] | [.number, .createdAt[0:10], .title] | @tsv' 2>/dev/null)
if [ -z "$open_prs" ]; then
  clear_alarm "✅ The vendor queue has drained: no open vendor PRs remain."
  exit 0
fi

# A PR is only "stuck" if a check has actually FAILED, or it has
# conflicts. Do NOT use mergeStateStatus == BLOCKED: a PR whose checks
# are still running is also BLOCKED, and this step runs in the same
# workflow that just opened tonight's PR. That would fire a false alarm
# every single night, and a nightly false alarm is how a signal becomes
# noise and then gets ignored, which is the exact failure this whole
# change exists to prevent.
blocked=""
while IFS=$'\t' read -r num created title; do
  [ -z "$num" ] && continue
  failed=$(gh pr view "$num" --json statusCheckRollup \
    --jq '[.statusCheckRollup[]? | select(.conclusion == "FAILURE" or .conclusion == "TIMED_OUT" or .conclusion == "CANCELLED")] | length' 2>/dev/null)
  dirty=$(gh pr view "$num" --json mergeStateStatus --jq 'select(.mergeStateStatus == "DIRTY") | "conflicts"' 2>/dev/null)
  reason=""
  [ "${failed:-0}" -gt 0 ] 2>/dev/null && reason="${failed} failing check(s)"
  [ -n "$dirty" ] && reason="${reason:+$reason, }merge conflicts"
  if [ -n "$reason" ]; then
    blocked="${blocked}- #${num} (opened ${created}): ${title} — ${reason}"$'\n'
  fi
done <<< "$open_prs"

if [ -z "$blocked" ]; then
  # There are open vendor PRs and none of them is stuck, so knowledge is
  # flowing again even though the queue is not empty. This is the path that
  # used to leave a stale alarm lit.
  clear_alarm "✅ Nothing in the vendor queue is stuck any more: the open vendor PR(s) are healthy, so the plugin is consuming knowledge again."
  exit 0
fi

count=$(printf '%s' "$blocked" | grep -c '^- ')
gh label create vendor-blocked --color B60205 --description "Vendor refresh PRs are stuck; the plugin is not consuming knowledge" 2>/dev/null
body="**${count} vendor refresh PR(s) are stuck.** While they are, the plugin is consuming NO new knowledge: every substrate change is piling up on the wrong side of the pipe."$'\n\n'"${blocked}"$'\n'"This issue closes automatically as soon as nothing in the queue is stuck."
existing=$(gh issue list --state open --label vendor-blocked --json number --jq '.[0].number // empty' 2>/dev/null)
if [ -n "$existing" ]; then
  gh issue comment "$existing" --body "Still blocked (${count} PR(s))."$'\n\n'"${blocked}" 2>/dev/null
else
  gh issue create --title "🔴 Vendor refresh is blocked: the plugin is not consuming knowledge" --label vendor-blocked --body "$body" 2>/dev/null
fi
exit 0
