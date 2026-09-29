# Figma screen

The JSON `figma-screen.js <screen.json> --parent-id <id>` turns into design system instances: one file per screen, one `screens[]` entry of `schemas/flow-data.schema.json`.

```json
{ "id": "<slug>-1", "name": "<what this screen shows>", "template": "studio|explorer|administration",
  "activeNavItem": "<side navigation label>", "pageHeader": { "title": "...", "subtitle": "..." },
  "content": [ <nodes> ] }
```

The script draws the app header, the app's own side navigation and the page header from `template`, `activeNavItem` and `pageHeader`: author only the content area. It builds the frame 1440 wide, hugging its height, and appends it to the node `--parent-id` names.

| Key | Values | Notes |
| --- | --- | --- |
| `type` | `FRAME`, `TEXT`, `INSTANCE`, `DIVIDER` | |
| `name` | string | the Figma layer name |
| `children` | nodes | FRAME only |
| `layout` | `{ mode: VERTICAL or HORIZONTAL, spacing, padding, primaryAxisAlignItems, counterAxisAlignItems }` | `padding` a number or `[t,r,b,l]` |
| `sizing` | `{ horizontal, vertical }`, each `FILL`, `HUG` or a px number | |
| `fills`, `stroke`, `cornerRadius` | array, object, number | colours and lengths as `var(--zen-...)` tokens |
| `content`, `font`, `size`, `color` | text, `"Roboto:Regular"` (Medium, Semi Bold, Bold), px, a text token | TEXT only |
| `library`, `dsSlug`, `variant`, `props` | `"ds"`, a component slug, `"Axis=Value, Axis=Value"`, `{ "Prop": "value" }` | INSTANCE only |
| `positioning`, `x`, `y` | `"absolute"`, px, px | a top-level layer (drawer, toast) placed on the screen at x, y |

Which components exist, their variant axes and their properties: `vendor/components/dist/dskit-components.md`.

A token the script cannot resolve, or a colour field whose token is not a colour, stops it with `{ "ok": false, "errors": [...] }` and no code: fix the node it names. Properties the live component refuses are dropped, and the Figma call's return lists them in `droppedProps`: read it, and set what matters by hand.
