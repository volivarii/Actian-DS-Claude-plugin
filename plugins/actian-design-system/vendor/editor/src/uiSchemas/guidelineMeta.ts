// uiSchema for guideline-meta.json. Lives ONLY in the editor — never in
// schemas/. Doctrine P3: the JSON Schema is the published contract;
// labels, ordering, help text, and widget choices belong to the consumer.
//
// React JSONSchema Form (RJSF) ui:options reference:
// https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/uiSchema

import type { UiSchema } from "@rjsf/utils";

// T1.8 Phase 1: status/owner/updatedAt are no longer author-facing.
//   - status is auto-derived by the Authoring Workspace from file presence
//     (file in cart/remote → draft) or the "Use category default" intent
//     checkbox (→ inherited). `approved` is reserved for a future review
//     action with audit, never author-self-set.
//   - owner + updatedAt will be auto-derived from git in T1.8 Phase 2.
// We keep them in the schema (deriver still reads them); we just stop
// asking the author. Hidden via RJSF ui:widget=hidden so the form values
// round-trip on submit without rendering an input.
const domainSubform: UiSchema = {
  status: { "ui:widget": "hidden" },
  owner: { "ui:widget": "hidden" },
  updatedAt: { "ui:widget": "hidden" },
};

export const guidelineMetaUiSchema: UiSchema = {
  // RJSF requires `ui:order` to either enumerate every schema property or
  // end with the `"*"` wildcard. The wildcard guarantees we don't break the
  // form when a future schema field is added without a matching uiSchema
  // update. Concrete prefix names the fields whose order is load-bearing
  // (component first, then category/section, then the meaty domains block).
  "ui:order": [
    "component",
    "category",
    "section",
    "domains",
    "related",
    "examples",
    "lastReviewed",
    "*",
  ],
  component: {
    "ui:title": "Component name",
    "ui:placeholder": "e.g. Button",
  },
  category: {
    "ui:title": "Category",
    "ui:widget": "CategorySelect",
    "ui:help":
      "Pick from the canonical category set in components/src/categories/.",
  },
  domains: {
    "ui:title": "Domain status matrix",
    "ui:help":
      "Status, owner, and last-updated are managed by the Authoring Workspace and git — not edited here. Use the workspace to write or mark a domain as inherited.",
    content: domainSubform,
    usage: domainSubform,
    design: domainSubform,
    behavior: domainSubform,
    tokens: domainSubform,
  },
  related: {
    "ui:title": "Related components",
    "ui:widget": "RelatedMultiSelect",
    "ui:help":
      "Search the DS Kit registry + authored components to cross-reference.",
  },
  examples: {
    "ui:title": "Examples",
    items: {
      label: { "ui:placeholder": "e.g. Primary button" },
      figmaNode: { "ui:placeholder": "e.g. 302:5142" },
      url: { "ui:placeholder": "https://…" },
    },
  },
  lastReviewed: {
    "ui:title": "Last reviewed (YYYY-MM-DD)",
    "ui:placeholder": "2026-05-23",
  },
};
