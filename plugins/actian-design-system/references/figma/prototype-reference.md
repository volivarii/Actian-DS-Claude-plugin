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

Flow prototypes add just enough interactivity to a static HTML flow to make it testable — screen transitions, basic form validation, and decision paths. The underlying static HTML (from the actian-ux-prototype skill) is the source of truth and must not be altered structurally.

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
| `{{SKIN_CSS}}` | The lo-fi skin's generated CSS (`lofi-skin.js`) when `meta.skin` is `"lofi"`; empty string otherwise |
| `{{SKIN_ATTR}}` | ` data-skin="lofi"` on the stage element when `meta.skin` is `"lofi"`; empty string otherwise |
| `{{ADDS_BLOCK}}` | The "This flow adds N" `<details>` disclosure listing every screen's declared `adds[]`; empty string when no screen declares one |

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

## Rules

1. **Prototypes are for testing only.** Never push a `-prototype.html` or `-playground.html` file to Figma. These files live in the local project directory and are served via `ensure-server.sh`.

2. **Static HTML is the source of truth.** The prototype layer adds Alpine directives to the existing HTML from the actian-ux-prototype skill output. It does not rewrite structure, change class names, or alter the visual design.

3. **Keep it simple.** Add only the minimum interactivity needed to test the flow or component. If a prototype requires more than 30 lines of custom JS, stop and question whether the complexity belongs in a prototype at all.

4. **Same server.** Serve prototypes and playgrounds from the same `ensure-server.sh` instance used for static flows. Do not start a separate server. Pass the project working directory — never `.` — to avoid serving the plugin cache.

5. **One self-contained HTML file.** Each prototype or playground is a single `.html` file with all CSS, JS, and Alpine logic inline. No external JS files, no imports, no build step. The only allowed external resource is the pinned Alpine.js CDN URL and Google Fonts.
