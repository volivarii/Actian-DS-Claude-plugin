# Authoring a proposal document

`proposals/proposal-data.json` is the source; `assemble-preview.js --type proposal` lays it out and
`validate-proposal.js` checks it. The schema (`schemas/proposal-data.schema.json`) carries an example on
every field; read its examples, not the renderer.

## The sections and what each one is for

- **context**: `question` (the one sentence from Step 1), `product` (three to six sentences on how the
  product handles this today: the anchor surface, the data model behind it, what an admin and a user see),
  `sources` (one line each, `app-context: ...` or `attachment: ...`), `gap` (one sentence, only when the
  anchor surface has no capture in app-context).
- **research**: `ran` and up to five `findings` of `{ claim, source }`, the source as text (the document
  loads nothing). When research did not run: `ran: false`, `findings: []`, `skippedBecause`.
- **approaches**: two to four. Each has an `id` (a slug), a `name`, an `anchor` (`app` slug and the
  `surface` in the product's words), `whatItIs` and `breaksWhen` (one line each), a `verdict` (a few words,
  printed as a tag), a `screen` (`width`, `html`) and `screens` (one to four entries in generate-flow's
  screen-list shape: `name`, `template` from `recipes/flow/_index.json`, `app`, `entity` or null, `note`).
- **comparison**: `criteria` rows (`id`, `label`, `source` one of `ticket goal`, `product fact`, `cost`)
  and `cells[approachId][criterionId] = { text, tone }` with `tone` one of `good`, `mixed`, `bad`. Every
  criterion comes from the ticket's stated goal, a fact the product read established, or cost; never taste.
- **recommendation**: `approachId`, a `summary` paragraph, two to four `reasons` of `{ title, why }`, and
  `change` (`adminSide`, `userSide`) when the change is two-sided.

## One anchor, N variants

Every approach is drawn inside the surface the ticket lives on, in the product's words (`anchor.surface`),
so the reader compares variants of one thing. When the approaches truly live on different surfaces, each
names its own anchor. The assembler renders the anchor app's header strip above the drawing; do not draw
an app name, a nav bar or an avatar strip.

## The fragment contract

- Classes come from the Fat Marker sheet; `references/ds-rules/fm-css-reference.md` shows the palette and
  the main components. `fm-base.css` also defines `fm-field-group`, `fm-input` with `fm-input__text`,
  `fm-toggle` (add `fm-toggle--on`), `fm-badge`, `fm-tag`, `fm-menu` with `fm-menu-item`, `fm-user` with
  `fm-user__avatar` and `fm-user__name`, and `fm-placeholder`; use them as named.
- `.fm-input-label` is a column flex container: it stacks its children. A badge beside a label needs its
  own row (`<span style="display:flex;gap:6px;align-items:center">` around the text and the badge).
- Colours are `--fm-*` variables only: `--fm-text-primary`, `--fm-text-secondary`, `--fm-text-tertiary`,
  `--fm-text-success`, `--fm-text-error`, `--fm-base-100` to `--fm-base-900`, `--fm-base-white`,
  `--fm-bg-grey`, `--fm-border`, `--fm-brand`, `--fm-brand-dark`, `--fm-brand-light`, `--fm-radius`,
  `--fm-shadow-default`. A hex or rgb value anywhere, prose included, is a P1 finding.
- **Draw in flow.** A menu, a popover or a panel is drawn as a block inside its anchor, at the top of the
  fragment, with `width:100%` or a fixed width; never `position:absolute` (P1). The frame grows with the
  drawing and nothing is clipped.
- No `<script>`, no `onclick`, no `javascript:` URL (P0). Clicks are declared: `data-toggle="<id>"` on the
  control and `id="<id>"` on the element it shows or hides, in the same drawing. Start a panel hidden by
  adding the `hidden` attribute. Ids are document-wide (P1 if reused).
- No `src` or `href` that starts with `http`, `https` or `//` (P0). The document opens offline.
- Every opened `div`, `span`, `p`, `section`, `button`, `a`, `ul`, `ol`, `li`, `table`, `tr`, `td`, `th`,
  `label` and heading is closed (P0).
- Product words follow the vendored terminology and avoid-word rules; the validator runs both over every
  text field. No em dashes anywhere (P2): colon, comma or period.

## Conventions that make the document read as a proposal

- **Width to the idea.** 320 for a menu or popover, 360 to 400 for a form region, 720 for a page region.
- **Emphasise the thing the ticket adds.** Wrap it in
  `style="border:2px dashed var(--fm-brand);background:var(--fm-brand-light);border-radius:var(--fm-radius);padding:8px 10px"`
  and add `<span class="fm-badge">New</span>` beside it. One emphasis per drawing.
- **Two lines, one verdict.** `whatItIs` says what it is; `breaksWhen` names the case it does not survive;
  `verdict` is the reader's shorthand ("Simple, caps at one group").
- **Reasons argue from the table.** Each reason names a criterion the recommended approach wins or a
  fact from the product read. Two to four; the fourth is usually "it reuses what exists".
- **The screen list is the bridge.** `screens[]` describes the pages a flow of this approach would show,
  not the drawing; `note` says what the approach changes on that page.

## Run

```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/validation/validate-proposal.js" proposals/proposal-data.json
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/renderers/assemble-preview.js" proposals/proposal-data.json --type proposal -o proposals/<slug>.html
```

Re-run until no P0 remains and every remaining P1 is one you have explained in chat (a ticket's own word
kept over a terminology hit); P2 is voice, fix it when cheap.
