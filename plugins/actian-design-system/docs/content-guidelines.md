# Actian Design System 2026 — Content Guidelines

> Shared writing standards for all UI text. Apply these rules in every skill: component briefs, design audits, flow generation, and analysis.
> Source: DS2026 Figma library (`8Yu8wUtPTXsa3iV6R4TmnS`)

---

## General Writing Rules

### Voice & Tone
- **Clear:** Use plain language. Avoid jargon unless the audience is technical.
- **Concise:** Say it in fewer words. Cut filler ("just", "simply", "please note that").
- **Consistent:** Same action = same label everywhere in the product.
- **Actionable:** Lead with what the user can do, not what the system did.

### Capitalization & Punctuation
- **Sentence case** for all UI text (buttons, labels, headings, tooltips, banners). Only capitalize the first word and proper nouns.
- **No terminal punctuation** on buttons, labels, menu items, or column headers.
- **Use periods** in body text, descriptions, and helper text that forms complete sentences.
- **No exclamation marks** except in celebratory moments ("Got it!" is an exception for informal confirmation).

### Formatting
- **Numbers:** Use digits for quantities (3 items, 12 results). Spell out numbers in prose only when they start a sentence.
- **Dates:** Use the product locale format. Default: `Mar 19, 2026`.
- **Lists:** Use bullet points. Start each item with a capital letter. No periods unless items are full sentences.

---

## Button Labels

### Rules
- Use **verb + object** for clarity: "Create dataset", "Add connection", "Download report".
- Keep labels to **1–3 words** when possible.
- One **Primary** button per view. Its label is the page's main action.
- Use the **same verb** on the trigger button and the confirmation — don't use "Create" to open a form and then "Submit" to finish it.

### Terminology

| Term | When to use |
|------|-------------|
| **Cancel** vs **Close** | Cancel when data has been entered or confirmation is required — allows return to previous state without saving. Close for read-only messages or screens. |
| **Create** vs **Add** vs **Insert** | Create = making something new. Add = bringing in something that exists elsewhere. Insert = placing in a specific position where order matters. The + icon is only needed when creating a new object. |
| **OK** | Read-only informational pages that are not legally required to accept. |
| **Accept** & **Decline** | Accept for legal terms of service. Accept/Decline when user must choose whether to implement proposed changes (from another user or AI). |
| **Got it!** | Informational confirmation modals where the user doesn't need to take action. |
| **Select** vs **Choose** | Select when picking from a limited list. Choose when picking from a large set or open-ended decision. |
| **Submit** vs **Send** vs **Save** | Submit for forms. Send for email only. Save for adding or changing selections in a modal. |
| **View** vs **See** | View as a noun ("Grid view", "Table view"). See as a verb only with a modifier ("See all results"). |

### Stepper Buttons
- Use **verb + object** for the creation button ("Create dataset", "Add connection").
- Use **only the verb** (without the object) when finishing a stepper ("Create", "Finish").
- Exception: When the button is a dropdown (like a Create menu on the Home page), the verb alone is sufficient.
- The initial button and final button should use the **same term** in most cases.

---

## Link Labels

### Rules
- Use **meaningful, descriptive text** that tells the user where the link goes: "View item details", not "Click here".
- **Never use raw URLs** as visible link text — they are long, complex, and hard to interpret.
- Use **action verbs** for links that lead to tasks: "Download orders", "Learn more".
- Use **sentence case**, no terminal punctuation.
- Link only the **relevant portion** of text — never entire sentences or paragraphs.
- Keep link text **brief but meaningful** — long enough to be clear, short enough to scan.
- Use **consistent phrasing** for similar actions across the product. If "Learn more" is used in one area, don't switch to "Read details" elsewhere.

### Link vs Button
- **Link = navigation** (goes to a page, URL, or anchor).
- **Button = action** (submits, saves, deletes, toggles).
- Avoid using links styled as buttons or buttons styled as links.

---

## Form Labels & Helper Text

### Rules
- Use **noun or noun phrase** for input labels: "Email address", "Dataset name".
- Add **required indicator** (asterisk `*`) for mandatory fields.
- Use **helper text** (below the input) for format hints: "Must be at least 8 characters".
- Use **placeholder text** sparingly — it disappears on focus. Prefer helper text.
- Error messages: State **what went wrong** and **how to fix it**: "Email is required" not "Invalid input".

---

## Status & Feedback Messages

### Alerts & Toasts
- **Success:** Past tense, confirms what happened. "Policy created successfully."
- **Error:** Present tense, states the problem + fix. "Failed to save. Check your connection and try again."
- **Warning:** Describes the consequence. "This action cannot be undone."
- **Info:** Neutral, provides context. "Changes will take effect after approval."

### Empty States
- Tell the user **what the page is for** and **how to start**: "No datasets yet. Add your first dataset to get started."
- Include a **CTA button** that takes the user to the creation flow.

---

## Modal & Dialog Copy

- **Title:** Action-oriented. "Delete dataset?" not "Confirm deletion".
- **Body:** Explain the consequence in 1–2 sentences. "This will permanently remove the dataset and all associated metadata."
- **Actions:** Primary button matches the action in the title. "Delete" not "OK".
- **Destructive confirmation:** Require typing the resource name for irreversible actions.

---

## Table & List Labels

- **Column headers:** Noun, sentence case, no punctuation. "Dataset name", "Last modified", "Owner".
- **Empty rows:** Use em dash (—) for missing values, not "N/A" or blank.
- **Truncation:** Truncate with ellipsis (...) and show full text on hover via tooltip.
- **Action columns:** Use icon buttons (edit, delete, more) — not text links in table rows.

---

## Navigation & Menu Items

- Use **nouns or verb + noun** for navigation items: "Dashboard", "Projects", "Requests".
- Keep to **1–2 words** maximum.
- Active item should be visually distinct (not just by color — also weight or background).

---

## Accessibility Copy

- All **icon-only buttons** must have `aria-label` or visually hidden text.
- All **external links** must indicate they open in a new tab.
- All **disabled elements** should explain why via tooltip or `aria-describedby`.
- **Don't rely on color alone** to convey meaning — pair with text or icon.
