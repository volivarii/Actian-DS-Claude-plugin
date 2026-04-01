# Test Prompts

Prompts to test the DS companion and all capabilities. Replace placeholder Figma URLs with real ones.

---

## Spot fixes — point and fix

```
https://figma.com/design/FILEKEY/File?node-id=123-456
the spacing feels off in this card
```

```
https://figma.com/design/FILEKEY/File?node-id=123-456
check the tokens on this screen
```

```
https://figma.com/design/FILEKEY/File?node-id=123-456
is this using the right colors?
```

```
https://figma.com/design/FILEKEY/File?node-id=123-456
the alignment is broken here, can you fix it?
```

```
https://figma.com/design/FILEKEY/File?node-id=123-456
this doesn't match our design system
```

---

## Design screens and flows

### From a feature idea

```
Create a data product publishing flow in Studio
```

```
Generate a wireframe for the connection setup wizard in Administration
```

```
How would a data steward create a metadata quality policy?
```

```
Mock up the catalog browsing experience in Explorer
```

```
Design a settings page for Administration — users, roles, permissions
```

### Quality tiers

```
Quick draft of a user registration flow
```

```
Production flow for data contract management with all states and edge cases
```

### With research

```
Generate a flow for data lineage visualization
Research competitor patterns first
```

```
Create an access request workflow in Explorer, no research, just build it
```

### Different screen types

```
Mock up a mobile notification screen for scanner alerts
```

```
Design a compact modal for connection deletion confirmation
```

### At the action gate

```
push                    # Send all screens to Figma
push 1,3,5              # Send specific screens only
push and wire           # Push + wire prototype connections
preview                 # Open HTML preview first
prototype               # Generate interactive HTML prototype
```

### Wire existing Figma flows

```
Wire a prototype on https://figma.com/design/FILEKEY/Flow?node-id=123-456
```

```
Make this flow interactive https://figma.com/design/FILEKEY/Flow?node-id=123-456
```

---

## Copy review

```
https://figma.com/design/FILEKEY/File?node-id=123-456
review the copy in this screen
```

```
Write better copy for this empty state
https://figma.com/design/FILEKEY/File?node-id=123-456
```

```
What should the error message say when a connection times out?
```

```
Is "Submit" a good button label here?
https://figma.com/design/FILEKEY/File?node-id=123-456
```

---

## Accessibility

```
https://figma.com/design/FILEKEY/File?node-id=123-456
is this form accessible?
```

```
Check the contrast on these cards
https://figma.com/design/FILEKEY/File?node-id=123-456
```

```
What WCAG issues do you see here?
https://figma.com/design/FILEKEY/File?node-id=123-456
```

---

## Research

```
How do data platforms like Atlan and Collibra handle onboarding?
```

```
What's the best practice for wizard vs. inline form for multi-step setup?
```

```
Research how Stripe, Linear, and Notion handle empty states
```

---

## Component briefs

### From Figma URL

```
Brief this component https://figma.com/design/FILEKEY/DS?node-id=123-456
```

```
Document the Button component from https://figma.com/design/FILEKEY/DS?node-id=123-456
```

### By name

```
Component brief for Button
```

```
Spec the Text Input component
```

### Specific cards

```
Component brief for Modal, only cards 2, 4, 5
```

### At the preview gate

```
push                    # Send all cards to Figma
push 2,4,5              # Send specific cards only
playground              # Generate interactive state explorer
```

---

## Create components

```
Create a Page Header component with title, subtitle, and action buttons variants
```

```
Build an FM Status Badge with types: info, success, warning, error
```

```
Create a Data Product Card component for Explorer
States: Default, Hover, Selected
Properties: title, description, quality score, owner avatar, domain tag
```

```
Add a compact size variant to the existing Button component
```

---

## Compare designs

```
Compare these two flows:
https://figma.com/design/FILEKEY/File?node-id=111-222
https://figma.com/design/FILEKEY/File?node-id=333-444
```

```
Which version is better for onboarding?
v1: https://figma.com/design/FILEKEY/File?node-id=111-222
v2: https://figma.com/design/FILEKEY/File?node-id=333-444
```

```
Compare the old and new catalog browsing flow — what improved?
Old: https://figma.com/design/FILEKEY/File?node-id=111-222
New: https://figma.com/design/FILEKEY/File?node-id=333-444
```

---

## Presentations

```
Create a presentation about Q1 design system adoption metrics
```

```
Present the data contract strategy to product leadership
Goal: get approval for the contract-first approach
```

```
Quick draft deck on sprint highlights
```

---

## Sync

```
Sync the design system
```

```
Sync components only
```

```
Sync the Button guidelines
```

```
Check if the local files are up to date with Figma
```

---

## Guideline proposals

```
We should add a rule about minimum card padding
```

```
The content guidelines don't cover date formatting — can we add that?
```

```
I think we need a guideline for side panel width — it should always be 400px
```

---

## Full design audit

```
Audit this screen https://figma.com/design/FILEKEY/File?node-id=123-456
```

```
What's wrong with this design? https://figma.com/design/FILEKEY/File?node-id=123-456
```

```
Fix finding #3
```

```
Fix all auto-fixable findings
```

---

## Direct skill invocation (power-user shortcuts)

```
/generate-flow Admin Dashboard for Administration
/component-brief Button
/design-audit https://figma.com/design/FILEKEY/File?node-id=123-456
/compare-flows https://figma.com/design/FILEKEY/File?node-id=111-222 https://figma.com/design/FILEKEY/File?node-id=333-444
/generate-presentation Q1 design system review
/create-component Status Badge with info, success, warning, error types
/sync-design-system all
/release-notes
```

---

## Browser annotations

Available during any preview:

```
1. Click "Annotate" in the preview toolbar
2. Click an element, type feedback, pick Change or Note
3. Click "Apply" in the browser
4. Say "apply" in the CLI
```
