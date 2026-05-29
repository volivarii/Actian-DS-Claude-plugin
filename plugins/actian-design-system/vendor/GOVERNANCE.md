# The Agnostic Substrate Doctrine

**For:** `actian-ds-knowledge` — the federated source-of-truth (SoT) for the
Actian Design System.
**Status:** ADOPTED — 2026-05-23.
**Derived from:** the Stage 0 Research Dossier (R1, R1b, R2, R3, R4, R5),
maintained as working artifacts in `actian-design-system-plugin/docs/superpowers/specs/2026-05-22-knowledge-substrate-assessment/`.

---

## Purpose & how to use this

This doctrine is the **standing yardstick** for every future change to
`actian-ds-knowledge`. It exists to keep the repo a *maximally agnostic, yet
stably structured* substrate — one that serves an unbounded set of consumers
(plugin, docs, Storybook, MCP, LLM surfaces, editing tools, …) without bending
to any one of them.

It has two parts: **eight principles** (the reasoning) and a **pass/fail
checklist** (the test). When a change is proposed — a new field, a renamed
file, a schema edit, a new consumer's request — run it through the checklist.
A change that fails a checklist item is not forbidden, but it must be
justified explicitly and, where it is a breaking change, follow the governed
process in Principle 5.

**The founding idea** (R5): *agnostic ≠ structureless.* An unstructured SoT is
not agnostic — it is **opaque**, pushing interpretation cost onto every
consumer. True agnosticism is the absence of *consumer-specific* structure,
not the absence of structure. A structure anchored to the **domain** is
simultaneously the most stable and the most agnostic — they are the same
property. "Consumers adapt, but benefit from a stable structure" is therefore
not a compromise; it is the natural consequence of domain-anchored design.

---

## The Eight Principles

### P1 — Domain-anchored structure

Every file path, directory, field name, type name, and section name is named
for a **design-system domain concept** (Component, Token, Foundation, Pattern,
Anatomy, Variant, State, Usage, Accessibility, Status) — never for a
consumer's UI, route, layout, tool, or data model.

- **Rationale (R5):** the domain changes slowly and deliberately; consumer
  needs change fast and conflict. A name that reflects *what a thing is*
  outlasts every consumer's rendering decision. DDD's *ubiquitous language*.
- **Evidence of violation (R1b, R2):** `card_*`-prefixed keys (a renderer's
  "card" UI), `_alias_of` / `registryAliases` (a Figma-naming artifact),
  `nav_order` and `{: .do-dont-table}` and `<Media>` markers in source (Jekyll
  / docs-renderer concerns).
- **Forecloses:** naming anything in the SoT after the consumer that happens
  to want it first.

### P2 — Consumers adapt; the SoT never bends to a consumer

