---
# yaml-language-server: $schema=../../../schemas/app-context-pattern.json
_schema_version: 1
slug: data-profiling-sampling
label: Data profiling and sampling
apps:
  - studio
reference: product
tags:
  - profiling
  - sample
  - charts
  - fields
  - statistics
components:
  - line-graph
  - table
---
Statistical graphs on fields (profiling) and sample data preview rows (sampling). On an item page the Sample Data tab is disabled when the source supplies no sample.

The profiling graphs are bar-shaped on the page, and `bar-graph` was retired from the Figma library on
2026-08-31 with no replacement, so the design system cannot express that half today. `line-graph` stays
because it is a real component; the gap is recorded rather than hidden by dropping the pattern.
