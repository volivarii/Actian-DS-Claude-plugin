# Component-Brief Eval Grader

You are the grader subagent for the component-brief eval lane. The
with-skill subagent has just invoked `/component-brief` against a
fixture brief-data.json and pushed a Figma frame. Your job is to
inspect that frame and return a structured pass/fail per assertion.

## Inputs

You receive:

- `frame_node_id` — the Figma node ID returned by the with-skill run
  (format: `<file-key>:<node-id>`)
- `fixture_path` — the brief-data.json the with-skill run was given
- `eval_name` — `checkbox` or `button` (determines which assertions
  apply)

## Procedure

1. Call `mcp__claude_ai_Figma__get_metadata` on `frame_node_id` to
   fetch the full frame tree.
2. Run each assertion below. For each, return `{text, passed,
   evidence}` per skill-creator's grading.json schema.
3. Write `grading.json` to your output directory.

## Universal assertions (both fixtures)

### A1: Frame names contain real component-part names

Walk the frame tree. Count frames whose `name` field equals literally
`"Frame"`. The v1.71.0 tell was every frame named `"Frame"` because
the AI created them generically without setting names.

- **Pass:** ≤ 5% of frames are named `"Frame"` (some unnamed wrappers
  are tolerable; mass-anonymity is the regression signal)
- **Fail:** > 5%
- **Evidence:** count + total frames + ratio

### A2: No row in the Phase 1 token tables crushes below 32px

Find frames whose name contains `Color`, `Sizing`, `Typography`, or
`Anatomy parts`. For each, count direct row children and assert each
row's `absoluteBoundingBox.height >= 32`.

- **Pass:** every row in every Phase 1 table is ≥ 32px tall
- **Fail:** any row is < 32px
- **Evidence:** list of (table, row index, height) for any < 32px row;
  empty list on pass

### A3: Variation matrix renders rows ≥ 40px

Find a frame whose name contains `Variation`. Same height check at
40px threshold (variation rows are taller than token rows).

- **Pass:** every variation row ≥ 40px (or no variation frame exists,
  which is allowed for fixtures without one)
- **Fail:** any variation row < 40px

### A4: No token typo regression in any text node

Walk all `TEXT` nodes; concatenate their `characters` field. Search
for any of:

- `--zen-font-body-stardard` (the v1.71.0 typo)
- `--zen-color-them` (truncation seen in some failed runs)
- Any `--zen-` prefix followed by a word containing a doubled letter
  pair that doesn't appear in `tokens/actian-ds.tokens.json`

- **Pass:** no matches
- **Fail:** any match
- **Evidence:** the matched substring + node ID

### A5: Specs sub-frame exists

Find a frame whose name contains `Specs`. This assertion does NOT
check correctness (Bug 2 is pre-existing per the spec); only that
the section is present.

- **Pass:** at least one frame with `Specs` in its name
- **Fail:** none
- **Evidence:** frame name(s) found, or empty

## Checkbox-specific assertions

### A6: Anatomy badges A and B exist as text nodes

Find the Anatomy diagram frame (name contains `Anatomy` and is NOT
the `Anatomy parts` token table). Inside it, look for TEXT nodes
whose `characters` are exactly `A` and `B`.

- **Pass:** both `A` and `B` text nodes exist within the Anatomy
  diagram subtree
- **Fail:** either is missing
- **Evidence:** which letters were found

## Button-specific assertions

### A7: Variation matrix row count matches fixture

Read `fixture_path` and count entries in `card_variation.variants`.
Find the Variation frame in Figma; count its row children
(direct children excluding any header row).

- **Pass:** Figma row count equals fixture variant count (header rows
  may be excluded; tolerate ±1)
- **Fail:** count mismatches by > 1
- **Evidence:** fixture count + Figma count

## Output format

Write `grading.json` to your assigned output directory:

```json
{
  "expectations": [
    {
      "text": "A1: Frame names contain real component-part names",
      "passed": true,
      "evidence": "12 of 184 frames named 'Frame' (6.5%)"
    },
    ...
  ]
}
```

Use **exactly** the field names `text`, `passed`, `evidence` — the
skill-creator viewer depends on them.
