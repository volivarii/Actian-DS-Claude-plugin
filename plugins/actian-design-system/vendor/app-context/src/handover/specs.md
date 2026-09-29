---
_schema_version: 1
kind: specs
sections:
  - { title: Screens / Flows Covered, owner: designer, required: true }
  - { title: Components Used, owner: designer, required: true }
  - { title: States, owner: designer, required: true }
  - { title: Interactions & Transitions, owner: designer, required: true }
  - { title: Copy, owner: designer, required: true }
  - { title: Accessibility Notes, owner: designer, required: true }
  - { title: Edge Cases, owner: designer, required: true }
  - { title: Flagged concerns, owner: designer, required: true }
---
# Specs: [Project/Feature Name]

**Owner (Designer):** [name]
**Knowledge:** v[the knowledge version the specs were checked against]
**Figma:** [link to the specific frame or page, not the whole file]
**Prototype:** [link to the clickable prototype]
**Intent:** [link to intent.md in the repo]

Each section's first line names where it comes from: `Source: Figma`, `Source: Prototype`, `Source: Intent`, or several joined with ` + `.

## Screens / Flows Covered
Source: Figma + Prototype
1. [Screen name]: [one-line description]

## Components Used
Source: Figma
- [DS name] ([slug]): [where and how it is used]

## States
Source: Prototype
| Screen | Default | Loading | Empty | Error | Disabled |
| --- | --- | --- | --- | --- | --- |
| [Screen name] | yes | n/a | yes | yes | n/a |

## Interactions & Transitions
Source: Prototype
- [What happens on click, hover or submit, in sequence]

## Copy
Source: Figma
- [label, button or message]: "[exact text]"

## Accessibility Notes
Source: Figma
- Focus order: [describe]
- Labels and alt text: [describe]
- Contrast exceptions: [describe, if any]

## Edge Cases
Source: Intent
- [scenario] → [expected behaviour]

## Flagged concerns
Source: Figma + Intent
- [audit findings not fixed, open questions carried from intent.md, or None.]
