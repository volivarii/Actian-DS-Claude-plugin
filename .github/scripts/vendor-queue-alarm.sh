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
# THREE VERDICTS, and the distinction is the whole design:
#
#   stuck    the refresh run did not succeed (REFRESH_OUTCOME, read first,
#            because the queue cannot show a PR that was never opened;
#            `cancelled` counts, see below), or an open PR has a failed check,
#            merge conflicts, or auto-merge not enabled
#                                                          -> raise/update the alarm
#   healthy  the refresh completed and every open PR positively reported
#            a passing conclusion with auto-merge on (the PR this run just
#            created is not counted: it cannot be stuck yet)
#                                                          -> clear the alarm
#   unknown  gh could not say, or checks have not reported -> touch NOTHING
#
# A missing job status is not a fourth verdict: the queue is still read and can
# still find a stuck PR, so an alarm can still be raised. What an absent status
# blocks is CLEARING, because nothing then says the refresh completed.
#
# One non-success run does NOT raise: the run whose own PR merged. Tonight's
# knowledge landed and a later step failed, so the alarm's title would be false.
# That night raises nothing and clears nothing, and the run summary carries it.
#
# The queue is read on every verdict: the pile is the signal, whatever
# happened tonight.
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
# Requires: gh on PATH, GH_TOKEN in the environment. The step passes in
# REFRESH_OUTCOME (the job's status), RUN_URL, OPENED_PR (the PR carrying
# tonight's refresh, if one exists) and OPENED_OP (created or updated: only a
# created PR is too new to be stuck). Without a status the script cannot tell
# whether the refresh completed, treats it as unknown, and never clears.
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

# Raise the alarm, or comment on the open one. The one raise path for every
# cause: the caller passes the reason, this adds what every alarm says.
#
# If gh cannot LIST the open alarms, it is not known whether one exists, and
# creating one would open a duplicate on exactly the nights (rate limits, a
# failing API) that coincide with a failed run. Unknown touches nothing, and
# the run summary carries the reason instead, so the night is not silent.
CLOSE_NOTE="This issue closes automatically once a refresh completes and every open vendor PR reports healthy."
raise_alarm() {
  local reason="$1" listed existing
  listed=$(own_alarm_issues)
  if [ $? -ne 0 ]; then
    could_not_raise "gh could not list the open alarms, so whether one exists is UNKNOWN and creating one could duplicate it" "$reason"
    return 0
  fi
  existing=$(printf '%s\n' "$listed" | head -1)
  if [ -n "$existing" ]; then
    gh issue comment "$existing" --body "Still blocked."$'\n\n'"${reason}" 2>/dev/null || could_not_raise "gh could not comment on the open alarm" "$reason"
  else
    gh label create vendor-blocked --color B60205 --description "Vendor refresh PRs are stuck; the plugin is not consuming knowledge" 2>/dev/null
    gh issue create --title "$ALARM_TITLE" --label vendor-blocked --body "${reason}"$'\n\n'"${CLOSE_NOTE}" 2>/dev/null || could_not_raise "gh could not create the alarm" "$reason"
  fi
}

# Everything this script tells a human goes through here, so the run summary and
# the issue body cannot drift into saying different things about one night.
summary() { [ -n "${GITHUB_STEP_SUMMARY-}" ] && printf '%s\n' "$1" >> "$GITHUB_STEP_SUMMARY"; return 0; }

# A raise that gh refused must not be a silent night: the run summary
# carries the reason instead.
could_not_raise() {
  echo "vendor-queue-alarm: $1."
  summary "$(printf '%s\n\n%s' "**The vendor alarm could not be raised** ($1), so it is recorded here instead:" "$2")"
  return 0
}

# The queue cannot show a PR that was never opened. On 2026-08-27 the refresh
# died at "Re-record the blank-box baseline", the steps that open the PR were
# skipped, and this script read the empty queue as drained and reported success
# on the one night the plugin had stopped consuming knowledge (#317). So it also
# reads WHY it is running: the step passes the job's own status in.
run_line="Run: ${RUN_URL:-unknown}"
refresh_note=""
may_clear=""
middle=""
headline=""

# Read tonight's PR state ONCE, and keep "not merged" apart from "could not
# tell". Ignoring gh's exit code here let a 502 read as "not merged", which put
# a false title ("the plugin is not consuming knowledge") on a night the
# knowledge had in fact landed.
opened_state=""
opened_state_known=""
if [ -n "${OPENED_PR-}" ]; then
  opened_state=$(gh pr view "$OPENED_PR" --json state --jq .state 2>/dev/null)
  if [ $? -eq 0 ] && [ -n "$opened_state" ]; then opened_state_known=1; fi
fi

