# Generate Flow — Eval Suite

Comprehensive evaluation framework for the `/generate-flow` skill. Tests process compliance, output quality, component accuracy, and edge cases.

## Eval dimensions

Each eval is scored on these dimensions (1-5 scale):

| Dimension | What it measures | Score 5 | Score 1 |
|---|---|---|---|
| **Process** | Gates respected, correct order | All gates hit, correct vocabulary | Gates skipped or wrong order |
| **Inference** | Context correctly inferred from prompt | Role, app context, tier all correct | Wrong role or app context chosen |
| **Screen coverage** | Right screens for the feature | All expected states + error/empty | Only happy path, missing states |
| **Component accuracy** | Correct FM components selected | Right component + variant for each element | Wrong components or raw HTML instead |
| **Forms layout** | 480px rule, action footer, extended elements | All form rules followed | Inputs full-width, footer wrong side |
| **Content quality** | Realistic, contextual UI copy | Labels, placeholders, nav items all contextual | Generic "Lorem ipsum" or "Button" |
| **Structure** | Screen scaffolding, naming, flow structure | App_header + sidebar + content, descriptive names | Missing scaffolding, "Frame 1" names |
| **Component config** | Correct variants, booleans, text overrides set per context | Right variant, icons hidden/shown contextually, text overrides set | Default variant always, icons left as placeholders, generic text |
| **Custom elements** | When FM library doesn't cover it | fm-custom- prefix, --fm-* vars, lo-fi | Raw HTML, hardcoded colors, hi-fi charts |

## Eval categories

### A — Process compliance (existing + expanded)

Already covered by evals 3-5 in evals.json. Add:

```json
{
  "id": 10,
  "name": "gf-pre-answered-research",
  "skill": "generate-flow",
  "prompt": "Create a quick draft flow for user onboarding. I already researched — Collibra uses a 3-step wizard, Alation uses a checklist. Just build it with those patterns.",
  "expected_output": "Should detect research pre-answered (user provided findings), skip research question, detect Draft tier ('quick draft'), go straight to screen list with 3-5 screens (happy path only)"
}
```

```json
{
  "id": 11,
  "name": "gf-production-tier",
  "skill": "generate-flow",
  "prompt": "Create a final production flow for managing API keys — create, rotate, revoke, view usage. Include all edge cases.",
  "expected_output": "Should detect Production tier ('final production'), include happy paths + error states + loading states + edge cases (expired key, rate limit hit, key already revoked). More screens than Standard tier."
}
```

### B — Inference accuracy

Test whether the skill correctly infers role, app context, and feature scope from ambiguous prompts.

```json
{
  "id": 12,
  "name": "gf-infer-admin-context",
  "skill": "generate-flow",
  "prompt": "An administrator configures data quality rules for a dataset",
  "expected_output": "Should infer: role=Administrator, app=Admin (configuration is an admin task), feature='Data Quality Rule Configuration'. App_header should show Admin variant."
}
```

```json
{
  "id": 13,
  "name": "gf-infer-explorer-context",
  "skill": "generate-flow",
  "prompt": "A data analyst searches for datasets and previews their contents",
  "expected_output": "Should infer: role=Viewer/Analyst, app=Explorer (data consumption), feature='Dataset Search & Preview'. App_header should show Explorer variant."
}
```

```json
{
  "id": 14,
  "name": "gf-infer-studio-context",
  "skill": "generate-flow",
  "prompt": "A developer creates a data pipeline connecting two sources with transformation steps",
  "expected_output": "Should infer: role=Developer, app=Studio (data engineering/building), feature='Pipeline Builder'. App_header should show Studio variant."
}
```

```json
{
  "id": 15,
  "name": "gf-ambiguous-context",
  "skill": "generate-flow",
  "prompt": "Create a flow for managing users",
  "expected_output": "Should pause at Step 1 — 'managing users' could be Admin (user management), Studio (team settings), or Explorer (profile). The app context materially changes the UI. Should ask for clarification."
}
```

