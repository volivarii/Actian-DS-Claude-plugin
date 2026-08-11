#!/usr/bin/env bash
#
# Tell a human when the plugin has stopped consuming knowledge.
#
# Vendor refresh PRs are opened with auto-merge, so when their checks fail they
# silently do not merge and each night quietly adds another to the pile. That is
# exactly what happened: five vendor PRs (#237 to #241) stacked up red between
# 2026-07-07 and 2026-07-12 while the plugin consumed no knowledge for five
# days. The pile IS the signal, and nobody was looking at it. This runs nightly
# from vendor-snapshot.yml, so it is the natural place to notice.
#
# THREE STATES, and the distinction is the whole design:
#
#   stuck    a PR has a failed check or merge conflicts   -> raise/update the alarm
#   healthy  every open PR positively reported success    -> clear the alarm
#   unknown  gh could not say, or checks have not reported -> touch NOTHING
#
# The two defects this shape exists to prevent, both real:
#
#  1. The original only cleared when the queue was completely EMPTY, while this
#     same workflow opens tonight's vendor PR moments before this step runs, so
#     the queue is almost never empty here. Issue #272 therefore outlived its
#     cause by eight days, still claiming the plugin was not consuming knowledge
#     after the refresh had resumed. An alarm that cannot clear itself trains the
#     reader to ignore the label, which is the failure this script exists for.
#
#  2. The first fix then read "gh told me nothing is stuck" and "gh could not
#     tell me" as the same thing, so an expired token or a rate limit would CLOSE
#     a real alarm claiming knowledge was flowing again. This repo had just lost
#     11 nights to an expired PAT. A false all-clear is worse than the silence it
#     replaced, so nothing but a positive healthy reading may clear.
#
# It lives in a file rather than inline in the workflow so its branches can be
# tested: see tests/vendor/vendor-queue-alarm.test.js, which runs it against a
# stubbed gh and pins both the verdicts and the queries.
#
# Requires: gh on PATH, GH_TOKEN in the environment.
# Best-effort by contract: it must never fail the refresh it runs inside, so
# every path exits 0.
set +e

ALARM_TITLE="🔴 Vendor refresh is blocked: the plugin is not consuming knowledge"

# The issues this script is allowed to close: its own, matched by title.
#
# Scoping by the label alone would close a human's issue that merely wears
# vendor-blocked to be findable, and it would do so on the healthy path, which
# is now the frequently taken one. An identity filter (--author @me) is
# deliberately not used: if it failed to resolve under a CI token the alarm would
# silently stop clearing, which is defect 1 all over again.
own_alarm_issues() {
  gh issue list --state open --label vendor-blocked --json number,title \
    --jq ".[] | select(.title == \"${ALARM_TITLE}\") | .number" 2>/dev/null
}

clear_alarm() {
  for n in $(own_alarm_issues); do
    gh issue close "$n" --comment "$1" 2>/dev/null
  done
}

open_prs=$(gh pr list --state open --label vendor --json number,title,createdAt --jq '.[] | [.number, .createdAt[0:10], .title] | @tsv' 2>/dev/null)
if [ $? -ne 0 ]; then
  # An empty list and a failed list are the same empty string, so this has to be
  # checked before the emptiness is trusted as "drained".
  echo "vendor-queue-alarm: could not read the vendor PR queue, so the queue state is UNKNOWN. Leaving any existing alarm exactly as it is."
  exit 0
fi

if [ -z "$open_prs" ]; then
  clear_alarm "✅ The vendor queue has drained: no open vendor PRs remain."
  exit 0
fi

blocked=""
unknown=""
while IFS=$'\t' read -r num created title; do
  [ -z "$num" ] && continue

  # `.conclusion // .state` on purpose: a modern CheckRun carries .conclusion,
  # a legacy commit status (StatusContext) carries .state, and reading only the
  # first let a red legacy status pass as healthy. A check with neither has not
  # reported, which is PENDING, not success.
  checks=$(gh pr view "$num" --json statusCheckRollup \
    --jq '[.statusCheckRollup[]? | (.conclusion // .state // "PENDING")] | join(",")' 2>/dev/null)
  checks_rc=$?
  dirty=$(gh pr view "$num" --json mergeStateStatus --jq 'select(.mergeStateStatus == "DIRTY") | "conflicts"' 2>/dev/null)
  dirty_rc=$?

  if [ "$checks_rc" -ne 0 ] || [ "$dirty_rc" -ne 0 ]; then
    unknown="${unknown}- #${num}: gh could not report its state"$'\n'
    continue
  fi

  reason=""
  case ",$checks," in
    *,FAILURE,* | *,TIMED_OUT,* | *,CANCELLED,* | *,ERROR,* | *,STARTUP_FAILURE,* | *,ACTION_REQUIRED,*)
      reason="failing check(s)"
      ;;
  esac
  [ -n "$dirty" ] && reason="${reason:+$reason, }merge conflicts"

  if [ -n "$reason" ]; then
    blocked="${blocked}- #${num} (opened ${created}): ${title} — ${reason}"$'\n'
    continue
  fi

  # Not stuck. That is only HEALTHY if every check positively reported success.
  #
  # Do NOT read pending as healthy: this step runs in the same workflow that
  # just opened tonight's PR, so pending is the normal state moments after
  # opening, and clearing on it would drop a real alarm on nothing but timing.
  # (This is also why mergeStateStatus == BLOCKED is not used as the stuck test:
  # a PR whose checks are still running is BLOCKED too, and that would fire a
  # false alarm every single night.)
  if [ -z "$checks" ]; then
    unknown="${unknown}- #${num}: no checks have reported yet"$'\n'
    continue
  fi
  case ",$checks," in
    *,PENDING,* | *,EXPECTED,* | *,IN_PROGRESS,* | *,QUEUED,* | *,WAITING,* | *,REQUESTED,*)
      unknown="${unknown}- #${num}: checks still running"$'\n'
      continue
      ;;
  esac
done <<< "$open_prs"

if [ -n "$blocked" ]; then
  count=$(printf '%s' "$blocked" | grep -c '^- ')
  gh label create vendor-blocked --color B60205 --description "Vendor refresh PRs are stuck; the plugin is not consuming knowledge" 2>/dev/null
  body="**${count} vendor refresh PR(s) are stuck.** While they are, the plugin is consuming NO new knowledge: every substrate change is piling up on the wrong side of the pipe."$'\n\n'"${blocked}"$'\n'"This issue closes automatically once every open vendor PR reports healthy."
  existing=$(own_alarm_issues | head -1)
  if [ -n "$existing" ]; then
    gh issue comment "$existing" --body "Still blocked (${count} PR(s))."$'\n\n'"${blocked}" 2>/dev/null
  else
    gh issue create --title "$ALARM_TITLE" --label vendor-blocked --body "$body" 2>/dev/null
  fi
  exit 0
fi

if [ -n "$unknown" ]; then
  echo "vendor-queue-alarm: nothing is provably stuck, but the state of some PR(s) is UNKNOWN, so the alarm is left exactly as it is:"
  printf '%s' "$unknown"
  exit 0
fi

# Every open vendor PR positively reported success.
clear_alarm "✅ Every open vendor PR reports healthy, so the plugin is consuming knowledge again."
exit 0