Each consumer translates the SoT into its own internal shape through its own
**adapter** (DDD's Anti-Corruption Layer). Consumer-specific needs are met in
the consumer's adapter — never by changing the SoT's shape. **A new consumer
must never require a SoT migration.**

- **Rationale (R5):** the SoT is a *Published Language* / Open Host Service —
  owned by the domain, used by all consumers, biased toward none.
- **Evidence (R1, R3):** the Keystatic finding — a tool demanding the repo be
  restructured to its flat-file collection model — is precisely the pressure
  this principle forecloses. R3: every platform that coupled its SoT to one
  tool's model (Supernova, Zeroheight) accrued migration debt.
- **Forecloses:** restructuring the SoT to fit any editor, renderer, or tool.

### P3 — The SoT is an explicit, documented, published contract

The schema and structure are a first-class, documented artifact: field names,
types, required/optional status, valid values, and the *meaning* of each
field. What consumers may depend on is stated explicitly.

- **Rationale (R5):** Hyrum's Law — with enough consumers, *every* observable
  behaviour becomes a de facto commitment. The only defence is to make the
  implicit contract explicit, so it can be evolved deliberately.
- **Evidence (R2):** `schemas/` + `paths-manifest.json` already do much of
  this; the gap is the *undocumented* observable behaviours (field ordering,
  heading-derived slugs, key presence).
- **Forecloses:** "it just happens to work that way" as a contract.

### P4 — Typed, presentation-free fields

Content is decomposed into the smallest fields that carry independent domain
meaning. No field name, type, or value encodes how content is displayed.
The SoT stores domain **entities**; each consumer produces its own
**projection**.

- **Rationale (R5):** typed fields can be consumed selectively by any
  consumer; prose blobs are opaque. Presentation is a consumer concern.
- **Evidence (R1):** consumers want wildly different shapes (plugin: cards;
  docs: pages; LLM: prose; Storybook: prop tables) — only a typed, neutral
  entity serves all; any one projection promoted into the schema serves one.
- **Forecloses:** a `body`-blob SoT; presentation hints in source.

### P5 — Additive by default; breaking changes are governed

Adding optional fields, new content types, new enum values, new sections is
**safe and needs no ceremony**. Removing, renaming, or retyping anything
consumers can observe is a **breaking change** and requires: a semver-MAJOR
bump, the expand-contract (parallel-change) migration, a deprecation window,
and confirmed consumer awareness before removal.

- **Rationale (R5):** a published contract must be stable; the repo must
  evolve. The reconciliation is discipline about *which* changes are free and
  *which* are governed — additive vs breaking, semver-encoded.
- **Evidence (R2, R4):** the repo already runs lockstep versioning and a
  vendor-pin scheme — the foundation exists; what's missing is the explicit
  expand-contract discipline and deprecation windows.
- **Forecloses:** silent renames; unilateral removals.

### P6 — Stable identifiers, never derived from editable prose

Every identifier a consumer addresses content by — slugs, keys, anchors — is
**explicit and stable in the source**. Identifiers are never silently derived
from editable prose (e.g. heading text).

- **Rationale (R1b — highest-risk live finding):** the a11y index derives
  slugs from heading text; both plugin and docs string-match them; an
  editorial heading rename silently breaks both consumers. `CANONICAL_PATTERN_SLUGS`
  is the same fragility patched with a hardcoded map in a derive script.
- **Forecloses:** "rename a heading, break a consumer."

### P7 — Internal organisation is not the external contract

The SoT's *internal* file layout and directory organisation may evolve freely
**behind a stable read interface** (the manifest / path-resolution
indirection). What consumers read is the contract; how files are arranged on
disk is implementation detail.

- **Rationale (R5):** decoupling internal organisation from the published
  contract is what lets the substrate be reorganised for authoring or
  maintainability without consumer breakage.
- **Evidence (R2):** `paths-manifest.json` + the consumers' `paths.js` /
  `paths.cjs` resolvers already provide this indirection layer — it works;
  it should be recognised as doctrine and relied on.
- **Forecloses:** consumers hardcoding raw file paths; treating the directory
  tree as the API.

### P8 — Transversal reference taxonomies use stable slug refs, never duplication

Some substrate domains serve as **reference taxonomies** that other domains
point into via stable slug refs, never duplicating the referenced content.
The reference shape is `{ref: <slug>, note?: <string>}`: the slug addresses
content in the target's dist; the optional `note` carries application-specific
context without duplicating canonical content.

Today the substrate has three transversal reference taxonomies in active use:

- **Accessibility** — WCAG 2.1 AA criteria anchored in
  `accessibility/dist/a11y-index.json`; components reference them via
  `a11y_refs: [{ref: focus-keyboard, note: "..."}, ...]` in
  category-defaults frontmatter.
- **Motion patterns** — 8 anchored patterns in
  `foundations/dist/tokens/motion.json#patterns`; components reference them via
  `motion_refs: [{ref: state-transitions, note: "..."}, ...]` in
  category-defaults frontmatter.
- **Foundations sections** — the design-foundation sections anchored in
  `foundations/dist/foundations-index.json#sections[*].slug` (color-primitives,
  tokens, design-guidelines, handoff-protocol, related-guidelines); components
  reference them via `foundations_refs: [{ref: tokens, note: "..."}, ...]` in
  category-defaults frontmatter.

The pattern is generalisable. Future transversal domains (candidates: content
rules, interaction state machines, anatomy primitives, brand colors) adopt the
same shape so they're recognisable as transversal-shaped rather than each
inventing their own reference convention.

- **Rationale:** transversal concerns cut across multiple substrate domains.
  Duplicating them into each referring domain produces drift; centralising in
  a reference taxonomy with stable slug addressing keeps a single source of
  truth that resolves at consumer read-time. Stable slugs (P6) make name
  drift invisible to consumers.
- **Concrete shape:** the reference array is named after the target domain
  (e.g. `motion_refs`, `a11y_refs`, `foundations_refs`); items are `{ref: <slug>}` plus
  optional `note`. Slugs must exist in the target's dist; derive-time check
  fails fast on missing slugs. (See §4.1 of the foundations split spec for
  the anchor-uniqueness check; the cross-domain version applies the same
  fail-fast philosophy.)
- **Evidence (existing usage):** `schemas/category-defaults.json` requires
  the `motion_refs` and `a11y_refs` arrays and supports a `foundations_refs`
  array — see `components/src/categories/action.md` for concrete example.
- **Provenance:** motivated by 2026-05-27 strategic synthesis recognising the
  transversal pattern already operating in components→a11y and
  components→motion. Vincent (2026-05-27) flagged that accessibility
  specifically should be transversal across tokens / motion / content /
  design / components. Schema verification revealed motion already
  participates in the same pattern — so this principle generalises the
  convention rather than naming a single domain.
- **Asymmetric gap (today):** components reference the transversal
  taxonomies; content does NOT yet (e.g., content rules discuss tone without
  pointing into any anchored taxonomy). The post-foundations-split follow-up
  adds `a11y_refs` and where appropriate `motion_refs` to foundations + content
  per-section files, completing the symmetry. As of 2026-05-29, foundations
  also acts as a *referenced* taxonomy: components declare `foundations_refs`
  into `foundations-index.json`. Content remains un-anchored and un-referenced
  pending a demonstrated citation need.
- **Naming note:** the substrate standardised on the `<domain>_refs` suffix
  in v0.25.0 — `motion_refs`, `a11y_refs` (renamed from bare `accessibility`),
  and `foundations_refs` — so the reference convention now reads uniformly. New
  transversal taxonomies adopt the same `<domain>_refs` shape.
- **Forecloses:** duplicated transversal-domain content (WCAG text in
  tokens; motion-pattern descriptions in components); string-based cross-refs
  that drift on rename; novel ref shapes that diverge from
  `{ref: <slug>, note?: <string>}`.

---

## Consumer-side obligation: the Tolerant Reader

The doctrine binds consumers too. "Consumers adapt" (P2) has a concrete
requirement: every consumer **must be a Tolerant Reader** (R5 P8) —

- extract only the fields it needs; **ignore unknown fields** rather than
  failing on them;
- use defaults for absent optional fields;
- never depend on field ordering or exhaustive key enumeration;
- pin to a schema major version and own a version floor guard (R1b found the
  docs site has `MIN_SUPPORTED_KNOWLEDGE`; the plugin has no equivalent —
  asymmetric, and a gap).

A producer that honours P5 and a consumer that is a Tolerant Reader together
make a substrate that evolves in both directions without breakage.

## Presentation divergence is allowed

A consumer that is opinionated about *how* it presents the substrate — page
order, section names, embedded widgets, prose flavor — is doing its job.
The substrate stays domain-anchored (P1) and renderer-agnostic; a consumer
(docs site, plugin, MCP surface, …) is free to rename, reorder, omit, augment,
combine, or hide whatever the substrate emits. This is not drift — it is
the very split P2 is meant to enable.

What this implies in practice:

- **The substrate is not the rendered website.** `foundations/src/`
  authors token shapes + design rules; the docs site (`actian-ds-docs`) is a
  hand-authored, opinionated view of those shapes. The two layers may diverge
  in section names, ordering, and structural granularity. That divergence is
  legitimate.
- **Make the divergence observable.** Every consumer that presents substrate
  data should make its source pointer visible to readers (e.g., a derivation
  banner on each docs page, or a comment at the top of a derived file). The
  doctrine forbids silent drift; it does not forbid loud divergence.
- **Where opinion lives.** Section labels, page order, embedded widgets, and
  prose flavor are consumer concerns. Token shapes, slugs, anchor ids, and
  schema contracts are substrate concerns. If a question is "should we rename
  X for clarity in our renderer?" — that is consumer-side. If a question is
  "should we change the dist shape?" — that is substrate-side and runs through
  P1+P5.
- **Drift guards.** A consumer that diverges materially should ship a check
  (a CI test, a coverage report, a presence assertion) that surfaces sections
  it expects to find in the substrate but doesn't, and vice versa. The aim
  is **intentional divergence**, observable to maintainers.

---

## The pass/fail checklist

Run a proposed change through these. Each is phrased so **"yes" = pass**.

**Domain anchoring**
1. Does every new/changed name refer to a design-system *domain* concept (not
   a consumer's UI, route, tool, file-format, or data model)? *(P1)*
2. Is the change free of presentation/rendering hints in field names, types,
   or values? *(P4)*

**Agnosticism**
3. Can the change be satisfied without restructuring the SoT to suit a
   specific consumer — i.e. could the requesting need be met in that
   consumer's own adapter instead? *(P2)*
4. If a *new* consumer motivated this change: does the SoT shape stay
   unchanged, with the new consumer adapting to it? *(P2)*
5. Is the change free of any consumer's name, tool, or routing assumption
   appearing in SoT files, schemas, or derive scripts? *(P1, P2)*

**Stable contract**
6. Is the change documented in the schema / manifest contract — types,
   required/optional, meaning — so consumers know what they may depend on?
   *(P3)*
7. Are all identifiers the change introduces (slugs, keys, anchors) explicit
   and stable in source — not derived from editable prose? *(P6)*

**Governed evolution**
8. Is the change **additive only** (new optional field / type / enum value /
   section)? If yes → pass freely. *(P5)*
9. If the change removes, renames, or retypes anything observable: does it
   carry a semver-MAJOR bump, an expand-contract migration, a deprecation
   window, and confirmed consumer awareness? *(P5)*

**Separation of concerns**
10. If the change reorganises files/directories: is it absorbed behind the
    stable manifest/path-resolution interface, leaving the consumer-facing
    contract unchanged? *(P7)*

**Cross-domain references**
11. If the change introduces a cross-reference between domains, does it use
    the `{ref: <slug>, note?: <string>}` shape, with the target slug existing
    in a reference taxonomy's dist (with a derive-time fail-fast check on
    missing slugs)? *(P8)*
12. If the change introduces a new transversal reference taxonomy: is it
    addressable by stable slugs in dist, and does it follow the same shape
    as accessibility + motion (so consumers can write polymorphic adapters)?
    *(P8)*

A change that answers "yes" to all applicable items is doctrine-compliant. A
"no" is not a veto — it is a flag that the change is either coupling debt
being created, or a breaking change that must be governed (item 9), and must
be justified in the open.

---

## Scope notes

- The doctrine governs the **SoT** (`src/`, schemas, the manifest contract,
  and derive-script behaviour that consumers observe). It does **not** govern
  consumers' internal code — that is each consumer's own concern, subject only
  to the Tolerant Reader obligation.
- The doctrine is **descriptive of a target**, not a record of the current
  state. A companion `current-state-audit.md` (kept with the research dossier
  in the plugin repo) measures today's repo against it; existing violations
  are coupling debt to be remediated under P5's governed process, not breakage
  to panic over.
