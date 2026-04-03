# File Catalog

Complete listing of all reference files in the plugin. Skills don't need to read this — each SKILL.md lists its own required files. This is for orientation and maintenance.

## JSON (source of truth — read in skills)

| File | Source | Purpose |
|------|--------|---------|
| `docs/component-guidelines/*.json` | `/sync-design-system` Phase 5 | Per-component content/design guidelines (44 components) |
| `docs/foundations/*.json` | `/sync-design-system` Phase 6 | Foundation docs: accessibility, borders, color, spacing, typography, etc. |
| `tokens/actian-ds.tokens.json` | `/sync-design-system` | W3C DTCG format (source of truth for token values) |
| `docs/meta-kit/variables.md` | `/sync-design-system` | DS Kit variable keys (115 vars, 3 themes) |
| `docs/meta-kit/text-styles.md` | `/sync-design-system` | DS Kit text styles with font specs |
| `docs/meta-kit/effect-styles.md` | `/sync-design-system` | DS Kit effect styles with shadow params |
| `docs/meta-kit/components.md` | `/sync-design-system` | Meta Kit component keys and properties |
| `docs/meta-kit/meta-kit-registry.json` | `/sync-design-system` | Meta Kit component + template keys, text slots, categories |
| `docs/fm-components-registry.json` | `/sync-design-system` | FM Kit: keys, variants, text overrides, boolean properties (40 components) |
| `docs/dskit-components-registry.json` | `/sync-design-system` | DS Kit: keys, variants, text overrides, boolean properties (103 component sets) |

## Markdown (auto-generated — for human review)

| File | Generated from | Purpose |
|------|---------------|---------|
| `docs/content-guidelines.md` | `foundations/content-guidelines.json` | UI copy rules |
| `docs/accessibility-guidelines.md` | `foundations/accessibility.json` | WCAG 2.1 AA standards |
| `docs/token-reference.md` | `tokens/actian-ds.tokens.json` | Human-readable token reference (3 themes) |
| `docs/dskit-components.md` | Figma MCP extraction | 97 DS Kit component sets + 3 standalone |
| `docs/fm-components.md` | Figma MCP extraction | 33 FM Kit component sets + 7 standalone |
| `tokens/tokens.css` | `tokens/actian-ds.tokens.json` | CSS custom properties (`--zen-*`) |

## Hand-authored

| File | Purpose |
|------|---------|
| `scripts/figma-codegen.js` | Shared Figma code generation library |
| `scripts/flow-to-figma.js` | Flow → Figma plugin JS via codegen |
| `scripts/brief-to-figma.js` | Brief → Figma plugin JS via codegen |
| `scripts/slide-to-figma.js` | Slide → Figma plugin JS via codegen |
| `scripts/templates.json` | Template definitions (admin, studio, explorer, etc.) |
| `scripts/html-renderers/*.js` | Client-side renderers for HTML preview |
| `references/generate-flow/` | HTML reference, figma-spec-builder, research guide |
| `references/component-brief/` | Data schema, figma-spec-builder, Figma rules, playground |
| `references/generate-presentation/` | Slide templates, chart types, figma-spec-builder |
| `references/create-component/` | figma-spec-builder for component authoring |
| `references/layout-patterns.md` | Canonical page layouts (dashboard, detail, table, form, graph, overlay) |
| `templates/` | CSS wrappers, annotation layer, prototype/playground wrappers |

## Theme modes

3 themes: **Actian**, **Studio**, **Explorer**. Theme switching changes `theme-primary`, `theme-selected`, `interactive-selected-*`, `background-bg-reverse`, most `status-*`, `text-*`, `icon-*`, `border-*` tokens. See `docs/token-reference.md` for exact per-theme values.
