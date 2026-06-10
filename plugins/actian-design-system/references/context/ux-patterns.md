# SaaS UX Pattern Library

Reference for all skills that generate flows, components, or presentations. Organized by flow type. Each pattern includes an exemplar app and implementation notes for Actian context.

## Cross-Cutting Principles

Apply these regardless of flow type:

### 1. Progressive disclosure
Show the minimum viable UI first, reveal complexity on demand. Applies to navigation (accordion sidebar), forms (essential fields first, advanced behind expandable sections), filters (start broad, narrow progressively), settings (basic visible, advanced collapsed).

**In Actian context:** Studio's metadata enrichment templates, Explorer's search refinement, Administration's connection configuration all benefit from this pattern.

### 2. Empty states as onboarding
Every empty state needs: a clear illustration or icon, a description of what will appear, an action CTA ("Add your first connection"), and optionally a template/example to start from. 84% of users who encounter blank states without help abandon in the first session.

**In Actian context:** First-time Explorer search with no results, empty domain in Studio, new connection in Administration.

### 3. Contextual trust signals
In data platforms, show freshness, quality scores, ownership, and usage stats alongside every asset. This is what separates "catalog" from "useful catalog."

**In Actian context:** Every catalog object card, data product listing, and lineage node should surface observability signals. Explorer marketplace cards need quality badges and freshness indicators.

### 4. Keyboard-first interaction
Command palette (`Cmd+K`) for search, navigation, and actions. Keyboard shortcuts for common operations. The mouse path remains fully functional — keyboard accelerates power users.

**In Actian context:** Studio power users (stewards, engineers) expect keyboard-driven workflows. Explorer business users rely more on mouse/touch.

### 5. Same data, many views
Let users choose their preferred lens on the same dataset: table, board/kanban, timeline, calendar, gallery, list. View-specific filters persist independently.

**In Actian context:** Catalog objects can be viewed as table (default), cards (marketplace), graph (lineage), timeline (change history).

### 6. Role-adaptive UI
The same data surface presents differently to different personas. Panels, available actions, and detail depth adapt based on user role.

**In Actian context:** Studio shows governance controls and editing capabilities. Explorer shows the same assets in read-only mode with consumption-focused actions (request access, bookmark, subscribe).

### 7. Lightweight governance
Slack-like embedded workflows beat rigid multi-step approval chains. YAML-based data contracts that are version-controlled. AI auto-generates first-draft documentation. Self-service with guardrails.

**In Actian context:** Data contract creation, access request workflows, metadata enrichment approvals.

---

## Patterns by Flow Type

### A. Discovery / Browsing Flows

Use when: user searches, filters, browses, or explores a collection of items.
**Actian examples:** Explorer marketplace, Studio asset browser, glossary browsing, connection list.

| Pattern | Exemplar | When to apply | Implementation |
|---------|----------|---------------|----------------|
| **Global search with semantic understanding** | Atlan | Any flow with a search-first landing | Natural language queries, synonym recognition, role-based result ranking. Search bar prominent at top. |
| **Faceted filtering with live counts** | Stripe | Lists with >20 items or >3 filterable properties | Dynamic count updates as filters applied. Progressive filter revelation — show top 3 filters, expand for more. |
| **Master-detail with companion sidebar** | Atlan, Figma | Asset detail without losing list context | Click item in list/grid to open side panel with details, metadata, actions. List stays visible. Good for quick scanning. |
| **Full detail page with tabs** | Stripe, Collibra | Complex records with deep metadata | Breadcrumb back to list. Tabbed sections (Overview, Metadata, Lineage, Governance, History). 360-degree view. |
| **Card-based grid with trust signals** | Atlan marketplace | Marketplace/catalog browsing | Cards show: title, description snippet, owner avatar, quality badge, freshness indicator, domain tag. |
| **Nested filter groups** | Notion | Advanced users building complex queries | Up to 3 levels of AND/OR nesting. Save filter presets. |

### B. Creation / Editing Flows

Use when: user creates, configures, or edits a record, asset, or workflow step.
**Actian examples:** Data product creation, contract definition, glossary term authoring, template building, metadata enrichment.

| Pattern | Exemplar | When to apply | Implementation |
|---------|----------|---------------|----------------|
| **Progressive field disclosure** | Stripe | Forms with >6 fields or mixed required/optional | Essential fields visible, advanced behind "Show more" or collapsible sections. Reduces form anxiety. |
| **Inline editing in tables** | Retool, Notion | Bulk metadata editing, property management | Click cell to edit directly. No modal for simple changes. Tab to next field. |
| **Form auto-population from selection** | Retool | Edit flows where context is already known | Select a row/card; form pre-fills. Reduces manual data entry. Shows "Editing: [Asset Name]" header. |
| **Drag-and-drop composition** | Notion, Actian Studio | Template building, layout configuration | Modular blocks that snap into structure. Visual preview of result. Undo/redo support. |
| **Stepper/wizard for multi-step creation** | Stripe onboarding | Complex creation with dependencies (data product, connection) | Numbered steps with progress indicator. Validation per step. Summary before submission. Back navigation. |
| **Template gallery for empty states** | Notion | First-time creation of any asset type | Pre-built structures as starting points. "Start from scratch" always available alongside templates. |

