# Content guidelines — Actian Data Intelligence

> Source of truth for all UI copy. Apply these rules in every skill: component briefs, design audits, flow generation, and analysis.
>
> **Full section files (local):** `{project_working_directory}/content-guidelines/` — read from disk if available  
> **Full section files (remote):** `https://raw.githubusercontent.com/levita99zeenea/actian-content-guidelines/main/{filename}` — fetch if local files not present  
> **Live site:** https://levita99zeenea.github.io/actian-content-guidelines

---

## Quick reference checklist

Before any design review, verify:
- [ ] Sentence case on all UI text (buttons, labels, headings, tooltips, banners)
- [ ] No "please," "sorry," "ensure," "execute," "abort," "sign in," or other banned words
- [ ] Buttons use verb + object ("Create report," not "Report")
- [ ] No terminal punctuation on buttons, labels, menu items, column headers
- [ ] Placeholder text models input — never repeats the label
- [ ] Error messages say what went wrong and how to fix it (no "Invalid")
- [ ] Empty states include a headline, body sentence, and one CTA
- [ ] Destructive actions confirmed with title that names the action ("Delete connection")

---

## 1. Global guidelines

Actian Data Intelligence speaks to data professionals: engineers, analysts, and catalog administrators. The voice is direct, precise, and professional without being formal or stiff.

### Voice and tone rules

- Use **active voice**: "Export the dataset" not "The dataset can be exported."
- Use **present tense**: "Saves automatically" not "Will save automatically."
- Use **sentence case** for all UI text, including headings and button labels.
- No exclamation points except in genuine success states.
- No "please" or "sorry."

### Words to avoid

| Term to avoid | Use instead |
|---|---|
| Please / Sorry | Omit or rephrase |
| We / Us (referring to Actian) | "Actian" or omit |
| Execute / Abort | Run / Cancel or Stop |
| Master / Slave | Primary / Secondary |
| Blacklist / Whitelist | Deny list / Allow list |
| Press / Type (as verbs) | Click / Enter or Provide |
| CTA | Button or link |
| Caution / Danger | Remember: / Note: |
| Disabled | Blocked / Off |
| Ensure | Verify |
| Agnostic | Independent |
| Sign in / Signin | Log in |
| Action on | Omit; use a direct verb |

---

## 2. Buttons

**Formula:** verb + object. "Create report," "Delete dataset," "Add connection."

- Sentence case. 1–3 words ideally. No punctuation.
- One primary button per view.
- Disable primary until required fields are complete.

### Term pairs

| Term | Rule |
|---|---|
| Cancel vs Close | Cancel = back out of entered/confirmed state. Close = read-only screens. |
| Create vs Add vs Insert | Create = new. Add = existing item. Insert = existing + ordering matters. |
| Submit vs Send vs Save | Submit = form. Send = email only. Save = adding/changing selections on modal. |
| Select vs Choose | Select = limited list. Choose = large or open-ended. |
| Accept vs Decline | Legal terms of service, or accepting/declining AI-proposed changes. |
| Got it! | Confirmation modals requiring no user action. |
| Back / Next / Create | Stepper navigation. Final step = "Create" (or object-specific verb), not "Finish." |

---

## 3. Links

- Descriptive text only: "View pipeline details" not "Click here."
- Sentence case, no terminal punctuation.
- Same tab unless labeled external (use external link icon).
- Use links for navigation; use ghost buttons for actions.

---

## 4. Checkboxes

- Labels in positive form: "Show archived items" not "Don't hide archived items."
- Parallel labels in each group.
- Card format: use when each option needs rich context (title, description, image, metadata).

---

## 5. Dropdown / Select

- Opens on click, not hover. Closes on Escape or outside click.
- Menu items: verb + noun ("Download PDF," "Add tag," "Delete record").
- Multi-select: include checkboxes; selections persist until menu closes.

---

## 6. Filters

- Labels: short noun phrases matching the attribute ("Owner," "Status," "Data domain").
- Show active count when collapsed: "Filters (3)."
- Provide "Clear all" / "Reset filters" when filters are active.
- Persist filter state on navigation.

---

## 7. Cards

**Item card:** Entire card is clickable. Use item name as title; sentence case; match name used elsewhere.

**Selectable card:** Radio (single) or checkbox (multi). Title = short noun phrase. One sentence description max.

**Topic card:** Noun/noun phrase title. One sentence describing the topic's scope.

---

## 8. Empty and system states

### Empty state
- Short instructive headline + one-sentence body + one primary CTA.
- Never "No results found" without guidance.
- Example: "No items found / Add your first dataset to start exploring. / Create dataset"

