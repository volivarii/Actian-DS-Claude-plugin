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

## Per-skill effects

| Tier | generate-flow | component-brief | create-component | generate-presentation |
|------|--------------|-----------------|------------------|-----------------------|
| **Draft** | 3-5 screens, happy path only, key layout + minimal overrides. Non-feature: placeholder. | Cards 1-5 only, simplified tables | Component only, skip build plan gate | 5-8 slides, stat cards only (no charts) |
| **Standard** | All screens, happy + error/empty states. Feature area: full overrides, contextual labels, realistic data. Non-feature: placeholder. | All 9 cards, full Meta Kit components | Component + gen log + standard cleanup | 8-15 slides, full chart selection |
| **Production** | All paths + loading + edge cases. Feature area: all states, real data. Non-feature: contextual but secondary. | Standard + variable binding + golden reference | Standard + variable binding + research step | 8-20 slides with speaker notes, slide-by-slide check |
