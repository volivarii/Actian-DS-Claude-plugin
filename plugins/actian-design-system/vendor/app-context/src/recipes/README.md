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

A recipe's `slots` object names the regions the pattern promises (`../patterns/`'s prose already
says what they are; the recipe says what covers them). A node's own `slot` field (a string, or an
array when one node carries more than one region at once) says which declared key that node draws;
`undrawnSlots` lists a declared key the skeleton deliberately does not draw at all, rather than
silently missing it. The coverage rule every declared slot key must satisfy is: declared = carried
∪ undrawn, and never both for the same key. `tests/app-context-recipes.test.js`'s slot-coverage gate
checks this over every dist recipe, so a slot that is neither drawn nor named as skipped is caught
before a consumer goes looking for a region that was never actually promised or actually built.

`derivedFrom.screenshot` names the product screenshot a recipe was composed against, a relative path
under `captures/` (e.g. `captures/faceted-browse.png`). What goes there is a screenshot of the real
running product surface, never a Figma frame: the frame is the design, `derivedFrom.screenshot` is
what a reader compares a render TO, and the two answer different questions. The plugin's look step is
what reads it, opening the render beside this file so a person (or a future automated check) can tell
a faithful composition from a guess. `faceted-browse.png`, the one committed today, is a dev-tenant
capture carrying the pre-Actian wordmark and a personal avatar; swap it for a clean one at PR time if
that matters for the audience, since neither affects what the recipe itself asserts.

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

## Sections: the parts a page repeats (2026-09-11)

The 09-10 audit of the plugin's output found every defect in the same place: a leaf right in
content, wrong in composition, and wrong differently on every screen. Two screens composed from
this very capture drew two different headers, because the header was a subtree trapped inside one
page recipe: not addressable, not reusable by a wizard step or another entity page.

`../sections/` fixes the ownership. A recurring part is one file with its own `derivedFrom`; a page
recipe references it with `{ "type": "SECTION", "section": "<slug>" }` and the derive splices it in,
so the dist recipe a consumer reads is unchanged in shape (proven byte-for-byte at the extraction
commit). Six exist: `item-header`, `facet-tabs`, `properties-panel`, `control-bar`, `drawer-header`,
`action-footer`. The dist recipe also lists them in `sections`, in document order.

The fragments this file said belong with the renderer (`overlay`, `action-bar`, the two
`composition-*` archetypes) are still not captures, and that position stands for them. A section is
the other thing: a capture of a part. See `../sections/README.md` for the rules.

A `{ "type": "SECTION", "section": "<slug>" }` reference node may also carry `slot`, the one per-use
exception to "a section's content is edited only in the section file": `inlineSections` stamps it
onto root 0 of the spliced-in subtree (the first top-level node of the section's own
`skeleton.content`), overriding whatever `slot` that root authored on itself. It reaches root 0
only; any other root of a multi-root section keeps whatever `slot` it authored, stamped or not. Any
OTHER key on a SECTION reference node besides `type`, `section` and `slot` is still rejected, so
`slot` does not reopen per-use content overrides in general, just this one narrow, addressable case.

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

## The third capture, 2026-09-16: composed from DS leaves

`faceted-browse` was re-authored, leaf by leaf, from the FM-tier `fmCheckbox` + `fmTag` + TEXT
compositions the second capture left behind to real DS-tier INSTANCE nodes: `{ "type": "INSTANCE",
"library": "ds", "dsSlug": "<slug>", "variant": "...", "props": {...} }`, the same shape
`render-node.js` already dispatches on for a generated screen's `library:"ds"` nodes. The two prior
captures proved the FM vocabulary reached the page; this one proves the DS vocabulary does too, with
no gap. `item-type-tag` gives every facet row and the rail a real per-type colour (the six Studio item
types resolve straight onto its `Type` axis, no `Custom-N` or `Glossary-N` stand-in needed);
`search-result-card` replaced the three hand-built result cards with six; `pagination` closes the
results pane, which had none. `../sections/control-bar.json` moved the same way: its results-header
and bulk-bar roots now carry `button` and `checkbox` instances instead of an `fmButton` + `fmCheckbox`
+ TEXT composition.

**Held.** No new DS component was needed either, mirroring the first capture's FM finding: every leaf
this composition reaches for (`checkbox`, `toggle`, `dropdown-select-default`, `item-type-tag`,
`search-result-card`, `read-only-tag`, `progress-bar-small`, `pagination`, `button`) is already
`**BUILT**` in `references/generate-flow/ds-components-authoring.md`.

**Corrected.** `search-result-card` reads less than its variant vocabulary suggests, recorded in
`renderNotes` rather than papered over: it carries no completion or sharing prop, so the completion
meter and the Shared tag are siblings (`progress-bar-small`, `read-only-tag`) rather than something the
card itself renders.

**Review round 2, 2026-09-16 (plan defect, superseding the paragraph above in the original submission):
the bulk bar first drew a `toolbar` instance for the four bulk verbs.** That was wrong on its own
terms, not merely under-expressive: `toolbar`'s `Type` axis (Single/Combined/Group) has no rendering
effect at all (only `Orientation` and `Show View scale` do), and its icon group is hardcoded to
filter/sort/view/more, which the product's bulk bar does not show at all -- the four verbs it does
show (Edit / Move to catalog / Delete / Export selection) were dropped entirely, and a second `Sort`
control was left standing on the right redundant with the header's own sort. Fixed: `toolbar` removed;
the four verbs restored as `button Type=Tertiary` leaves, capture content (the product always names
these same four words here), with the row reordered to match the product -- checkbox, then `Sort
{{sort_label}}` immediately after it, then the four verbs -- and the redundant second sort control
gone. No DS-tier bulk-action-bar leaf exists (checked
`ds-components-authoring.md`'s vocabulary table), named as a follow-up in `control-bar.json`'s own
`renderNotes`.

**A section gains its first DS-primary INSTANCE.** Every prior section kept the FM-primary `{ ref, ds
}` pair the two `tests/app-context-sections.test.js` gates were written against. `control-bar.json`'s
`checkbox` and `button` instances have no FM equivalent authored here either (this section was
composed directly in the DS-primary shape, not converted from an FM one), so neither carries a `ref`;
both gates (`every DS slug ... resolves in the DS kit registry` and `every INSTANCE ... carries a ds
slug`) were extended to also recognise a `{ library: "ds", dsSlug }` node as a first-class DS identity,
checked exactly as strictly as the `ref`+`ds` shape already was, not exempted from it. Proven RED before
GREEN by planting an unregistered `dsSlug` and reverting it, per this repo's gate doctrine. Still true
after the round-2 fix removed `toolbar`, the node that first exercised this: `checkbox` and `button`
need the same extension on their own.

Not a lo-fi regression: `render-node.js` dispatches per node on `library === "ds"`, straight to
`ds-html-map.js`, independently of the `--skin lofi`/hi-fi choice (a CSS-only overlay,
`lofi-skin.js`, that grays non-focus text and `[class*="ds-"]` sub-elements regardless of which map
drew them). A DS-primary node was never FM-only territory; this capture just no longer carries an FM
`ref` alongside it.

Not done here, and named so the next reader does not assume it was: every OTHER recipe and section
still authors FM-primary `{ ref, ds }` pairs, converted to their DS equivalent by a page generated with
`--hifi` through `transform-to-hifi.js` + `fm-to-ds-map.json`. Unifying every capture onto one
DS-primary vocabulary (so that hand-kept map has nothing left to do) is Move 2, tracked separately;
this capture and `control-bar` are the first two composed directly in it, not a general migration.
