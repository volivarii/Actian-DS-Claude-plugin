# Figma MCP Architecture Plan — Actian Design System Plugin

> Compiled: 2026-03-26 | Status: Ready for planning session
> Context: Figma opened canvas to agents via MCP. Assembler is now redundant. This doc captures all findings and proposed changes.

---

## Part 1 — Figma MCP Platform Capabilities

### 16 Official MCP Tools

| Tool | R/W | What it returns | Available to us? |
|------|-----|-----------------|-----------------|
| `get_design_context` | R | Layout + code (React+Tailwind default) + screenshot | Yes |
| `get_screenshot` | R | PNG screenshot of node | Yes |
| `get_metadata` | R | Sparse XML (IDs, names, positions, sizes) | Yes |
| `get_variable_defs` | R | Variables/styles used on a specific node | Yes |
| `get_figjam` | R | FigJam diagram metadata + screenshots | Yes |
| `get_code_connect_map` | R | Figma→code component mappings | Yes |
| `get_code_connect_suggestions` | R | AI-suggested component mappings | Yes |
| `search_design_system` | R | Components, variables, styles from libraries (keys only, no values) | Yes |
| `whoami` | R | User info, plan memberships | Yes |
| **`use_figma`** | **W** | **Plugin API JS execution — create/edit/delete anything** | **Yes** |
| `generate_figma_design` | W | Code-to-canvas (captures live UI) | **No** (remote-only) |
| `generate_diagram` | W | FigJam diagrams from Mermaid | Yes |
| `create_new_file` | W | New blank Figma/FigJam files | Yes |
| `add_code_connect_map` | W | Create Figma→code mappings | Yes |
| `send_code_connect_mappings` | W | Confirm suggested mappings | Yes |
| `create_design_system_rules` | W | Generate rule files | Yes |

### Key Constraints

- **`use_figma` limit:** 20KB per call
- **Rate limits:** Pro = 200 calls/day, Enterprise = 600/day
- **Sequential only:** `use_figma` calls must NEVER run in parallel (write corruption)
- **No custom fonts** in `use_figma`
- **No image/video assets** in `use_figma`
- **Beta pricing:** Free now, will become usage-based
- **`search_design_system` returns keys, not values** — can't get hex colors or font specs
- **DS2026 variables** must be searched by Figma path name ("Brand/primary") not CSS name ("theme-primary")

### 5 Official Figma Skills vs Our Skills

| Figma Official | Our Equivalent | Overlap |
|---------------|---------------|---------|
| `figma-implement-design` | Same name | Identical concept, ours adds DS-specific rules |
| `figma-generate-design` | `generate-flow` | Direct overlap, ours is FM-specific |
| `figma-code-connect-components` | Same name | Identical |
| `figma-create-design-system-rules` | Same name | Identical |
| `figma-create-new-file` | None | No overlap |

**Our unique skills (no Figma equivalent):** `design-audit`, `component-brief`, `compare-flows`, `generate-presentation`, `create-component`, `sync-guidelines`

---

## Part 2 — Community Skills Deep Dive (7 Repos)

### 1. uSpec (redongreen/uSpec)
- **What:** 7 spec types rendered directly in Figma (anatomy, API, color, structure, screen reader, motion, properties)
- **Architecture:** Template-driven — imports Figma template library components, detaches, clones internal rows, populates
- **Takeaway:** Screen reader spec (VoiceOver/TalkBack/ARIA per platform) is a gap in our Card 8. Config-driven template keys via `uspecs.config.json` is cleaner than our hardcoded keys.

### 2. rad-spacing (nolanperk/rad-spacing)
- **What:** Single-purpose spacing skill using Gestalt proximity + 8px/4px increments
- **Takeaway:** 40% nesting rule (parent = 1.4× child spacing) — we should document spacing hierarchy, not just raw values

### 3. Edenspiekermann (3 skills)
- **What:** Complete audit→apply→fix pipeline for design system adoption
- **`audit-design-system`:** Read-only, priority 0-3, confidence 0.0-1.0, JSON+markdown output, strict evidence standard ("what structure shows this? why does it matter?")
- **`apply-design-system`:** Reconnects designs to library. Classifications: already-connected, exact-swap, compose-from-primitives, blocked
- **`fix-design-system-finding`:** Single finding fix. Classifications: swap-instance, compose-from-primitives, bind-tokens, align-variant, blocked
- **Takeaway (HIGH IMPACT):** Add confidence scores to our audit. Create fix-finding companion skill. Add JSON output. Adopt evidence standards.

