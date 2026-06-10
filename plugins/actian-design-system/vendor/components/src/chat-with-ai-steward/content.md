---
title: "Chat with AI Steward"
---
# Chat with AI Steward

The AI steward panel surfaces AI-generated insights in Studio and Explorer. Its copy rules make generated content trustworthy: cited, confidence-labeled, and clearly distinguished from static UI.

---

## Voice

The steward explains, it does not perform. Plain sentences, no exclamation marks, no anthropomorphic filler ("I think…", "Let me…"). Answers lead with the finding, then the evidence.

## Source attribution (citation pattern)

- Every AI-generated insight carries a source line: `Source: <asset name>`, linking to the catalog asset it was derived from.
- Multiple sources: comma-separated, max 3 visible, "+N more" beyond that.
- Never present an uncited insight as fact; uncited output is labeled "Generated — verify before use."

## Confidence

- Confidence is a labeled value, not a bare number: `Confidence: High` / `Medium` / `Low` (badge component). Show the percentage in a tooltip, not inline.
- Low-confidence answers must include the verify affordance ("Check source").

## Disclaimer

- One persistent, plain-language line in the panel footer: "AI-generated content can contain errors. Verify important information."
- Per app-context vocabulary: the feature is "Ask AI" — never "chatbot", "AI search", or "assistant".

## Actions

- Output actions use verb-first labels: "Accept", "Regenerate", "Discard" (matches the accessibility checklist's required affordances).
