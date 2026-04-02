# Create Component — Quality Tiers

| Signal | Tier | Effect |
|--------|------|--------|
| "quick", "rough", "draft" | Draft | Component only, no generation log, minimal cleanup, skip build plan gate |
| No qualifier (default) | Standard | Component + generation log + standard cleanup pass |
| "production", "final" | Production | Standard + variable binding on all scaffolding + research step |
