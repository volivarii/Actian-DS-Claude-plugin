# Content Guidelines — Actian Design System 2026

<!-- AUTO-GENERATED from docs/foundations/content-guidelines.json -->
<!-- To update: edit the JSON, then regenerate this file. -->
<!-- Do not edit this section manually — changes will be overwritten -->

Source: [Content guidelines page](https://www.figma.com/design/l8biHxfarNi1I2RMvVxVOK/?node-id=13143-8755)
Generated: 2026-04-29

---

> Shared writing standards for all UI text. Apply these rules in every skill: component briefs, design audits, flow generation, and analysis.

---

## Content guidelines checklist

Use this handy checklist to confirm content is in the right state for reviews. Before meeting with Jeff or Jessie, or asking for review, ensure you've fixed any content issues during design and checked them off here.

---

## Words to avoid

Guidance on what content works best, including text, imagery, and messaging.

| Avoid | DO | DON'T | Why |
|-------|----|-------|-----|
| `Please / Sorry` | Contact Support | Please Contact Support | Unnecessary; remove rather than rephrase. |
| `we / us (referring to Actian)` | Actian recommends | We recommend | Don't refer to Actian as 'we' or 'us'. |
| `Execute / Abort` | The process was cancelled / stopped | The process was aborted. | Use neutral verbs. |
| `Master / Slave` | Primary and Secondary servers | Master and Slave servers | Use inclusive terminology. |
| `Blacklist / Whitelist` | Add a row to the Allow / Deny List | Add a row to the Black/Whitelist | Use inclusive terminology. |
| `Press / Type (as verbs)` | Click 'OK', Enter / Provide a name | Press 'OK', Type a name | Use the action the user is actually doing. |
| `developer-speak (e.g., CTA)` | Click the OK button. | Click the OK CTA. | Use plain language users recognize. |
| `Caution / Danger` | Remember: Restart the server first. | Danger: Stop the server first. | Avoid alarming language for normal flows. |
| `Ensure` | Verify that the value is provided. | Ensure you provided the correct value. | Use direct verbs. |
| `Disabled` | This setting is blocked / off | This setting is disabled | Use neutral state language. |
| `Agnostic` | This feature is platform independent | This feature is platform agnostic | Avoid jargon. |
| `Sign in / Signin` | Log in to begin | Signin to begin | Use 'Log in' consistently. |

---

## Capitalization

Don't overuse capitalization as it makes copy harder to read and de-emphasizes the important content.

### Case mapping by UI element

| Title case | Sentence case | All caps |
|------|------|------|
| Top-level Navigation | Functional text (Section headers, Checkboxes, radios, badges, sliders, toggles, tooltips, tags, pills, toasts, loading indicators) | Acronyms (API, AM/PM, HTML) |
| Menu Titles | Main page headers | — |
| Menu Items | Placeholder text inside form fields | — |
| Buttons | Labels | — |
| Column Headers | Proper nouns and names of people or products (within sentence case body) | — |

### Examples

- ✅ DO: `Add a row to the catalog. List it on the page.`
- ❌ DON'T: `Add a row to the Catalog. List it on the Page.`

- ✅ DO: `Add a row to the MyCatalog page.`
- ❌ DON'T: `Add a row to the MyCatalog Page.`

- ✅ DO: `Selects an item type.`
- ❌ DON'T: `Select an Item Type.`

---

## Writing style

Use present, active tense in all possible cases. In some cases, you can use passive voice if the focus needs to be on a system instead of a person.

### Tense and voice

| Voice | When to use | Example |
|-------|-------------|---------|
| **Active** | All cases except where passive is needed. | Only an administrator can create a warehouse. |
| **Passive** | Use only when focus is not on a person. | The database needs to be shut down. |

### Tone

- Be direct, active, and consistent.
- Be friendly and helpful.
- Use simplest terms; don't try to 'beautify' with alternatives.

- ✅ DO: `Submit Form`
- ❌ DON'T: `Click here to submit the form`

### Personification

Do not personify the product as the subject of the text. Keep the user in focus, rather than the product.

- ✅ User focus: `In the Delivery Information window, specify the name of the sender.`
- ❌ Product focus: `The Delivery Information window allows you to specify the name of the sender.`

- ✅ User focus: `Use this menu to create diagrams.`
- ❌ Product focus: `This menu enables you to create diagrams.`

---

## Numerical formatting

Standard formats for numbers, currency, dates, and times across the product.

| Type | Format | Example |
|------|--------|---------|
| Currency | — | `$1,000,000.00` |
| Phone numbers | — | `+1 (212) 123 4567` |
| Time (within current day, 12-hour) | Use uppercase AM or PM, without periods | `2:00 PM` |
| Time (24-hour clock) | Display the time without AM/PM | `14:00` |
| Date (within current calendar year) | Show date without year | `January 14` |
| Date (other years) | Show date with year | `Jan 3, 2012`, `10/23/2022` |
| Timestamp | Display an exact time | `2:36:17 PM PST` |
| Approximate time | Round down to the largest and most recent date or time. | `In 5 minutes`, `3 days ago` |

---

## Punctuation

To help readers scan text at a glance, avoid using punctuation in places where it isn't necessary.

### Periods

Avoid using periods on solitary sentences within UI elements listed below.

**Do use in:**
- Multiple sentences
- Sentence followed by a link (links themselves should not be full sentences)
- Description text
- Hover text

**Don't use in:**
- Labels
- Tooltips
- Placeholder text
- Radios
- Loading indicators

### Commas

Use the Oxford comma — place a comma after the second-to-last item in a series, before the conjunction.

- ✅ DO: `You can select green, blue, or both.`

### Exclamation points

Use exclamation marks only positively, not negatively. No more than one per page or window.

- ✅ DO: `Got it!`

---

## Prepositions

Prepositions indicate relationships between different elements, actions, or concepts. Proper use maintains clarity and precision; misuse leads to confusion or overly complex sentences.

### Conciseness — minimize unnecessary prepositions

While prepositions provide important context, excessive use clutters sentences. Always aim for simplicity.

- ✅ DO: `Manage notification settings.`
- ❌ DON'T: `The settings for managing notifications on your profile.`
- ✅ DO: `Contact Support`
- ❌ DON'T: `Contact to Support`

### Accuracy — clarify the relationship

Prepositions should clearly express the relationship between actions, objects, or concepts.

- ✅ DO: `Upload to the server`
- ❌ DON'T: `Upload on the server`

### Avoid vague prepositions

Choose prepositions that accurately describe the relationship. Be specific.

- ✅ DO: `Details on how to configure settings`
- ❌ DON'T: `Information about settings`

### Keep prepositional phrases short

Long chains of prepositional phrases confuse users and decrease readability. Break them up.

- ✅ DO: `Click the link in your email to view your order details.`
- ❌ DON'T: `Click on the link in the email for information about your order.`

### Consistency — standardize common phrases

Frequently used phrases should be consistent across content.

- ✅ DO: `Save the changes to your profile.`
- ❌ DON'T: `Save the changes on your profile.`

### Clear action relationships

When giving instructions, prepositions should make the action clear.

- ✅ DO: `Drag the file into the folder`
- ❌ DON'T: `Drag the file to the folder`

### Limit directional prepositions in instructional text

Avoid overly directional prepositions unless critical to spatial understanding.

- ✅ DO: `Tap the icon`
- ❌ DON'T: `Tap on the icon`

---

## Acronyms

- Spell out an acronym the first time it's mentioned. On subsequent references, use the abbreviation.
- If the abbreviation isn't clearly related to the full version, specify in parentheses after the spelled-out version in the first instance.
- Fully capitalize all letters in abbreviations: AM/PM, HTML, OK (not Ok or Okay).
- If an abbreviation might not be known to the target audience, spell it out in full the first time. Don't spell out commonly-known abbreviations.
- If well-known to the average client (e.g., CIC, COE), use without spelling out on first reference.

---

## Plurals

- Make sure items are correctly used as plural or singular nouns as appropriate.
- Do not use '(s)' or '/s' after a noun to make it plural. If you must indicate both forms, use 'one or more.'

---

## Abbreviations and articles

- Don't speak like a robot; use 'a,' 'an,' and 'the' articles.
- Use the default JRE to run a shell instance.

---

## Additional team-authored rules

> ⚠ **Status:** Not from Figma. These are product-team rules built up through real design work — terminology, link rules, form labels, modal patterns, accessibility copy. They are not currently in the Figma source of truth.
>
> **Decision pending:** propose these upstream into Figma, move to a separate `content-guidelines-extended.md`, or retire. Until decided, they're preserved here.

The following rules are not present in the JSON foundation data but were included in the hand-authored content guidelines. They are preserved here until they are added to the Figma source.

### General Writing Rules

#### Voice & Tone
- **Clear:** Use plain language. Avoid jargon unless the audience is technical.
- **Concise:** Say it in fewer words. Cut filler ("just", "simply", "please note that").
- **Consistent:** Same action = same label everywhere in the product.
- **Actionable:** Lead with what the user can do, not what the system did.

#### Formatting
- **Lists:** Use bullet points. Start each item with a capital letter. No periods unless items are full sentences.

### Button Labels

#### Rules
- Use **verb + object** for clarity: "Create dataset", "Add connection", "Download report".
- Keep labels to **1-3 words** when possible.
- One **Primary** button per view. Its label is the page's main action.
- Use the **same verb** on the trigger button and the confirmation -- don't use "Create" to open a form and then "Submit" to finish it.

#### Terminology

| Term | When to use |
|------|-------------|
| **Cancel** vs **Close** | Cancel when data has been entered or confirmation is required -- allows return to previous state without saving. Close for read-only messages or screens. |
| **Create** vs **Add** vs **Insert** | Create = making something new. Add = bringing in something that exists elsewhere. Insert = placing in a specific position where order matters. The + icon is only needed when creating a new object. |
| **OK** | Read-only informational pages that are not legally required to accept. |
| **Accept** & **Decline** | Accept for legal terms of service. Accept/Decline when user must choose whether to implement proposed changes (from another user or AI). |
| **Got it!** | Informational confirmation modals where the user doesn't need to take action. |
| **Select** vs **Choose** | Select when picking from a limited list. Choose when picking from a large set or open-ended decision. |
| **Submit** vs **Send** vs **Save** | Submit for forms. Send for email only. Save for adding or changing selections in a modal. |
| **View** vs **See** | View as a noun ("Grid view", "Table view"). See as a verb only with a modifier ("See all results"). |

#### Stepper Buttons
- Use **verb + object** for the creation button ("Create dataset", "Add connection").
- Use **only the verb** (without the object) when finishing a stepper ("Create", "Finish").
- Exception: When the button is a dropdown (like a Create menu on the Home page), the verb alone is sufficient.
- The initial button and final button should use the **same term** in most cases.

### Link Labels

#### Rules
- Use **meaningful, descriptive text** that tells the user where the link goes: "View item details", not "Click here".
- **Never use raw URLs** as visible link text -- they are long, complex, and hard to interpret.
- Use **action verbs** for links that lead to tasks: "Download orders", "Learn more".
- Use **sentence case**, no terminal punctuation.
- Link only the **relevant portion** of text -- never entire sentences or paragraphs.
- Keep link text **brief but meaningful** -- long enough to be clear, short enough to scan.
- Use **consistent phrasing** for similar actions across the product. If "Learn more" is used in one area, don't switch to "Read details" elsewhere.

#### Link vs Button
- **Link = navigation** (goes to a page, URL, or anchor).
- **Button = action** (submits, saves, deletes, toggles).
- Avoid using links styled as buttons or buttons styled as links.

### Form Labels & Helper Text

#### Rules
- Use **noun or noun phrase** for input labels: "Email address", "Dataset name".
- Add **required indicator** (asterisk `*`) for mandatory fields.
- Use **helper text** (below the input) for format hints: "Must be at least 8 characters".
- Use **placeholder text** sparingly -- it disappears on focus. Prefer helper text.
- Error messages: State **what went wrong** and **how to fix it**: "Email is required" not "Invalid input".

### Status & Feedback Messages

#### Alerts & Toasts
- **Success:** Past tense, confirms what happened. "Policy created successfully."
- **Error:** Present tense, states the problem + fix. "Failed to save. Check your connection and try again."
- **Warning:** Describes the consequence. "This action cannot be undone."
- **Info:** Neutral, provides context. "Changes will take effect after approval."

#### Empty States
- Tell the user **what the page is for** and **how to start**: "No datasets yet. Add your first dataset to get started."
- Include a **CTA button** that takes the user to the creation flow.

### Modal & Dialog Copy

- **Title:** Action-oriented. "Delete dataset?" not "Confirm deletion".
- **Body:** Explain the consequence in 1-2 sentences. "This will permanently remove the dataset and all associated metadata."
- **Actions:** Primary button matches the action in the title. "Delete" not "OK".
- **Destructive confirmation:** Require typing the resource name for irreversible actions.

### Table & List Labels

- **Column headers:** Noun, sentence case, no punctuation. "Dataset name", "Last modified", "Owner".
- **Empty rows:** Use em dash (--) for missing values, not "N/A" or blank.
- **Truncation:** Truncate with ellipsis (...) and show full text on hover via tooltip.
- **Action columns:** Use icon buttons (edit, delete, more) -- not text links in table rows.

### Navigation & Menu Items

- Use **nouns or verb + noun** for navigation items: "Dashboard", "Projects", "Requests".
- Keep to **1-2 words** maximum.
- Active item should be visually distinct (not just by color -- also weight or background).

### Accessibility Copy

- All **icon-only buttons** must have `aria-label` or visually hidden text.
- All **external links** must indicate they open in a new tab.
- All **disabled elements** should explain why via tooltip or `aria-describedby`.
- **Don't rely on color alone** to convey meaning -- pair with text or icon.
