# Recipes

A **pattern** in `../patterns/` names a page shape and says in prose what it is. A **recipe** here
gives that shape a composition: the node tree a consumer renders to produce the page.

Patterns answer "what shapes exist". Recipes answer "what is this shape made of".

## Where recipes came from, and why they moved

Compositions lived in the plugin (`recipes/flow/`, 12 of them). That is the wrong **owner**:
consumers that keep their own copy of a shared fact drift from it.

It is **not** the wrong source, and an earlier version of this file said it was. Checked, and false:
`browse-search` names Studio's 277px tree nav and Explorer's 335px faceted filter panel, `detail-view`
names Studio's 568px equal columns. Those were written by someone looking at the product. Nor are all 12
page shapes: `overlay`, `action-bar` and the two `composition-*` entries are fragments, which belong
with the renderer, not in a page-shape catalogue. Retiring them wholesale would delete working
knowledge.

**The defect is the join.** The plugin resolves app-context patterns and biases recipe selection by tag
overlap, so the link already exists. But the pattern schema has no `tags` field, so
`resolve-patterns.js` invents them by splitting the slug on hyphens. Over the 25 Studio patterns and 12
recipes that yields ties (`faceted-browse` hits `table-list` **and** `browse-search`, both on "browse"),
floods (`search-filtered-table` hits five), coincidences (`import-wizard` reaches `form-create` via
"wizard"), and silence: **11 of 25 match nothing**, `activity-timeline`, `metamodel-designer`,
`notification-system` and `access-request-management` among them, all real Studio pages. Filed as plugin #300.

So the sequence is: give patterns real tags, then have the plugin read recipes, and only then retire an
individual flow archetype once a captured recipe covers the same shape.

The evidence, gathered 2026-08-18 by composing the Studio Catalog page and comparing it against a
screenshot of the running product.

**The robust finding, measured across the whole kit.** Rebuilding the page correctly required **no new
FM components**. `fmSlider`, `fmCheckbox`, `fmToggle`, `fmProgressBar`, `fmTag`, `fmChip` and
`fmMultiSelectDropdown` all already shipped. Across all twelve plugin recipes they were used five
times in total (`fmBadge` four, `fmCheckbox` once), with zero uses of slider, toggle or progress bar.
The vocabulary existed and the compositions did not reach for it. That is a count over the entire
recipe set, not an impression.

**The single-page observation.** Asked for Catalog, the generator selected `table-list` at tier
`recognized`, confidence 0.93, and produced a two pane CRUD table. The real page is a three pane
faceted browse over 24,160 items. On that page, the parts sourced from the substrate were right
(sidebar labels, entity properties, entity relationships) and the parts a recipe invented were wrong.

That contrast is suggestive, not established. **It is one page.** Treat it as a single datapoint until
a second archetype is composed the same way and either confirms or breaks it. It should not be quoted
as a general law about substrates versus consumers.

## The second capture, 2026-08-18: what held and what did not

`asset-detail-360` was composed from a Studio Dataset page the same way, after browsing fifteen Studio
surfaces rather than one.

**Held.** Composing the detail page needed no new FM components either. `fmUser`, `fmEmptyState`,
`fmMultiSelectDropdown`, `fmDateInput`, `fmTabs` and `fmInputLabel` all already shipped.

**Held, and larger than first stated.** Studio runs on roughly **fourteen distinct page shapes**, against
the three generic archetypes the plugin held. That is the composition gap in one number.

**Corrected.** `table-list` was **misapplied, not useless**: the Topics page really is one. The archetype
set was not wrong so much as unanchored.

**Corrected, and this is the part one page could not show.** Three component gaps are real, found by
probing the registry with a positive control rather than by eye:

- **No radial gauge exists in either kit** (`gauge`, `donut`, `radial`, `ring`, `circular` all return
  nothing), while the Analytics page leads with two of them.
- **The DS tier has no slider.** `fm-slider` exists, so the FM-tier claim above stands, but the Catalog's
  primary facet is a range slider with no DS-tier component behind it.
- Analytics' chart is an **area chart with dual y-axes**, which is neither `bar-graph` nor `line-graph`.

A removable chip is **not** a gap: the DS tier spells it `tag-interactive`, which carries a trailing-icon
property. Checking that before reporting it is the difference between a finding and a rename.

