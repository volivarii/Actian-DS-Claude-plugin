# Browser Annotation Reference

## Including the annotation layer

Skills include the annotation loader before `</body>`: `<script src="/_plugin/annotation-loader.js" defer></script>`. The loader fetches split files (CSS, JS, markup) from the `/_plugin/` server route.

**Static previews (no Alpine.js present):**
Add the Alpine.js CDN script first, then inject the annotation layer:

```html
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
{{ANNOTATION_LAYER}}
</body>
```

**Prototypes and playgrounds (Alpine.js already loaded):**
Alpine is already present in the document — include the annotation layer directly without the CDN script:

```html
{{ANNOTATION_LAYER}}
</body>
```

---

## How designers use it

1. Click **Annotate** in the toolbar to enter annotation mode.
2. Hover over elements — a blue outline and tooltip appear identifying each annotatable target.
3. Click an element to open its annotation popover.
4. Type feedback in the text field and pick a severity: **fix**, **change**, or **note**.
5. Click **Save** — a badge appears on the element showing the severity.
6. Repeat for any other elements that need feedback.
7. Click **Copy JSON** to copy the full annotation payload to the clipboard.
8. Paste the JSON in the CLI with the phrase **"apply annotations"** to trigger processing.

---

## JSON schema

```json
{
  "source": "annotation-layer",
  "previewUrl": "http://localhost:PORT/preview.html",
  "exportedAt": "2026-03-28T12:00:00.000Z",
  "annotations": [
    {
      "id": "ann_01",
      "target": "Hero Card",
      "message": "Increase contrast on the subtitle text",
      "severity": "fix",
      "createdAt": "2026-03-28T12:01:00.000Z"
    }
  ]
}
```

**Field notes:**

| Field | Description |
|---|---|
| `source` | Always `"annotation-layer"` — identifies the payload type. |
| `previewUrl` | The local URL where the preview was served. |
| `exportedAt` | ISO 8601 timestamp when the designer exported the JSON. |
| `annotations` | Array of individual annotation objects. |
| `id` | Unique identifier for the annotation (e.g. `ann_01`). |
| `target` | Matches the `data-name` attribute on the annotated element. |
| `message` | The designer's feedback text. |
| `severity` | One of `change` or `note`. |
| `createdAt` | ISO 8601 timestamp when the annotation was saved. |

The `target` value is matched against `data-name` attributes in the HTML. If no element has a matching `data-name`, the annotation is reported as unresolvable and carried forward as a note.

---

## Processing annotations at the gate

When a designer says **"apply annotations"** and pastes a JSON payload:

1. **Parse** the JSON payload and validate it against the schema above.
2. **For each annotation**, locate the element whose `data-name` matches `annotation.target`.
3. **Apply based on type:**
   - `change` — Modify the element as described in `message`. This is the default — the designer wants something different.
   - `note` — Do NOT change the HTML. Carry the note forward to the Figma push step. Write it into the `.last-push.json` manifest under a `notes` array so it's available during `use_figma` generation and parity check.
4. **Re-save the HTML** file with all applied changes.
5. **Re-serve the preview** at the same local URL.
6. **Report what was applied** — list each annotation, the target element, the action taken, and flag any `note`-severity items as carried forward. Flag any unresolvable targets (no matching `data-name`).
7. **Re-present the gate** — walk through the updated output and prompt for approval or further feedback.

---

## data-name requirements

The annotation layer targets `[data-name]` elements. Add `data-name` to **every meaningful element at every level**, not just top-level containers. Designers need to annotate specific components — a button, a table header, a nav item — not just entire screens.

**Required depth — annotate every layer:**

| Level | Examples | data-name format |
|-------|---------|-----------------|
| **Screen** | Full page/screen container | `"Screen 1: Dashboard"` |
| **Chrome** | App header, sidebar, footer | `"App header"`, `"Side navigation"` |
| **Navigation items** | Individual nav links | `"Nav: Dashboard"`, `"Nav: Catalog"` |
| **Page structure** | Page header, content sections | `"Page header"`, `"Summary metrics"` |
| **Components** | Search inputs, filter bars, metric cards | `"Search input"`, `"Metric: Pending"` |
| **Tables** | Table, header row, individual columns | `"Request table"`, `"Table header"` |
| **Actions** | Buttons, links, action groups | `"Button: Approve"`, `"Action buttons"` |
| **Forms** | Form groups, individual fields | `"Email input"`, `"Priority dropdown"` |
| **Feedback** | Alerts, toasts, empty states, dialogs | `"Error alert"`, `"Success toast"`, `"Approve dialog"` |

**Naming convention:** Descriptive names matching what the designer sees. Prefix with element type when there are many of the same kind (`"Nav: Dashboard"`, `"Metric: Pending"`, `"Button: Submit"`).

**Example:**

```html
<div class="screen" data-name="Screen 1: Dashboard">
  <div class="fm-app-header" data-name="App header">...</div>
  <div class="fm-sidebar" data-name="Side navigation">
    <div class="fm-sidebar__item" data-name="Nav: Dashboard">Dashboard</div>
    <div class="fm-sidebar__item" data-name="Nav: Catalog">Catalog</div>
  </div>
  <div class="content-area" data-name="Content area">
    <div class="fm-page-header" data-name="Page header">...</div>
    <div class="fm-search" data-name="Search input">...</div>
    <table data-name="Request table">
      <thead data-name="Table header">...</thead>
    </table>
    <div class="action-footer" data-name="Action buttons">
      <button data-name="Button: Cancel">Cancel</button>
      <button data-name="Button: Approve">Approve</button>
    </div>
  </div>
</div>
```

**Rule of thumb:** If a designer might want to comment on it, it needs a `data-name`. Elements without `data-name` are invisible to the annotation layer.