### 4. Component Contracts (nvillapiano/component-contracts-figma)
- **What:** JSON contracts as single source of truth → compile to Figma components deterministically
- **Two-tier tokens:** Primitive (raw values, hidden) → Semantic (aliases, bound to components)
- **Key pattern:** `setExplicitVariableModeForCollection` after every binding (prevents ghost mode)
- **Key gotcha:** Figma defaults frames to FIXED 100px — must explicitly set `layoutSizingHorizontal = 'HUG'`
- **Takeaway (HIGH IMPACT):** Add ghost mode prevention + HUG sizing to our quality checklist and figma-output.md

### 5. Warp (warpdotdev/figma-skills)
- **What:** Text-to-design with strict 7-step workflow
- **Key pattern:** Destination-first resolution (know target file before anything else)
- **Takeaway:** Minor — we already follow similar patterns

### 6. Augment Multi-Agent (AugmentedAJ/skills)
- **What:** Fan-out pattern — one agent per frame link for parallel implementation
- **Critical constraint:** "Never parallelize `use_figma` calls" — write corruption risk
- **Living Specification pattern:** Store frame links in docs, always fetch fresh context
- **Takeaway:** Document sequential `use_figma` constraint. Rate limit awareness.

### 7. Firebenders sync-figma-token (firebenders/sync-figma-token-skill)
- **What:** Bidirectional token sync with drift detection
- **9 drift categories:** missing_in_figma, missing_in_code, value_mismatch, alias_mismatch, type_mismatch, mode_mismatch, scope_mismatch, code_syntax_mismatch, broken_alias
- **Dry-run + approval gate** before any writes
- **Epsilon tolerance** (0.0001 RGBA) for color comparison
- **Takeaway:** Reference architecture if we build token sync. Drift detection could enhance design-audit.

---

## Part 3 — New Sync Architecture

### Current Flow (to be replaced)
```
Figma libraries → Assembler (npm run sync) → GitHub → Plugin (sync-from-upstream.sh)
```

### Proposed Flow
```
Figma libraries → /sync-design-system skill (MCP tools) → Plugin docs/tokens/
```

### Three-Tier Extraction Model

**Tier 1 — Live at runtime (no sync):**
Skills call `search_design_system` on-demand to get keys for binding. No static files needed.

**Tier 2 — Extract via sync skill, store as static reference:**

| Data | Source | Method | Output |
|------|--------|--------|--------|
| DS2026 components (77) | Library `<DS2026_FILE_KEY>` | `get_metadata` + `use_figma` | `ds2026-components.md` |
| FM components (29) | Library `<FM_KIT_FILE_KEY>` | Same | `fm-components.md` |
| Meta Kit components | Meta Kit library | Same | `meta-kit/components.md` |
| All variable values | DS2026 library | `use_figma` → `getLocalVariablesAsync()` | `meta-kit/variables.md` (expanded) |
| Text style specs | DS2026 library | `use_figma` → `getLocalTextStylesAsync()` | NEW `meta-kit/text-styles.md` |
| Effect style specs | DS2026 library | `use_figma` → `getLocalEffectStylesAsync()` | NEW `meta-kit/effect-styles.md` |
| Component guidelines | DS2026 component pages | `get_design_context` per frame | `component-guidelines/*.json` |
| Foundations | DS2026 foundation pages | Same | `foundations/*.json` |
| **Content guidelines** | DS2026 page `7397:3249` | `get_design_context` per frame | `content-guidelines.md` **(replaces hand-authored)** |
| **Accessibility guidelines** | DS2026 page `12685:19373` | `get_design_context` per frame | `accessibility-guidelines.md` **(replaces hand-authored)** |
| Token reference | Generated from variables | Template formatting | `token-reference.md` |
| CSS properties | Generated from variables | Template formatting | `tokens.css` |
| DTCG JSON | Generated from variables | Template formatting | `actian-ds.tokens.json` |

