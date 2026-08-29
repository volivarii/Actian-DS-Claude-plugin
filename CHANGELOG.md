# Changelog

All notable changes to the Actian Design System plugin are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Since `2026.6.0` the plugin uses **calendar versioning** (`YYYY.MM.PATCH`) in
`plugins/actian-design-system/.claude-plugin/plugin.json`: same month bumps
**PATCH**, a new month resets to `YYYY.MM.0`. (Versions through `1.108.0` were
semver; `2026.6.0 > 1.108.0` numerically, so release ordering is preserved.)

Routine `vendor(knowledge): refresh to vX.Y.Z` commits are automated nightly
version bumps (PATCH within a month, or a `YYYY.MM.0` reset at a month boundary)
that propagate a pinned snapshot from
[`volivarii/actian-ds-knowledge`](https://github.com/volivarii/actian-ds-knowledge);
they are not individually listed below unless they changed user-facing behavior.

This file was seeded at v1.97.0 from the commit history; entries before that
are summarized at the release level.

## [Unreleased]

- **The fm-to-ds map cached a slug beside the immutable key it derives from, so a Figma rename made
  the map disagree with the registry.** ([#326](https://github.com/volivarii/Actian-DS-Claude-plugin/pull/326)) Each of the 24 mappings
  carried a `dsSlug` next to its `dsKey`, and `dsKey` is what survives a rename. Nothing at runtime
  read the cached field: `transform-to-hifi.js` has always resolved the current slug from `dsKey`,
  with a comment saying so. Only tests read it, so its entire effect was to go stale on a rename and
  fail a check whose message pointed at a `/sync-design-system` command that does not exist in this
  repo. The field is removed and both test readers derive from `dsKey` through
  `shared.slugFromKey`, which reads the vendored registry and therefore follows a rename by itself.
  Part 5 of the map test now asserts what matters, that the stable key still resolves to a registry
  slug, plus a guard that the cache cannot come back.

### Changed

- **The knowledge v0.34.150 breaking sync is carried through the plugin's own authored source.**
  ([#315](https://github.com/volivarii/Actian-DS-Claude-plugin/pull/315), upstream
  [knowledge #588](https://github.com/volivarii/actian-ds-knowledge/pull/588)) The vendored renderer
  moved with the sync; what follows it here is everything this repo authors on top of it.

  | upstream change | carried through |
  | --- | --- |
  | `sticky-footer` renamed to `action-bar` (same component, class `ds-action-bar`) | the A1 override list in `flow-share-a1-overrides.test.js`, the leaf and hostile-prop tests in `ds-html-map.test.js`, the fidelity `PILOT` in `scripts/quality/quality-gates-cli.js`, the Action category row in `references/context/companion-context.md` |
  | `card-for-items` retired with no successor | its leaf tests and the two `cardCatalog` goldens are deleted, its worked example leaves `ds-components-authoring.md`, its measured block leaves `convert-to-hifi/anatomy/catalog-slice.json`, and `recipes/flow/detail-view.json` composes content sections without it |
  | `alert-inline` and `identification-key` retired, `card` added | the blank-box baseline re-banked: the two retired slugs leave, `card` arrives at 0 blank boxes, total unchanged at 61 |
  | `database` icon glyph re-exported | the explorer chrome golden recaptured, one path token (`v.047z` to `v.046z`) |

  **`card-for-items` is not repointed at `card`.** The new `card` is the base container (Elevation
  and Size axes) and cannot express the retired Type axis (Item, Catalog, item type, Glossary type,
  Topic). The screen generator's vocabulary has no catalog item card; `card-for-perimeter`,
  `card-for-grouped-content` and `search-result-card` survive, and which of them a given screen needs
  is a product fact to check on that screen, not a default to alias in. The `hifi-push-emit` CLI
  proof, which only needs a keyed content card, uses `search-result-card`.

  **The `sticky-footer` flow archetype keeps its name.** `recipes/flow/sticky-footer.json` and the
  `form-create` + `sticky-footer` composition name a plugin recipe built from FM buttons, not the DS
  component, and knowledge's own recipes README keeps the same mention for the same reason.

  **One gate changed shape rather than number.** `appearance-variant-realdata.test.js` required
  `ceil(candidates * 0.94)` exercised, a floor that tolerates one structural-only skip only at 17 or
  more candidates. `card` joins as the 12th candidate with a single removal-only delta
  (`Elevation=Raised with shadow` sets `border: null`). The test now renders every candidate,
  removal deltas included: the expected change is computed by the renderer's own exported
  `resolveNodeAppearance` and `appearanceToDecls`, a declaration the delta adds must occur more
  often in the variant render than in the base render and one it removes must occur less often, a
  glyph swap must change the markup, and an entry that produces no observable delta fails by name.
  The population is guarded by a file scan independent of the tree walk, so a walk that stops short
  fails naming the slugs it dropped (12 candidates to 4 under mutation), and a doc whose delta is
  nulled fails as unobservable (`actian-pyramid (Color=White)` under mutation).

  Also: the built-leaf props section of `ds-components-authoring.md` regenerated from the render
  contract (57 slugs, 173 bindings), its authorable count corrected to the registry's 71, and the
  `fm-to-ds-map.json` alert note trimmed to the current axis.

  **Review follow-through.** The orphan-case gate in `ds-coverage.test.js` now derives the
  authorable set from the registry's `section === "Components"` (the hand list of non-authorable
  categories missed `Third-party logos`, so 167 slugs passed as authorable against 71 real
  components and a `case "snowflake"` would have been accepted). `doc-counts.js` now derives and
  stamps the per-category counts in `companion-context.md`, the foundations JSON count (79) and the
  app-context pattern and entity counts, so the nightly corrects them; the `llms.txt` guideline link
  points at `components/dist/guidelines` and the evicted presentation guide line is gone. The icon
  list in `ds-components-authoring.md` is generated from the vendored `icons.json` by
  `render-authoring-table.js` (the hand copy named 12 slugs that do not exist), its worked examples
  use the registry's axes and values (`Breakpoints=XL`, `Selection=Unchecked`, `Type=Default` for
  tags, `size`/`history` for the AI steward) and a new gate joins every example's `variant` string
  against the registry. `quality-gates-cli.js` throws at startup when a `PILOT` slug is not in
  `BUILT_SLUGS`. The nightly vendor workflow also runs `render-authoring-props.js` and
  `ds-coverage-report.js --write-baseline` (which refuses a regression) and commits the baseline. A
  card-family test renders each built card leaf with a hostile heading and asserts the escape.
  `figma-push-patterns.md`, `catalog-slice.json`, the `search-results-ai` recipe notes and the
  chrome golden note state the current library (`Action bar`, `Breakpoints` XL and L,
  `search-result-card` built, tag `Type` axis).

### Removed

- **The vendored media oracles, 6.9 MB in every install and 34 MB of git history, bought two
  unactioned failure reports and zero verifications.** ([#314](https://github.com/volivarii/Actian-DS-Claude-plugin/pull/314))
  `vendor/components/dist/media/<slug>/` held 365 `.webp` reference screenshots across 183 components.
  One caller in this repo read them: `scripts/fidelity/run-fidelity.js`, through
  `PATHS.components.media()` / `mediaDefault()`, over a hardcoded 19-slug `PILOT`, in a `pr-checks`
  job carrying `continue-on-error: true`. Nothing in `skills/`, `agents/`, `recipes/`, `references/`
  or `templates/` touched them.

  **Measured before and after, on the same tree.** The visual gate reported
  `2 fail, 17 skipped, 0 verified` with all 183 components' oracles present, and now reports
  `0 fail, 19 skipped, 0 verified`. The DS Quality Score is 87/100 either way, because `visual` is
  "not scored" in both. What shipped bought two failure reports that could not red a build, against
  zero verified components.

  **The cost was not the 6.9 MB.** Across history the media is 1041 unique blobs holding 34.3 MB
  against a 59 MB pack. WebP does not delta-compress, so every nightly re-vendor stored fresh copies:
  a fresh install was 39 MB and a live one that had taken nightly updates had reached 86 MB, of which
  57 MB was `.git`. The marketplace clone is shallow, but updates arrive by fetch and a shallow clone
  only cuts history at clone time, so the number a user lived with grew every night.

  **They could not be dropped upstream.** `vendor-include.json` is shared with the docs site, which
  genuinely renders these files onto component pages (`scripts/generate-component-pages.cjs` mirrors
  them into `public/media/`, `src/components/media-asset-resolver.mjs` resolves them; 549 entries
  vendored there). The substrate's `vendor-exclude.json` seam is repo-global for the same reason. So
  the plugin prunes its own copy in `vendor-snapshot.js`'s existing `postVendorHook`, after the copy
  and before `[vendor] OK`. The prune is scoped to the `.webp` oracles and removes a slug directory
  only once emptied, so a future per-component asset under `components/dist/media` is not taken with
  them; `_index.json` and `README.md` stay, because `paths-manifest.json` declares
  `components.media.index` as a path entry. A failing prune warns and sets a non-zero exit rather
  than throwing, matching the mirror step: an unguarded throw would abort before the mirrors
  regenerate, which is the stale-mirror state `postVendorHook` was introduced to prevent.

  **The fidelity harness is now inert in this repo, and that is recorded rather than hidden.** Its
  integration test already carried the skip reason `"default.webp oracles not vendored"` and now
  always takes it, and the CI summary states `19 skipped, 0 verified` in plain words. Deciding the
  harness's home is [#310](https://github.com/volivarii/Actian-DS-Claude-plugin/issues/310) step 2:
  it pixel-diffs knowledge's renderer against knowledge's own oracle, from inside a consumer, and
  both halves belong to the producer.

  `pruneMediaOracles(mediaDir)` requires its directory and never defaults to one. A prune helper that
  can fall back to a repo-relative path is one bad call away from deleting committed files, which has
  happened in this ecosystem before.

### Fixed

- **The vendor alarm read an empty PR queue as healthy, so a refresh that died before opening a PR
  reported success on the night the plugin stopped consuming knowledge.** ([#323](https://github.com/volivarii/Actian-DS-Claude-plugin/pull/323), plugin #317) On 2026-08-27 the refresh failed at "Re-record the blank-box baseline" and the
  four steps after it, including the ones that open and auto-merge the PR, were skipped;
  `vendor-queue-alarm.sh`, which decides stuck, healthy or unknown by inspecting open vendor PRs,
  found none and cleared. A queue cannot show a PR that was never opened, so the step now passes the
  job's own status (`REFRESH_OUTCOME: ${{ job.status }}`), the run URL, and the number and operation
  (created or updated) of the PR carrying tonight's refresh when one exists. A failed refresh raises
  or updates the alarm and can never clear it, saying which PR carries tonight's refresh or that the
  PR step reported none. That wording is deliberate: `create-pull-request` sets its outputs last, so
  an empty output is not proof no PR exists, and the alarm states what is known rather than that the
  plugin consumed nothing. If that PR had already merged, nothing is raised and the run summary says
  so; whether it merged is read with gh's exit code, so a 502 is unknown rather than "not merged",
  which would put a false title on a night the knowledge landed. The queue is read on every verdict,
  because the pile is the signal: an older stuck PR is named in the same alarm, what could not be
  read is named in that same body rather than dropped, and a green vendor PR with auto-merge not
  enabled is stuck, since it will never merge. A PR is healthy only when every check reported a
  conclusion on an explicit passing list (`SUCCESS`, `SKIPPED`, `NEUTRAL`, the ones GitHub itself
  counts as passing for a required check, so auto-merge fires on them); `STALE`, which describes an
  older commit, and anything GitHub adds later are unknown. The list is positive on purpose, but
  reading it as `SUCCESS` only would have been the opposite mistake: a vendor PR carrying one skipped
  required check would read unknown every night and the alarm could never clear. The conclusion is
  read as the first NON-EMPTY of `.conclusion`, `.state`, `PENDING`, not through `//`: jq's `//`
  falls through on null and false but not on `""`, and gh reports a check that is still running as
  `"conclusion": ""` with no `.state` key, so three running checks joined to `,,`, which is not empty
  and holds no non-passing token. The PR read healthy and cleared the alarm while its checks were
  still running, which is defect 2 from the script's own header. An empty token is also named rather
  than dropped on the shell side, since an empty line survives `grep -v` and then vanishes in
  `paste`. Only the PR this run created is exempt from "pending is
  unknown", so a transient alarm no longer clears only on a night nothing was published; an updated
  PR keeps its history. When that exempt PR is the only one open, nothing was measured, so the clear
  says the queue drained apart from tonight's PR rather than claiming every PR reports healthy. A
  cancelled run is treated as a failed refresh: a cancel is a timeout, a concurrency cancel or a lost
  runner as often as it is a human, and its own quiet verdict let a nightly that hangs every night go
  silent under a status word. An absent status never clears. A failed refresh whose queue cannot be
  read is raised rather than only logged, since the refresh is known to have failed whatever the
  queue says. The alarm is raised from one path for every cause, one headline and one note are
  assembled per night so the run summary and the issue body cannot disagree, and when gh cannot list,
  create or comment, the reason goes to the run summary instead of nowhere. Each PR's checks, merge
  state and auto-merge are read in one gh call rather than three, joined on `|` rather than a tab,
  since two of the four fields are empty on a healthy PR and `read` collapses whitespace delimiters.
  A PR is healthy only if GitHub reports it mergeable now: `CLEAN`, `HAS_HOOKS` or `UNSTABLE`.
  `mergeStateStatus` was reduced to conflicts-or-not, so `BLOCKED`, which means a required check that
  never reported or a required review, cleared the alarm with every check green, though `gh pr merge
  --auto` queues silently on it and never fires. `BLOCKED` and `DRAFT` are stuck; `BEHIND` and
  `UNKNOWN` are neither, so they are unknown. The queue is read with `--limit 100`, because gh pages
  at 30 newest-first and a pile is exactly when it exceeds that window, so the oldest and most stuck
  fell outside it. Tonight's own PR is exempt from every stuck test rather than only from the
  pending-checks reading: `gh pr merge --auto` runs in the step before, so the lag before
  `autoMergeRequest` appears raised an alarm about the one PR that had just succeeded. The test stub
  now emits the JSON gh really returns and lets the script's own `--jq` run through real jq: it used
  to answer with the already-joined row, so no test ever executed the filter and every semantic
  element of it, including the empty-conclusion fallback above, could be deleted with the suite
  green. A PR that is no longer open is not in the queue: a vendor PR carries auto-merge, so one can merge
  between the listing and its own read, and it would then report no auto-merge request and be called
  stuck for doing exactly what it was built to do. The test that pins the questions asked reads the
  `--json` field list itself rather than the command line, because every field name also appears in
  the `--jq` filter, so dropping one from `--json` left the suite green while jq read the absent
  field as null for every PR, which would have fired the alarm every night.
  The script also writes the failure line of the run
  summary, which used to say "no changes" for a dead refresh; the Summarize step keeps only the
  success lines, guarded on success. The contract is asserted against the workflow YAML step by step,
  including `if: always()` and the four inputs by their expressions, with the step slice bounded by
  the step's own indent and asserted to hold exactly one step, so an assertion cannot pass against a
  slice that quietly ran to the end of the file.

- **A component new to the plugin was reported as "demoted to a bare chip", and the false verdict
  halted all knowledge consumption.** ([#321](https://github.com/volivarii/Actian-DS-Claude-plugin/pull/321), plugin #318) `dropdown`
  arrived in knowledge v0.34.155 as a real slot-based menu with no render leaf yet, so it renders as a
  chip. `compareBlankBoxes()` listed every chip absent from the baseline as a demotion, because the
  baseline never recorded which slugs it had seen, and `--write-baseline` refused to bank it; the
  steps that open the PR skipped, and the plugin stayed at v0.34.153 while knowledge shipped .154 to
  .156. The bank rule is now one sentence: only a SAME-NAME loss refuses, a slug emitting more boxes
  than recorded or a slug that rendered real markup under that name and renders a bare chip now;
  every other change is a named row and banks, because a refusal before the PR opens is this outage
  and the vendor job cannot answer a prompt. So the `--accept-new-blanks` flag is gone with the
  refusal it served. The baseline gains `builtSlugs`, because built slugs have no per-slug row; a
  record without it fails closed. A rename the vendored identity ledger knows (read through `PATHS`,
  failing closed on a ledger that does not parse) is applied to the baseline before anything is
  compared, so the one set of rules then compares name to name and a rename needs no rule of its
  own, even while the old name lingers as a built leaf; it is not applied when the baseline already
  carries the new name, when the new name does not exist tonight, or when two applicable retired
  names claim one current slug; while the old name is still a measured row, the new name's count
  is compared to that row. Only a same-name change refuses: a slug's own count rising, or real markup becoming a
  chip under the same name. Everything the ledger carries over is named and banks, a chip under a
  renamed name included, because a knowledge rename must never halt the intake (the very next
  refresh, v0.34.156, renames two built leaves whose new names render from anatomy with a few boxes).
  Only a re-key, which leaves no trail, is still flagged as a vanished-plus-newcomer pair for a
  reader. A built slug that falls back to the generic renderer is the named `leafDropped` row, with
  its boxes, and banks. The comparison also names a built slug gone from the vocabulary, a
  measured slug gone, a measured slug promoted to built, a leaf built tonight, fewer boxes, and a
  chip that stopped being one; a slug that demotes to a chip is no longer also an improvement;
  `clean` is derived from the rows themselves; a record without `builtSlugs` says so in its refusal,
  and a measurement without it reads as no change in what is built. Everything banked comes from
  one place (`summarizeBank`) and reaches stdout, the job summary and, through the step's output, the
  vendor PR body; a refusal reaches the job summary too; the bank step runs only on a night the
  vendor changed, so a bank no PR carries is never announced. `authorableSlugs()` lists each slug
  once; a chip is recognised by its root element, not by a chip nested in real markup; a render that
  produces nothing (empty, not a string, or thrown) is a chip; the command refuses a record it cannot
  parse instead of overwriting it, degrades with a note when the vendored client ships no rename
  reader, and takes `BLANK_BOX_BASELINE` and `BLANK_BOX_LEDGER` so the tests that drive it never
  touch a committed or vendored file. Two existing tests asserted the wrong reading
  (their "demotion" baselines had never measured the slug) and now describe a real demotion.
  A hand-authored leaf that stops applying banks whichever way the slug falls: onto an anatomy doc,
  or, with no doc to catch it, onto a bare chip. Both are one upstream event, the leaves live in the
  vendored renderer, and refusing the second halted the nightly on a slug no maintainer of this repo
  can fix, gated only on whether knowledge happened to ship an anatomy doc for it. The chip fall is
  a real loss, so it is worded as one (`LOST REAL MARKUP`) rather than filed with the ordinary
  fallbacks. The rename ambiguity guard counts claims per class: a retired name still measured
  tonight is not a rival claimant, because it is still there under its own name, but two names that
  both linger toward one slug leave no way to say whose row that slug's count belongs to, so neither
  is applied and the slug reads as a newcomer. Counting the two classes together let the order of
  `previousSlugs`, which is just the order a component was renamed in, decide whether a night banked
  or reported a regression and halted. Measuring now refuses outright when the vendored renderer
  exports no `BUILT_SLUGS`: an empty export would skip no slug, measure every built one as if it had
  never been built, and bank a record whose `builtSlugs` is `[]`, which the fail-closed path cannot
  catch because that record still has the field. The drift failure words each class once, from
  `summarizeBank`, instead of naming every improvement, newcomer, promotion and departure a second
  time under a second heading. A name the ledger retired that is still measured tonight
  gets its own row, naming the retired name it answers to, rather than reporting a component the
  baseline has measured for weeks as a newcomer; the row is worded as a loss only when the retired
  name rendered real markup, so a chip renamed to a chip no longer claims something was lost. A component that
  lost real markup is reported once, from one place, whichever of the three routes it arrived by: a
  retired leaf that fell to a chip, a carried-over rename whose new name is a chip, or a rename the
  ledger could not carry over. Worded separately they printed two contradictory lines about one
  component, and left the commonest shape of all reported as a routine rename note with no counts at
  all: an ordinary rename whose new name has no leaf, where the same-name path suppresses the fall as
  a demotion and the chip class excludes a renamed slug, so the fall appeared nowhere. Each line
  names the retired name, the boxes it fell from, and which of the three causes applies. Left as
  found, filed as plugin #319: `authorableSlugs()` reads every table in the authoring file, so a leaf
  keyed to a slug the registry has renamed never leaves the vocabulary. Left as found, filed as
  plugin #320: with the new-blank refusal gone, the blank-box total has no bound on the nightly path,
  because the vendor job re-banks before any test runs, so a corpus that grows by a few boxes a night
  is reported only as a line in an auto-merged PR body.

- **The fidelity ledger named a reference image that was never compared, and after the prune above it
  would have named a missing file on every row.** ([#314](https://github.com/volivarii/Actian-DS-Claude-plugin/pull/314))
  `ledgerRow()` in `scripts/fidelity/run-fidelity.js` emitted
  `reference.media: ["components/dist/media/<slug>/default.webp"]` even when `chosenOracle` was null,
  falling back to that literal string. Its own comment states the field exists "so the recorded
  reference can never disagree with what was actually compared". It now emits `[]` when nothing was
  compared, so the ledger and the CI artifact cite only oracles that were actually diffed.

- **A test asserted that a captured recipe is always named for the pattern it composes, which was true
  only by coincidence, and it blocked the substrate's first real use of the declared join.**
  ([#PR](_PR link added at open_)) knowledge v0.34.145 shipped `studio-quick-edit-drawer`, which
  declares `patterns: ["right-sliding-drawer"]`: Studio and Explorer draw the same 550px right-hand
  drawer with different bodies, so one pattern now has two captures told apart by `apps`. The nightly
  vendor PR went red on `assert.strictEqual(p.pageRecipe, p.slug)` and stopped auto-merging, so the
  capture reached no consumer.

  **It was the assertion that was wrong, not the capture.** `patterns` is a DECLARED field precisely so
  a recipe can compose a pattern it is not named for, `resolve-patterns.js` says so in as many words
  ("the declared link and wins"), and the same suite already contained "serves every pattern a recipe
  declares, not just the one it is named for" and "joins on the recipe's own slug when it declares no
  patterns", the second of which proves slug-matching is the FALLBACK rather than the rule. The suite
  asserted both that a recipe may compose a pattern it is not named for and that it never does; the
  first capture to exercise the design decided which one it meant.

  The check now asserts the JOIN rather than the NAME: the recipe a pattern points at must DECLARE that
  pattern (with the same slug fallback the resolver uses) and CLAIM that app. Verified not to be
  tautological by planting a wrong pairing, which it rejects. A new test pins the capability directly,
  one pattern with two captures resolving per app, and it is written against a synthetic index rather
  than the vendored substrate so it holds at every vendored version instead of only after a given sync.
  Nothing pinned that before, which is why a green suite broke on the first recipe to use the join as
  designed.

### Added

- **The generator now composes from a captured page recipe where the substrate has one, instead of
  always falling back to a generic flow archetype.**
  `resolve-patterns.js` emits a new `pageRecipe` field on every pattern: the slug of the captured
  composition that declares it, or `null`. The join is declared rather than scored, because a recipe
  in `app-context/dist/recipes/` names the pattern(s) it composes, so this is a lookup and never a
  ranking. One inference remains and is marked as such in the code: `patterns` is optional in the
  schema, so a capture omitting it falls back to joining on its own slug. It is scoped by the recipe's own `apps`, since a pattern can live in two apps while the
  captured page exists in only one.

  The two artefacts are not interchangeable. A flow archetype is a generic shape the plugin owns; a
  page recipe was composed from the running product and carries provenance (`derivedFrom` names the
  surface, the capture date and the product build) that an archetype cannot have. The measured gap:
  across all twelve archetypes there are 63 component instances, 9 of them placeholders, while the two
  captures hold 56 with one. On the two patterns that have both, `faceted-browse` was being offered
  `browse-search` (9 instances, 3 placeholders) in place of a capture of that literal page (34, none).

  Both captures shipped in knowledge v0.34.137 on 2026-08-18 and had been read by nothing in either
  consumer since. The tag ranking was reporting `decisive` for exactly those two patterns, so the
  fallback was most confident where it was least right.

  Classification is deliberately unchanged: `matchedRecipe` still names the archetype. The capture
  supplies the composition, not the tier, and `validate-flow-data.js` keys its detail-screen and
  pattern-grounding checks on archetype IDs, so redefining that field would have silenced both.

  Reaches consumers through `screen-generator.md` and `generate-flow/SKILL.md`, which now carry the
  precedence rule and the full pattern shape.

  A capture is preferred for its STRUCTURE, and that is not the same as its content being ready.
  Because it was taken from a real screen it speaks the product's vocabulary rather than the design
  system's: composed verbatim, `faceted-browse` raises 7 terminology and 2 avoid-word findings and
  `asset-detail-360` raises 9 and 1, where both archetypes raise none. Two are blocking rather than
  advisory (`placeholder-text` on a bare `"Description"`, and `missing-required-override` on
  `fmButton`). `screen-generator.md` now names all of this beside the `{{token}}` substitution rule,
  since nothing downstream catches an unsubstituted token.

  The capture layer reports itself, because the ways it can fail are all silent ones. The CLI prints
  `page recipes for <app>: N captured, M joined, K joined nothing`, since the upstream derive validates
  that a named pattern *exists* but not that it is scoped to the recipe's app, so a capture can ship
  green and be read by nobody. Two captures claiming one pattern warn and resolve by sorted slug rather
  than by directory order, which is the tie defect the archetype ranking was already rewritten to
  remove. A `no match` line now names any capture the pattern holds. A vendor snapshot predating the
  `appContextRecipes` collection says so and degrades, instead of throwing a `TypeError` out of
  `resolvePatterns` and taking the whole glossary build down with it.

### Fixed

- **Recipe selection reads the substrate's authored pattern tags and ranks by overlap size, instead of
  intersecting tags invented from a slug.** ([#300](https://github.com/volivarii/Actian-DS-Claude-plugin/issues/300))
  `resolve-patterns.js` derived a pattern's tags by splitting its slug on hyphens, so the join to
  `recipes/flow/_index.json` was a naming coincidence rather than a semantic link. Two things fell out of
  that, and better words could not have fixed either: `faceted-browse` reached both `table-list` and
  `browse-search` on the single shared word "browse", and a set-membership test cannot separate them, so
  the tie resolved to whichever came first. That is how a Studio Catalog request produced a two-pane CRUD
  table at confidence 0.93. Separately, **11 of the 25 Studio patterns matched no recipe at all**, with no
  warning anywhere in the pipeline.

  Knowledge #560 authored real tags on 30 of the 31 patterns, and they arrived here with the v0.34.141
  vendor snapshot. Patterns now score on those, with the slug split kept only as a fallback for a pattern
  authored before tags existed. **Ranking by overlap size is the other half**: the same tags under the old
  boolean join cut silence but raised ambiguity, so the operator was the defect, not the vocabulary.

  Measured against the 25 Studio patterns, split by how much evidence each result actually rests on.
  A first version of this entry reported "8 decisive to 13", which counted a single shared word as a
  decision on both sides and so flattered both:

  | | 2+ shared tags | exactly 1 | tied | no match |
  | --- | --- | --- | --- | --- |
  | slug words, boolean join | **1** | 7 | 6 | 11 |
  | authored tags, ranked | **9** | 8 | **2** | **6** |

  So the real move is that results resting on more than a coincidence go from **1 to 9**, ambiguity
  from 6 to 2, and silence from 11 to 6. `faceted-browse` scores `browse-search` 4 against `table-list`
  1 and resolves decisively.

  **The decision belongs to the pattern, not to the screen.** `_glossary.patterns` holds every
  app-scoped pattern with its own decision, and a flow has many screens, so a generator decides which
  pattern the screen it is building actually realizes and reads only that one. An earlier version of the
  instruction read as per-screen, which would have relocated the very failure this fixes: `faceted-browse`
  carries a decisive `browse-search`, and a "Create data product" form screen in the same Studio flow must
  not inherit it. If no pattern describes the screen there is no recipe guidance, and the screen's own
  purpose governs as before.

    **Compositions are never ranked.** `recipes/flow/_index.json` holds two `kind: composition` entries,
  which are a separate branch of the pipeline: `screen-generator.md` defines a single recipe as an entry
  without that key, and `flow-data.schema.json` says `matchedRecipe` is `null` when tier 2 is a
  composition. Ranking them was wrong twice over. It invited the generator to set `matchedRecipe` to a
  value the schema forbids, and because those two carry 6 and 9 tags against 5 for every base recipe,
  overlap size favoured them on volume alone: four of the six remaining Studio ties were a composition
  sharing one tag.

  **A single shared tag is reported as `weak`, not `decisive`.** Eight of Studio's seventeen sole
  winners rest on one word, including `metamodel-designer`, a split drag-drop editor, reaching
  `data-visualization` on "canvas" alone. Calling that decisive would have relabelled the defect rather
  than fixed it. It is still reported as the best guess, with the generator told to read the pattern
  description before taking it.

  `recipe.candidates` always means every archetype at the top score. It briefly meant that on a tie and
  the top three otherwise, so a consumer told to choose between candidates saw `browse-search(4)` beside
  `table-list(1)` with nothing marking the loser. The slug fallback is normalized like the authored path,
  so the tags reported are the tags scored, and an explicitly passed `null` recipe index now means "no
  recipes" rather than falling through to the shipped one.

    Tags are also matched case-insensitively and deduped, because `validate-flow-data.js` lowercases both
  sides of the same vocabulary and nothing validates casing in the substrate: an authored `"Table"`
  would have scored `no-match` here while the validator still saw an overlap. Deduped because the score
  is an overlap count, so `["search","search"]` would otherwise beat a rival sharing two real tags.

  **A tie and a miss are both reported rather than silently resolved.** Each pattern carries a `recipe`
  decision of `decisive`, `weak`, `tie` or `no-match`; a tie returns `archetype: null` with every candidate at the
  top score named, because a stable arbitrary pick is still arbitrary. The CLI prints ties, misses and
  any pattern still scoring on slug words to stderr, leaving stdout a parseable object. `SKILL.md` and
  `agents/screen-generator.md` now tell the generator to take the ranked decision rather than match tags
  itself, and what to do when there isn't one.

  One defect found while testing this rather than by reading it: `tagSource` and the tags themselves were
  computed from two separate copies of the same condition, so `tags: ["", ""]` reported the pattern as
  authored while leaving it with no tags at all, scoring against nothing. The source is derived from the
  tags actually used now.

### Added

- **The built-leaf props reference is generated from the substrate's render contract, so the screen
  generator finally knows what to call each component's content.** The vocabulary table was already
  generated and already correct at 58 BUILT slugs; the section beneath it was not. Its prose said
  *"the following 19 slugs have real HTML leaf renderers"*, contradicting the table directly above
  it, and it described **45** `(slug, prop)` bindings against the **177** the renderer exposes. So a
  component could be known-renderable while none of its content had a documented name, and that
  failure is silent by construction: a prop the renderer does not read is not an error, it renders an
  empty slot. The section now covers all 58 slugs with each prop's fallback, every variant axis with
  its values, and the values the renderer draws identically to another (`side-nav` now warns that
  `Studio` renders as `Admin`). Hand-authored worked examples stay hand-authored below the block: the
  contract says what is accepted, a person still says what is good.

### Fixed

- **The vendored renderer had started inventing content for props a caller deliberately omits, and the
  test that caught it was one keystroke from being regenerated away.**
  ([#291](https://github.com/volivarii/Actian-DS-Claude-plugin/pull/291)) The vendored snapshot moves to
  knowledge **v0.34.135**, which closes a single defect class opened three versions earlier. **v0.34.133**
  gave the renderer literal fallbacks for 13 props while filling empty slots in its own specimen gallery,
  **v0.34.134** moved twelve of them into a specimen layer only the gallery reads, and **v0.34.135** fixed
  the thirteenth and added two guards that take no hand-maintained list of slots. It matters more here than
  upstream: this plugin generates real product screens with the same vendored renderer that draws that
  gallery, so a value chosen to make the gallery look complete appeared on every generated screen.

  **No golden was regenerated and no test was changed.** The suite read 1997 pass / 0 fail on v0.34.132,
  13 failures on v0.34.133 (3 behavioural, 9 goldens, 1 derived document), 3 on v0.34.134 with the
  behavioural ones green again untouched, 1 on v0.34.135, and **1997 pass / 0 fail** here. Two of the 13
  were not drift: `stewardAnswered` supplies `Title`, `Insight`, `Source` and `Confidence` and
  deliberately not `Context`, and it had begun rendering a context chip nobody asked for. That assertion
  is what located the thirteenth slot, so a blind regeneration would have laundered a live product
  regression into a green build.

  **The only plugin-side change is a regenerated reference**,
  `references/generate-flow/ds-components-authoring.md`, rebuilt by its own
  `scripts/renderers/render-authoring-props.js` because the upstream render contract legitimately changed.
  Its built-leaf props section now publishes a `default` only where the renderer genuinely falls back on
  one, so `alert-banner.Message`, `stepper.Step`, `tooltip.Body`, `card-for-items.Body`,
  `chat-with-ai-steward.Insight`, `notification.Message` and both lineage `Item type initials` gain one,
  while `chat-with-ai-steward.Context`, `notification.Action`, `stepper.Body`, `page-header.Description`
  and the rest correctly show none. For a flow author the table now separates what the renderer supplies
  from what is theirs to fill. The snapshot also brings a new upstream artifact,
  `vendor/components/render/dist/sparse-render.json` and its schema, which backs knowledge's own ratchet
  and has no plugin-side consumer today by design.

- **The nightly vendor sync had been unable to advance for three days, and reported success the whole
  time.** ([#291](https://github.com/volivarii/Actian-DS-Claude-plugin/pull/291))
  `vendored.json#knowledge_repo_version_range` was `"<1.0.0"` from at least 07-21 through 08-13, so each
  nightly resolved the newest knowledge tag and the snapshot advanced on its own. Commit `4f1fb878`
  replaced it with `"0.34.129"`, the exact version it had just resolved, and the hand-carried refreshes
  after it kept that shape. Three nightlies then re-resolved the version the repo already had (#288 and
  #290 merged, #293 auto-merged), and each still bumped the marketplace version, because the workflow's
  change guard diffs `vendored.json`, whose `vendored_at` timestamp is rewritten on every run. So three
  CalVer releases in three days carried no new content, and that churn is what collided with this PR's own
  bump twice in one morning. The range is back to `"<1.0.0"`, so adoption resumes.

  The freeze was never undetected: `notifyIfNewerAvailable` warned on every one of those runs
  (`Newer knowledge release available: v0.34.135 ... resolves to v0.34.132`). It is the right sentence in a
  place nobody reads, an annotation inside a green nightly whose PR title already claims a refresh. That
  warning's visibility and the change guard are filed together as
  [#294](https://github.com/volivarii/Actian-DS-Claude-plugin/issues/294), since both change what the
  nightly does to `main` unattended and want their own review.

- **Four hand-written copies of one retired category slug, across three repos.** `form-input-selection`
  was renamed to `form` upstream (knowledge #541) after the Figma page was retitled. Each copy read
  the real vendored dist, so each would strand on the rename. All now read the shipped dist.
- **Five components were reported as having lost their root appearance and had lost nothing.** Their
  anatomy is byte-identical across the version range; the taxonomy repair moved them from
  `Foundations` into `Components`, so the gate examined them for the first time. Allowlisted per slug
  with a reason matching what each capture actually shows.
- **The blank-box baseline moved 44 to 61, banked with its reason.** Nothing regressed: all 8
  pre-existing per-slug entries are unchanged. The baseline gained **7** slugs, of which five arrive
  with blanks (`checkbox-group` 5, `radio-group` 5, `text-area` 3, `field` 2, `textfield-buttons` 2)
  and two at zero (`label`, `message`). They overlap only partly with the five allowlisted above, so
  they are not "the same five". All seven were always blank and merely out of scope until the
  taxonomy repair filed them as components; their anatomy is byte-identical across the whole version
  range. This resizes the gray-box picture from *"42 of 45 boxes are the two charts"* to **42 of 61**,
  with 17 in form-base components the count could not previously see.


### Fixed
- **A breaking design-system change folded five tag components into one, and every one of the 15 failures
  it caused was in what the plugin's tests CLAIMED, not in what the renderer does.**
  ([#PR](_PR link added at open_)) knowledge **v0.34.124** replaced `tag-default`'s `Color` axis with a
  14-value `Type` axis (`Default`, `Catalog`, `Shared`, `Stage-1..8`, `Status-error`/`-warning`/`-success`),
  deleted `tag-catalog`, `tag-shared`, `tag-stage`, `tag-status` and `tag-glossary-item-type`, and renamed
  `tag-catalog-item-type` to `tag-item-type` and `radio-button-card` to `radio-card`. **v0.34.125** then
  dropped the ruleless `ds-tag--with-icon` modifier at both of its emit sites (knowledge #527). The
  vendored snapshot moves to v0.34.125, so this catch-up covers both. No renderer or CSS code changed here:
  since the relocation the plugin consumes knowledge's renderer from `vendor/`, so the only thing that
  could disagree was the test suite, and it did in nine places.

  **The loud failures were the safe half.** An unknown axis does not throw: the leaf shape-clamps
  `v.Type`, so `"Color=Default"` rendered a bare `<span class="ds-tag">` with no modifier class at all,
  and every substring assertion except the class one still passed. Two tests were reading a pill that had
  silently lost its paint, and two golden fixtures were pointing at a slug that no longer exists, where a
  blind `UPDATE_GOLDENS=1` would have banked a `gracefulChip()` fallback and called it a tag. Specimens
  are now derived from the anatomy doc the renderer itself reads, via four additions to
  `tests/helpers/appearance-specimen.js`, so no test names `Color` or `Type`.

  **Two gates came back stronger rather than merely unstuck.** The `ds-base.css` check asserted one
  hardcoded hue (`.ds-tag--pink`); it now asserts that every `Type` the capture paints differently from
  the base has a rule, all 12 of them, and names any that do not. It is verified non-tautological by
  mutation. Its converse is deliberately not asserted, because `Type=Default` and `Type=Stage-1` carry no
  captured delta and inventing a hue for them is the move that shipped a white-on-white segmented control.
  The deliverable test pinned a whole span string, which made it an accidental icon golden that broke when
  the leading icon became default-true; it now captures the opening tag's attribute tail, which is its
  real subject.

  **A real defect closed on the way through.** `tag-status`'s goldens recorded label-only pills because
  the 2026-07 icon rework deleted `checkmark-outline` and `misuse-outline`, and the note in the file asked
  for a re-baseline with the icon once glyphs existed. The fold-in supplies live `success-filled` and
  `error-filled` glyphs, so both now carry real geometry. Separately, the leading icon is default-TRUE and
  the captured default variant carries the icon child, so tags rendered from a bare `Label` gain the icon
  they always should have had. All 13 tag backgrounds were checked rather than diffed: black text on every
  one clears AAA, worst `Type=Shared` `#cbe3ff` at 15.97.

  **And two hand-maintained records moved for real reasons.** The blank-box baseline goes 45 to 44:
  `radio-button-card: 1` to `radio-card: 1`, a rename, plus `checkbox-card: 2` to `1`, which is **not an
  improvement**. That component's vendored anatomy collapsed from 11 nodes to 3 in the same sync
  (`Checkbox, content`, `Content`, `Option label, digram, icon`, `Digram`, `Icon`, `Label`,
  `Description` and `Vector` all
  gone, with `radio-card` showing the matching `Description` to `Slot` redesign), so the box did not get
  fixed, its subject disappeared. It is banked as a shrunken subject, because calling it progress is the
  fossil-measurement pattern this repo has already been burned by.

  Worth recording about the gate itself: `bankable()` refuses only on `regressions` and chip demotions. A
  rename is classified `disappeared` plus `unlisted`, neither of which it checks, so a successful write is
  **not** evidence that a renamed slug's count is unchanged. It does hold here (1 equals 1, total 45 to 44,
  nothing up), but that was established by reading the diff, not by the writer agreeing to run.
  README's doc-count denylist banned `"322 DS Kit"` from when DS Kit grew
  past 322; the fold-in deleted five components, DS Kit came back down to 322, and the guard called the
  correct figure stale. That is the second time that list has fired against the truth, and the new part is
  the direction: a count denylist can be re-entered from below, so both remaining count literals are gone.
  The `contains` side already asserts the derived value for each.

- **Two tests hardcoded facts that a Figma redesign was about to invalidate, and one of them would have
  kept passing while asserting nothing.** ([#280](https://github.com/volivarii/Actian-DS-Claude-plugin/pull/280)) Both were filed as
  #275 when they were found by running the next sync locally rather than by CI, and both went live when
  the knowledge repo merged its tag fold-in (knowledge #522, v0.34.124).

  `categories.test.js` asserted that a non-COMPONENTS category equals its Figma page clean-name,
  verified 252/252 when it shipped. That is not an invariant: knowledge's `preserveKnownCategories`
  deliberately carries a component's last-known category forward when Figma's page attribution churns,
  which decouples the two by design. The assertion was also redundant, because the relation that does
  hold, `categories.json` against `registry.category`, is already asserted a few tests further down.
  The page-name half is gone; the curated closed-set half, which encodes a real decision, stays.

  The tag deliverable test drove `parseVariant("Color=Purple")`. The fold-in replaced `tag-default`'s
  `Color` axis with a `Type` axis, so that resolves to nothing, the variant appearance silently equals
  the base, and the test's own precondition stops meaning anything while still reporting green. It now
  picks its specimen at run time from whatever axis the anatomy publishes, naming neither `Color` nor
  `Type`, the way `tests/helpers/appearance-specimen.js` picks a slug instead of naming one. Verified
  on both snapshots (it selects `Color=Indigo` on the vendored v0.34.122 and `Type=Catalog` on
  v0.34.124), and it can no longer pass vacuously: an empty axis, a missing axis, or a first value
  matching the base all raise rather than skip.

  The lesson is the one already written into `tests/helpers/appearance-specimen.js`: a test that names
  a specimen rots the moment the design system reorganizes, and it rots quietly, because the assertion
  survives while its subject disappears.

- **The blank-box gate was carrying 91 boxes of silent headroom, so the gray-box programme's real
  progress was invisible inside the gate built to track it.** ([#277](https://github.com/volivarii/Actian-DS-Claude-plugin/pull/277)) The gate
  shipped on 2026-07-13 with two literals in its test file, `BUDGET = 136` and `CHIP_BUDGET = 4`, both
  documented as ceilings that "RATCHET DOWN". Neither was ever lowered. Measured on 2026-08-11 the
  renderer emits **45 boxes and 2 chips**, so output could have tripled and still passed CI, while the
  drop from 136 to 45 appeared nowhere.

  A hand-maintained number standing in for a fact the data already knows is the same defect class as the
  hand-kept lists behind the 2026-07-25 outage. The baseline is now a generated per-slug record,
  `tests/renderers/blank-box-baseline.json`, written by
  `node scripts/renderers/ds-coverage-report.js --write-baseline`, and the rule is exact equality rather
  than a ceiling. A regression becomes a reviewable diff line (`bar-graph: 25 -> 30`), which is louder
  than a total creeping from 136 to 137, and an improvement also fails until it is banked, which is what
  stops the number going stale a second time. A regression is deliberately **not** offered the
  regenerate command, since that is how one would get laundered into a green check.

  Per-slug rather than a total, because the total hides the shape of the remaining work: **42 of the 45
  boxes are two chart components** (`bar-graph` 25, `line-graph` 17), with `checkbox-card` at 2 and
  `radio-button-card` at 1 accounting for the rest. Mutation-verified in three directions: a regression,
  an unbanked improvement, and a chip demotion each red the gate with the right classification.

  An independent review then found that swapping a crude total for a name-keyed record gave up three
  things the crude number had, all now restored. **The total bound is back alongside the per-slug
  detail**, because it is the one assertion that does not depend on slug identity: keying only on names
  let a box-count increase hide inside a rename (`radio-button-card` 1 becomes `radio-card` 8 was
  classified as zero regressions, and the held knowledge tag sync performs exactly that rename) and let
  a newly authorable unbuilt slug raise the count with nothing objecting. **`--write-baseline` now
  refuses** while any slug has regressed or demoted to a chip, since the failure messages print that
  command and an author following it would otherwise bank a regression riding along in the same change,
  which is the laundering path the pinned ceilings could not take quietly. And **a bare chip that gains
  real anatomy is classified as a promotion, not a regression**: it went from rendering nothing real to
  rendering something, so the old classification had the one assertion that refuses to be banked
  blocking a genuine improvement and telling the author to revert it.

  Two smaller ones from the same pass: the false-zero control was gated on the baseline's own `total`,
  a value the bank command can zero, so it is now a structural assertion about the detector against
  synthetic markup that cannot be banked away or go stale; and the record's `total` is checked against
  its own `perSlug` sum, so a hand edit cannot leave the two halves disagreeing in silence.

- **The vendor-queue alarm could not clear itself, so it spent eight days reporting a queue that had
  already drained.** ([#276](https://github.com/volivarii/Actian-DS-Claude-plugin/pull/276)) Issue #272 said "the plugin is not consuming
  knowledge" from 2026-08-03 to 2026-08-11, and its own body promised "this issue auto-closes when the
  queue drains". It could not: the only close path required **zero** open vendor PRs, and this same
  workflow opens tonight's vendor PR moments before the alarm step runs, so the queue is almost never
  empty at that point. The healthy-queue path simply exited, leaving the alarm lit after the refresh
  had resumed.

  An alarm that cannot clear itself is worse than no alarm, because it trains the reader to ignore the
  label, which is the exact failure the queue alarm was written to prevent. It now clears on **both**
  not-stuck paths: an empty queue, and a queue whose open PRs all positively report healthy.

  **The first version of that fix was worse than the bug**, and an independent review caught it. It read
  "gh told me nothing is stuck" and "gh could not tell me" as the same state, so an expired token or a
  rate limit would have **closed a real alarm** claiming the plugin was consuming knowledge again, on a
  repo that had just lost 11 nights to an expired PAT. A silent no-op became an affirmative false
  all-clear. The script is now explicitly three-state: `stuck` raises or updates the alarm, `healthy`
  clears it, and **`unknown` touches nothing and says why**. Only a positive success reading clears, so a
  failed `gh` call, a PR whose checks have not reported, and a PR with no checks at all are all unknown.
  Checks are read as `.conclusion // .state` so a red legacy commit status counts, and the close is
  scoped to the alarm's own title rather than to everything wearing the label, since the healthy path is
  now the frequently taken one and a human's issue could wear it too. The workflow invokes the script as
  `bash <path> || true`, because a `run:` runs under `bash -e` and a lost exec bit must not fail a
  refresh whose real work succeeded.

  The step was inline shell in `vendor-snapshot.yml`, which is why nothing tested it and why the defect
  survived. It now lives in `.github/scripts/vendor-queue-alarm.sh` and all four of its branches are
  exercised against a stubbed `gh` in `tests/vendor/vendor-queue-alarm.test.js`, mutation-verified:
  removing the new clear reds exactly the one test that covers it. The long explanation of the original
  incident moved into the script header rather than being restated in the workflow.

- **The nightly vendor snapshot flows again, and four of the gates that blocked it no longer rot on
  normal Figma activity.** ([#PR](_PR link added at open_)) The knowledge v0.34.122 refresh PR had
  been red every night since 2026-07-25 (15 consecutive runs), so `main` stayed pinned at v0.34.117,
  five versions behind, while the nightly kept force-pushing the same branch. 36 tests were failing.
  Every one traced to the 2026-07-23 breaking sync, and none was a defect in the substrate:
  - **`radio-button` was renamed `radio`** in Figma (same `dsKey` 9ceb3411, so the same component).
    Knowledge moved its renderer case, anatomy doc and guideline; the plugin's
    `references/convert-to-hifi/fm-to-ds-map.json` still pointed at the old slug, which made the
    conversion map reach a component with no renderer, and every `radio*` golden render a fallback
    chip. Repointed, plus the stale authoring example in
    `references/generate-flow/ds-components-authoring.md` (which also still documented the `Format`
    and `Selected` axes that the earlier form-control rework deleted) and the category list in
    `references/context/companion-context.md`.
  - **Tags lost their border.** `tag-default`'s captured appearance is now `{background, radius}` and
    each Color variant carries a background only. The renderer and the vendored `ds-base.css` both
    followed correctly; two tests still demanded a border. They now assert against whatever the
    appearance layer carries, and the deliverable test additionally asserts the *absence*: with no
    captured border, the rendered span must not invent one. Mutation-verified in both directions.
  - **Four new Foundations pages arrived at once** ("Base: label, message, field, textfield buttons",
    "Checkbox, checkbox card, checkbox group", "Radio, radio card, radio group", "Text area, text
    input"). `categories.test.js` checked category names against a hand-kept
    `NON_COMPONENTS_CATEGORIES` list that the knowledge repo does not itself keep: outside the
    COMPONENTS section a category simply *is* the Figma page clean-name. It now asserts that relation
    instead of list membership (verified 252/252 non-COMPONENTS members match, 0/71 COMPONENTS ones
    do, since those are curated groupings), keeps the closed set only where it encodes a real decision
    (a curated category needs a `*-defaults.json`), and reports every violation at once rather than
    stopping at the first, which had been hiding three of the four.
  - **The anatomy phase captured 104 appearance-less docs instead of 8.** `NO_ROOT_APPEARANCE`
    hand-listed 8 brand assets, so ~95 connector logos (snowflake, tableau, db2, ...) plus the new
    Foundations pages were reported as having "LOST their root appearance". Logos and illustrations
    have no root paint by construction, so they are now exempt by registry *section*, derived, while
    the curated list keeps holding only per-component decisions. A slug absent from the registry is
    still not exempt, so a mystery doc keeps failing.
  - **Icon renames** (`chevron-up` deleted, `chevron-left`→`arrow-left`, `directory`→`catalog`,
    `ai`→`stars-filled`, `dots`→`more`, all by `dsKey`). Knowledge had already migrated its renderer;
    13 goldens and two test fixtures still encoded the old glyphs. Regenerated after confirming every
    diff is confined to glyph geometry and the retired `ds-icon--rot180` rotation hack (`chevron-up`
    rotated 180° is now a real `arrow-down` glyph), with no fallback chips and no empty `<svg>`. The
    renamed icons are drawn on a 48-unit artboard rather than 24; `.ds-icon` sizes at `1em`, so that
    is visually neutral.
  - A hardcoded `["add", "chevron-up", "simple-check", "directory"]` precondition duplicated the
    orphan-ref gate that already derives required icons from the renderer source. Reduced to the part
    that cannot rot: the manifest resolves, parses, and is non-empty.

  Also repointed `tests/fidelity/render-leaf.test.js`, whose "unmapped slug" specimen was
  `radio-button`: it kept passing, but a slug that exists nowhere is unmapped trivially, so the case
  it names stopped being covered. `radio` is still a real Components-section slug with anatomy and no
  default-props entry.

  1957/1957 tests pass. Two follow-ups belong upstream, not here: the vendored renderer's `radio`
  case still branches on the deleted `Format` axis and on `Helper text` props the component no longer
  exposes, and `radio`'s root appearance is still variant-conditional-only from the 2026-07 rework
  (allowlisted with a VERIFY note since then).

### Added
- **The plugin's Fat Marker (fm) renderer is now vendored from knowledge, matching the ds-tier's own setup**, instead of a plugin-local copy that could silently drift. ([#PR](_PR link added at open_)) `fm-html-map.js` was already knowledge's dead-weight dependency of `ds-html-map.js` (relocation phase 1a); `fm-base.css` never moved at all. `scripts/lib/renderer.js` now exports `fmHtmlMap` and `cssPaths.fmBase`, mirroring the existing `dsHtmlMap`/`cssPaths.base` exports exactly (no injection needed: `fm-html-map.js` has no `lib/paths` coupling to sever, unlike the icon/anatomy/graphics seams). All 7 real production consumers and 9 test files repointed; the plugin's local `scripts/renderers/html-renderers/fm-html-map.js` and `fm-base.css` are deleted.
- **The plugin's own generated output now shows real artwork for empty-state and the app header logo**, instead of an empty illustration slot or an empty header span. ([#264](https://github.com/volivarii/Actian-DS-Claude-plugin/pull/264)) Knowledge shipped a color-preserving graphics tier at v0.34.112 ([actian-ds-knowledge#454](https://github.com/volivarii/actian-ds-knowledge/pull/454)), with a `setGraphics` seam on the vendored renderer mirroring the existing `setIcons` seam. That seam vendored in but nothing called it, so every `renderGraphic()` call silently returned an empty string and rendered blank, the same silent-failure shape the icon and anatomy injections already guard against. `scripts/lib/renderer.js` now reads the vendored `graphics.json` and calls `setGraphics()` once at module load, asserting its shape loudly rather than defaulting on a mismatch. Three new smoke tests mirror the existing icon-injection gates and are mutation-verified.

### Removed
- **`capture-seed.js` and its test** (renderer-relocation phase 3). ([#260](https://github.com/volivarii/Actian-DS-Claude-plugin/pull/260)) It captured the plugin's rendered
  components into the 35 frozen seed files that knowledge used to build its gallery from. Knowledge
  retired those seeds at v0.34.111 (its gallery has been produced live by the relocated renderer since
  v0.34.107), so the capture had nothing left to write and no remaining caller. Note both halves of this
  file's history sit in this same unreleased window: it was generalized from Button to all 35 slugs
  earlier here, and its matrix half is already gone (it moved into knowledge at phase 1a and reached this
  repo through the vendored renderer at phase 2), leaving only the capture half to delete.

### Changed
- **The `appearance-render` icon workaround is retired in favour of the module's own seam** (renderer-relocation phase 3). ([#260](https://github.com/volivarii/Actian-DS-Claude-plugin/pull/260))
  Phase 2 had to monkey-patch the vendored `appearance-render` exports object, because phase 1a gave
  `ds-html-map` a `setIcons` seam and missed this module, which resolves icons independently through the
  same dual-source idiom whose Node branch cannot resolve from a vendored layout. That patch was labelled
  a WORKAROUND in `scripts/lib/renderer.js`. Knowledge added the matching `setIcons` and
  `setShadowedSlugs` seam at v0.34.111, so the wrapper is gone and the accessor calls the seam directly.
  A loud guard now throws if a future vendor snapshot lacks it, mirroring the existing `ds-html-map`
  check, rather than silently rendering blank glyphs.
  Mutation-verified rather than assumed, because `renderDSComponent` never throws and a passing suite
  proves nothing about whether glyphs render. Rendering `alert-inline` and `tag-stage` through the real
  `assemble-flow-share` path yields 2 icon glyphs with the injection and 0 without. Measured across the
  whole anatomy tier the injection is worth 17 glyphs on 9 of 86 components (`alert-banner`,
  `alert-inline`, `dropdown-select-default`, `global-header`, `popover`, `search`, `tag-default`,
  `tag-interactive`, `tag-stage`), and the seam produces byte-identical output to the wrapper it
  replaces on all 86.
  **This closes the renderer-relocation program's core: one renderer in the ecosystem, no frozen
  seeds, no labelled workaround.** One item flagged at phase 2 stays open by design: `fm-html-map.js`
  is a byte-identical, unguarded copy in both knowledge and this repo, and its ownership needs an
  explicit decision rather than a default.
- **The plugin now renders DS components with the renderer vendored from knowledge, and keeps no copy of its own** (renderer-relocation phase 2). Nine files and ~4,900 lines are deleted; every consumer reaches the renderer through the new `scripts/lib/renderer.js` accessor, which is the only file that knows the renderer is vendored. That keeps `no-bare-vendor-paths` satisfied by construction rather than by allowlisting a dozen call sites. There is deliberately **no drift-guard**, because there is deliberately no copy to guard: the accessor requires the vendored modules directly, the same way `scripts/lib/paths.js` requires `vendor/clients/resolve-paths.js`. A guard test enforces the absence instead.
  **This closes the two-renderer divergence.** Tag colours and checkbox state were fixed in knowledge's gallery at phase 1b and stayed broken in the plugin's own `generate-flow` output; they now render correctly here too.
  Three silent-injection traps had to be handled, all the same shape: a vendored module resolves a fact source through a relative `lib/paths` walk that cannot resolve from the vendored layout, inside a `try`/`catch`, so it degrades to empty rather than failing. Icons via `setIcons`; the anatomy loader bound in the accessor so call sites are correct by default rather than by discipline; and `appearance-render`'s independent icon lookup, which had no module-level seam at all (measured: 2 of 51 anatomy-tier components lost their glyph). Each is covered by a mutation-verified test.
  Also fixed, and worth calling out: the golden fixtures encoded the very bug phase 1b fixed. `Selected=Yes` is not a real Figma axis, so `checkboxOn`/`toggleOn`/`radioOn` only ever rendered checked because of the old renderer's buggy branch. Regenerating would have baked an *unchecked* render into a fixture named `checkboxOn`. The fixtures were pointed at the real `Selection` axis instead, after which 5 of 7 goldens matched byte-identically.


### Added
- **The vendor snapshot can now exclude heavy sub-paths declared by the substrate.** ([#252](https://github.com/volivarii/Actian-DS-Claude-plugin/pull/252)) `vendor-snapshot-core.js` reads an optional `vendor-exclude.json` from the knowledge repo root and skips those repo-relative paths when copying, even when their top-level directory is included. The substrate declares `components/render/src` (the 15 MB self-contained render seeds, a capture intermediate) so only the ~1 MB deduplicated render dist reaches the plugin, not the seeds.
- **Generalized the canonical-render capture from Button to the full 35-slug render set.**
  `plugins/actian-design-system/scripts/render/capture-seed.js` gained `captureMatrix(slug)`, a
  registry-driven generalization of the Button-only capture: it builds each slug's variant matrix from
  the registry (via `variantMatrix`, from the slice-1 bootstrap) instead of a hand-picked list, and
  derives its `@dsCard` group from the component's own registry category. `captureButtonMatrix()` is now
  `captureMatrix("button")`. A new `RENDER_SLUGS` constant enumerates the 35 slugs the HTML renderer
  supports, and a `--all <destDir>` CLI mode captures every one of them into a destination directory in
  one pass (skipping and reporting any slug that throws), replacing the single-slug-only bootstrap CLI.
- **Seeded the canonical component render for the knowledge substrate (North Star slice 1).** ([#250](https://github.com/volivarii/Actian-DS-Claude-plugin/pull/250)) A new
  one-time bootstrap, `plugins/actian-design-system/scripts/render/capture-seed.js`, captures the
  plugin's hand-authored Button render as a single self-contained, token-bound `@dsCard` document (the
  full Intent x Emphasis variant matrix plus a disabled state) and writes it to
  `actian-ds-knowledge/components/render/src/button.html`. This is the seed for the substrate-owned
  canonical render library that all consumers (this plugin, the Claude Design bundle, docs) will read
  from; slice 2 replaces the capture with a real derive-from-facts in the knowledge repo. See
  `actian-ds-knowledge/docs/superpowers/plans/2026-07-16-canonical-component-chain-slice1.md`.
- **The HTML renderer now reports its own fidelity, and a CI gate holds the line.** The DS coverage
  report gained a **blank-box count** (the empty grey placeholder boxes a generated flow actually shows
  a reader: **136** today, across 25 of the 37 non-override slugs) and a **renderability verdict** read
  from the anatomy doc itself. `tests/renderers/blank-box-budget.test.js` ratchets that count downward
  and fails on a regression.

  This exists because the tier table was measuring the wrong thing. `quality.ratio` is computed upstream
  as `nodesNormalized / nodesTotal`, which scores whether the **Figma component was drawn with
  auto-layout**. That is a hygiene score, not a fidelity score, and it is wrong in both directions:
  `spinner` scores 0.83 and renders as five grey boxes, while `notification-dropdown` scores 0.50 with an
  empty `degraded[]` list yet has 9 of its 9 instances unresolved. 13 anatomy-tier slugs are not actually
  renderable. **No render behavior changed:** the report now tells the truth, and the anatomy floor is
  retired by attrition as real leaves land, rather than by flipping a gate, which would demote 17 slugs to
  chips before their replacements exist.

### Fixed
- **Status tags in generated output now show their real label instead of always reading "Fail".**
  ([#269](https://github.com/volivarii/Actian-DS-Claude-plugin/pull/269)) Tag Status used to render
  through the captured-appearance seam, which draws its text from the anatomy capture and never
  consumed `props.Label`, so every status pill in a generated flow rendered the captured word
  regardless of what the author asked for: a tag authored as "Active" came out as "Fail". Knowledge
  v0.34.116 ([actian-ds-knowledge#472](https://github.com/volivarii/actian-ds-knowledge/pull/472))
  gave `tag-status` a hand-authored render leaf that honours the prop, and the two goldens that had
  been pinning the old behaviour are re-baselined to "Active" and "Failed". The pill stays
  deliberately label-only: the 2026-07 Figma rework deleted both `checkmark-outline` and
  `misuse-outline`, so knowledge renders no glyph rather than substituting a fake one (tracked
  upstream in [actian-ds-knowledge#406](https://github.com/volivarii/actian-ds-knowledge/issues/406)).

  That same vendor bump grew `BUILT_SLUGS` from 41 to 63, which broke 14 tests that had hardcoded a
  specimen slug or an absolute population count. Both assumptions are now resolved at run time, so
  future gray-box slices do not re-break them, and each guard fails loudly rather than passing
  vacuously once its population reaches zero.
- **Adapted to the 2026-07 Figma form-control rework** (knowledge sync #378), which is what has kept
  every vendor-refresh PR red since 2026-07-07. The DS renamed the selection axis on the form
  controls, and the Fat Marker to DS map still targeted the old values:
  - `fmCheckbox`: `Selected=[No,Yes]` became `Selection=[Unchecked,Indeterminate,Checked]`.
  - `fmRadioButton`: `Selected=[No,Yes]` became `Selection=[Unselected,Selected]`; the `Format` axis
    and the `Show Helper text` property were deleted upstream, so both are dropped here (FM's
    `Show Label` no longer has a DS counterpart).
  - `fmToggle` is untouched: its rename is still sitting in unmerged knowledge PR #382.
- **Tag Status "Success" golden re-baselined.** Not an icon problem: the new vendor resolves more
  values to tokens, so the renderer now emits `var(--zen-color-success-25, #f0ffec)` where it used to
  emit the raw `#f0ffec`. That is the values-first pivot working as intended, so the golden was stale.

### Changed
- Two brittle tests now assert data-derived invariants instead of frozen snapshots, per the durable
  lesson from the render-fidelity pivot:
  - The appearance-coverage check asserted `>= 56` slugs, a magic number snapshotted from whatever the
    substrate held that day. It broke at 55 when the Figma rework left `radio-button`'s root without an
    appearance, reporting a "coverage regression" for what may be a correct model of a radio row. It
    now asserts a **ratio** of the anatomy set actually supplied. Per-slug correctness is still checked
    in the loop, which is where a real regression shows up.
  - The end-to-end icon-resolution test hardcoded the slug `misuse-outline`, which the Figma icon
    rework deleted. That test is about the resolution *mechanism*, not about any one glyph, so it now
    picks a slug **from** the vendored icon set.

### Known broken upstream (recorded, not hidden)
- **`calendar` and `search` are RESOLVED — the fix was the namespace, not a Figma rename.** An earlier
  version of this note said the icons were lost and needed renaming upstream. They were not deleted at
  all: the registry was **one flat slug-keyed map**, so the `calendar` GLYPH lost its slug to the
  Calendar COMPONENT and simply vanished (so did `search`, to the Search component). Renaming in Figma
  would only have postponed it — `link`, `table`, `settings` are all words an icon and a component can
  reasonably both want. Knowledge gave icons **their own namespace** (knowledge #418/#420/#421), both
  glyphs are back, and `renderIcon("calendar")` resolves: `input-date` has its calendar affordance
  again. Recorded here because the earlier diagnosis in this file was **wrong**, and a changelog that
  quietly drops a bad call is worse than one that corrects it.

- **Tag Status "Success" renders no icon either, and its golden now records that too.**
  Same defect, same anatomy: the glyph is `checkmark-outline`, which the 2026-07 Figma icon rework
  **deleted**. Verified genuinely gone, not merely shadowed — unlike `calendar` and `search`, which
  were eaten by a slug collision and came **back** once knowledge gave icons their own namespace
  (knowledge #418), **no** component owns `checkmark-outline`, and tag-status’s anatomy instance
  resolves to `slug: undefined`. **The DS ships Tag Status pointing at an icon that does not exist.**

  Same call as "Fail" below: given an icon set without the glyph, an empty box is the correct output,
  so the golden says so rather than asserting a stale expectation. Deliberately NOT papered over with
  a curated icon override, which would mask the defect while pretending to fix it. **When the glyph is
  restored in Figma this golden fails again** — which is the point: re-baseline it with the icon and
  delete the note.

- **Tag Status "Fail" renders no icon, and its golden now records that.** The glyph is
  `misuse-outline`, which the 2026-07 Figma icon rework **deleted**. This is not a renderer bug:
  given an icon set without that glyph, an empty box is the correct output, so the golden says so
  rather than asserting a stale expectation.

  The defect is real and must be fixed, it is just not ours to fix here. **Tag Status ships in the DS
  today pointing at an icon that does not exist.** `misuse-outline` is one of six glyphs the rework
  dropped that are **not** on the design team's own "REMOVED" note, so they look like collateral:
  `expand`, `maximize`, `minimize`, `misuse-outline`, `tools`, `view-table`.

  Deliberately NOT worked around with a curated icon override: that would be a new file to maintain
  that shadows Figma, and it would mask the defect while pretending to fix it. The signal lives
  upstream where the fix lives (knowledge now detects and names ghost components, and every sync PR
  lists them), and the fixture carries a comment naming the glyph. When it is restored in Figma this
  golden fails, which is the point: re-baseline it with the icon and delete the note.

## [2026.7.23] - 2026-07-06

### Fixed
- tag-default washout: per-variant colors now render from the appearance layer with a value fallback, replacing the retired path-b token-injection that emitted unresolved bare `var(--token)`.

### Removed
- Retired the path-b token-injection chain (resolveRootTokenStyle et al.) and the vendored harvest token-bindings sidecars; tag-default now renders via the unified appearance path (bespoke pill kept, colors re-sourced).

## [2026.7.22] - 2026-07-06

### Added
- **Layout spacing tokens theme too (P2 consumer, layout half).** When the
  vendored anatomy carries a `layout.gapToken` / `layout.paddingTokens` (knowledge
  #357), `flexStyle` now emits `gap:var(--zen-spacing-xs, 8px)` and per-side
  `padding:var(--zen-spacing-sm, 8px) …` instead of the bare value — the value
  stays the fallback, the name themes. Uses the same `tokenized` helper as the
  color emit (now exported from `appearance-style.js`), so a bare token name is
  never emitted into a CSS value. Total-tolerant: no layout token → value-only,
  byte-identical to before (goldens/real-data green), so it's a no-op until the
  knowledge variable-id export is populated. Completes the P2 name-layer consumer
  surface: appearance colors (2026.7.20) + layout spacing now both theme.

## [2026.7.20] - 2026-07-06

### Added
- **Token names ride the appearance render (P2 consumer half).** When the
  vendored anatomy carries the published `--zen-*` custom property a color slot
  is bound to (knowledge P2, its #356), the appearance renderer now emits
  `var(<token>, <value>)` at its single emit point (`appearance-style.js`)
  instead of the bare value: the value stays the fallback (fidelity, no washout
  if a name is unpublished downstream), the name enables theming. Covers
  `background`, `border` color, and `text` color, plus resolved icon-glyph
  color, per variant (the top-level `backgroundToken` now flows through
  `resolveNodeAppearance` alongside the nested `border`/`text` tokens).
  Total-tolerant: a slot with no token, a null token, or an unsafe token name
  degrades to value-only (byte-identical to the previous values-only emit), so
  with today's token-less vendored data rendering is unchanged — the var()
  wrapping switches on automatically once the knowledge-side variable-id export
  is populated and a real sync carries the names. Corner-radius token binding
  is not emitted (deferred upstream until the REST bind shape is verified). The
  runtime emit gate now enforces two invariants on real rendered output: every
  emitted `var()` carries a value fallback (no bare `var(--name)` washout), and
  every emitted `--zen-*` name resolves in the vendored `tokens.css`.

## [2026.7.18] - 2026-07-06

### Fixed
- **Ref-collision in the registry key maps is now deterministic.** Two
  registry slugs can derive the same camelCase ref (`chip` and `fm-chip`
  both become `fmChip` because ref derivation strips the kit prefix), and
  the winner used to be whichever entry the registry emitted last. The
  knowledge sync's move to canonically sorted keys (its #355) flipped that
  order and silently re-pointed `fmChip` from the single chip component to
  the `fm-chip` set, breaking Figma push for FM chips on the vendor PR.
  Collision resolution is now order-independent: a plain slug beats a
  prefix-stripped one, then sorted-first wins; applies to both the key maps
  and the ref→slug maps.
- **Nightly vendor refreshes self-heal the authoring table.** The
  vendor-snapshot workflow now regenerates the
  `ds-components-authoring.md` vocabulary table (introduced with its drift
  gate in 2026.7.17) inside the same auto-merge PR, so a knowledge-side
  component or variant-axis rename can no longer leave the nightly vendor PR
  stuck red waiting for a manual regen. Same self-healing class as the
  doc-counts guard.

## [2026.7.17] - 2026-07-05

### Added
- **Per-variant icon glyphs (consumer half).** The appearance renderer now
  honors the `slug` field on anatomy variant deltas (knowledge #354): when a
  variant swaps the component an instance references (a per-status tag icon),
  the matching delta's slug wins over the node's base slug, so a Success tag
  renders its own check glyph instead of Fail's x-circle. Total-tolerant in
  either landing order: without slug deltas in the vendored data, rendering is
  byte-identical to today; a swapped slug missing from the icon set renders
  the neutral placeholder, never the wrong glyph. Closes the F2 known
  limitation once the knowledge capture lands and vendors.

### Fixed
- **`ds-components-authoring.md` vocabulary table regenerated and gated.** The
  hand-maintained table had drifted badly (16 built slugs still marked as chip
  fallbacks, the retired `input` slug listed as the text field, `text-input`
  missing, stale variant axes), mis-steering hi-fi screen generation. The
  table is now generated from the vendored registry + `BUILT_SLUGS`
  (`node scripts/renderers/render-authoring-table.js`, statuses:
  BUILT / appearance / chip per the real render tiers, verbatim registry axis
  names), a sync gate test fails on any future drift, and the text-field
  authoring section moved to `text-input` with an explicit
  never-author-`input` note.

## [2026.7.16] - 2026-07-05

### Fixed
- **Body text no longer renders blue in the ds-base fallback styles.** 36
  remaining pre-rename `var(--zen-color-text-primary)` call sites in
  `ds-base.css` were written when text-primary meant black body text; since the
  token's meaning flipped to interactive blue (`#0f5fdc`), those sites rendered
  blue, mostly masked by the 1B inline appearance values. Each site was
  verified against the captured appearance values in the vendored anatomy docs
  (the resolved Figma colors): 33 body-text sites (labels, titles, table text,
  banner messages, stepper titles including the active state, selected
  interactive tag, active segment, calendar text) now bind
  `--zen-color-text-default` (black), the input field description binds
  `--zen-color-text-tertiary` (its exact captured value `#50505d`), and the
  tooltip bubble background binds `--zen-color-bg-reverse` instead of a text
  token. The five genuinely interactive sites (secondary button label, avatar
  initials, breadcrumb link, active tab, steward source link) keep
  `text-primary`. Completes the migration started in 2026.7.15 / PR #226.

## [2026.7.15] - 2026-07-05

### Changed
- **Migrated off the retired `--zen-color-text-link-*` tokens.** Knowledge #341
  deletes the text-link family; `--zen-color-text-primary` is now the
  interactive-text token (same resolved value, `#0f5fdc`). The five
  `var(--zen-color-text-link-default)` call sites in `ds-base.css` (secondary
  button, selected item, breadcrumb link, active tab, steward source link) and
  the brief renderer's token-pill color now use
  `var(--zen-color-text-primary)`; the contrast-lint pair and token-pill test
  follow. In the three binding-gated chrome sections (page-header, breadcrumbs,
  tabs), body text moved from the pre-rename `text-primary` to `text-default`
  (black, matching the Figma measurement), and the binding-conformance gate
  accepts old and new names during the vendor transition. Remaining body-text
  `text-primary` call sites in other sections migrate in a follow-up.

## [2026.7.13] - 2026-07-05

### Added
- **Real icon glyphs in generated flows/previews (F2).** The appearance renderer
  resolves anatomy icon instances against the vendored 142-icon set, so DS component
  icons render their real SVG glyph instead of a neutral placeholder box. Slug-only,
  default-variant glyph until per-variant capture lands upstream. (#224)

### Removed
- **Legacy slug-to-prerendered-HTML anatomy fallback.** Retired (Group C); the
  appearance-doc renderer with graceful chip fallback is now the only
  anatomy-derived render path. The tag-default token-injection path is unchanged.
  (#224)

## [2026.7.12] - 2026-07-04

### Added
- **Unified appearance renderer (Phase 1B).** DS components that fall through the
  instance render seam now draw their fill, border, radius, and text from Figma's
  captured resolved appearance (values-only), so generated components render their
  real colors instead of washing out. Renders per-instance so a component's variant
  selects the right colors. Includes a values-only emit gate, a CSS-coverage guard,
  non-default-variant real-data coverage, and the fidelity harness wired to render
  appearance slugs. ([#223](https://github.com/volivarii/Actian-DS-Claude-plugin/pull/223))

## [2026.6.21] — 2026-06-29

### Added
- **Typed rendering in generated flows (S3c).** Entity properties carry a `type`
  through the flow glossary, and the screen-generator now renders it: `type:"enum"`
  columns become `fmTableCell Type=Pill` status badges (HTML `.fm-table-cell__pill`,
  token-bound, mirroring `.fm-badge`), and `type:"date"` values follow the content
  guideline's date format. Property labels are humanized from camelCase
  (`apiVersion` → "Api version"). New non-blocking advisory `enum-not-typed` flags an
  enum-bearing flow that renders no pill.

### Fixed
- The `properties-ungrounded` grounding check now tokenizes the rendered property
  **label**, not just the raw field name, so camelCase-named columns
  (`apiVersion` → "Api version") still ground and don't trip a spurious advisory.

## [2026.6.20] — 2026-06-28

### Added
- **Entity-property-grounded tables & forms (S3b).** Table column headers and form
  field labels are resolved from the entity's `properties` in `app-context.json`
  (`resolve-properties.js` → `meta._glossary`) instead of invented per screen. New
  non-blocking advisory `properties-ungrounded` flags a flow whose tables/forms reflect
  none of the entity's standard fields.

## [2026.6.19] — 2026-06-28

### Added
- **Relationship-grounded detail content (S3).** Detail-view screens draw their tab bar
  and related sub-lists from the entity's relationship graph (`resolve-relationships.js`),
  so a detail page reflects the entity's real connections. New non-blocking advisory
  `relationships-ungrounded`.

## [2026.6.17] — 2026-06-28

### Added
- **App-grounded authoring + pattern resolution (S2).** The target app is an explicit
  choice; flows resolve one of the app-scoped named UX patterns (`resolve-patterns.js`)
  into an idiomatic scaffold, with app-scope enforced (an app can't borrow another app's
  pattern). New non-blocking advisory `pattern-ungrounded`.

## [2026.6.14] — 2026-06-26

### Added
- **App-chrome grounding (S1).** Generated screens take their sidebar / header / nav from
  the structured `app-context.json` for the target app (`resolve-chrome.js`), eliminating
  generic or hallucinated navigation. New non-blocking advisories `chrome-divergence` /
  `chrome-drift` / `chrome-ungrounded` / `chrome-incoherent`.

## [2026.6.0] — 2026-06-13

### Changed

- **Versioning switched to calendar versioning** (`YYYY.MM.PATCH`). The plugin
  is an end-user tool whose version is a release counter, not an API contract,
  so month-granularity recency is the meaningful signal rather than a
  major/minor/patch semantic. Same month → PATCH+1; new month → `YYYY.MM.0`. CI
  auto-bump (`vendor-snapshot.yml`) and the manual `scripts/lib/bump-version.js`
  now share one `calendar` mode. Knowledge-repo versioning is unaffected (it
  stays semver — it's resolved through a version range). Prior plugin history
  through `1.108.0` was semver.

## [1.106.1] — 2026-06-10

### Added
- **Studio chrome + AI Steward, sourced from Figma intent.** The hi-fi DS chrome now reads as the
  real Studio app, authored from the Figma component frames (Figma is the source of truth; the
  shipping code is a reference only):
  - **global-header** → the real cluster: brand/app + context selector + global search + a right
    cluster (What's new · notifications · apps switcher · avatar). No invented AI trigger (Figma has none).
  - **side-nav** → grouped icon sidebar (groups, per-item icons, active state, collapse). The legacy
    comma `Items` prop still works (back-compat).
  - **chat-with-ai-steward** → header controls (New chat · settings · expand · close), a Welcome state,
    a task-input footer (Give Steward a task + context chip + Plan), and a `Drawer` size.
  - **Steward placement** — the renderer now wraps the Steward as an **overlay** (fixed, floats over
    content) or a **docked full-height column** (`mode:"docked"` → 3-column shell that reflows the main
    content), matching the Figma `size` Default/Drawer variants.
- Chrome-config wiring: `screen.header` (search/account/context) and `screen.sidebar.groups`
  (grouped icon nav) feed the upgraded leaves; `screen.steward` descriptor drives the overlay/docked Steward.
- Captured Figma anatomy reference (`references/generate-flow/studio-chrome-anatomy.md`) as the authoring oracle.

## [1.106.0] — 2026-06-10

### Added
- **`--hifi` = DS-native authoring.** `generate-flow --hifi` now composes screens directly
  against the DS component vocabulary (content INSTANCE nodes carry `library:"ds"` + `dsSlug`)
  and renders themed hi-fi HTML as the deliverable — no Figma round-trip. `--hifi` no longer
  implies a Figma push (push stays `--push`); the `transform-to-hifi` path survives only inside
  `/convert-to-hifi`. New vocabulary reference `references/generate-flow/ds-components-authoring.md`
  (the 69-slug surface, built-vs-chip status, per-leaf props), a DS-native branch in the
  screen-generator agent, and a Studio `search-results-ai` recipe.
- **AI feature foundations (demo Use Case 2).** Vendored the `chat-with-ai-steward` component
  guideline (Studio/Explorer AI surface — first authored `usage` doc) + curated `ai`/`stars`
  glyphs (knowledge v0.31.1, 37 icons). New `ux-patterns.md` §F "AI Surfaces" answer path; the
  AI a11y slice is now reachable via `a11y.js` (un-orphaned through `a11y_refs`).
- **Five new DS leaves** (19 built total): `table`, `modal`, `empty-state`, `alert-banner`, and
  the static `chat-with-ai-steward` panel (sparkle header, insight, source line, confidence
  badge, streaming shimmer). Each token-bound, oracle-checked, with a fidelity-ledger row
  depositing anatomy facts.
- **DS-node contract.** `flow-data.schema.json` declares `library`/`dsSlug` (decision #2:
  extend) + renderer-drift repairs; the validator hard-errors `unknown-ds-slug` and warns
  `ds-slug-unbuilt` (renders as a graceful chip). `BUILT_SLUGS` is exported with a switch-case
  sync gate.
- **page-header actions slot** on the DS chrome path — primary/secondary CTAs survive hi-fi
  (was dropped).
- **Embedded Roboto + Inter** woff2 subsets (base64 data URIs) in the flow deliverable — DS
  leaves render in the real `--zen-font-family-text` face while staying fully offline.

### Fixed
- **`meta.mode:"hifi"` promotion** — `/convert-to-hifi` outputs now render DS leaves in themed
  DS chrome instead of grey FM chrome (the assembler ignored `meta.mode`).
- **Render-path hardening** — `fillToCss` object-shaped colors no longer leak `[object Object]`;
  style-attribute values are escaped (injection); a malformed node degrades to a labeled chip
  instead of blanking the preview; DS nav active-item matching is case-insensitive (FM parity).
- **Critical-secondary button** renders its own outline variant instead of silently falling back
  to primary blue on destructive flows.
- Repointed a dead `figma-spec-builder.md` reference in the screen-generator agent.

### Decisions (recorded)
- #2 schema = extend (shipped). #3 fidelity gate = assisted-vision for now, pixel-diff
  (ImageMagick vs media oracle) as the PRIMARY gate fast-follow (fidelity README doctrine
  flipped). #1 bridge framing / Renderers-publish ask = OPEN. `--hifi` = DS-native authoring;
  AI carrier = chat-with-ai-steward (Studio/Explorer).

## [1.105.0] — 2026-06-10

### Added
- **Self-healing doc-count sync in the vendor pipeline** — a knowledge re-vendor
  that changes a registry component count (e.g. DS Kit 318→319 in v0.30.5) used
  to leave the human-facing inventory counts (README, llms.txt, marketplace.json,
  plugin.json, companion-context, figma-push-patterns) stale, failing the
  `doc-counts` guard and leaving the auto-merge vendor PR **stuck** with no
  self-healing path. The vendor-snapshot workflow now runs
  `scripts/vendor/sync-doc-counts.js` after each pull to rewrite those counts
  from the registries, and commits the result (the managed docs were added to
  the PR's `add-paths`), so count-changing refreshes merge cleanly.
  - The guard (`tests/integration/doc-counts.test.js`) and the fixer now share
    one source of truth — `scripts/lib/doc-counts.js` (`deriveCounts` +
    `buildChecks` + `fixContent` + `syncDocCounts`) — so they can never
    disagree. Vendor reads route through `PATHS`; fixer regexes are anchored and
    idempotent (a real-doc idempotency test guards against over-greedy
    rewrites). Run `node scripts/vendor/sync-doc-counts.js --check` to report
    drift, or without `--check` to fix it.

## [1.104.5] — 2026-06-10

### Added
- **Hi-fi DS render core** — the first DS-native render tier for `generate-flow`
  HTML output, gated entirely on `library: "ds"` so fat-marker (lo-fi) flows are
  untouched:
  - **Two new DS leaves — `toggle` and `radio-button`** (now 14 leaves total),
    hand-authored token-bound BEM markup modeled on the existing
    `checkbox-with-label` leaf. Each covers off / on / disabled states (toggle
    also right-aligned-with-helper; radio also card format). 8 goldens + DOM
    tests assert real rendered HTML (incl. hostile-label escaping).
  - **Phase-1 chrome + theming** — `flow-renderer.js` `screen()` now branches
    `library: "ds"` screens to real DS chrome leaves (global-header / side-nav /
    page-header) via an `appProfile` (app → `{theme, headerApp, navApp}`), sets
    `data-theme` (studio / explorer / actian) so per-app accent tokens recolor
    by inheritance, and adds a `.screen--hifi` surface class. Lo-fi screens
    render byte-identically to before (negative test asserts no DS chrome /
    theme / hifi class leaks onto a no-`library` screen).
  - **Assembler stamping** — `assemble-flow-share.js` propagates `meta.library`
    (or `meta._glossary.library` / `meta.hifi`) down to each screen's `library`
    field before render, never overriding a per-screen authored value.
  - **Capture-as-you-build ledger** — `tests/renderers/__fidelity__/` records
    per-leaf fidelity gates + substrate facts (anatomy + token bindings + known
    gaps) as build provenance for the eventual knowledge backfill.

Known follow-up (non-blocking): tier-wide a11y pass (semantic `role` /
`aria-checked` on checkbox + radio + toggle together; `href` / `aria-selected` /
`:focus-visible` on chrome) — tracked, deliberately not one-off'd here to keep
the leaf idiom uniform.

## [1.104.3] — 2026-06-08

### Fixed
- Flow HTML chrome contract drift — the screen-generator now emits richer,
  Figma-shaped data than the FM renderer consumed, producing broken output
  (surfaced by a `generate-flow` hi-fi test):
  - **Empty sidebar:** `navItems` (an array of `{label,state}`) was passed
    where `sidebar()` expected a numeric count, so the placeholder loop never
    ran and the nav rail rendered empty. It now renders real nav labels with
    the active item highlighted (On-state or `activeNavItem` match), keeping
    the legacy numeric-count shape working.
  - **`[object Object]` page-header button:** `pageHeader.actions` (now
    `[{label,variant}]`) was stringified whole; the renderer now reads
    `.label` (still accepts bare strings).
  - **`background:[object Object]` on frames/rects/ellipses:** Figma-shaped
    fills `[{type,color}]` are normalized to a CSS color string via a new
    `fillToCss` helper in `render-node.js` (string fills unchanged).
- These affect the lo-fi deliverable; the same chrome/fills path also feeds
  the planned DS-native hi-fi render, so the fixes are a prerequisite for it.

## [1.104.1] — 2026-06-08

### Added
- Hi-fi DS render tier grows 9 → 12: `page-header`, `breadcrumbs`, and `tabs`
  chrome leaves (`ds-html-map.js` + `ds-base.css`), 100% token-bound and grounded
  in K1's vendored `domains.tokens` bindings. Breadcrumb separators reuse the P1a
  `renderIcon` mechanism (rotated `chevron-left`).
- `ds-token-bindings.test.js` — binding-conformance gate making `domains.tokens`
  load-bearing for the three new leaves (every binding resolves + is used in CSS).

### Fixed
- `tabs` / `side-nav`: a non-matching `Active` prop now falls back to the first
  item instead of leaving zero items active. Shared `parseItems`/`resolveActive`
  helpers de-duplicate list parsing across the chrome leaves.

## [1.103.0] — 2026-06-06

### Added
- **Hi-fi DS render tier — 6 more components (catalog-browse vertical slice).**
  `tag-default`, `badge`, `search`, `card-for-items` (content) and
  `global-header`, `side-nav` (chrome) — token-bound (`ds-base.css`), grounded by
  measured Figma anatomy (`references/convert-to-hifi/anatomy/catalog-slice.json`).
  Proves the DS-native authoring path end-to-end: a real Studio Data Catalog
  screen composed from real DS components and rendered hi-fi offline.
- **`card-for-items` is DS-native-only** (no FM mapping). The `ds-coverage`
  orphan gate now validates renderer cases against the **authorable dskit
  surface** (~76, dskit minus icon/brand-asset categories) rather than the
  22-slug FM→DS conversion map — so DS-native-only components are legitimate. The
  conversion-coverage check still keys on `fm-to-ds-map.json`.

## [1.102.0] — 2026-06-06

### Added
- **Hi-fi DS HTML render tier (Phase 0: button, input, checkbox-with-label).**
  A second HTML render tier behind the existing INSTANCE seam: when a flow node
  carries `library:"ds"` (emitted by `transform-to-hifi.js`), `render-node.js`
  routes it to `ds-html-map.js`, which renders token-bound markup styled by
  `ds-base.css` (100% `--zen-*`, geometry measured once from the published Figma
  DS Kit). Hi-fi is a **mode of the `flow-share` deliverable** — `ds-base.css` is
  inlined via `FLOW_CSS` (inert for lo-fi) and the offline single-file contract is
  preserved; no new `--type`.
- **Three gates for the new tier:** `token-resolution` now covers ds-base.css +
  ds-html-map.js; new `ds-coverage` test asserts every DS slug reachable via
  FM→DS conversion (`fm-to-ds-map.json`) has a renderer case or is in a shrinking
  allowlist; frozen `golden-snapshot` `ds-*` baselines; plus an end-to-end offline
  assembly test.

  The DS render tier is **shared substrate**, fed by two paths: FM→DS conversion
  (today) and DS-native authoring against the broader authorable dskit (future) —
  it is not capped at the FM map's slugs. Infrastructure release — the user-facing
  `--hifi` wiring, the DS-native authoring feeder, and the remaining components
  follow. See `scripts/renderers/html-renderers/SEAM.md`.

## [1.101.0] — 2026-06-06

### Changed
- **generate-flow is now HTML-first.** The default deliverable is a single
  encapsulated, offline `flows/[feature].html` (two-view Prototype + Overview,
  rendered as `--type flow-share`) — the live preview *is* the deliverable. The
  Figma push is now **opt-in** rather than automatic and last.
- **Gates collapsed to ~3.** The old pre-gen config questions (Step 0.5) are
  folded into Gate 3; **Step 7.5** is a single combined post-build gate offering
  the Figma push **and** the design audit.

### Added
- **`--push` / `--no-push` flags** (`scripts/lib/parse-push.js`). A push is also
  triggered by explicit prose ("push to figma" / "in figma" / "as a figma
  file"), by `--hifi`/`--audit` (which imply a push), or by accepting the Step
  7.5 gate. `--no-push` wins ties. Refine/iterate/branch on an existing Figma
  URL always pushes.
- **`references/generate-flow/push-opt-in.md`** — the push-trigger reference.

### Removed
- **`--share` flag retired.** Its behavior — the shareable, offline two-view
  deliverable — is now the default, so the flag is no longer needed.

## [1.100.0] — 2026-06-05

### Added
- **Shareable flow deliverable (`--share`).** generate-flow can emit a
  self-contained, offline two-view HTML file (Prototype + Overview) for sharing
  with reviewers who don't use Figma
  (`scripts/renderers/assemble-flow-share.js`).

## [1.99.1] — 2026-06-04

### Added
- **Tier B — live-streaming flow preview.** generate-flow now streams the HTML
  preview as screens generate: a chrome-aware shimmer **skeleton at screen-list
  approval**, then each screen **fills in live** as it lands — in the Cowork
  inline panel (file-watch) and the CLI/IDE browser (`--refresh`).
- **New `status: "pending" | "ready"` screen field** (absent = ready;
  backward-compatible).
- **`merge-partials.js --incremental --screen-list`** skeleton-fill mode
  (parallel-mode streaming).
- **`assemble-preview.js` atomic writes** — temp + rename so a reload never
  catches a half-written file. Final render is clean (no `--refresh`).

## [1.99.0] — 2026-06-04

### Added
- **generate-flow visual feedback (Tier A).** The HTML preview now renders
  **automatically and before** the Figma push (was opt-in and last), and the
  build + push phases stream `N/M` progress to the chat — so the run is never a
  silent wait and the visual lands before the slow push.
- **`assemble-preview.js --refresh <seconds>`** — injects a self-contained
  auto-reload (meta-refresh + JS fallback, no server) into the preview HTML.
  Off by default; deterministic. Seam for the staged "watch it build"
  follow-on + a Cowork auto-refresh spike.

## [1.98.2] — 2026-06-04

### Fixed
- **HTML preview render fidelity — prop-key drift in `fm-html-map.js`.** Several
  hand-written FM component renderers read prop keys that didn't match what the
  flow data ships, so they rendered **blank** in the HTML preview while the Figma
  push (which resolves keys at runtime) rendered them correctly — a twin
  divergence:
  - **`#id`-suffixed keys now resolve in HTML.** Added `normalizeProps()` which
    aliases `"Label#1411:32"` → `"Label"` (mirroring the emitter's
    `split('#')[0]` resolver), so e.g. buttons authored with suffixed keys no
    longer render label-less.
  - **`fmStepper`** now reads the `"Step number"` key and renders the step
    **Label** + active/upcoming/complete state (was an empty grey circle — the
    dominant break on wizard flows).
  - **`fmTableCell`** renders multi-column header/data rows authored as one
    instance with numbered `Label`…`Label 5` props (was showing only the node
    name).
  - Regression-guarded with new golden fixtures (stepper, suffixed-key button,
    multi-column row) — the coverage gate proves a renderer *exists*; these prove
    it renders real *content*.
- **generate-flow Figma push — two output bugs found in wider-audience testing:**
  - **GenLog version trap.** `SKILL.md` and `figma-push-patterns.md` told the AI
    to "read the version from `plugin.json`, never hardcode" — then printed the
    literal `v1.55.0`, which the AI copied verbatim. Replaced the stale literal
    with a run-time read command, so the generation card shows the real version.
  - **Screen-frame clipping.** The push created a fixed `1440×960` screen frame,
    so tall screens (long forms) clipped at 960px. The frame now hugs content
    height (960 as a minimum, not a cap) and never clips.
  - **Chrome props left as defaults.** The content emitter sets `screen.content[]`
    props deterministically, but app-header / page-header / sidebar (chrome) are
    pushed by prose — and the push step never mapped the screen data → the chrome
    component props, so headers showed "Page Title" / "Description text" /
    "Button label". Step 6c now spells out the data→prop mapping
    (`Title#979:22` ← `pageHeader.title`, action-button labels, nav labels,
    active-item state) + the page-header top margin. (Deterministic chrome
    emission — extending the twin emitter to whole-screen — is queued as the next
    stage.)

## [1.98.0] — 2026-06-04

### Added
- **Deterministic Figma content emitter (`render-node-figma.js`)** — the
  structural twin of the HTML `render-node.js`. One component-node spec
  (`content[]`: FRAME/TEXT/INSTANCE/RECT/ELLIPSE/DIVIDER) now drives BOTH the
  offline HTML preview and the Figma push, so they are mechanically identical
  by construction rather than by convention. The emitter validates the tree
  (runtime gate), resolves FM refs to component keys, and emits one atomic
  `use_figma` script (font-preload → build → append-into-parent →
  FILL-after-append → `{createdNodeIds, mutatedNodeIds}`).
- **Twin-parity golden gate** (`tests/renderers/twin-parity-emit.test.js`) +
  `form-create` / `table-list` fixtures, plus extension of the fm-coverage and
  token-resolution gates to the emitter.

### Changed
- **`/generate-flow` content push routes through the emitter** as the canonical
  path (parallel-change per MIGRATIONS Rule 1; the hand-walk remains the
  documented fallback during cutover).

## [1.97.0] — 2026-06-04

### Fixed
- **Wider-audience Phase 1 — doc-drift sweep.** Reconciled every advertised
  inventory count against ground truth (filesystem + vendored registries):
  - Skills **9 → 8**, agents **8 → 9** across `marketplace.json` and
    `plugin.json` (and added the missing `brief-researcher` to the marketplace
    agent list).
  - Recipes **23 / 25 → 24** (README banner / marketplace).
  - **WCAG 2.1 → 2.2 AA** across README, `marketplace.json`, `USAGE.md`,
    `llms.txt` (the substrate moved to 2.2 some releases ago).
  - Component counts corrected to the vendored registries: **DS Kit 318 / 80
    sets** (was 322 / 82 / 107), FM Kit 287 / 33, Meta Kit 28 / 11 — in README,
    `companion-context.md`, `llms.txt`, `figma-push-patterns.md`.
  - Guideline counts reframed from the obsolete "85 docs / 41 stubs" to the
    vendored reality: **44 per-component guideline docs** (36 components + 8
    registry-key aliases), all content-bearing in the current snapshot.
- Purged the live `sync-design-system` references that survived its v1.79.0
  decommission (marketplace skill list, `llms-overview.md`); kept the
  intentional historical tombstones.
- Rewrote README's stale project-structure tree (it described a pre-federation
  `docs/foundations.md` / `docs/generated/` layout that no longer exists; the
  DS substrate now lives under `vendor/`).

### Added
- **Count-guard regression test** (`tests/integration/doc-counts.test.js`):
  derives the canonical skills / agents / recipes / component / guideline
  counts from the source of truth and asserts every managed doc matches —
  inventory counts can no longer drift silently.
- **`claude plugin validate` CI gate** in `pr-checks.yml` (`--strict` for the
  marketplace manifest; non-strict for the plugin manifest).
- This `CHANGELOG.md`.

## [1.96.0] — 2026-06-03

### Fixed
- **Wider-audience Phase 0 — stop-the-bleeding hardening** for first-run
  robustness on fresh machines: repointed the hifi transformers off the
  non-existent `docs/generated/` onto the vendored registries; fixed
  `ensure-server.sh` cold-start node resolution; removed a dead `SessionStart`
  hook; broadened node resolution (nvm / Volta / asdf / fnm / Homebrew /
  system); env-precise README + point-of-use Figma-MCP guidance; corrected
  tester auto-update / cache-bust instructions.

## [1.95.0] — 2026-06-03

### Added
- Fat Marker HTML precision pass + tier-agnostic component-node seam, with
  three new quality gates (coverage, token-resolution, golden-snapshot).

## [1.94.0] — 2026-06-03

### Added
- Accessibility linked-criteria slice: sourced WCAG criteria surfaced in the
  component brief and companion.

## 1.93.x — 2026-06-02

### Changed
- Drift-proof vendored-path references (`vendor-paths-resolve` CI guard).
- Adopted the shared knowledge consumption client (resolver import + snapshot
  copy + drift guard).
- Track E evictions: plugin now owns `presentation-guide.md` and
  `fm-to-ds-map.json` under `references/`.
- Inclusion-based vendoring — dropped upstream tooling from `vendor/`.

## 1.90.0 – 1.91.0 — 2026-05-31

### Changed
- Consume the substrate directly: `bySlug` O(1) lookup + verbatim
  `categorySlug`; structured `words-to-avoid.json` with an avoid-word
  soft-check in flow validation.

## 1.89.0 — earlier

### Changed
- Refreshed knowledge to slug-only foundations/accessibility filenames with
  `_order.json`; symmetric `a11y_refs` / `motion_refs` consumer rename.

[1.97.0]: https://github.com/volivarii/Actian-DS-Claude-plugin/releases/tag/v1.97.0
[1.96.0]: https://github.com/volivarii/Actian-DS-Claude-plugin/releases/tag/v1.96.0
[1.95.0]: https://github.com/volivarii/Actian-DS-Claude-plugin/releases/tag/v1.95.0
[1.94.0]: https://github.com/volivarii/Actian-DS-Claude-plugin/releases/tag/v1.94.0
