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

### Layout-pattern-specific prompts

```
Design a Studio dashboard with latest searches, popular items, and watchlists
```

```
Create an Explorer homepage with search hero, marketplace tiles, and topic cards
```

```
Mock up a catalog item detail page in Explorer with featured properties sidebar
```

```
Generate a catalog browsing flow in Explorer with faceted filters and result cards
```

```
Design a new glossary term creation screen in Studio with radio card type picker and sticky footer
```

```
Create a lineage visualization screen in Studio with graph canvas and toolbar
```

```
Mock up a table view for Administration users page with sort, filters, and bulk actions
```

```
Design a side panel drawer for quick-editing a dataset field in Studio
```

```
Create a confirmation modal for deleting a connection — 700px width
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

### With hifi conversion

```
Generate a connection settings flow in Studio --hifi
```

```
/actian-ux-prototype Admin dashboard for Administration --hifi
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

## Design proposals

### From a ticket

```
/actian-ux-proposal DIP-I-496 Ability to show user roles and permissions for a logged-in user
```

### With research and a chosen count

```
/actian-ux-proposal show a user their roles in the account menu --concepts 2
```
(answer "yes" at the research gate)

### Re-render after editing the data file

```
/actian-ux-proposal --from proposals/proposal-data.json
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
/actian-ux-prototype Admin Dashboard for Administration
/actian-ux-prototype Connection settings in Studio --hifi
/actian-ux-audit https://figma.com/design/FILEKEY/File?node-id=123-456
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
