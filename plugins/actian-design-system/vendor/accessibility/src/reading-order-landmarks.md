## 7. Reading Order & Landmarks {#reading-order-landmarks}

- Visual order must match DOM order — don't use CSS to reorder content in ways that differ from the source order.
- Annotate landmark regions in specs: header, nav, main, footer. Screen readers use these to navigate the page.
- Multiple navigation blocks on a page have unique labels (`aria-label="Main"` vs `aria-label="Breadcrumb"`).
- Headings must follow a logical hierarchy (h1 → h2 → h3) — never skip levels for visual styling reasons.