### Error state
- Specific about what went wrong. Offer a resolution. No technical codes as primary message. No user blame.
- Example: "Something went wrong / There was an error creating your item. Try again or contact support."

### Maintenance state
- What is affected + estimated resolution time + single action ("Refresh").

### Success state
- Confirm what was completed. Brief (one line). Offer logical next action.

---

## 9. Forms

- Sentence case for labels: "Group name" not "Group Name."
- Mark required fields with asterisk (*).
- Helper text explains the "why" — never just restates the label.
- Error text guides correction: "Enter a valid date" not "Invalid input."
- Primary CTA at bottom right; disabled until all required fields filled.
- Validate on blur (field exit), not on keystroke.
- Single-column layouts preferred.

### Toggle vs Checkbox vs Radio button

| Use | When |
|---|---|
| Toggle / Switch | Immediate effect, binary system state (ON/OFF, dark mode) |
| Checkbox | Multi-select OR action not immediate (form submission, terms) |
| Radio button | Single select from 2–6 visible options |

### Dropdown in forms
- 5–20 options. Label = category of options (not action).

### Calendar
- Labels: "From" / "To" or "Start date" / "End date." Never pre-fill. Support both typing and picker.

---

## 10. Sticky footer

- Exactly one primary action (exception: add a destructive button like Delete).
- Max 3 buttons.
- Stepper labels: "Back" / "Next" / final verb (e.g., "Create").
- Never mix "Continue" and "Next" or "Finish" and "Submit" in the same flow.

---

## 11. Modal

- Title matches the triggering button/link label.
- Body: 1–2 sentences, actionable.
- Primary + secondary button pair.
- No nested modals.
- Destructive modals: Title names the action ("Delete dataset"), primary CTA repeats verb ("Delete"), secondary = "Cancel."

---

## 12. Search

- Placeholder: "Search [asset names]" or "Search in [asset names]" (plural).
- No period at end of placeholder text.
- Examples: "Search items," "Search topics," "Search users," "Search properties."

---

## 13. Text input

- Placeholder = example of expected input, not a label substitute.
- Validate on blur (when user exits field).
- Never use placeholder if the label is sufficient.
- Example: Label "Dataset name" / Placeholder "e.g. Q4_sales_report"

---

## 14. Notifications and messaging

**Notification:** 1–2 sentences. Include timestamp. Include action if user must respond.

**Tooltip:** Few words or one sentence. Never repeat the label. Use popover for multi-sentence explanations.

**Toast / Snackbar:** One short sentence. Include "Undo" where relevant. Not for actions requiring user input.
- Examples: "Dataset deleted. Undo" / "Export ready. Download" / "Connection failed. Try again"

---

## 15. Navigation

**Global header:** Utility icons (notifications, help, profile) unlabeled with tooltips.

**Side nav:** Short descriptive labels matching page headers. Consistent naming and order.

**Breadcrumbs:** Main component / Sub component / Specific item. Current page = plain text (not a link).

**Tabs:** Short nouns/noun phrases ("Overview," "Lineage," "Settings"). Sentence case. No verbs.

**Pagination:** "Previous" and "Next." Show count: "Showing 1–25 of 340 results."

---

## 16. Loading and progress

**Loading indicator:** Use message only when wait > 3 seconds. Present tense. "Loading datasets..." — never "Please wait."

**Progress indicator:** Label steps with short noun or verb phrase. "Step 2 of 4."

---

## 17. Tags, badges, and status indicators

**Tags:** 1–3 words. Sentence case. Not action triggers.

**Badges:** Single word or short abbreviation. Standard vocabulary: New, Updated, Draft, Published, Deprecated.

---

## 18. Dialogs and confirmations

**Confirmation dialog:** Title = action name ("Delete connection"). Body = 1 sentence on what happens and reversibility. Primary CTA = title verb. Secondary = "Cancel."

**Inline banner:** State issue + what user should do. 1–2 sentences. Include link/action if applicable.

---

## 19. Onboarding

- Lead with what the user can do (not what the product does).
- Action-oriented CTAs: "Set up your first connection."
- No marketing language.
- Step titles: short imperative phrases ("Choose a data source"). No step numbers in title text.

---

## 20. What's new

- Past tense: "Added support for..." / "Fixed an issue where..."
- Group by category. 1–2 sentences per item.
- No marketing adjectives ("powerful," "seamless," "game-changing").

---

## 21. Alerts

- 1–2 sentences. Lead with most important information.
- Severity: informational, success, warning, error.
- No "Alert:" / "Warning:" prefix — icon conveys severity.
- Warning/error alerts persist until resolved.
- Appear at top of affected area.

