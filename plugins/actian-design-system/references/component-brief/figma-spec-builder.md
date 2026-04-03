# Component Brief — Figma Spec Builder

**This file is maintenance documentation for `scripts/brief-to-figma.js`.** It is NOT read by the AI at runtime. The script encodes all card-by-card mapping logic deterministically.

## How it works

1. AI generates `brief-data.json` (the data model)
2. Script runs: `node ${CLAUDE_PLUGIN_ROOT}/scripts/brief-to-figma.js brief-data.json --target-node-id "<id>"`
3. Script outputs call files (interpreter runtime + JSON spec) — self-contained per call
4. AI reads each `call-N.js` and passes to `use_figma` — no ID replacement needed

## Card mapping (9 DS + 5 FM cards)

The script builds these cards from the data model:

### DS Kit mode (9 cards)

| Card | Data model fields | Key components |
|------|------------------|----------------|
| Gen Log | meta.* | genLog instance |
| Card 1: Overview | name, description, category, figmaUrl, links | briefCard + text |
| Card 2: Anatomy | anatomy[] | briefCard + LOCAL_INSTANCE per variant |
| Card 3: States & Variants | states[] | briefCard + LOCAL_INSTANCE grid |
| Card 4: Design Tokens | designTokens[] | briefCard + colorSwatch instances |
| Card 5: Spacing & Layout | spacing, layout | briefCard + dimAnnotation instances |
| Card 6: Typography | typography[] | briefCard + text styles |
| Card 7: Do/Don't | guidelines[] | briefCard + doDontPair instances |
| Card 8: Accessibility | accessibility | briefCard + a11yCard instance |
| Card 9: Code | code | briefCard + codeBlock instance |

### FM mode (5 cards)

Cards 1-5 only, adapted for Fat Marker wireframe components.

## Key rules encoded in the script

- **Never summarize** — every array item expands to real spec nodes (P0 rule)
- **LOCAL_INSTANCE** for same-file component variants (Cards 2, 3)
- **isValidHex()** guard for non-hex color values
- **Auto-splitting** measures each card's JSON size, bins under 12KB
- **Compact JSON** — no pretty-printing (every byte counts for 50KB limit)

## Maintaining the script

To modify card layout or add new cards:
1. Edit `scripts/brief-to-figma.js` directly
2. Test with real brief-data.json: `node scripts/brief-to-figma.js test-data.json --target-node-id "0:1"`
3. The data model schema is in `references/component-brief/data-schema.md`