case "${REFRESH_OUTCOME-}" in
  success) may_clear=1 ;;
  "")
    echo "vendor-queue-alarm: no job status was passed in, so whether the refresh completed is UNKNOWN. The queue is read, but nothing may clear."
    ;;
  *)
    # `cancelled` lands here with every other non-success. It is a human
    # pressing stop no more often than it is a timeout, a concurrency cancel or
    # a lost runner, and treating it as its own quiet verdict let a nightly that
    # hangs every night go silent under a status word.
    if [ -n "$opened_state_known" ] && [ "$opened_state" = "MERGED" ]; then
      # The refresh's product landed; a later step failed. Not a night the
      # plugin consumed nothing, so the alarm's title would be false. No
      # refresh_note, so nothing is raised: the summary carries it.
      headline="Vendor refresh FAILED (status: ${REFRESH_OUTCOME}) after PR #${OPENED_PR} merged; tonight's knowledge landed, the run still needs a look."
    elif [ -n "${OPENED_PR-}" ]; then
      middle="PR #${OPENED_PR} carries tonight's refresh and a later step failed, so check that PR and the run."
      headline="Vendor refresh FAILED (status: ${REFRESH_OUTCOME}); PR #${OPENED_PR} carries tonight's refresh, check that PR."
    else
      # An empty OPENED_PR is NOT proof that no PR was opened:
      # create-pull-request sets its outputs last, after labels and assignees,
      # so a failure anywhere after the PR was created leaves them empty. Say
      # what is known (the step reported none), never "no PR was opened, so the
      # plugin consumed nothing", which would be a fabricated certainty.
      middle="The PR step reported no PR tonight, so no new knowledge is known to have landed."
      headline="Vendor refresh FAILED (status: ${REFRESH_OUTCOME}) and the PR step reported no PR; the plugin may not be consuming knowledge."
    fi
    ;;
esac
# One headline and one note per night, assembled once, so the run summary and
# the issue body cannot state the same facts in two different shapes.
[ -n "$headline" ] && summary "### ${headline} ${run_line}"
[ -n "$middle" ] && refresh_note="**The vendor refresh run did not complete (status: ${REFRESH_OUTCOME}). ${middle}** ${run_line}"

# --limit 100, because gh's default is 30, newest first. The pile IS the signal,
# and a pile is exactly when it exceeds the window: past 30 the OLDEST, most
# stuck PRs fall outside it, so the count under-reports and, if the newest 30
# read healthy, the script clears while older ones sit.
open_prs=$(gh pr list --state open --label vendor --limit 100 --json number,title,createdAt --jq '.[] | [.number, .createdAt[0:10], .title] | @tsv' 2>/dev/null)
if [ $? -ne 0 ]; then
  # An empty list and a failed list are the same empty string, so this has to be
  # checked before the emptiness is trusted as "drained".
  echo "vendor-queue-alarm: could not read the vendor PR queue, so the queue state is UNKNOWN. Leaving any existing alarm exactly as it is."
  # A failed refresh is known to have failed whatever the queue says, so it is
  # raised rather than merely logged. raise_alarm guards its own duplicates and
  # falls back to the summary when gh cannot list, so this degrades safely.
  if [ -n "$refresh_note" ]; then
    raise_alarm "${refresh_note}"$'\n\n'"The vendor PR queue could not be read, so what is waiting in it is unknown."
  fi
  exit 0
fi

if [ -z "$open_prs" ]; then
  if [ -n "$refresh_note" ]; then
    raise_alarm "${refresh_note}"$'\n\n'"There is nothing in the queue to review."
  elif [ -n "$may_clear" ]; then
    clear_alarm "✅ The vendor queue has drained: no open vendor PRs remain."
  fi
  exit 0
fi

