# Prompt Template: Generate a Fat Marker Flow

> Copy this into Claude Desktop when starting a new flow. Replace the [bracketed] parts with your specifics.
> Updated: 2026-03-25

---

## The prompt

```
Using the Fat Marker wireframe components from our design system, generate a user flow for the following feature:

**Feature:** [e.g., Approval Workflow]
**User role:** [Administrator / Reviewer / Viewer]
**App context:** [Admin / Studio / Explorer]

**User goal:** [e.g., A reviewer needs to evaluate and approve an incoming request for a listed item]

**Output type:** [assembler / html / both]
  - assembler: generates a JSON spec for the DS Assembler plugin (real Figma components)
  - html: generates an HTML file for Figma capture
  - both: generates both formats

**References:** [paste Figma URLs, attach screenshots, or link competitor pages — or write "none"]

**Before designing:**
1. If I attached references, analyze each one: describe the layout, extract useful patterns, note what to skip, and map to our FM components
2. Search for how competing data platforms handle this feature (relevant competitors in the same product category)
3. Summarize what you found: which approaches work, what's common across products, and what you recommend

**Then give me:**
1. Reference analysis (if any were provided)
2. A brief competitor/pattern research summary (3–5 bullet points)
3. A numbered screen list with screen names and what each shows — I'll review before you generate anything
4. Include: starting state, interaction triggers, form/input states, success confirmation, and error state
5. Use Fat Marker components: FM App_header, FM Side navigation bar, FM Page Header, FM Button, FM Text input field, FM Input Label, FM Table Cell, FM Badge, FM Tag, FM Alert, FM Dialog, FM Empty State, FM Placeholder
6. Each sub-flow starts with a dark cover card showing Feature / Flow / User
7. Screen naming convention: [Persona] - [Page] - [State/Action]
8. Screen size: 1440×960px (70px header + 260px sidebar + content area)
9. Flows are always laid out as horizontal rows — one row per flow

Do not generate screens until I approve the screen list.
```

### What counts as a reference

You can attach any of these — Claude will analyze them before designing:

| What you have | How to share it |
|---|---|
| Figma frame | Paste the URL (e.g., `figma.com/design/.../...?node-id=...`) |
| Screenshot / photo | Drag and drop the image into the chat, or paste the file path |
| Competitor website | Paste the URL (e.g., `https://competitor-app.example.com/...`) |
| PDF (spec, wireframe, deck) | Drag and drop, or paste the file path |
| Existing Actian screen | Paste the Figma URL from Studio/Explorer/Admin |

Claude will describe what it sees, extract useful patterns, and map them to FM components before building the flow.

---

## Prompt without competitor research

If you want to skip the research phase:

```
Using the Fat Marker wireframe components from our design system, generate a user flow for:

**Feature:** [e.g., Approval Workflow]
**User role:** [Administrator / Reviewer / Viewer]
**App context:** [Admin / Studio / Explorer]
**User goal:** [describe the goal]
**Output type:** [assembler / html / both]

Skip competitor research — go straight to a numbered screen list. I'll review before you generate.
Include: empty state, error state, success confirmation. Use FM components only.
```

---

## Output types explained

| Type | What it produces | Best for |
|------|-----------------|----------|
| **assembler** | JSON spec file → DS Assembler plugin creates real Figma component instances | Production-quality Figma frames with actual library components |
| **html** | HTML file → captured to Figma as static frames | Quick visual mockups, complex layouts, custom elements |
| **both** | Both formats generated | When you want real components + a visual backup |

The assembler output supports:
- **textOverrides** — customize text content on library components (match by content or layer name)
- **textByOrder** — sequential text replacement (e.g., Tab 1, Tab 2, Tab 3)
- **Custom elements** — mix library components with raw frames, text nodes, and shapes

---

## Key FM component specs (for reference)

These are the correct styles — if Claude generates something different, point it here:

- **App header:** White background, `border-bottom: 2px solid #CBD2E0`, height 70px, two-line logo ("Actian Data Intelligence" / bold app name)
- **Sidebar:** 260px wide, white bg, nav items with 20px icon placeholder + label + chevron, active item has `#EDF0F7` bg
- **Buttons:** Primary fill `#2D3648` (dark blue-grey, NOT black), height 48px (md), 6px radius
- **Color palette:** `#2D3648` (primary), `#CBD2E0` (borders), `#EDF0F7` (active/hover), `#4A5468` (secondary text)

---

## Tips
- Be specific about the user goal — "a user needs to do X" beats "create a dashboard"
- The competitor research phase adds 30 seconds but often surfaces patterns you wouldn't think of
- If the flow has multiple user roles (e.g., requester + approver), ask for separate sub-flows
- After Claude generates, ask: "What edge cases or error states are missing?"
- To iterate: "Move screen 3 before screen 2" or "Add a confirmation dialog between steps 4 and 5"
- The assembler output produces real Figma components that are editable — HTML capture produces static frames
- Always specify output type — Claude will ask if you forget
