# Interactive Prototype & Playground Reference

Generation guidelines for Alpine.js prototypes and component playgrounds. Read this file before generating any `-prototype.html` or `-playground.html` file.

---

## Alpine.js Version

Always pin to the exact CDN URL below. Never use `@3.x`, `@latest`, or any other floating reference.

```html
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.9/dist/cdn.min.js"></script>
```

Place this tag in `<head>` — before the closing `</head>` tag, after all `<style>` blocks.

---

## Flow Prototypes

Flow prototypes add just enough interactivity to a static HTML flow to make it testable — screen transitions, basic form validation, and decision paths. The underlying static HTML (from the generate-flow skill) is the source of truth and must not be altered structurally.

### Template

Prototype files use the wrapper at:

```
../../templates/flow-prototype-wrapper.html
```

#### Placeholder table

| Placeholder | What to fill in |
|---|---|
| `FEATURE_NAME` | Human-readable feature name, e.g. `"Data Source Setup"` |
| `SCREEN_LIST` | JS array of screen numbers used to build navigation, e.g. `[1, 2, 3, 4]` |
| `SCREENS` | Concatenated HTML of all screen `<section>` blocks (see Screen Sections below) |
| `COMPONENT_SPECIFIC_CSS` | Any CSS classes needed for this prototype's components that aren't already in `tokens.css` |
| `ADDITIONAL_STYLES` | Any prototype-specific override styles (error states, transition overrides, etc.) |

### Screen sections

Wrap each screen's static HTML in a `<section>` with an `x-show` directive. Screens are identified by integer index starting at `1`.

```html
<section x-show="screen === 1" data-screen="1" data-name="Screen name">
  <!-- static HTML for this screen goes here unchanged -->
</section>

<section x-show="screen === 2" data-screen="2" data-name="Screen name">
  <!-- static HTML for this screen goes here unchanged -->
</section>
```

- Always include `data-screen` and `data-name` for debugging and accessibility.
- Do not add CSS transitions between screens — `x-show` toggling is sufficient.
- The Alpine root element wrapping all sections must carry `x-data` with the full state object.

### Directive mapping

Add Alpine directives to the rendered HTML elements as shown. Do not modify the element's existing classes or structure — attach directives as additional attributes only.

| Element | Directive to add | Notes |
|---|---|---|
| Primary / "Next" button | `@click="screen = N"` | `N` is the target screen number |
| "Cancel" / "Back" button | `@click="screen = screen - 1"` | Use when there is a linear back path; use an explicit `@click="screen = N"` for non-linear returns |
| Text input | `x-model="fieldName"` | Bind each input to a named string property in `x-data` |
| Required text input | `x-model="fieldName"` + `@blur="validate('fieldName')"` + sibling error `<span>` | See Form Validation Example below |
| Submit button | `@click="submit()"` + `:disabled="!isFormValid"` | `isFormValid` is a getter computed in the `x-data` object |
| Decision / branching button | `@click="path = 'optionA'; screen = 3"` | Set both the path and the target screen in one handler |
| Conditional screen | `x-show="screen === N && path === 'optionA'"` | Combine screen and path checks when the screen is path-specific |

### Form validation example

Use this pattern for any form screen with required fields. The `fm-input-group`, `fm-label`, `fm-input`, and `proto-error` classes come from the wrapper's base styles — do not redefine them.

```html
<div class="fm-input-group">
  <label class="fm-label" for="sourceName">
    Data source name <span aria-hidden="true">*</span>
  </label>
  <input
    id="sourceName"
    class="fm-input"
    :class="{ 'fm-input--error': errors.sourceName }"
    type="text"
    placeholder="e.g. Production DB"
    x-model="sourceName"
    @blur="validate('sourceName')"
    aria-describedby="sourceName-error"
  />
  <span
    id="sourceName-error"
    class="proto-error"
    x-show="errors.sourceName"
    x-text="errors.sourceName"
    role="alert"
  ></span>
</div>
```

Corresponding `x-data` object:

```js
{
  sourceName: '',
  errors: {},
  validate(field) {
    if (!this[field] || this[field].trim() === '') {
      this.errors[field] = 'This field is required.';
    } else {
      delete this.errors[field];
    }
  },
  get isFormValid() {
    return this.sourceName.trim() !== '' && Object.keys(this.errors).length === 0;
  }
}
```

### What NOT to make interactive

These elements must remain static. Adding Alpine to them creates scope creep and is explicitly out of bounds for a prototype.

| Element | Why to leave static |
|---|---|
| Navigation sidebar (FM Side navigation bar) | Navigation context is implied by screen; do not simulate full nav state |
| App header | Header chrome is structural, not tested in flow prototypes |
| Table sorting / column headers | Data-table interactions are a separate test scope |
| Dropdown open/close | FM Dropdown is rendered in a fixed state (Placeholder or Filled) — do not add open/close toggle |

---

## Component Playgrounds

Component playgrounds render a single DS2026 or FM Kit component with live controls for every variant axis and interactive state. They are used to verify token binding, state transitions, and theme switching in isolation.

### Template

Playground files use the wrapper at:

```
../../templates/component-playground-wrapper.html
```

#### Placeholder table