### C — Screen coverage and state completeness

Test whether the skill generates all required states for Standard and Production tiers.

```json
{
  "id": 16,
  "name": "gf-form-states",
  "skill": "generate-flow",
  "prompt": "A user creates a new connection to an external database — they fill in host, port, credentials, and test the connection",
  "expected_output": "Standard tier. Screen list MUST include: (1) connection list/empty state, (2) create form with inputs, (3) testing/loading state, (4) success confirmation, (5) connection test failure/error state. Forms must follow 480px max-width rule."
}
```

```json
{
  "id": 17,
  "name": "gf-table-interaction",
  "skill": "generate-flow",
  "prompt": "Admin reviews pending access requests — they can approve, reject, or request more info on each request",
  "expected_output": "Screen list MUST include: (1) table view with pending requests, (2) detail view or expanded row, (3) approve confirmation, (4) reject with reason form, (5) request info form, (6) empty state (no pending requests). Table should use FM Table Cell components. Bulk actions if applicable."
}
```

```json
{
  "id": 18,
  "name": "gf-multi-step-wizard",
  "skill": "generate-flow",
  "prompt": "Create a flow for importing a CSV file — the user uploads, maps columns, previews data, and confirms the import",
  "expected_output": "Screen list should follow a wizard pattern: (1) upload screen with drag zone, (2) column mapping with dropdowns, (3) data preview with table, (4) confirmation summary, (5) import progress/loading, (6) success with row count, (7) error state (invalid file, mapping errors). Custom drag zone element should use fm-custom- prefix."
}
```

```json
{
  "id": 19,
  "name": "gf-empty-and-first-use",
  "skill": "generate-flow",
  "prompt": "User visits the notifications center for the first time",
  "expected_output": "MUST include an empty state screen using FM Empty State component. Also include: (1) empty notifications with onboarding hint, (2) notifications with items (unread + read), (3) notification detail or action. Standard tier requires empty state — missing it is a failure."
}
```

### D — Component accuracy

Test whether the correct FM components are selected for each UI element.

```json
{
  "id": 20,
  "name": "gf-component-selection-form",
  "skill": "generate-flow",
  "prompt": "No research. Build a flow: user fills in their profile — name, email, role (dropdown), bio (text area), notification preferences (toggles), and saves.",
  "expected_output": "Component check: FM Text input field (name, email), FM Dropdown (role), FM Text Area (bio), FM Toggle (notification prefs), FM Input Label on each field, FM Button Primary (save), FM Button Secondary (cancel). Form container 480px max-width. Action footer with primary right."
}
```

```json
{
  "id": 21,
  "name": "gf-component-selection-table",
  "skill": "generate-flow",
  "prompt": "No research. Build a flow: admin views a list of datasets with name, owner, status (active/archived/draft), last modified. They can filter by status and search by name.",
  "expected_output": "Component check: FM Table Cell Header (column headers), FM Table Cell Text (name, owner, date), FM Table Cell Pill (status badges), FM Search input field, FM Dropdown or FM Tabs for status filter. Table should be full-width (extended element, not 480px). FM Page Header with title."
}
```

```json
{
  "id": 22,
  "name": "gf-component-selection-feedback",
  "skill": "generate-flow",
  "prompt": "No research. Build a flow: user submits a form, sees a success toast, then navigates away. If validation fails, show inline errors.",
  "expected_output": "Component check: FM Toast (success confirmation, not FM Alert — toasts are brief), FM Alert or inline error text (validation errors — not toast for persistent errors). FM Button Primary (submit). Error state should show field-level validation with error styling on inputs."
}
```

### E — Forms layout rules

Test the 480px constraint, extended elements, and action footer rules specifically.

