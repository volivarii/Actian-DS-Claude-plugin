# Create Component — Research and Dependency Resolution

## Research (Step 3 — optional)

Skip if the user specified variants, layout, and content. Run when the component is new and description is high-level.

### What to research

1. **Actian product context** — Read `../context/app-context.md`. Which app? What entities? The app context changes the component's property surface.
2. **Established design systems** — Material, Atlassian, Ant, Carbon, Spectrum. Focus on variant axes, internal anatomy, common states, accessibility patterns.
3. **SaaS UX patterns** — Read `../context/ux-patterns.md` for the relevant flow type.
4. **Existing Actian patterns** — Check FM/DS Kit for conventions this component should match.

Use `WebSearch` for 2-3 sources. Focus on component API, not visual styling. Fold insights directly into the spec (no separate report).

## Dependency resolution (Step 5.0 — before building)

When the build plan includes nested components (e.g., Card containing Button and Badge):

1. Scan build plan for nested component references
2. Check `../../vendor/components/registries/fmkit.json` or `../../vendor/components/registries/dskit.json` (fast, local). Fallback: `search_design_system`
3. Classify: **Exists** (import key ready) or **Missing** (build first)
4. If missing: build leaf-to-root (components with no dependencies first), record keys
5. Report: "Dependencies resolved: FM Button (exists), FM Icon (exists), Custom Badge (building...)"

Skip entirely if no nested components are referenced.