blocked=""
unknown=""
healthy=0
tonight_pending=""
while IFS=$'\t' read -r num created title; do
  [ -z "$num" ] && continue

  # One read per PR, not three. Three separate `gh pr view` calls tripled the
  # exposure to a transient 502 on exactly the flaky nights this script exists
  # for, and any one of them failing discarded the other two.
  #
  # First NON-EMPTY of .conclusion, .state, "PENDING". A modern CheckRun carries
  # .conclusion, a legacy commit status (StatusContext) carries .state, and
  # reading only the first let a red legacy status pass as healthy.
  #
  # Non-empty, not `//`: jq's `//` falls through on null and false but NOT on
  # "", and gh reports a check that is still running as `"conclusion": ""` with
  # no .state key at all. So `.conclusion // .state // "PENDING"` yielded ""
  # for every in-flight check, three running checks joined to ",,", which is not
  # empty (so the -z guard below misses it) and contains no non-passing token
  # (so the allow-list misses it too). The PR read HEALTHY and cleared the
  # alarm while its checks were still running: defect 2 from this file's header.
  # A vendor PR is built to auto-merge. One with auto-merge off and green
  # checks will sit unmerged forever, which is stuck, not healthy.
  pr_state=$(gh pr view "$num" --json state,statusCheckRollup,mergeStateStatus,autoMergeRequest \
    --jq '[
      .state,
      ([.statusCheckRollup[]?
        | [(.conclusion // ""), (.state // ""), "PENDING"]
        | map(select(. != "")) | .[0]] | join(",")),
      (.mergeStateStatus // ""),
      (if .autoMergeRequest == null then "off" else "" end)
    ] | join("|")' 2>/dev/null)
  if [ $? -ne 0 ]; then
    unknown="${unknown}- #${num}: gh could not report its state"$'\n'
    continue
  fi
  # Joined on "|", NOT a tab: a tab is whitespace, and `read` collapses runs of
  # whitespace delimiters, so a PR with no conflicts silently shifted the
  # auto-merge field into the conflicts one and a green PR with auto-merge off
  # read as healthy. Two of these three fields are empty on a healthy PR, so the
  # delimiter has to be one `read` treats literally.
  IFS='|' read -r pr_status checks merge_state noauto <<< "$pr_state"

  # The queue was listed a moment ago. A vendor PR carries auto-merge, so one
  # can merge between the list and this read; it then reports no auto-merge
  # request (it is spent) and no conflicts, and would be called stuck for having
  # done exactly what it was supposed to do. A PR that is no longer open is not
  # in the queue.
  if [ -n "$pr_status" ] && [ "$pr_status" != "OPEN" ]; then
    continue
  fi

  # The PR this very run CREATED moments ago cannot be stuck yet, so it is
  # exempt from EVERY stuck test, which is what the header has always said. It
  # used to be exempt only from the pending-checks reading, so the lag between
  # `gh pr merge --auto` (the step immediately before this one) and
  # autoMergeRequest appearing reported tonight's own PR as "auto-merge not
  # enabled" and raised an alarm titled "the plugin is not consuming knowledge"
  # on a night it did. A PR the run merely UPDATED (a re-used branch
  # force-pushed) was there before tonight and keeps its history.
  if [ "${OPENED_OP-}" = "created" ] && [ -n "${OPENED_PR-}" ] && [ "$num" = "$OPENED_PR" ]; then
    tonight_pending="$num"
    continue
  fi

  reason=""
  case ",$checks," in
    *,FAILURE,* | *,TIMED_OUT,* | *,CANCELLED,* | *,ERROR,* | *,STARTUP_FAILURE,* | *,ACTION_REQUIRED,*)
      reason="failing check(s)"
      ;;
  esac
  # A PR GitHub itself will not merge is stuck, whatever its checks say. DIRTY
  # is a conflict; BLOCKED means a required check that never reported or a
  # required review, so `gh pr merge --auto` queues silently and never fires;
  # DRAFT will not merge either. Reducing this field to DIRTY/not-DIRTY let a
  # BLOCKED PR with every check green CLEAR the alarm, which is the false
  # all-clear this file calls worse than silence.
  case "$merge_state" in
    DIRTY)   reason="${reason:+$reason, }merge conflicts" ;;
    BLOCKED) reason="${reason:+$reason, }auto-merge cannot fire (mergeStateStatus BLOCKED)" ;;
    DRAFT)   reason="${reason:+$reason, }the PR is a draft" ;;
  esac
  [ -n "$noauto" ] && reason="${reason:+$reason, }auto-merge not enabled"

  if [ -n "$reason" ]; then
    blocked="${blocked}- #${num} (opened ${created}): ${title} — ${reason}"$'\n'
    continue
  fi

  # Not stuck. That is only HEALTHY if every check positively reported SUCCESS.
  #
  # Health is stated positively rather than as "none of these bad words".
  # Listing the pending states let STALE, NEUTRAL and SKIPPED through as
  # healthy, and auto-merge does not fire on those, so a PR that will sit
  # forever could clear the alarm. Anything that is not SUCCESS, including a
  # status GitHub has not invented yet, is unknown.
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
  # An explicit allow-list of the conclusions GitHub itself counts as passing
  # for a required check, so auto-merge WILL fire on them. Anything outside it,
  # including a conclusion GitHub has not invented yet, is unknown.
  #
  # SKIPPED and NEUTRAL are in the list on purpose. Reading health as
  # "SUCCESS only" is the safe-looking choice and the wrong one: a vendor PR
  # carrying one skipped required check would then read unknown every night, the
  # alarm could never clear, and that is defect 1 from this file's own header.
  # STALE is NOT in the list: it means the answer describes an older commit.
  # An empty token is named rather than dropped. The jq above should no longer
  # produce one, and this is the second lock on the same door: an empty line
  # survives `grep -v` and then vanishes in `paste`, so a list of nothing but
  # empties collapses to "" and reads as passing.
  not_passing=$(printf '%s' "$checks" | tr ',' '\n' | sed 's/^$/PENDING/' \
    | grep -vE '^(SUCCESS|SKIPPED|NEUTRAL)$' | sort -u | paste -sd, -)
  if [ -n "$not_passing" ]; then
    unknown="${unknown}- #${num}: not every check reported passing (${not_passing})"$'\n'
    continue
  fi
  # And healthy only if GitHub says it can merge NOW. Stated as an allow-list
  # for the same reason the check conclusions are: BEHIND (needs an update) and
  # UNKNOWN (mergeability still being computed) are neither stuck nor healthy,
  # and a value GitHub adds later must not read as healthy by default.
  case "$merge_state" in
    CLEAN | HAS_HOOKS | UNSTABLE) ;;
    *)
      unknown="${unknown}- #${num}: not reported mergeable (mergeStateStatus ${merge_state:-empty})"$'\n'
      continue
      ;;
  esac
  healthy=$((healthy + 1))
