# Actian Product Context

Reference for all skills that generate flows, components, or presentations involving Actian Data Intelligence Platform features.

## Three Applications

| App | Purpose | Primary users | Font/Layer |
|-----|---------|---------------|------------|
| **Studio** | Data governance, catalog management, stewardship, lineage, glossary admin, metadata enrichment | Data stewards, data engineers, data architects, domain experts | Roboto / DS2026 |
| **Explorer** | Data marketplace, discovery, consumption, business glossary browsing, data product access | Business users, analysts, data consumers | Roboto / DS2026 |
| **Administration** | User management, connections, catalog configuration, system settings | Admins, IT ops | Roboto / DS2026 |

### App context inference

| Signal in prompt | App |
|------------------|-----|
| "steward", "govern", "curate", "lineage", "glossary admin", "metadata", "enrich", "template", "ontology", "knowledge graph", "catalog management" | **Studio** |
| "browse", "discover", "search", "marketplace", "consume", "request access", "data product", "business glossary", "explore" | **Explorer** |
| "users", "permissions", "connections", "connectors", "settings", "configuration", "system", "LDAP", "SSO", "roles" | **Administration** |
| "admin" (ambiguous) | Ask: "Administration app (users, connections, settings) or Studio (governance, catalog)?" |
| No signal / "user" (generic) | **Studio** (default) |

### App-specific chrome

Each app has distinct navigation, layout, and branding:

**Studio** (blue top bar, "Zeenea" wordmark):
- **Left sidebar**: Dashboard, Catalog, Topics, Import, + New Item, Access requests, Catalog design, Analytics. Collapsible.
- **Top bar**: catalog selector dropdown, global search, notifications, grid menu, user avatar.
- **Catalog list**: rich result rows — color-coded type badges (teal for Dataset, blue for Data Product, orange for Data Process, etc.), completion progress bars, status tags (Shared, Approved), suggestion counts. Sort by name/date. Bulk actions (Edit, Move to catalog, Delete, Export selection). Left filter panel with facets (completion level, item type, user suggestions, item lifecycle event, curator, contact, data product, access request policy).
- **Detail page**: 8 horizontal tabs (General, Fields, Sample Data, Data Quality, Lineage, View 360, Data Model, Activity). Right property panel with completion level ring, quality status, and tabs (Properties, People, Suggestions). Top breadcrumb with type badge + status tags. "Actions" dropdown top-right.
- **Right sliding drawer (quick edit)**: opens from a list row or field click — shows field-level details (description, properties, profile, suggestions) without leaving the parent view. Used on Fields tab to inspect/edit individual columns.
- **Import wizard**: 6-step horizontal stepper (Connection → Items → Curator → Contact → Data Product → Confirm). Connection step shows provider logos in a selectable grid.
- **New Item**: type picker grid with tabs (All Types, Glossary Types, Physical & Logical Types). Color-coded icons per type.
- **Topics**: table listing curated collections with name, filters, actions. Edit modal with description, icon picker (color-coded), selected filters.
- **Analytics**: completion-by-type card grid (each with progress bar), adoption rate charts (Explorers vs Stewards toggle), popular items list, frequent searches list, custom analysis section.

**Explorer** (green/teal top bar, "Zeenea" wordmark):
- **Top bar**: green branded header with "All items" dropdown, global search, Access Requests link, What's new, notifications, grid menu, user avatar.
- **Homepage** (search-first): prominent search bar, then sections — Marketplace (recently shared horizontal card carousel), Catalog Filters (chip pills: Default, Demo, Finance, IT, Product, etc.), Topics (card grid with colored icons + "AI Ready" badges), Catalog item types (type description cards), Glossary item types.
- **Catalog list**: left faceted filter panel (item type with color checkboxes, data quality checks, data source, connection, contact, glossary). Result rows with type badges, description preview, metadata chips.
- **Context menu on hover**: shows "Favorite Topics" overlay + tabbed quick preview (Output ports, Properties, Contents, Suggestions) in a popover/inline panel.
- **Right sliding drawer (quick view)**: opens from clicking a result row — shows asset description, featured properties, glossary terms, output ports, and a fields table. Expanding the drawer reveals full field details with descriptions. "Request Access" and quality indicators at the top.
- **Detail page (Data Product)**: breadcrumb, left sidebar (Details, Featured properties, Glossary, Contacts, Attachments), main content with description + properties. Actions: Submit a suggestion, Open in Studio.
- **Detail page (Dataset)**: tabs (Details, Fields, Data model, Lineage, Data quality, View 360, Discussions, Suggestions). Left sidebar with featured properties, glossary, contacts. Data model relations section. User avatars row for contacts.

