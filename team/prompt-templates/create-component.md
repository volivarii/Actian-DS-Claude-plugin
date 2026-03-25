# Prompt Template: Create a Component

> Copy this into Claude Desktop when building a new component for the Figma design system library. Replace the [bracketed] parts.
> Updated: 2026-03-25

---

## The prompt

```
Create a new component for our design system:

**Component name:** [e.g., FM Stepper, Page Header, Status Indicator]
**Library:** [Fat Marker (lo-fi, Inter font) / DS2026 (hi-fi, Roboto font)]

**Description:** [what it does and when to use it — one sentence]
**Where it appears:** [e.g., multi-step forms, dashboard headers, user profiles]

**Variants:** [describe the axes and values, or say "suggest based on research"]
  - e.g., Type: Horizontal / Vertical / Compact
  - e.g., State: Default / Active / Completed / Error

**Content:** [what goes inside each variant]
  - e.g., step number, label, status icon
  - e.g., title, description, action button

**References:** [paste Figma URLs of similar components, attach screenshots, or write "none"]

Before building:
1. Check if this already exists in our FM Kit or DS2026 library
2. Research how Material, Atlassian, Ant Design, or Carbon handle this component type
3. Use the research to inform variant axes, states, and accessibility patterns

Generate a component-spec.json for the DS Assembler plugin.
```

---

## Quick prompt (when you know exactly what you want)

```
Build a new [FM / DS2026] [component name] component with these variants:
- [Variant axis]: [Value 1] / [Value 2] / [Value 3]

Content: [describe what's inside]
Layout: [horizontal / vertical], spacing [Npx]

Skip research — go straight to the spec JSON.
```

---

## Prompt for extending an existing component

```
Add a new variant to the existing [component name]:

**Figma URL:** [paste the URL of the current component]
**New variant:** [describe what to add — e.g., "Destructive variant with red background"]
**Should match:** [what existing variants should it be consistent with]

Generate an updated component-spec.json that includes the new variant.
```

---

## What gets generated

The skill produces a `component-spec.json` file with:

| Section | Content |
|---------|---------|
| `name` | Component name (FM prefix for Fat Marker) |
| `library` | `"fat-marker"` or `"ds2026"` |
| `variants` | Axis names and values |
| `definitions` | Layout spec for each variant — children, spacing, sizing |

The spec uses:
- **Text nodes** with style tokens (`heading-display`, `body-standard`, `label-standard`)
- **Nested component instances** referencing exact FM Kit registry names
- **Frame containers** with auto-layout (`"hug"` / `"fill"` sizing)
- **Token references** for fills, spacing, and radii — no hardcoded values

---

## After generation

1. Open **DS Assembler** → **Create** tab → enter `component-spec.json` → **Create Component**
2. Review the component in Figma
3. Publish to library if it's a shared component
4. Run `sync-all.js` to update the registry and docs

---

## Tips

- If you're unsure about variants, say "suggest based on research" — Claude will check Material, Atlassian, etc. and propose a variant structure
- For simple extensions (adding one variant), skip research with "Skip research — go straight to the spec"
- The assembler produces real Figma components with auto-layout, not static frames
- After creation, ask: "Does this overlap with any existing component we should consolidate?"
- Check the cleanup pass output — it validates token compliance, naming conventions, and completeness
