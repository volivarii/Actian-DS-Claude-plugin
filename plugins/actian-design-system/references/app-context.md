# Actian Product Context

Reference for all skills that generate flows, components, or presentations involving Actian Data Intelligence Platform features.

> **Sources:** All information in this file is derived from publicly available documentation at [docs.actian.com/zeenea](https://docs.actian.com/zeenea/) and marketing pages at [actian.com/data-intelligence](https://www.actian.com/data-intelligence/). No proprietary or confidential information is included.

## Three Applications

| App | Purpose | Primary users | Font/Layer |
|-----|---------|---------------|------------|
| **Studio** | Data governance, catalog management, stewardship, lineage, glossary admin, metadata enrichment | Data stewards, data engineers, data architects, domain experts | Roboto / DS Kit |
| **Explorer** | Data marketplace, discovery, consumption, business glossary browsing, data product access | Business users, analysts, data consumers | Roboto / DS Kit |
| **Administration** | User management, connections, catalog configuration, system settings | Admins, IT ops | Roboto / DS Kit |

### App context inference

| Signal in prompt | App |
|------------------|-----|
| "steward", "govern", "curate", "lineage", "glossary admin", "metadata", "enrich", "template", "ontology", "knowledge graph", "catalog management", "import", "topics", "watchlist", "analytics", "catalog design" | **Studio** |
| "browse", "discover", "search", "marketplace", "consume", "request access", "data product", "business glossary", "explore", "ask AI", "suggestion", "favorite" | **Explorer** |
| "users", "permissions", "connections", "connectors", "settings", "configuration", "system", "LDAP", "SSO", "roles", "groups", "scanners", "API keys", "maintenance", "catalogs" | **Administration** |
| "admin" (ambiguous) | Ask: "Administration app (users, connections, settings) or Studio (governance, catalog)?" |
| No signal / "user" (generic) | **Studio** (default) |

### App-specific chrome

Each app has distinct navigation, layout, and branding:

**Studio** (blue top bar, "Zeenea" wordmark):
- **Left sidebar**: Dashboard, Catalog, Topics, Import, + New Item, Access requests, Catalog design, Analytics. Collapsible.
- **Top bar**: catalog selector dropdown, global search, notifications (bell icon with unread counter), grid menu, user avatar.
- **Dashboard**: widget-based home page — Last searches (5 recent), Most popular items (30-day views in curator's perimeter), Watchlists (saved filter shortcuts, 5 defaults: low-completion datasets, low-completion glossary, orphan datasets, pending PII suggestions, pending user suggestions), Perimeter (item count + completion rate by type).
- **Catalog list**: 3-panel layout (left filters, center item list, right overview panel). Rich result rows — color-coded type badges (teal for Dataset, blue for Data Product, orange for Data Process, etc.), completion progress bars, status tags (Shared, Approved), suggestion counts. Sort by relevance/name/date. Bulk actions (Edit, Move to catalog, Delete, Export selection). Left filter panel with 13 facets: Completion level, Item type, Item Lifecycle Event, Contacts, Category, Access request policy, Connections, Orphan Items, Quality Status, PII, Implemented, Bot-powered suggestions, User suggestions. Search scope selector: Default, Assets, Glossary, All Items.
- **Detail page**: 8 horizontal tabs (General, Fields, Sample Data, Data Quality, Lineage, View 360, Data Model, Activity). Right property panel with completion level ring, quality status, and tabs (Properties, People, Suggestions). Top breadcrumb with type badge + status tags. "Actions" dropdown top-right. Rich text editor for descriptions (bold, italic, underline, color, lists, links, tables, images). Discussion threads on Dataset pages.
- **Right sliding drawer (quick edit)**: opens from a list row or field click — shows field-level details (description, properties, profile, suggestions) without leaving the parent view. Used on Fields tab to inspect/edit individual columns.
- **Import wizard**: 6-step horizontal stepper (Connection → Items → Curator → Contact → Data Product → Confirm). Connection step shows provider logos in a selectable grid.
- **New Item**: type picker grid with tabs (All Types, Glossary Types, Physical & Logical Types). Color-coded icons per type.
- **Topics**: table listing curated collections with name, filters, actions. Edit modal with description, icon picker (color-coded), selected filters. Created by curators in Studio, consumed in Explorer.
- **Analytics**: completion-by-type card grid (each with progress bar), adoption rate section (donut chart for Explorers vs Stewards with toggle, line chart for 12-month evolution), popular items list, frequent searches list, custom analysis widgets (select item type + segmentation property → value distribution chart).
- **Notifications**: bell icon with increment counter. 3 types: new items detected by connector, orphan items detected, import complete. Click actions redirect to relevant filtered views or import wizard. "Mark all as read" link.

**Explorer** (green/teal top bar, "Zeenea" wordmark):
- **Top bar**: green branded header with "All items" dropdown, global search, Access Requests link, What's new, notifications, grid menu, user avatar.
- **Homepage** (search-first): prominent search bar, then sections — Marketplace (recently shared horizontal card carousel), Catalog Filters (chip pills: Default, Demo, Finance, IT, Product, etc.), Topics (card carousel with colored icons + "AI Ready" badges, + "Browse all Topics" link), Catalog item types (type description cards), Glossary item types.
- **Ask AI**: natural language query search through the knowledge graph. AI-generated summary in results. Thumbs up/down feedback buttons. Topics must be "AI Ready" (auto-tagged when items have good descriptions). Semantic search powered by embeddings.
- **Topics**: carousel on homepage + dedicated table view (sortable columns). Star icon for favorites. Scope switching via search bar dropdown (Topic → All Items). Topics are curated collections created by stewards in Studio.
- **Catalog list**: left faceted filter panel (Item Type, Data Source, Quality Level, Contacts, Implemented status, custom org-specific filters). Result rows with type badges, description preview, metadata chips. Fuzzy/typo-tolerant search with advanced operators (`INFIELD:`, `AND`).
- **Context menu on hover**: shows "Favorite Topics" overlay + tabbed quick preview (Output ports, Properties, Contents, Suggestions) in a popover/inline panel.
- **Right sliding drawer (quick view)**: opens from clicking a result row — shows asset description, featured properties, glossary terms, output ports, and a fields table. Expanding the drawer reveals full field details with descriptions. "Request Access" and quality indicators at the top.
- **Detail page (Data Product)**: breadcrumb, left sidebar (Details, Featured properties, Glossary, Contacts, Attachments), main content with description + properties. Tabs on output ports: General Info, Datasets, Data Model, Data Quality, Attachments (YAML contract). Actions: Submit a suggestion, Open in Studio.
- **Detail page (Dataset)**: tabs (Details, Fields, Data model, Lineage, Data quality, View 360, Discussions, Suggestions). Left sidebar with featured properties, glossary, contacts. Data model relations section. User avatars row for contacts. Inline field search within datasets.
- **Suggestions**: "Submit a suggestion" button (top-right of detail pages). Text input (20-1000 chars). Status: Pending → Curator reviews (accept/decline with comment) → email notification. Private to submitter. Deletable.
- **Access Requests**: "Request Access" button on item details. Form: Use Case dropdown, extra fields, Reason text (optional). Statuses: Pending, Approved, Rejected, Granted, Error, Closed. Policy-driven workflow with approval/rejection + comments. Audit trail.

**Administration** (neutral header, "Administration Dev" label):
- **Left sidebar**: Users and contacts, Catalogs, Groups, Connections, Scanners, API keys, Policies, Maintenance mode.
- **Users page**: tab bar (Users / Contacts). Search + filter. Table with columns: Name, Email, Profiles, Role (Super Admin, etc.), Last count, Actions (edit icon). "+ Create user" button top-right. User creation form: Email, Groups (multi-select), First name, Last name, Phone number.
- **Groups page**: "Create a group" button. Group type selector (Explorer vs Data Steward). Global permissions checkboxes (Catalog Design, User Admin, Connectivity Admin, Analytics, Manage Catalogs). Catalog access configuration with granular write permissions by item type (Datasets, Fields, Visualizations, Data Processes, Categories, Custom Items, Glossary). Scopes: All Items, Only if Curator, Include Unassigned, By Catalog.
- **Connections page**: list of all connections with status (Valid/Error). Settings action for detail view. Actions menu for manual jobs (Run inventory, Update imported items, Run automatic import, Synchronize objects, Run data profiling, Run data sampling). Import menu for selecting items in Studio.
- **Scanners page**: scanner list with 3 states — Active (verified every 10s), Inactive (no verification for 3 days, hidden by default), Action Required. "Include Inactive Scanners" toggle. Eye icon for detail view showing connections and metadata.
- **API Keys page**: "Create API Key" button. Dialog with Name, Permission scope selector (5 levels: Read-only, Manage documentation, Admin, Scanner, Access request), Expiration date selector.
- **Catalogs page**: "Create a catalog" button. Catalog name (editable) + code (locked after creation). Default catalog cannot be deleted. Federated Catalog enables additional catalogs.
- **Maintenance Mode**: "Activate" toggle with confirmation dialog. Super Admin retains full access. All other users redirected to maintenance landing page.
- **General pattern**: top-right primary action button per section, table-based content, form modals for create/edit, confirmation dialogs before destructive actions, status indicators (Active/Inactive/Error/Action Required).

### Shared cross-app patterns

- **DS Kit and FM Kit components are cross-platform** — the same component library is used across all 3 apps. Components are not app-specific.
- **Right sliding drawer** — used in both Studio (quick edit) and Explorer (quick view). Same component, different mode: Studio allows inline editing, Explorer is read-only with "Request Access" and "Open in Studio" actions.
- **Color-coded type badges** — consistent type identification across apps. Each catalog item type has a distinct color + icon (teal for Dataset, blue for Data Product, orange for Data Process, green for Visualization, etc.).
- **Completion progress bars** — visual completion level on catalog items, shown in both list rows and detail pages.
- **Status tags** — pill badges: Shared, Approved, Pending, Draft. Same visual treatment across apps.
- **Suggestions** — AI-powered suggestions appear as counts in list rows and as dedicated tabs/panels in detail views. "N suggestions are pending" inline alerts. Two sources: bot-powered (PII detection, similarity) and user-submitted (Explorer users propose changes, curators review).
- **Discussion threads** — available on Dataset detail pages in both Studio and Explorer. Persistent, visible to all users.
- **Graph visualizations** — three types across apps: Lineage (DAG with expandable nodes, field-level paths), View 360 (radial knowledge graph), Data Model (ER diagram). All have zoom controls, export-to-PNG, click-to-navigate.
- **Notification bell** — unread counter, click-to-action (redirects to filtered views or import wizard).
- **Top-right primary action** — consistent pattern: "+ Create user", "Create a group", "Create API Key", "Submit a suggestion", "Request Access". Always top-right of the content area.

## Core Entity Model

These are the interconnected concepts that appear across all three apps. Flows and components should use the correct entity names and relationships.

| Entity | Description | Appears in |
|--------|-------------|------------|
| **Catalog Object** | Any indexed item. Types: Dataset, Field, Visualization, Data Process, Data Product, Glossary Item, Custom Item, Category | Studio, Explorer |
| **Domain** | Organizational/business unit owning a set of data assets | Studio, Explorer |
| **Data Product** | A catalog item type representing a curated, business-ready asset. Contains Input Ports (upstream data interfaces) and Output Ports (consumer-facing interfaces). Published to the marketplace. Managed via YAML descriptors (ODPS/ODCS standards) or REST API/CI-CD. | Studio, Explorer |
| **Data Contract** | Formal agreement on an Output Port defining quality thresholds, access permissions, validation rules. Attached as YAML. | Studio |
| **Glossary Term** | Business vocabulary entry linked to technical assets | Studio, Explorer |
| **Custom Asset** | User-defined asset type extending the catalog model | Studio |
| **Lineage** | Field-level transformation tracking from source to downstream | Studio, Explorer (read-only) |
| **Governance Policy** | Access rules, quality rules, compliance constraints | Studio, Administration |
| **Scanner** | External data ingestion agent that discovers and imports metadata from connections | Administration |
| **Connection** | Configuration for a data source connector (93+ pre-built: Snowflake, Azure, AWS, Tableau, Power BI, SQL Server, Oracle, SAP, MongoDB, Databricks, etc.) | Administration |
| **User / Group** | Identity and role assignments. Groups: Explorer (read-only), Data Steward (edit), Super Admin | Administration |
| **API Key** | Machine-to-machine auth with 5 scopes (Read-only, Manage documentation, Admin, Scanner, Access request) | Administration |
| **Observability Signal** | Quality score, freshness, usage stats attached to assets | Studio, Explorer |
| **Access Request** | Consumer request for data product/item access with policy-driven approval workflow | Studio, Explorer |
| **Watchlist** | Saved filter shortcut on Studio Dashboard (curator-scoped) | Studio |
| **Discussion Thread** | Conversation thread on Dataset detail pages | Studio, Explorer |

### Entity relationships

```
Domain
  +-- Catalog Objects (datasets, fields, visualizations, data processes, data products, glossary items, custom items)
        +-- Metadata (technical + business, Standard/Important properties)
        +-- Lineage (field-level transformations via Data Processes)
        +-- Glossary Terms (linked business vocabulary, hierarchy up to 5 levels)
        +-- Observability Signals (quality, freshness, usage, data profiling, data sampling)
        +-- Governance Policies (access, compliance)
        +-- Discussion Threads (conversations on detail pages)
        +-- Suggestions (user-submitted or bot-powered enrichment proposals)
        +-- Completion Level (calculated from: description, contacts, glossary links, properties)

Data Product (a catalog item type, published to marketplace)
  +-- Input Ports (upstream data interfaces)
  +-- Output Ports (consumer-facing interfaces)
  |     +-- Data Contract (YAML: quality thresholds, access rules, validation)
  |     +-- Access Requests (consumer requests with approval workflow)
  +-- Datasets (linked data assets)

Scanner --> Connection (agent discovers metadata via connector plugins)
Connection --> Catalog Objects (via automated discovery/scanning)
User/Group --> Governance Policies (via role-based access)
Curator --> Catalog Objects (responsible for documentation, assigned per item)
Topic --> Catalog Objects (curated filtered collection for Explorer browsing)
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

### Notification system
Bell icon with unread counter. Three notification types: new items detected by connector, orphan items detected, import complete. Click redirects to filtered views or import wizard. "Mark all as read" link.

### Discussion threads
Available on Dataset detail pages in both Studio and Explorer. Users create threads, reply, and edit own messages. Persistent over time, visible to all Studio and Explorer users.

### Ask AI (Explorer)
Natural language query search through the knowledge graph. AI-generated summary in results. Thumbs up/down feedback. Topics must be "AI Ready" (auto-tagged when items have good descriptions). Semantic search powered by embeddings.

### Suggestion workflow
Explorer users submit suggestions (20-1000 chars) on any item. Pending status → Curator reviews (accept/decline with comment) → email notification. Private to submitter until accepted. Bot-powered suggestions also appear for PII detection, similarity analysis.

### Access request workflow
"Request Access" button on item/output port details. Form with Use Case dropdown, optional reason text. 6 statuses: Pending, Approved, Rejected, Granted, Error, Closed. Policy-driven approval with comments. Webhook/email triggers for external systems.

### Data profiling and sampling
Data Profiling: statistical graphs on fields (impacts billing). Data Sampling: sample data preview rows. Both toggled per connection as feature flags.

### Federated Catalog
Multi-catalog federation. Additional catalogs created from Administration. Scoped permissions per catalog. Search across federated sources. Default catalog cannot be deleted.

### Federated knowledge graph
The underlying architecture connecting all metadata. Domain-specific ontologies maintain local autonomy while connecting to an enterprise semantic layer.

### Actian MCP Server
7 tools for AI integrations: Find Glossary Definition, Get Glossary Implementations, Get Dataset Data Model, Semantic Search Glossary, Get Metamodel Item Types (Beta), Get Metamodel Properties (Beta), Search Items (Beta). Integrates with Claude, Cursor, Windsurf, Microsoft Copilot Studio. API Key auth, per-tenant managed server.

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
| Watchlist | Saved filter shortcut on Studio Dashboard | "saved search" |
| Perimeter | Scope of a curator's item responsibility | "scope" (too generic) |
| Scanner | External data ingestion agent | "crawler", "harvester" |
| Metamodel | System structure/template configuration (Catalog Design) | "schema", "model" |
| PII | Personally Identifiable Information flag on fields | "sensitive data" (less specific) |
| Ask AI | Natural language query feature in Explorer | "AI search", "chatbot" |
| AI Ready | Auto-tag on Topics with well-documented items | "indexed", "searchable" |
| Data Profiling | Statistical profile of field values | "data analysis" |
| Data Sampling | Sample data rows from a dataset | "data preview" |
| Input Port | Interface for receiving upstream data into a data product | "input", "source" |
| Federated Catalog | Multi-catalog architecture with scoped permissions | "multi-tenant" |
| Discussion Thread | Conversation on a Dataset detail page | "comment", "note" |
| Access Request Policy | Rules governing the approval workflow for data access | "access control" |
