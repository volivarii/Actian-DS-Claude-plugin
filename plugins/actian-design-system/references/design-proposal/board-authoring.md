# Authoring a proposal board

A board is `proposals/proposal-data.json`: `meta` plus one `screens[]` entry per screen. Each screen is an
HTML fragment you write by hand, plus a caption and a width. The assembler adds the app header strip,
inlines the Fat Marker stylesheet and lays the screens side by side. You never write the page; you write
what goes inside each screen. Schema: `schemas/proposal-data.schema.json`.

## The fragment contract

- Classes come from the Fat Marker sheet (`references/ds-rules/fm-css-reference.md` shows the palette and the
  main components). The ten a board uses most: `fm-page-header` with `fm-page-header__text` and
  `fm-page-header__title`; `fm-field-group`; `fm-input-label` with `fm-input-label__text`; `fm-input` with
  `fm-input__text`; `fm-button` with `fm-button--primary` or `fm-button--secondary`; `fm-toggle` (add
  `fm-toggle--on`); `fm-badge`; `fm-tag`; `fm-menu` with `fm-menu-item`; `fm-user` with `fm-user__avatar`
  and `fm-user__name`; `fm-placeholder` for grey filler.
- `.fm-input-label` is a column flex container in `fm-base.css`: it stacks its children. A badge sitting
  beside a label needs its own row, for example `<span style="display:flex;gap:6px;align-items:center">`
  wrapping the label text and the badge together. Drop the badge straight in as a child of
  `.fm-input-label` and it stretches into a full-width bar under the label instead of sitting beside it.
- Colours are `--fm-*` variables only: `--fm-text-primary`, `--fm-text-secondary`, `--fm-text-tertiary`,
  `--fm-base-100` to `--fm-base-900`, `--fm-base-white`, `--fm-bg-grey`, `--fm-border`, `--fm-brand`,
  `--fm-brand-light`, `--fm-radius`. A hex or rgb value in a `style` attribute is a P1 finding.
- No `<script>`, no `onclick`, no `javascript:` URL (P0). Clicks are declared: put `data-toggle="<id>"`
  on the control and `id="<id>"` on the element it shows or hides, in the same screen. The board's one
  listener flips the `hidden` attribute. Start a panel hidden by adding the `hidden` attribute. Ids are
  board-wide (P1 if reused): a state copied into a second screen for "States as screens" must rename its
  ids, not just its toggle targets.
- No `src` or `href` that starts with `http`, `https` or `//` (P0). The board opens offline.
- Every opened `div`, `span`, `p`, `section`, `button`, `a`, `ul`, `ol`, `li`, `table`, `tr`, `td`, `th`,
  `label` and heading is closed (P0).
- Product words follow the vendored terminology and avoid-word rules; the validator runs both over your
  text and captions. No em dashes in copy (P2): colon, comma or period.
- Do not write an app name, a nav bar or an avatar strip: the assembler renders the header strip for the
  screen's `app` from app-context. If the screen must show a menu that hangs from the header avatar,
  draw the avatar button at the top right of your fragment (see the popover convention).

## Conventions that make a board read as a proposal

- **Width to the idea.** 320 for a menu or popover, 360 to 400 for a form region, 720 for a page region.
  Never 1440: the board is not a prototype.
- **One caption, one decision.** The caption states what the screen decides, in one sentence:
  "Single-group case: the badge is the whole answer, no extra click."
- **Emphasise the thing the ticket adds.** Wrap it in
  `style="border:2px dashed var(--fm-brand);background:var(--fm-brand-light);border-radius:var(--fm-radius);padding:12px"`
  and add `<span class="fm-badge">New</span>` beside its label. One emphasis per screen.
- **Popover.** The screen body is `position:relative`. Draw the trigger at the top right
  (`style="position:absolute;top:0;right:12px"`), then the panel below it
  (`style="position:absolute;top:44px;right:12px;width:240px;z-index:2"`), and give the body a
  `min-height` tall enough to hold the open panel. Use `data-toggle` from the trigger to the panel.
- **States as screens.** Default and expanded, one group and several groups, are separate screens with
  their own captions, not tabs inside one screen.
- **Recommendation.** `meta.recommendation` is a short HTML fragment: which screen to ship and why, two
  or three sentences.

## Run

```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/validation/validate-proposal.js" proposals/proposal-data.json
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/renderers/assemble-preview.js" proposals/proposal-data.json --type proposal -o proposals/<slug>.html
```

Re-run until no P0 remains and every remaining P1 is one you have explained in chat (a ticket's own word
kept over a terminology hit); P2 is voice, fix it when cheap.
