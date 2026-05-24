// uiSchema for guideline-meta.json. Lives ONLY in the editor — never in
// schemas/. Doctrine P3: the JSON Schema is the published contract;
// labels, ordering, help text, and widget choices belong to the consumer.
//
// React JSONSchema Form (RJSF) ui:options reference:
// https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/uiSchema

import type { UiSchema } from "@rjsf/utils";

const domainSubform: UiSchema = {
  status: { "ui:widget": "select" },
  owner: { "ui:placeholder": "e.g. content-team" },
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
    "ui:widget": "select",
    "ui:help": "Picks the section the component lives under in the docs.",
  },
  domains: {
    "ui:title": "Domain status matrix",
    "ui:help":
      "One row per guideline domain. Status drives docs visibility; owner is the responsible team.",
    content: domainSubform,
    usage: domainSubform,
    design: domainSubform,
    behavior: domainSubform,
    tokens: domainSubform,
  },
  related: {
    "ui:title": "Related components",
    "ui:options": { addable: true, orderable: true, removable: true },
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
