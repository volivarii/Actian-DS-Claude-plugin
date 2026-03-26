# Meta Kit Variable Keys

DS2026 Figma variables for use with `figma.variables.importVariableByKeyAsync(key)`.
Bind to generated scaffolding frames via `setBoundVariableForPaint()`.

All variables are from the **Actian Design System v1.1.0** library, **Color** collection.

## Usage pattern

```js
// Import variables at the start of each use_figma call
const vars = {};
async function importVar(name, key) {
  vars[name] = await figma.variables.importVariableByKeyAsync(key);
}
await importVar('bgDefault', '805afec875092b89deebe685e17992963d603974');
await importVar('bgGrey2', '2d7f893d1d1f5807dfc84b7b6e057eff8fd2ae31');
await importVar('borderDefault', '290c868621027b488cbc3b262619959bec52765f');
// ... import all needed variables

// Bind a fill to a Figma variable
function bindFill(node, variable) {
  const fills = JSON.parse(JSON.stringify(node.fills));
  fills[0] = figma.variables.setBoundVariableForPaint(fills[0], 'color', variable);
  node.fills = fills;
}

// Bind a stroke to a Figma variable
function bindStroke(node, variable) {
  const strokes = JSON.parse(JSON.stringify(node.strokes));
  strokes[0] = figma.variables.setBoundVariableForPaint(strokes[0], 'color', variable);
  node.strokes = strokes;
}
```

## Color Variables

| Variable | Key | Default (Actian) | Purpose |
|----------|-----|------------------|---------|
| background-bg-default | `805afec875092b89deebe685e17992963d603974` | #FFFFFF | Card backgrounds, content areas |
| background-bg-grey-1 | `62257cce2f8b13cca0c39739e79569c69f22b028` | #FBFBFF | Subtle backgrounds |
| background-bg-grey-2 | `2d7f893d1d1f5807dfc84b7b6e057eff8fd2ae31` | #F5F5FA | Table headers, section backgrounds |
| border-default | `290c868621027b488cbc3b262619959bec52765f` | #E4E4F0 | Card borders, table row dividers |
| text-primary | `cb3cf6a8b661f3a2ff12835120957f3278d329d0` | #000000 | Headings, primary content |
| text-secondary | `54d9d36f7653380d99e9aadbad21e14f9dcdb295` | #3F3F4A | Body text, subtitles |
| text-tertiary | `d56575506dae345c45ea1563df6b81ca041c8c4f` | #595968 | Muted labels, captions |
| text-placeholder | `e34e7702643edf1bb8f17ad77aafbd8874f89017` | #8A8A9A | Placeholder text in inputs |
| theme-primary | `a256595115f6048a1e1c843e3099a79a5c259288` | #0550DC | Brand accents, links, primary actions |
| status-success-primary | `b8c56f1d09375fd2087f84d74c0c5d5af119ed5c` | #047800 | Pass badges, Do labels |
| status-error-primary | `bc472063267d7d69f837a57c80df56f73d64c577` | #C10C0D | Error indicators, Don't labels |
| interactive-enabled-inverse | `83772749c42b0ab54a4bca609a59310559d9eab3` | #FFFFFF | Text on dark/colored backgrounds |
| interactive-disabled-primary | `226235904cc0141fd82410af0e31b32cd59d1591` | #9898A7 | Disabled elements |
| icon-default | `3dcaaa7ab47eefe274129f94647b3649bde36778` | #12131F | Default icon color |
| icon-secondary | `0dace0dc11a0f6f627c27597c094dcb0ad2c2a15` | #595968 | Secondary icon color |

## Figma variable names

The Figma variable names differ slightly from the CSS token names. For reference:

| CSS Token | Figma Variable Name |
|-----------|-------------------|
| `--zen-color-background-bg-default` | Background (bg)/default |
| `--zen-color-background-bg-grey-1` | Background (bg)/grey 1 |
| `--zen-color-background-bg-grey-2` | Background (bg)/grey 2 |
| `--zen-color-border-default` | Border/default |
| `--zen-color-text-primary` | Text/primary |
| `--zen-color-text-secondary` | Text/secondary |
| `--zen-color-text-tertiary` | Text/tertiary |
| `--zen-color-text-placeholder` | Text/placeholder |
| `--zen-color-theme-primary` | Brand/primary |
| `--zen-color-status-success-primary` | Status/success-primary |
| `--zen-color-status-error-primary` | Status/error-primary |
| `--zen-color-interactive-enabled-inverse` | Interactive/enabled-inverse |
| `--zen-color-interactive-disabled-primary` | Interactive/disabled-primary |
| `--zen-color-icon-default` | Icon/default |
| `--zen-color-icon-secondary` | Icon/secondary |

## Last verified

2026-03-26 -- Variable keys are stable across publishes. Re-verify quarterly.