done <<< "$open_prs"

if [ -n "$blocked" ]; then
  count=$(printf '%s' "$blocked" | grep -c '^- ')
  lead="**${count} vendor refresh PR(s) are stuck.** While they are, the plugin is consuming NO new knowledge: every substrate change is piling up on the wrong side of the pipe."
  [ -n "$refresh_note" ] && lead="${refresh_note}"$'\n\n'"${lead}"
  body="${lead}"$'\n\n'"${blocked}"
  # One stuck PR plus one unreadable PR used to report only the stuck one, so a
  # reader acting on the alarm would have fixed half the queue and believed it
  # drained. The refresh-failed body below names them; this one must too.
  [ -n "$unknown" ] && body="${body}"$'\n'"These could not be read:"$'\n'"${unknown}"
  raise_alarm "$body"
  exit 0
fi

# Nothing in the queue is provably stuck, but the refresh itself did not
# complete. What could not be read is named rather than called clear.
if [ -n "$refresh_note" ]; then
  if [ -n "$unknown" ]; then
    raise_alarm "${refresh_note}"$'\n\n'"No open vendor PR is provably stuck; these could not be read:"$'\n'"${unknown}"
  else
    raise_alarm "${refresh_note}"$'\n\n'"No open vendor PR is stuck."
  fi
  exit 0
fi

if [ -n "$unknown" ]; then
  echo "vendor-queue-alarm: nothing is provably stuck, but the state of some PR(s) is UNKNOWN, so the alarm is left exactly as it is:"
  printf '%s' "$unknown"
  exit 0
fi

# Every open vendor PR positively reported success, and the refresh completed.
if [ -z "$may_clear" ]; then
  # may_clear is empty for two different reasons, and saying "unknown" for both
  # misreports the one where the status is perfectly well known.
  if [ -n "${REFRESH_OUTCOME-}" ]; then
    echo "vendor-queue-alarm: the queue reads healthy, but the refresh did not succeed (status: ${REFRESH_OUTCOME}), so the alarm is left exactly as it is."
  else
    echo "vendor-queue-alarm: the queue reads healthy, but no job status was passed in, so whether the refresh completed is unknown and the alarm is left exactly as it is."
  fi
  exit 0
fi
# "Every open vendor PR reports healthy" is a claim about PRs that were actually
# measured. Tonight's own PR is exempt (it cannot be stuck yet), so when it is
# the ONLY open one, nothing was measured and that sentence would be a false
# all-clear dressed as a reading.
if [ "$healthy" -gt 0 ] && [ -z "$tonight_pending" ]; then
  clear_alarm "✅ Every open vendor PR reports healthy, so the plugin is consuming knowledge again."
elif [ "$healthy" -gt 0 ]; then
  # Tonight's PR is exempt from the reading, so it is excluded from the claim
  # rather than folded into it: "every open PR" would be counting one that was
  # never measured.
  clear_alarm "✅ ${healthy} open vendor PR(s) report healthy, and tonight's PR #${tonight_pending} is too new to judge. The plugin is consuming knowledge again."
elif [ -n "$tonight_pending" ]; then
  # Nothing was measured at all: the only open PR is the one this run created.
  # Saying its checks "have not reported" would be a claim of its own, and they
  # may well have reported success; it was skipped for being too new, not for
  # being silent.
  clear_alarm "✅ The vendor queue has drained apart from tonight's PR #${tonight_pending}, which is too new to judge."
else
  clear_alarm "✅ The vendor queue has drained: no open vendor PRs remain."
fi
exit 0