**Tier 3 — Stays hand-authored:**
- `CLAUDE.md` — architecture rules, component token mapping
- `references/quality-checklist.md` — process rules
- `references/fm-css-reference.md` — FM CSS patterns (HTML output)
- `references/figma-output.md` — shared Figma output patterns
- `docs/presentation-*.md` — presentation templates
- `templates/*.html` — card templates
- `meta-kit/builders.md` — JS builder functions

### Sync Skill Phases (7)

1. **Components** — Extract component sets, variant axes, properties, keys
2. **Variables** — Extract all names, keys, types, scopes, values per theme mode
3. **Styles** — Extract text styles (font specs) + effect styles (shadow values)
4. **Token files** — Generate token-reference.md, tokens.css, actian-ds.tokens.json
5. **Component guidelines** — Walk component pages, extract from named frames
6. **Foundations + Content + Accessibility** — Extract from Figma pages
7. **Validation** — Diff against previous, present for approval

### What Gets Eliminated
- Assembler repo as sync intermediary
- `scripts/sync-from-upstream.sh`
- Two-hop data flow
- Hand-authored `content-guidelines.md`
- Hand-authored `accessibility-guidelines.md`

### Extraction Proof Points (tested this session)

| Tool | Target | Result |
|------|--------|--------|
| `get_screenshot` on DS2026 library | Accessibility page (23 frames), Content page (10 frames) | **Works** — full page screenshots |
| `get_design_context` on DS2026 frame | Content checklist (13143:9595) | **Works** — full text extracted cleanly (headings, body, checklist items, colored annotations) |
| `search_design_system` for components | "button" query | **Works** — returns name, key, libraryName, description for DS2026 + FM + legacy libraries |
| `search_design_system` for variables | "Brand/primary" query | **Works** — returns key `a256...` matching our variables.md |
| `search_design_system` for text styles | "heading" query | **Works** — returns all 5 DS2026 heading styles + FM heading styles with keys |
| `search_design_system` for effect styles | "shadow" query | **Works** — returns all 5 DS2026 shadow styles with keys |
| `get_metadata` on DS2026 library | Multiple nodes | **BROKEN in long sessions** — silent rejection. Needs fresh session. |

### Open Investigation Items (for next session)

1. **`get_metadata` reliability** — worked earlier in session, broke later. Test in fresh session to confirm it's a context-length issue.
2. **`use_figma` on library files** — untested. Need to confirm we have edit access and can call `getLocalVariablesAsync()`, `getLocalTextStylesAsync()`, etc.
3. **Content extraction fidelity** — `get_design_context` returns React+Tailwind. Need to test on complex frames (tables, do/don't examples, multi-section layouts) to verify all text is captured.
4. **Accessibility page extraction** — 23 frames including P0/P1/P2 component checklists. Need to verify checklist structure (bullets, sub-items) survives extraction.
5. **Foundation pages** — 11 pages (Borders, Color, Spacing, Typography, etc.). Need to map page node IDs and test extraction.
6. **Variable mode values** — `getLocalVariablesAsync()` returns variables but need to confirm `resolveForConsumer()` or equivalent gives per-mode values (Actian/Studio/Explorer hex).
7. **Rate limit impact** — estimate total MCP calls for full sync and verify it fits within daily limits.

---

## Part 4 — Action Items Summary

### Immediate (before next planning session)
- [x] Token binding fix — shipped v1.12.1
- [x] Component-brief parity fix — shipped v1.12.2
- [x] Create-component brief offer — shipped v1.12.2
- [x] Save findings to memory — done
- [x] Create this planning doc — done

### Next Session — Plan & Build
1. Test `get_metadata` in fresh session (confirm context-length theory)
2. Test `use_figma` variable/style extraction on DS2026 library
3. Test content extraction on complex guideline frames
4. Plan `/sync-design-system` skill architecture
5. Add to `figma-output.md`: sequential `use_figma` constraint, HUG sizing, ghost mode prevention, rate limits
6. Add to `quality-checklist.md`: HUG sizing requirement

### Future Roadmap
- Build `/sync-design-system` skill (replaces Assembler pipeline)
- Build `/fix-finding` skill (companion to design-audit)
- Add confidence scores to design-audit
- Add JSON output format to design-audit
- Expand `meta-kit/variables.md` to all tokens (not just 15)
- Add `meta-kit/text-styles.md` and `meta-kit/effect-styles.md`
- Consider publishing skills to Figma Community
- Consider publishing as custom rules for Figma's `create_design_system_rules`