```json
{
  "id": 23,
  "name": "gf-forms-480px-rule",
  "skill": "generate-flow",
  "prompt": "No research. Build: user creates a new tag — enters tag name, selects a color from a grid of swatches, and adds an optional description",
  "expected_output": "Simple form inputs (tag name text input, description text area) MUST be in a 480px max-width container. Color swatch grid is an extended element — should be full-width within content area. Action footer: primary button right, secondary left, inside the content area (not full screen width)."
}
```

```json
{
  "id": 24,
  "name": "gf-extended-elements-fullwidth",
  "skill": "generate-flow",
  "prompt": "No research. Build: user selects datasets to include in a collection by checking rows in a table, then names the collection and saves",
  "expected_output": "The selection table (checkboxes + table rows) is an extended element — MUST be full-width. The collection name input is a simple form input — 480px max-width. These should coexist on the same screen or sequential screens, each with correct width constraints."
}
```

### F — Custom elements

Test behavior when FM library components don't exist for what's needed.

```json
{
  "id": 25,
  "name": "gf-custom-chart",
  "skill": "generate-flow",
  "prompt": "No research. Build: user views a dataset quality dashboard showing completeness score, row count trend over 7 days, and a breakdown of data types",
  "expected_output": "No FM chart components exist. Should use custom elements: fm-custom-chart class, --fm-* CSS vars for colors, lo-fi style (labeled rectangles with axis lines, not polished charts). HTML comment above each: <!-- Custom: [what and why] -->. Stat cards can use FM components (text + frame)."
}
```

```json
{
  "id": 26,
  "name": "gf-custom-drag-drop",
  "skill": "generate-flow",
  "prompt": "No research. Build: user reorders columns in a table by dragging them",
  "expected_output": "No FM drag-and-drop component. Should use fm-custom-drag-zone or fm-custom-sortable. Lo-fi: dashed border area with grip handles (simple lines), not a polished drag animation. Must use --fm-* vars, not hardcoded colors."
}
```

### G — Component configuration

Test whether components are configured with the right variants, boolean properties, text overrides, and icon visibility for each specific use case.

```json
{
  "id": 31,
  "name": "gf-button-variants-and-icons",
  "skill": "generate-flow",
  "prompt": "No research. Build: user views a record detail page with actions: Edit (primary), Delete (outline, destructive), Download CSV (secondary with leading download icon), and a back arrow icon button",
  "expected_output": "Component config check: (1) FM Button Type=Primary, Label='Edit' — no icons visible, (2) FM Button Type=Outline, Label='Delete' — no leading/trailing icons (destructive intent conveyed by label and context, not by icon), (3) FM Button Type=Secondary, Label='Download CSV' — leading icon visible (download icon placeholder), trailing icon hidden, (4) FM Icon Buttons Type=Secondary for back arrow. Each button must have Label text override set to the contextual label, not 'Button' or 'Label'."
}
```

```json
{
  "id": 32,
  "name": "gf-tabs-configuration",
  "skill": "generate-flow",
  "prompt": "No research. Build: user views a dataset detail page with 3 tabs — Overview, Schema, Lineage. Overview is active by default. There's also a placeholder for future tabs.",
  "expected_output": "Component config check: (1) FM Tab State=On for 'Overview' (active), (2) FM Tab State=Off for 'Schema' and 'Lineage', (3) FM Tab State=Placeholder for the future tab slot — NOT a real tab with a label. Tab text must be set to the actual tab names, not 'Tab 1', 'Tab 2'."
}
```

```json
{
  "id": 33,
  "name": "gf-navigation-items",
  "skill": "generate-flow",
  "prompt": "No research. Build: admin navigates from the Rules page to create a new rule. The sidebar should show: Dashboard, Datasets, Rules (active), Settings, and 2 placeholder items.",
  "expected_output": "Component config check: (1) FM Side navigation item State=Off + Label='Dashboard', (2) State=Off + Label='Datasets', (3) State=On + Label='Rules' (active page), (4) State=Off + Label='Settings', (5) State=Placeholder for the 2 placeholder items — no label text set. Active item must match the current page context."
}
```

