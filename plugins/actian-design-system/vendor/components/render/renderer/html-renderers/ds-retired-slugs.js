// AUTO-GENERATED - DO NOT EDIT.
// Source: components/dist/identity.json
// Regenerate: node scripts/render/derive-retired-slugs.js
//
// Retired slug -> the slug that component answers to now, read from the
// identity ledger. ds-html-map.js resolves through this at its single entry
// point, so content authored against a retired name still renders.
//
// A slug is absent here when the ledger cannot say unambiguously what it
// became: two identities claiming one retired name are dropped rather than
// guessed at (see buildRenameIndex). A component that was DELETED rather
// than renamed is also absent, and must be: it has no successor to resolve
// to, and rendering it as a chip is the honest answer.

(function (exports) {
  "use strict";
  var m = Object.create(null);
  m["account-dropdown"] = "global-header-account-dropdown";
  m["calendar-date-input"] = "calendar";
  m["collapse-accordion"] = "collapse";
  m["data-viz-legend-item"] = "data-viz-legend";
  m["date-input"] = "calendar";
  m["drawer-side-panel"] = "drawer";
  m["dropdown"] = "menu-dropdown";
  m["glossary-item-hierarchy-diagram"] = "glossary-item-hierarchy";
  m["icon"] = "new-conversation";
  m["input-date"] = "calendar";
  m["lineage-individual-node"] = "lineage";
  m["metamodel-widget"] = "metamodel";
  m["notification"] = "toast";
  m["rich-text"] = "rich-text-froala";
  m["sticky-footer"] = "action-bar";
  m["tag-default"] = "read-only-tag";
  m["tag-interactive"] = "interactive-tag";
  m["tag-item-type"] = "item-type-tag";
  m["tag-read-only"] = "read-only-tag";
  m["tooltip"] = "tooltip-default";
  m["view-details"] = "view-detail";
  exports.RETIRED_SLUGS = m;
})(
  typeof module !== "undefined"
    ? module.exports
    : (window.dsRetiredSlugs = window.dsRetiredSlugs || {}),
);