| Placeholder | What to fill in |
|---|---|
| `COMPONENT_NAME` | Component name as it appears in the design system, e.g. `"Button"` |
| `VARIANT_AXES` | JS object mapping axis names to their allowed values, e.g. `{ hierarchy: ['Primary', 'Secondary color', 'Tertiary color', 'Link color'], size: ['Default', 'Small'] }` |
| `TOKEN_MAP` | JS object mapping states to token names (see Token Readout below) |
| `CONTROL_GROUPS` | HTML for the control panel — one group per axis (see Axis Detection below) |
| `VARIANT_SECTIONS` | HTML rendering the component in each variant/state combination |
| `COMPONENT_SPECIFIC_CSS` | CSS scoped to this component's playground (hover overrides, demo spacing, etc.) |

### Axis detection

Inspect the component's Figma variant axes. Map each axis type to a control type using the table below.

| Axis type | Control type | Alpine directive |
|---|---|---|
| Boolean (True / False, Yes / No, On / Off) | Toggle button | `@click="axisName = !axisName"` |
| Enum (2+ named string values) | Segmented bar | `@click="axisName = 'hover'"` (one button per value) |

#### Boolean toggle example

```html
<div class="pg-control-group">
  <label class="pg-control-label">Destructive</label>
  <button
    class="pg-toggle"
    :class="{ 'pg-toggle--active': destructive }"
    @click="destructive = !destructive"
    :aria-pressed="destructive.toString()"
  >
    {{ destructive ? 'True' : 'False' }}
  </button>
</div>
```

#### Enum segmented bar example

```html
<div class="pg-control-group">
  <label class="pg-control-label">State</label>
  <div class="pg-segmented" role="group" aria-label="State">
    <button class="pg-seg-btn" :class="{ 'pg-seg-btn--active': state === 'enabled' }"  @click="state = 'enabled'">Enabled</button>
    <button class="pg-seg-btn" :class="{ 'pg-seg-btn--active': state === 'hovered' }"  @click="state = 'hovered'">Hovered</button>
    <button class="pg-seg-btn" :class="{ 'pg-seg-btn--active': state === 'focused' }"  @click="state = 'focused'">Focused</button>
    <button class="pg-seg-btn" :class="{ 'pg-seg-btn--active': state === 'disabled' }" @click="state = 'disabled'">Disabled</button>
  </div>
</div>
```

### Token readout

Include a live token readout panel that shows which tokens are active for the current state. Structure it as a JS object in the `x-data` where keys are state names and values are arrays of token name strings.

```js
const tokenMap = {
  enabled: [
    '--zen-color-theme-primary',
    '--zen-color-interactive-enabled-inverse',
    '--zen-radius-sm',
    '--zen-spacing-xs'
  ],
  hovered: [
    '--zen-color-interactive-hovered-primary',
    '--zen-color-interactive-enabled-inverse'
  ],
  focused: [
    '--zen-color-interactive-focused-stroke-default',
    '--zen-width-focus'
  ],
  disabled: [
    '--zen-color-interactive-disabled-primary',
    '--zen-color-interactive-disabled-secondary',
    '--zen-color-text-disabled'
  ]
};
```

Render the readout as a live list:

```html
<div class="pg-token-readout">
  <div class="pg-token-readout__label">Active tokens</div>
  <template x-for="token in tokenMap[state]" :key="token">
    <div class="pg-token-row" x-text="token"></div>
  </template>
</div>
```

### Theme switching

Every playground must include a theme switcher. Bind `data-theme` to the `theme` state variable — `tokens.css` handles all `[data-theme]` overrides automatically.

```html
<!-- Theme switcher control -->
<div class="pg-control-group">
  <label class="pg-control-label">Theme</label>
  <div class="pg-segmented" role="group" aria-label="Theme">
    <button class="pg-seg-btn" :class="{ 'pg-seg-btn--active': theme === 'actian' }"   @click="theme = 'actian'">Actian</button>
    <button class="pg-seg-btn" :class="{ 'pg-seg-btn--active': theme === 'studio' }"   @click="theme = 'studio'">Studio</button>
    <button class="pg-seg-btn" :class="{ 'pg-seg-btn--active': theme === 'explorer' }" @click="theme = 'explorer'">Explorer</button>
  </div>
</div>

<!-- Root element that receives the theme attribute -->
<div class="pg-stage" :data-theme="theme">
  <!-- component renders here -->
</div>
```

Initial state in `x-data` must include `theme: 'actian'` as the default.

```js
{
  theme: 'actian',
  state: 'enabled',
  // ... other axes
}
```

---

## Rules

1. **Prototypes are for testing only.** Never push a `-prototype.html` or `-playground.html` file to Figma. These files live in the local project directory and are served via `ensure-server.sh`.

2. **Static HTML is the source of truth.** The prototype layer adds Alpine directives to the existing HTML from the generate-flow skill output. It does not rewrite structure, change class names, or alter the visual design.

3. **Keep it simple.** Add only the minimum interactivity needed to test the flow or component. If a prototype requires more than 30 lines of custom JS, stop and question whether the complexity belongs in a prototype at all.

4. **Same server.** Serve prototypes and playgrounds from the same `ensure-server.sh` instance used for static flows. Do not start a separate server. Pass the project working directory — never `.` — to avoid serving the plugin cache.

5. **One self-contained HTML file.** Each prototype or playground is a single `.html` file with all CSS, JS, and Alpine logic inline. No external JS files, no imports, no build step. The only allowed external resource is the pinned Alpine.js CDN URL and Google Fonts.