```json
{
  "id": 34,
  "name": "gf-input-states",
  "skill": "generate-flow",
  "prompt": "No research. Build two screens: (1) empty form for creating a connection, (2) the same form with a validation error on the host field and a filled port field",
  "expected_output": "Screen 1: FM Text input field Type=Placeholder (host, port — showing placeholder text), FM Dropdown Type=Placeholder (connection type). Screen 2: FM Text input field Type=Default for host (with error styling — error state must be shown), FM Text input field Type=Default for port (filled, showing value like '5432'), FM Dropdown Type=Filled. FM Input Label on each: Label Text set contextually ('Hostname', 'Port'), Disabled=No."
}
```

```json
{
  "id": 35,
  "name": "gf-page-header-variants",
  "skill": "generate-flow",
  "prompt": "No research. Build 3 screens: (1) a list page with just a title, (2) a detail page with title and subtitle, (3) a page with title and action buttons (Create New + Export)",
  "expected_output": "Component config check: (1) FM Page Header Type='Title only', Title text set contextually, (2) FM Page Header Type='Title + Subtitle', both Title and Subtitle text overrides set, (3) FM Page Header Type='Title + Actions', Title set, action buttons visible. Must NOT use 'Title only' variant for all three and manually add buttons outside the component."
}
```

```json
{
  "id": 36,
  "name": "gf-table-cell-variants",
  "skill": "generate-flow",
  "prompt": "No research. Build: a table showing connections with columns — Name, Type, Status (Active/Error/Paused as colored pills), Last Sync (date), and a placeholder column for future use",
  "expected_output": "Component config check: (1) FM Table Cell Type=Header for column headers — text set to actual column names, (2) FM Table Cell Type=Text for Name, Type, Last Sync — with contextual sample data, (3) FM Table Cell Type=Pill for Status — pill text set to 'Active'/'Error'/'Paused', (4) FM Table Cell Type=Placeholder for the future column. Must NOT use Type=Text for status (should be Pill) or Type=Text for placeholder columns."
}
```

```json
{
  "id": 37,
  "name": "gf-dropdown-states",
  "skill": "generate-flow",
  "prompt": "No research. Build 2 screens: (1) a form with an empty dropdown labeled 'Select region', (2) the same form after the user selected 'North America' and the dropdown shows the open state with options visible",
  "expected_output": "Screen 1: FM Dropdown Type=Placeholder. Screen 2: FM Dropdown Type=Open, with FM Multi-select menu item or FM Menu item instances showing options ('North America' State=On, 'Europe' State=Off, 'Asia Pacific' State=Off). Must use the correct Open variant, not fake an open state with a separate frame."
}
```

```json
{
  "id": 38,
  "name": "gf-checkbox-radio-toggle-states",
  "skill": "generate-flow",
  "prompt": "No research. Build: a settings form with (1) a checkbox group where 'Email notifications' is checked and 'SMS notifications' is unchecked, (2) a radio group where 'Daily' is selected among Daily/Weekly/Monthly, (3) a toggle for 'Dark mode' that is off, and (4) a disabled toggle for 'Beta features' that is on but locked",
  "expected_output": "Component config: (1) FM Checkbox State=On for Email, State=Off for SMS, both Style=Default, (2) FM Radio button State=On for Daily, State=Off for Weekly and Monthly, all Style=Default, (3) FM Toggle State=Off Style=Default for Dark mode, (4) FM Toggle State=On for Beta — but this needs Style=Disabled or a visual indicator that it's locked. Each control must have an FM Input Label with contextual Label Text."
}
```

### H — Content quality

Test whether UI copy is contextual and realistic vs generic placeholders.

