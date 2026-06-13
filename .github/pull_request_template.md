<!--
PR template for Actian Design System plugin.
The "Smoke evidence" section is mandatory for any PR that touches:
  - skills/component-brief/**
  - references/component-brief/push-patterns.md
  - any push-pattern, renderer, or migration ("Phase X") work
For docs-only / refactor / test-only changes, mark "Smoke evidence" as N/A
with a one-line justification. Do not delete the section.

See plugins/actian-design-system/MIGRATIONS.md for the parallel-change rule
that any pattern migration must follow.
-->

## Summary

<!-- 1-3 sentences: what changed, why, what user-visible behavior changes (if any). -->

## Test plan

<!-- Bulleted checklist. Mark [x] for what you did, [ ] for what's deferred. -->

- [ ] Full plugin test suite passes locally (`find tests -name '*.test.js' -print0 | xargs -0 "$NODE_BIN" --test`).
- [ ] Doc-conventions test passes (catches bare `node` / `$PLUGIN_ROOT` / unresolved `$NODE_BIN`).
- [ ] If touching push patterns or skills: ran the affected skill end-to-end on a real component.
- [ ] If touching tokens / registries: verified no schema-shape regressions in `docs/generated/*.json`.

## Smoke evidence

<!--
MANDATORY for any push-pattern / migration / "Phase X" / brief skill change.
For other changes, replace with: "N/A — <one-line reason>".

Show evidence the AI-side path was actually exercised, NOT just unit tests.
At minimum:
  - Component name + Figma node ID smoke-tested (e.g. Checkbox at FaBwMaNkvdrcQIo3fl8I4D#1067-2614).
  - Frame-name proof (e.g. metadata shows "Table (renderTable)" not generic "Frame").
  - Visual confirmation (link a screenshot or describe the cell heights).
  - Regression check: list at least one pre-existing surface that still works.

The v1.71.0 retro showed unit-test green doesn't prove AI adoption. This
section closes that gap.
-->

- **Component / node ID smoked:**
- **AI used the new path? (proof):**
- **Visual / metadata check:**
- **Pre-existing surface still works (proof):**

## Migration discipline

<!--
MANDATORY for any PR that retires, deletes, or supersedes an existing
push pattern or skill behavior. Otherwise: replace with "N/A".

Per MIGRATIONS.md (parallel-change rule):
  - Old path stays alive in docs and code.
  - New path is added in parallel.
  - Smoke proves AI adopts the new path on at least one real component.
  - Old path is marked deprecated (still functional) only after smoke proof.
  - Old path is deleted only after sustained adoption is observed.
-->

- [ ] Old path remains functional in this PR (not deleted).
- [ ] New path has smoke evidence (see section above).
- [ ] OR: documented exception to parallel-change rule with justification:

## Version bump

- [ ] `plugins/actian-design-system/.claude-plugin/plugin.json` bumped per
      calendar versioning `YYYY.MM.PATCH` (same month → PATCH+1; new month →
      `YYYY.MM.0`). From the repo root, run: `node
      plugins/actian-design-system/scripts/lib/bump-version.js
      plugins/actian-design-system/.claude-plugin/plugin.json calendar`. The
      `plugin.json bumped` CI check enforces the bump exists.

## Out-of-scope / follow-up

<!-- Anything intentionally deferred. Link to memory file or future PR. -->