**Administration** (neutral header, "Administration Dev" label):
- **Left sidebar**: Users and contacts, Catalogs, Groups, Connections, API keys, Policies, Maintenance mode.
- **Users page**: tab bar (Users / Contacts). Search + filter. Table with columns: Name, Email, Profiles, Role (Super Admin, etc.), Last count, Actions (edit icon). "+ Create user" button top-right.
- **General pattern**: settings-style layout — sidebar category navigation, table-based content area, form modals for create/edit.

### Shared cross-app patterns

- **DS2026 and FM Kit components are cross-platform** — the same component library is used across all 3 apps. Components are not app-specific.
- **Right sliding drawer** — used in both Studio (quick edit) and Explorer (quick view). Same component, different mode: Studio allows inline editing, Explorer is read-only with "Request Access" and "Open in Studio" actions.
- **Color-coded type badges** — consistent type identification across apps. Each catalog item type has a distinct color + icon (teal for Dataset, blue for Data Product, orange for Data Process, green for Visualization, etc.).
- **Completion progress bars** — visual completion level on catalog items, shown in both list rows and detail pages.
- **Status tags** — pill badges: Shared, Approved, Pending, Draft. Same visual treatment across apps.
- **Suggestions** — AI-powered suggestions appear as counts in list rows and as dedicated tabs/panels in detail views. "N suggestions are pending" inline alerts.

## Core Entity Model

These are the interconnected concepts that appear across all three apps. Flows and components should use the correct entity names and relationships.

| Entity | Description | Appears in |
|--------|-------------|------------|
| **Catalog Object** | Any data asset (table, column, dataset, report, dashboard) indexed in the catalog | Studio, Explorer |
| **Domain** | Organizational/business unit owning a set of data assets | Studio, Explorer |
| **Data Product** | Curated, business-ready asset published by a domain into the marketplace | Studio, Explorer |
| **Data Contract** | Formal agreement defining quality thresholds, access permissions, validation rules for a data product | Studio |
| **Glossary Term** | Business vocabulary entry linked to technical assets | Studio, Explorer |
| **Custom Asset** | User-defined asset type extending the catalog model | Studio |
| **Lineage** | Field-level transformation tracking from source to downstream | Studio, Explorer (read-only) |
| **Governance Policy** | Access rules, quality rules, compliance constraints | Studio, Administration |
| **Connection** | Configuration for a data source connector (75+ pre-built: Snowflake, Azure, AWS, Tableau, Power BI, SQL Server, Oracle, SAP, MongoDB, Databricks, etc.) | Administration |
| **User / Group** | Identity and role assignments | Administration |
| **Observability Signal** | Quality score, freshness, usage stats attached to assets | Studio, Explorer |

### Entity relationships

```
Domain
  +-- Data Product (published to marketplace)
  |     +-- Data Contract (quality, access, validation)
  +-- Catalog Objects (tables, columns, datasets)
        +-- Metadata (technical + business)
        +-- Lineage (field-level transformations)
        +-- Glossary Terms (linked business vocabulary)
        +-- Observability Signals (quality, freshness, usage)
        +-- Governance Policies (access, compliance)

Connection --> Catalog Objects (via automated discovery/scanning)
User/Group --> Governance Policies (via role-based access)
```

## Established UI Patterns

Patterns already in use across the Actian platform. Flows should be consistent with these when working within existing feature areas.

### Interactive graph visualization
Used for lineage (interactive DAG with zoom controls, field-level connections between nodes), View 360 (radial knowledge graph with the current asset at center, related entities orbiting by type), and Data Model (ER diagram with field-level relationships and connection lines). Nodes are clickable, revealing detail in a side panel or navigating to the detail page.

### Drag-and-drop template builder
Studio feature for creating documentation templates (Catalog Design page). Left panel lists item types with counts. Right panel shows an interactive diagram of the catalog schema. Tabs: Physical & Logical Metamodel, Glossary, Properties, Responsibilities.

### Marketplace browsing
Explorer homepage is search-first with curated sections below: recently shared data products (horizontal card carousel), catalog filter chips, topic cards (colored icons), item type cards, glossary type cards. Each section has a "Browse" or "Browse all" link.

### 360-degree asset detail view
Every catalog object has a tabbed detail page. Studio: 8 tabs (General, Fields, Sample Data, Data Quality, Lineage, View 360, Data Model, Activity) with a right property panel. Explorer: similar tabs (Details, Fields, Data model, Lineage, Data quality, View 360, Discussions, Suggestions) with a left sidebar.

