# `scripts/lib/knowledge/` — consumer-side knowledge layer

Reusable, render-agnostic queries over the vendored substrate. Skills consume
these instead of re-reading raw `vendor/…` files ad-hoc. First member: `a11y.js`.

## Helper contract

Every helper in this directory MUST:

1. **Resolve via `PATHS`** (`scripts/lib/paths.js`) — never hardcode `vendor/…`
   literals. (Guarded by `tests/integration/no-bare-vendor-paths.test.js`.)
2. **Return render-agnostic plain data** — no HTML/Figma shapes. Consumers
   (HTML renderer, Figma push, companion answer) decide presentation.
3. **Fail gracefully** — never throw on missing/unknown input. Return empty
   collections + a `resolved` boolean so callers can fall back.
4. **Be pure + unit-tested** — no MCP, no network; logic is testable against
   the vendor snapshot.
5. **Ship a CLI entry** (`if (require.main === module)`) printing JSON, so
   agent surfaces (companion) and humans can query directly.

## Members

### `a11y.js`
- `resolveLinkedCriteria(guidelinesJson, categoryDefaults)` — pure core; union of
  component `meta.a11y_refs` and category `a11y_refs.requirementRefs`, deduped
  (component wins), grouped `{ component, inherited, resolved }`.
- `linkedCriteriaForComponent(slug, opts?)` — load-by-slug (or `opts.{guidelinesJson,
  categoryDefaults}` to reuse already-loaded data).
- `linkedCriteriaForCategory(categorySlug)` — inherited (foundation) criteria only.
- CLI: `node a11y.js <slug>` | `node a11y.js --category=<slug>`.
- Criterion shape: `{ slug, title, wcag: string[], tier, note?, excerpt? }`.

## Phase-2 backlog (the pattern grows into these — see the 2026-06-02 absolute-knowledge spec)

Each follows the contract above:
- **content/usage helper** — "how should we display hints on inputs?" (per-component
  `domains.content`/`usage` + global content guidelines).
- **tokens helper** — token/spacing/color lookups over `tokens.json` + foundations.
- **app-context helper** — Studio/Explorer/Administration context queries.
- **graph / inverse-edge queries** — "which components reference WCAG 2.1.1 / this
  token?" (consume the dormant `graph.json`).
- **companion multi-domain routing** — route a free-text question to the right helper.
- **design-audit consumer** — check a design against a component's linked criteria.