---

## 22. Combo box

- Placeholder: describes what's being searched ("Search or select a data source"), not "Type to filter."
- Show "No results found for [query]" — never an empty dropdown.
- Filter dynamically as user types.

---

## 23. Data tables

**Column headers:** 2–3 word noun phrases, sentence case, no punctuation. Left-align text, right-align numbers.

**Cell content:** Consistent formatting. Empty values = "—" (em dash), not blank, "N/A," or "null."

**Status vocabulary:** Active, Inactive, Draft, Published, Deprecated, Error.

**Bulk actions:** "Delete selected" / "Export." Show count: "3 items selected."

| Use | Avoid |
|---|---|
| Last modified | Last Modification Date |
| Owner | Assigned to / Owned by |
| Status | Current status |

---

## 24. Grid and spacing

- Avoid wrapping text in narrow columns. Abbreviate predictably or truncate with tooltip.
- Do not vary density within the same table or list view.

---

## 25. Icons

- Approved Actian icon set only. No decorative icons.
- Icon-only controls: always pair with tooltip or aria-label. Sentence case. Verb/noun conventions.
- Decorative icons: `aria-hidden="true"`.

---

## 26. Inline toast

- ≤ 10 words. Present or past tense: "Copied" / "Saved."
- For localized actions only (copy value, save field inline). Not for global events.
- Examples: "Copied" / "Saved" / "Tag added" / "Link created"

---

## 27. Lineage-specific UI

**Node labels:** Exact asset name + asset type as secondary label ("Orders" / "Table"). Sentence case.

**Edge labels:** Short verb phrase ("Reads from," "Writes to," "Transforms"). No jargon.

| Term | Definition |
|---|---|
| Upstream | Assets that provide data to the selected asset |
| Downstream | Assets that consume data from the selected asset |
| Source | The originating system or dataset |
| Transformation | A processing step that modifies or aggregates data |
| Impact | The downstream effect of a change to this asset |

---

## 28. Multi-select

- Label = short noun phrase ("Data domains," "Owners").
- Selected values shown as chips. Chip = item name only.
- Collapsed count: "3 selected."
- Use "Select all" and "Clear all."

---

## 29. Object preview panels

- Panel title = exact asset name.
- Short attribute labels (1–2 words): "Owner," "Last modified," "Type."
- Include "View full details" link at bottom.

---

## 30. Popover

- Opens on click (not hover). Closes on click outside or Escape.
- Title: short noun phrase (optional). Body: 2–4 sentences. No bullet lists.
- Use for explanations too long for tooltip, or small action sets.

---

## 31. Related content panels

- Panel heading = relationship type ("Related datasets," "Used in reports").
- Asset name as link + 1–2 metadata attributes.
- Empty state: "No related datasets found."

---

## 32. Stepper

- Step titles: short imperative verb phrases ("Choose a data source"). No step numbers in title.
- Navigation: "Back" / "Next" / final verb ("Create [object]").
- Never "Previous," "Finish," "Done," or "Submit" as a final step.

---

## 33. Switch

- Label = feature being controlled, not state. "Email notifications" not "Enable email notifications."
- For immediate-effect binary settings only. Not for changes requiring a save action.

---

## 34. Tables (general)

- Column headers: short noun phrases, sentence case, no punctuation.
- Empty cells: "—" (em dash).
- Dates: ISO 8601 (YYYY-MM-DD) preferred.

---

## 35. Uploads

- Drop zone: "Drag and drop a CSV file, or browse."
- Browse link: "Browse" or "Choose file" — not "Click here."
- List accepted formats: "Accepts .csv, .json, and .xlsx files."
- Error: specific — "data.csv — File exceeds the 50 MB size limit." not "Upload failed."

---

## 36. Validation messages

- Validate on blur (field exit). Not on keystroke. Not before user interaction.
- Specific: say what is wrong and how to fix it.
- No "Invalid" standalone. No "Please." No user blame.

| Do | Don't |
|---|---|
| Enter a valid email address. | Invalid email. |
| Connection name is required. | Please fill out this field. |
| Password must be 8–32 characters. | Password does not meet requirements. |
| This name is already in use. Choose a different name. | Duplicate entry error. |

---

## 37. Wizards

- Step titles: short imperative phrases, parallel structure across steps.
- In-step: 2-sentence max explanation at top of each step. Field-level help via popovers.
- Final step: "Review" or "Review and create" summary with edit links.
- Navigation: "Back" / "Next" / object-specific final verb ("Create connection").

---

*Full section files with complete Do/Don't examples and subsection detail: `{project_working_directory}/content-guidelines/`*