```json
{
  "id": 27,
  "name": "gf-contextual-copy",
  "skill": "generate-flow",
  "prompt": "No research. Build: admin sets up a scheduled data refresh — picks a dataset, sets frequency (hourly/daily/weekly), chooses a time, and enables notifications",
  "expected_output": "Content check: Nav items should be contextual (e.g., 'Datasets', 'Schedules', 'Settings' — not 'Item 1', 'Item 2'). Page header should be specific (e.g., 'Schedule Data Refresh' — not 'Page Title'). Button labels should be action-specific ('Schedule Refresh' — not 'Submit'). Dropdown options should be realistic ('Every hour', 'Every day at...', 'Every Monday at...'). Form labels should be descriptive ('Refresh frequency', 'Notification recipients')."
}
```

### H — Edge cases

```json
{
  "id": 28,
  "name": "gf-minimal-prompt",
  "skill": "generate-flow",
  "prompt": "Create a flow",
  "expected_output": "Should pause at Step 1 — no feature described. Must ask what feature to build. Should NOT generate anything or infer a random feature."
}
```

```json
{
  "id": 29,
  "name": "gf-two-subflows",
  "skill": "generate-flow",
  "prompt": "No research. Build a flow for submitting and approving a data access request — show both the requester's experience and the approver's experience",
  "expected_output": "Should generate TWO sub-flows (two flow-rows): (1) Requester flow (Explorer context, request submission), (2) Approver flow (Admin context, review + approve/reject). Each with its own cover card. Different App_header variants per sub-flow."
}
```

```json
{
  "id": 30,
  "name": "gf-reference-image",
  "skill": "generate-flow",
  "prompt": "Build a settings page flow inspired by this reference",
  "expected_output": "Should detect that a reference was mentioned but not provided. Should ask for the reference (image, URL, or Figma link) rather than proceeding without it. Should NOT ask the research opt-in question since the user indicated they have references."
}
```

## Running evals

Each eval should be run as a walkthrough (like iteration-1) — the agent reads the prompt, walks through every skill step, and documents what it would do at each decision point.

### Scoring template

For each eval, produce:

```markdown
# Eval: [eval name]

## Scores
| Dimension | Score (1-5) | Notes |
|---|---|---|
| Process | | |
| Inference | | |
| Screen coverage | | |
| Component accuracy | | |
| Component config | | |
| Forms layout | | |
| Content quality | | |
| Structure | | |
| Custom elements | | |

## Decision walkthrough
[Step-by-step decisions at each skill step]

## Issues found
[Specific failures or degraded behavior]

## Skill improvements needed
[What to fix in SKILL.md or reference files]
```

### Aggregate scoring

After all evals in a category, aggregate:

```markdown
## Category [X] — [Name] Summary

| Eval | Process | Inference | Screens | Components | Config | Forms | Content | Structure | Custom | Avg |
|---|---|---|---|---|---|---|---|---|---|---|
| gf-xxx | 5 | 4 | 3 | ... | ... | ... | ... | ... | ... | 4.1 |

**Weakest dimension:** [which dimension scores lowest across evals]
**Skill fix priority:** [what to fix first based on patterns]
```

## Eval execution order

Run in this order — earlier evals inform whether later ones are worth running:

1. **B (Inference)** — if the skill can't correctly infer context, everything downstream fails
2. **C (Screen coverage)** — can it plan the right screens?
3. **D (Component accuracy)** — does it pick the right FM components?
4. **G (Component config)** — does it set the right variants, booleans, text overrides, icon visibility?
5. **E (Forms layout)** — does it follow the 480px and action footer rules?
6. **F (Custom elements)** — does it handle missing components correctly?
7. **H (Content quality)** — is the copy contextual?
8. **I (Edge cases)** — does it handle weird inputs?
9. **A (Process)** — gates and tiers (partially covered already)

Component config (G) runs right after component accuracy (D) — picking the right component is necessary but not sufficient. Configuring it correctly for the use case is where real quality lives.
