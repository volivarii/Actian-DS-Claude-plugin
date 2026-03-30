# Component Playground Generation

Opt-in interactive state playground for testing component variants before pushing to Figma.

## Trigger

- User says "playground" at the preview gate
- User included "playground", "interactive", or "test states" in original prompt
- Skip if user said "quick"/"draft" or went straight to "push"

## Generation process

1. Read `../../references/prototype-reference.md` § "Component playgrounds" for generation rules
2. Read `../../templates/component-playground-wrapper.html` for the base template
3. Extract variant axes from `get_design_context` data collected in Step 1:
   - Each Figma property (State, Selected, Size, Type, etc.) becomes a control group
   - Booleans → toggle button, Enums → segmented bar
4. For each axis combination, render the component variant HTML from Card 2 of the static spec
5. Populate the token readout from the component token mapping in CLAUDE.md
6. Save to: `{project_working_directory}/components/[component-name]/[component-name]-playground.html`

## Re-present the gate

After generating the playground, show both URLs:

> "Static: `http://localhost:8765/components/[name]/[name]-spec.html`
> Playground: `http://localhost:8765/components/[name]/[name]-playground.html`
>
> Toggle states, variants, and themes in the playground, then:
> - **"push"** — send to Figma
> - **"push 2,4,5"** — send selected cards
> - **feedback** — I'll fix and re-preview"

## Rules

- Playgrounds are for testing only — never pushed to Figma
- Static HTML remains the source of truth for Figma parity
- Same `ensure-server.sh` serves both files
- Alpine.js 3.14.9 from CDN — no build step