### C. Configuration / Settings Flows

Use when: user configures system settings, connections, permissions, or policies.
**Actian examples:** Administration connection setup, user/group management, catalog configuration, governance policy definition.

| Pattern | Exemplar | When to apply | Implementation |
|---------|----------|---------------|----------------|
| **Category sidebar + form content** | macOS Settings, Stripe | Settings with >5 categories | Left sidebar lists categories. Right panel shows form for selected category. URL-addressable sections. |
| **Test/validate before save** | Stripe (test mode) | Connection configuration, policy rules | "Test Connection" button that validates without saving. Shows success/failure inline. |
| **Permission hierarchy table** | Notion, GitHub | User/group role management | Table showing: entity, role, inherited-from. Expandable groups. Search/filter users. |
| **Bulk operations with confirmation** | Linear | User management, batch config changes | Multi-select rows, contextual action bar at bottom. Confirmation dialog for destructive actions. Count of affected items. |
| **Code/YAML alongside UI** | Atlan (contracts) | Technical users configuring contracts or policies | Split view: visual form on left, generated YAML/JSON on right. Edit either side. Version-controlled. |
| **Connection wizard with provider selection** | Retool | Adding a new data source | Step 1: pick provider (grid of logos). Step 2: credentials. Step 3: test. Step 4: configure scope. |

### D. Data Visualization / Lineage Flows

Use when: user explores data relationships, transformation paths, or impact analysis.
**Actian examples:** Studio lineage explorer, knowledge graph navigation, impact analysis.

| Pattern | Exemplar | When to apply | Implementation |
|---------|----------|---------------|----------------|
| **Interactive DAG with zoom levels** | Atlan, dbt | Lineage visualization | Nodes = assets, edges = transformations. Semantic zoom: overview shows clusters, detail shows fields. Pan/zoom controls. |
| **Click-to-drill node inspection** | Atlan | Any graph node detail | Click node to open side panel with: metadata, quality score, transformation logic, run history, downstream dependents. |
| **Column-level lineage toggle** | Atlan | Field-level impact analysis | Default: table-level view. Toggle to expand tables into columns and show field-level edges. Performance-heavy — load on demand. |
| **Impact analysis highlight** | Collibra | Change management | Select a node, highlight all downstream dependents. Color-code by distance (1-hop, 2-hop, 3+). Show affected count. |
| **Minimap + legend** | Figma, graph tools | Large graphs (>20 nodes) | Corner minimap showing viewport position. Legend explaining node types, edge types, color coding. |
| **Filter graph by dimension** | Data lineage tools | Complex lineage with many paths | Filter by: asset type, domain, quality status, freshness. Dim non-matching nodes instead of hiding them. |

### E. Governance / Approval Flows

Use when: user requests access, approves changes, defines policies, or reviews compliance.
**Actian examples:** Data access requests, contract approval, quality issue resolution, stewardship tasks.

| Pattern | Exemplar | When to apply | Implementation |
|---------|----------|---------------|----------------|
| **Lightweight request + approve** | Atlan, Slack | Access requests, change approvals | Requester fills minimal form (asset + reason). Approver sees context + one-click approve/deny. No multi-step chain unless policy requires it. |
| **Task inbox with priorities** | Linear, Collibra | Stewardship dashboard | List of pending tasks sorted by priority/due date. Quick actions inline. Batch operations for similar tasks. |
| **Contract-first creation** | Atlan | Data product publishing | Define contract (quality thresholds, access rules, SLA) before or alongside the product. Visual contract builder or YAML editor. |
| **Automated violation detection** | Actian platform | Quality monitoring, policy enforcement | Dashboard showing: passing/failing contracts, trend over time, top violators. Click to see specific violations and remediation steps. |
| **Audit trail timeline** | GitHub, Figma | Any governed asset | Chronological list of changes: who, when, what changed. Diff view for before/after. Filter by change type. |
| **Self-service with guardrails** | Stripe, Notion | Any user-facing action | Users act freely within their permission scope. Destructive/high-impact actions require confirmation dialog with impact summary. |

### F. AI Surfaces (Studio / Explorer)

Actian-defined: the AI surface is the **Chat with AI Steward** panel. Full guidance:
`vendor/components/dist/guidelines/chat-with-ai-steward.json` (domains.usage/design/content)
+ the AI a11y checklist (`vendor/accessibility/src/components.md`, "AI Output & Suggestions").

| Pattern | Actian definition |
|---|---|
| Surface elevation | Panel on `--zen-shadow-xl`, never flush with static content (foundations elevation scale: depth not decoration) |
| Identification | `ai` sparkle icon + "Generated by AI" label — never color alone |
| Citation | `Source: <asset>` line on every insight; uncited = labeled "verify before use" |
| Confidence | Badge: High / Medium / Low; percentage in tooltip only |
| Streaming | Skeleton shimmer (2000ms, untokenized — flagged), `aria-busy` → `aria-live="polite"`, honors `prefers-reduced-motion` |

Scope: Studio + Explorer only — Administration has no AI surface. Vocabulary: "Ask AI",
"Suggestion" (per app-context) — never "chatbot"/"assistant".