## Authoring against the renderer, not against a guess

Read `vendor/.../html-renderers/fm-html-map.js` in the plugin before authoring: several components read
less than their name suggests, and a prop the renderer does not read renders blank rather than erroring.
`fmEmptyState` takes no props at all and always says "No items". Those three are filed as plugin #299. `fmTextArea` reads only its `Content=`
variant. `fmTabs` reads `Tabs` plus `Active` and has no count badge. `fmUser` always draws the name
beside the initials. Each recipe's `renderNotes` is where these go, so the next author does not
rediscover them by looking at a broken page.

One rule is now a gate rather than a note. Inside a VERTICAL frame, `sizing.horizontal: "FILL"` is never
correct: it emits `flex:1` with no axis awareness and distributes height, while width already fills from
flexbox's `stretch` default. `faceted-browse` carried 20 of them against its own `renderNotes`, and they
are gone. `tests/app-context-recipes.test.js` now walks every skeleton for the case.

## Authoring a recipe

Derive it from the product, not from an idea of the product. Take a screenshot of the real page,
compose it, render it, and compare. A recipe that has never been rendered next to the screen it
claims to describe is a guess.

Carry a `renderNotes` array. It records the renderer behaviours an author must know to make the
composition draw correctly, so the next recipe does not rediscover them by looking at a broken page.

## Status: wired

A recipe is derived per slug to `app-context/dist/recipes/<slug>.json`, validated against
`schemas/app-context-recipe.json`, stamped, and registered in `paths-manifest.json` as the
`appContextRecipes` collection so `validate-manifest` proves the path resolves.

Per slug rather than folded into `app-context.json`, because that file is consumed whole and one
recipe already exceeds 1400 lines. Bundling them would make every consumer pay for every archetype in
order to read one, which is the mistake already on the roadmap for the 497KB `render.css` inlined into
all 61 bundle cards.

Two guards, both proven to fail before they were trusted:

- The derive refuses to emit when a recipe names an app or pattern that does not exist. Verified by
  pointing a recipe at a non-existent pattern: exit 1, no dist leaf written.
- `tests/app-context-recipes.test.js` asserts a recipe actually reached dist, with a positive control
  proving the count can be zero, so the assertion cannot pass over an empty list.

**The consumer now reads them.** Plugin #305 (2026.8.16, 2026-08-19) closed the last step of the
sequence above: `resolve-patterns.js` emits a `pageRecipe` on every pattern, naming the capture that
declares it, and the generator composes from that capture instead of the ranked archetype. The join is
the recipe's own `patterns` field, so it is a lookup rather than a ranking, scoped by the recipe's
`apps`.

Two things that shipping it established, both worth knowing before authoring the next one:

- **It changes the answer for 2 of 31 patterns**, which is the whole point of capturing more. Both
  captured patterns had been resolving `decisive` to a generic archetype, so the fallback was most
  confident exactly where it was most wrong.
- **A capture is better structurally and worse lexically.** `faceted-browse` holds 34 real component
  instances where `browse-search` holds 9 padded with 3 placeholders. But because it was taken from a
  real screen it speaks the product's vocabulary: run `validate-flow-data.js` over the skeletons and
  the captures raise 7 and 10 terminology findings plus 2 and 1 avoid-word findings, where both
  archetypes raise zero. Compose from the capture, then re-term against the glossary.

Step three of the sequence, retiring a flow archetype, is deliberately not started.

## Known gap in the pattern set

`faceted-browse` now exists in `../patterns/`, added here because the derive refuses to emit a recipe
whose pattern does not resolve. `asset-detail-360` existed but held a single sentence; it is now written
from the capture, and its `components` list grew from 5 to 16.

Still open, and deliberately untouched: `search-filtered-table` describes the Studio Catalog page as
its own opposite, "no separate filter sidebar... no other facets". That is the substrate being
actively wrong about the product's main screen, and every consumer reading patterns has been reading
it. Tracked as #558, which found the deeper cause: the pattern schema is `additionalProperties: false`
over five fields with nowhere to record when a pattern applies or which neighbour to use instead, and
25 of the 31 patterns claim `studio`. Correcting the prose alone would leave the next reader with the
same 25-way choice, so the fix is a selection field first.
