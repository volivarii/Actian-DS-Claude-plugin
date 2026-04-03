# Quality Tiers

Trigger words in the user's prompt determine the quality tier. Default is Standard.

| Signal | Tier |
|--------|------|
| "quick", "draft", "rough", "sketch" | Draft |
| No qualifier | Standard |
| "production", "final" | Production |
| Re-generation after feedback | Production (auto-upgrade) |

## Per-skill effects

| Tier | generate-flow | component-brief | create-component | generate-presentation |
|------|--------------|-----------------|------------------|-----------------------|
| **Draft** | 3-5 screens, happy path only, minimal overrides | Cards 1-5 only, simplified tables | Component only, skip build plan gate | 5-8 slides, stat cards only (no charts) |
| **Standard** | All screens, happy + error/empty states, full FM overrides | All 9 cards, full Meta Kit components | Component + gen log + standard cleanup | 8-15 slides, full chart selection |
| **Production** | All paths + loading + edge cases, variable binding | Standard + variable binding + golden reference | Standard + variable binding + research step | 8-20 slides with speaker notes, slide-by-slide check |
