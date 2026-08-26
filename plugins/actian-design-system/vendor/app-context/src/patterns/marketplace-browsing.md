---
# yaml-language-server: $schema=../../../schemas/app-context-pattern.json
_schema_version: 1
slug: marketplace-browsing
label: Marketplace browsing
apps:
  - explorer
tags:
  - homepage
  - browse
  - search
  - curated
  - discover
  - carousel
components:
  - search
  - global-header
---
Explorer homepage: search-first with curated sections (carousels, filter chips, topic cards).

The card this screen shows was recorded as `card-for-items`, which Figma retired in the 2026-08-24 sync (#526). The reference is removed rather than repointed: `card-for-perimeter`, `card-for-grouped-content`, `search-result-card` and `radio-card` all survive, and choosing between them is a fact about the running product that nobody has checked for this screen. The two earlier corrections to this same slug (`analytics-dashboard`, `type-picker-grid`) were both made by looking at the product and both found a different component, so guessing here would be the third such error rather than the first.

It is not repointed at the new `card` either. That component is a blank container with a content slot, carries `status: in-progress`, and is a styling basis rather than something a screen composes as-is. `components` means what this pattern COMPOSES, so naming it there would assert something false. The basis relationship is already recorded where it belongs, between components: the family shares `group: "Card"` in the registry, and `registryAliases` routes `card-for-perimeter` and `card-for-grouped-content` to the `card` guideline doc.
