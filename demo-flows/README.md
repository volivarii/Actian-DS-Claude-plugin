# Demo flows — DS-native hi-fi (v1.106.0)

Two DS-native hi-fi flows for the Friday demo, authored against the DS component
vocabulary (`plugins/actian-design-system/references/generate-flow/ds-components-authoring.md`).
The `.flow.json` sources are committed; the rendered `.html` deliverables are regenerable
(and gitignored — each embeds ~340kb of woff2 fonts).

- **`studio-ai-steward.flow.json`** — Use Case 2 (AI feature foundations): Studio catalog
  search with the AI Steward panel open (sparkle marker, insight, `Source:` citation,
  confidence badge). Demonstrates AI-content-vs-static-UI distinction.
- **`admin-users.flow.json`** — Administration user management: table leaf, page-header CTAs,
  and a destructive-confirm modal (Critical action).

## Regenerate the HTML

```bash
cd plugins/actian-design-system
source scripts/lib/resolve-node.sh
"$NODE_BIN" scripts/renderers/assemble-preview.js \
  ../../demo-flows/studio-ai-steward.flow.json --type flow-share \
  -o ../../demo-flows/studio-ai-steward.html
"$NODE_BIN" scripts/renderers/assemble-preview.js \
  ../../demo-flows/admin-users.flow.json --type flow-share \
  -o ../../demo-flows/admin-users.html
```
