# Prototype files

What a direct-route prototype is made of: the screen list you write, the brief `prepare-flow.js --direct` builds from it, and the four files you write. `assemble-direct.js` draws the rest; `check-direct.js` enforces the rules below.

## The screen list

```json
{ "meta": { "feature": "<slug>", "nav": "<id of the side navigation item the feature lives under>" },
  "screens": [
    { "name": "<what this step shows>", "pattern": "<pattern slug>", "exit": "<what the user does to move on>" },
    { "name": "...", "pattern": "<pattern slug>", "layer": { "kind": "drawer|panel|modal|toast", "over": <step number> }, "exit": "..." }
  ] }
```

`pattern` where an app pattern covers the step (the app file lists them); `layer` where the step is a surface over another step, its `kind` the width the page docks it at (`drawer` 550, `panel` 420); `exit` on every step but the last.

## What the brief gives you

- `direct.steps`: your steps, with `id`, `name`, `nav`, `pattern`, `layer`, `exit` and `capture`.
- `direct.captures[<slug>]`: the real page's `slots` (its regions, in order), `renderNotes`, `sections` and `screenshot` (a PNG path, or null). Read the PNG as an image.
- `direct.components[]`: `fragment` (the design system's own markup, one cell per variant) and `usageNotes`. Every other component: `<slug>.html` under `direct.fragments.dir`, its notes under `direct.fragments.usageNotesDir`.
- `direct.assets`: `renderContract`, `content.writing`, `.patterns`, `.product`, `terminology`, `tokensCss`, `baseCss`, `icons`.
- `direct.app`: the app's rail and header, as the app record has them.

**A screenshot is structure, the design system is appearance**: take a page's regions and their order from a capture, never a colour, size or font. **The product's own words win**: labels on a captured page and the brief's `labels` and `glossary` outrank `terminology` where they disagree.

## The four files, in one folder

**`body.html`**
- One `<div data-app-frame>` holding the page's content area only (its own `class` and attributes are kept). The assembler draws the app header and the side navigation, with the right item active on every step; a `ds-header` or `ds-sidenav` class in your file is a P0.
- The assembler also draws a strip above the page: a button per step, a hint from each `exit`, "Show what is new" and "Restart". Draw none of these.
- Component markup is the fragment's markup with your content in it: classes, roles and `aria-*` kept. Every control has an accessible name in the product's words.
- An icon is `<span data-icon="<slug>"></span>`, in `body.html` and in markup `app.js` writes.
- A layer is `<aside data-layer="drawer|panel|modal|toast" hidden>`, after the frame's closing `</div>`, keeping the fragment's own class. The page owns the box of a drawer, a panel and a modal (centred on a scrim): never set their position or size. A toast you place yourself in `extra.css`.
- Show and hide with the `hidden` attribute, never `style.display`. When a layer opens, move focus into it.
- Anything the product does not have today carries `data-new="<name>"`, the name of its entry in `meta.json`.
- No `<script>`, `<style>`, `<link>`, external URL or `{{`.

**`app.js`**
- Plain JavaScript, no imports. One state object, one render function.
- The page creates `proto` first. Assign `proto.steps = [{ id, arrive }, ...]`, one per step, the brief's ids in order, and nothing else of `proto` (never `var proto`).
- `arrive()` puts the page in that step's state from any state (a step can be opened cold with `?step=n`) and keeps what a live click already made true. A layer step takes the state of the step it sits over.
- The control a step's `exit` names calls `proto.go(<next step>)`; an action exit ("ticks two rows") advances when the action happens.
- Between steps the behaviour is live: a checkbox selects, a filter filters, a save changes the list.
- Never the text `<!--`.

**`extra.css`**: layout glue only. Every colour, space, radius and shadow is a `var(--token)` from `tokensCss`; `var(--proto-app-header)` is the app header's height. Every class you style is carried by an element. No `</style`.

**`meta.json`**: `{ "adds": [{ "name", "composedFrom": ["<component slug>"], "why" }], "justification": "<one sentence>" }`, one entry per `data-new` name, named as a designer would say it, composed from components that exist.

## One flow, one truth

A step's name is a claim the page must show: "Catalog, no description" shows that filter applied, not merely rows that happen to match. Decide the data once (rows, names, counts) and draw every step from it. Realistic product data: never "Item 1", never lorem ipsum.

## The findings

`check-direct.js` prints `P0 [kind] file → message` or `P1 [kind] file → message` per finding, `check-direct: clean` when there is none, and exits 1 on any P0.

| Kind | Level | The fix |
| --- | --- | --- |
| `external-url` | P0 | Remove it: the page opens offline |
| `unfilled-token` | P0 | Replace the `{{placeholder}}` with content |
| `unknown-icon` | P0 | Use a slug from the icons file the brief names |
| `unknown-token` | P0 | Use a `var(--token)` the stylesheet defines |
| `unknown-ds-class` | P0 | Use the class the component's fragment carries |
| `raw-colour` | P1 | Replace the hand-typed colour in `extra.css` with a token |
| `unstyled-class` | P0 | Put the class on the element it was meant for, or delete the rule |
| `frame-missing` | P0 | Wrap the content area in `<div data-app-frame>` |
| `rail-mismatch` | P0 | The brief's rail disagrees with the app record: rebuild the brief with `prepare-flow.js --direct` |
| `frame-redrawn` | P0 | Remove the header or side navigation: the assembler draws them |
| `layer-misplaced` | P0 | A layer is an `<aside data-layer>` of a known kind, after the frame closes |
| `step-mismatch` | P0 | `proto.steps` ids equal the brief's step ids, in order |
| `steps-unread` | P1 | `app.js` threw when evaluated: fix the error it names |
| `new-undeclared` | P1 | Add the `data-new` name to `meta.json` adds |
| `add-unplaced` | P1 | Mark the new thing with `data-new`, or drop the entry |
| `unsafe-embed` | P0 | Remove `</style` from `extra.css`, or `<!--` from `app.js` |
