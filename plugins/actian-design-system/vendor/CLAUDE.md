# CLAUDE.md — actian-ds-knowledge

This is the federated knowledge layer for the Actian Design System 2026. If you're an AI agent (Claude or otherwise) reading or modifying content here, follow these rules.

## Read first

- [llms.txt](llms.txt) — content index
- [CONTRIBUTING.md](CONTRIBUTING.md) — `src/`+`dist/` convention, edit-here / never-edit table, full per-domain pointers

## Editing rules

1. **Never edit `dist/` content.** Folder name is the signal: `dist/` = CI-generated, edits revert. Mixed-origin domains (`foundations/`, `components/`) use `src/` for editable sources.
2. **Single-origin domains stay flat.** `content/`, `accessibility/`, `presentation/`, `app-context/`, `fm-to-ds-map/` have no `src/`+`dist/` split because there's no boundary to draw — everything in them is human-authored.
3. **Tokens are interim-flat.** `tokens/{tokens.json,tokens.css}` are human-frozen snapshots until a successor generator returns. `tokens/token-reference.md` is CI-generated. See `tokens/README.md`.
4. **One hand-edit exception in `dist/`:** the `templates` block of `components/dist/registries/metakit.json` is hand-curated and preserved across syncs (`_meta.hybrid: true`). Editing this block is allowed; everything else in the file is regenerated from Figma.
5. **`dsSlug` in `fm-to-ds-map.json` is hand-maintained.** Despite the historical `_authoringNote` claim, no auto-regeneration code exists. Keep `dsSlug` in sync with `dsKey` manually when adding/renaming entries.
6. **Stamp regenerated content honestly.** Generated JSONs carry `_meta.auto_generated: true` + `_meta.source: <source path>` + `_meta.do_not_edit`. Generated MDs carry an `AUTO-GENERATED — DO NOT EDIT` banner near the top. If you write a new generator, follow this stamping pattern.

## Manifest contract

Consumers reference logical names from `paths-manifest.json` at the repo root, not physical file paths. The manifest maps each logical name to its file location. When you move files or add new content, update the manifest in the same commit. `validate-manifest.yml` is a required CI gate that catches drift.

Spec: `docs/superpowers/specs/2026-05-10-manifest-and-tag-pin-design.md` in the plugin repo (gitignored — ask Vincent if you need to read it).

## How CI runs

- **`sync-from-figma.yml`** (07:00 UTC nightly + manual): Figma REST → `components/dist/registries/*.json` → also runs `styles-to-md.js` and `render-token-reference.js` as workflow steps. Calls `generate-guideline-stubs.js` programmatically inside `sync-from-figma.js` on additive/breaking diffs. Auto-bumps `package.json` patch + emits `v$VERSION` git tag. Opens additive PRs auto-merged; flagged PRs (breaking) get `review-required` label.
- **`foundations-derive.yml`** (PR event): on any PR touching `foundations/src/foundations.md` or parser scripts, regenerates `foundations/dist/*.json` and posts a semantic-diff comment. Auto-bumps + emits tag after the regen commit.
- **`validate-manifest.yml`** (PR event): runs `scripts/validate-manifest.js` on every PR touching the manifest or content dirs. Fails if any manifest path doesn't resolve or any orphan content exists outside the manifest.

## Federated consumers

Plugin (`volivarii/Actian-DS-Claude-plugin`) vendors a pinned snapshot of this repo nightly via `vendor-snapshot.yml` (09:00 UTC, 2h offset from upstream Figma sync). The plugin reads exclusively from its `vendor/` tree at runtime — never directly fetches this repo. Future docs site / Storybook / API clients will follow the same pattern.

## Don't

- Don't edit `dist/` files (except `metakit.json.templates`).
- Don't add new top-level domains without updating `CONTRIBUTING.md`, `llms.txt`, and the README content table.
- Don't rename a top-level domain without checking `MIGRATIONS.md` Rule 1 (parallel change) — there are downstream consumers (plugin's hardcoded vendor paths, future docs site URLs).
- Don't commit specs / audits / planning docs from `docs/superpowers/` (gitignored, working artifacts only) per `feedback_no_commit_specs`.

## Repo collaborators

- Vincent Olivari (`volivarii`) — lead
- Jeff (`levita99zeenea`) — content guidelines
- Kristina — foundations
