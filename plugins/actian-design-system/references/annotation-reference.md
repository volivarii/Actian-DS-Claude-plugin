# Browser Annotation Reference

## Including the annotation layer

Skills inject the contents of `../../templates/annotation-layer.html` at the `{{ANNOTATION_LAYER}}` placeholder, inserted immediately before `</body>`.

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
| `severity` | One of `fix`, `change`, or `note`. |
| `createdAt` | ISO 8601 timestamp when the annotation was saved. |

The `target` value is matched against `data-name` attributes in the HTML. If no element has a matching `data-name`, the annotation is reported as unresolvable and carried forward as a note.

---

## Processing annotations at the gate

When a designer says **"apply annotations"** and pastes a JSON payload:

1. **Parse** the JSON payload and validate it against the schema above.
2. **For each annotation**, locate the element whose `data-name` matches `annotation.target`.
3. **Apply based on severity:**
   - `fix` — Correct the element directly. Fix the specific issue described in `message` (e.g. wrong token, broken layout, incorrect label).
   - `change` — Modify the approach. Rethink how the element is implemented or styled based on the guidance in `message`.
   - `note` — Carry the message forward as a comment or context note. Do not change the element; preserve the note for the next gate review.
4. **Re-save the HTML** file with all applied changes.
5. **Re-serve the preview** at the same local URL.
6. **Report what was applied** — list each annotation, the target element, the action taken, and flag any `note`-severity items as carried forward. Flag any unresolvable targets (no matching `data-name`).
7. **Re-present the gate** — walk through the updated output and prompt for approval or further feedback.

---

## data-name requirements

Every meaningful element in a generated HTML preview must have a `data-name` attribute so designers can annotate it precisely. Required elements include:

- **Screens** — top-level containers representing a full screen or page (e.g. `data-name="Dashboard Screen"`).
- **Cards** — any card or panel component (e.g. `data-name="Summary Card"`).
- **Sections** — logical groupings within a screen (e.g. `data-name="Filters Section"`).
- **Tables** — data tables and their header rows (e.g. `data-name="Results Table"`).
- **Key UI elements** — primary actions, hero content, navigation items, form fields, and any element a designer would want to call out by name.

Skills already add `data-name` attributes derived from Figma frame names during output generation. When writing custom HTML or extending a template, apply `data-name` to any element that has a distinct identity in the design.

**Example:**

```html
<section data-name="Filters Section" class="...">
  <div data-name="Date Range Card" class="...">...</div>
  <table data-name="Results Table" class="...">...</table>
</section>
```

Elements without `data-name` are invisible to the annotation layer. When in doubt, add it.