### Right sliding drawer
Shared pattern across Studio and Explorer. Opens from clicking a list row or field. Studio mode: quick edit with editable fields (description, properties, profile, suggestions). Explorer mode: quick view with read-only preview, "Request Access" button, quality indicators. Always shows: entity name, type badge, breadcrumb, and tabs for structured content.

### Smart suggestions
AI-powered metadata enrichment: suggestion counts shown inline on catalog list rows ("N suggestions are pending" yellow alert bar). Detail pages have a Suggestions tab. Suggestions include: similarity analysis, anomaly detection, personal/sensitive data marking, auto-documentation.

### Multi-step import wizard
Studio Import flow: 6-step horizontal stepper (Connection → Items → Curator → Contact → Data Product → Confirm). Connection step shows a grid of provider logos (BigQuery, Snowflake, Oracle, etc.) as selectable tiles. Progress is tracked with numbered circles and connecting lines.

### Type picker grid
Used for New Item creation and File Import. Grid of type tiles organized by tabs (All Types, Glossary Types, Physical & Logical Types). Each tile has a color-coded icon + label. File Import adds a right panel for drag-and-drop upload with format instructions.

### Analytics dashboard
Studio Analytics: card grid showing completion percentage per item type (each card has a progress bar), adoption rate section (donut chart for Explorers vs Stewards with toggle, line chart for adoption evolution), popular items list with type icons, frequent searches list.

### Activity timeline
Studio detail page Activity tab: chronological timeline with date headers, user avatars, and action descriptions ("updated the property", "linked the glossary term type", "removed"). Entries grouped by month.

### Access request management
Studio Access Requests page: simple table with Requester, Item, Created at, Last updated, Status (Pending), Actions (Approve button). Status tabs: Pending / Done.

### Federated knowledge graph
The underlying architecture connecting all metadata. Domain-specific ontologies maintain local autonomy while connecting to an enterprise semantic layer.

## Creative Latitude

This reference documents what exists today — it is context, not a constraint. When generating new flows, components, or presentations:

- **Use established patterns as a foundation**, not a ceiling. A new feature can introduce a pattern that doesn't exist yet if it better serves the user.
- **Combine patterns creatively.** A governance workflow might borrow the lightweight approval pattern from Atlan and combine it with the existing right drawer for inline review.
- **Challenge the status quo.** If a current pattern is suboptimal (e.g., a multi-step wizard could be replaced by a progressive form), propose the improvement.
- **Draw from `ux-patterns.md` freely.** The SaaS patterns are there to inspire, not just to validate existing choices. A data lineage view could adopt Notion's multi-view pattern (DAG, table, timeline) even though the current product only has DAG.
- **Stay grounded in the entity model and terminology.** Creativity applies to interaction design and UX patterns — but the entities (Data Product, Contract, Glossary Term, etc.) and terms should remain consistent.

The goal is to generate flows and components that feel native to the platform while pushing the experience forward.

## Terminology

Use these exact terms in generated content (flows, briefs, presentations):

| Term | Meaning | Do NOT use |
|------|---------|-----------|
| Data Intelligence Platform | The overall product | "the tool", "the app" |
| Studio | Governance/catalog app | "admin panel", "backend" |
| Explorer | Consumer/marketplace app | "frontend", "user portal" |
| Administration | Config/settings app | "admin app" (ambiguous) |
| Catalog object | Any indexed data asset | "item", "record", "entry" |
| Data product | Curated published asset | "dataset" (too generic) |
| Data contract | Quality/access agreement | "SLA", "policy" (different concepts) |
| Governance-by-design | Policies embedded at creation | "governance overlay" |
| Contract-first | Define expectations before building | "quality-first" |
| Shift-left | Catch issues at source | "early detection" |
| Field-level lineage | Column-level transformation tracking | "table lineage" (less granular) |
| Impact analysis | Understanding downstream effects of changes | "dependency check" |
| Federated knowledge graph | Enterprise metadata architecture | "metadata store" |
| Topic | Curated, filtered collection of catalog items for Explorer | "folder", "category" |
| Connection | Configured data source connector | "integration", "data source" (use for the abstract concept) |
| Completion level | Percentage of metadata filled for an item | "progress", "completeness" |
| Suggestion | AI-generated metadata enrichment proposal | "recommendation" |
| Curator | Person responsible for curating a catalog item | "owner" (different role) |
| Output port | Published endpoint/view of a data product | "API", "export" |
| View 360 | Radial knowledge graph centered on an asset | "relationship view" |
