# Quality Tiers

Tier is chosen by the user at the detail level gate (after screen list approval). Default is Standard.

| Signal | Tier |
|--------|------|
| "draft", "quick", "rough", "sketch" | Draft |
| "approve", no qualifier | Standard |
| "production", "final", "detailed" | Production |
| Re-generation after feedback | Production (auto-upgrade) |

## FM focus principle (all tiers)

Non-feature chrome is ALWAYS placeholder — muted text, generic labels, greyed-out variants. Only elements relevant to the feature being designed get real content. The tier controls how detailed the **feature-relevant** content is, not how detailed the whole screen is.

## generate-flow tiers (concrete rules)

### Draft
**Purpose:** Quick structural sketch — "is this the right layout?" Not detailed.

- **Screens:** 3-5 max, happy path only
- **Page header:** Real title + subtitle (these are NEVER placeholder)
- **Feature content:** Section titles + fmPlaceholder components to show layout zones. NO real data in tables, NO stat values, NO button labels beyond primary actions. Use `fmPlaceholder` (Type=Label+3lines or Label+1line) to represent content blocks.
- **Tables:** Show header row + 1-2 placeholder rows max. No real cell data.
- **Cards/tiles:** Show card frame + title only. Body content = fmPlaceholder.
- **Buttons:** Primary action labeled, secondary actions = fmPlaceholder or omit.
- **Non-feature:** All placeholder.

### Standard (default)
**Purpose:** Feature fully realized — "this is the design."

- **Screens:** All relevant states (happy, empty, error if applicable)
- **Page header:** Real title + subtitle
- **Feature content:** Full contextual labels, realistic data values, all form fields labeled, table rows with real data (3-5 rows), stat cards with numbers, all buttons labeled with action verbs.
- **Tables:** Header + 3-5 rows with realistic data.
- **Cards/tiles:** Full content — title, description, metadata, badges.
- **Buttons:** All labeled with action verbs.
- **Non-feature:** Placeholder.

### Production
**Purpose:** Handoff-ready — "build this."

- **Screens:** All paths (happy, empty, error, loading, edge cases)
- **Feature content:** Real data, all states, complete form validation, full tables (5-8 rows).
- **Non-feature:** Contextual but visually secondary.

## Other skill tiers

| Tier | component-brief | create-component | generate-presentation |
|------|-----------------|------------------|-----------------------|
| **Draft** | Cards 1-5 only, simplified tables | Component only, skip build plan gate | 5-8 slides, stat cards only (no charts) |
| **Standard** | All 9 cards, full Meta Kit components | Component + gen log + standard cleanup | 8-15 slides, full chart selection |
| **Production** | Standard + variable binding + golden reference | Standard + variable binding + research step | 8-20 slides with speaker notes, slide-by-slide check |
