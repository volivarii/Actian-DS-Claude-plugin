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
  m["input-date"] = "date-input";
  m["metamodel-widget"] = "metamodel";
  m["sticky-footer"] = "action-bar";
  m["tag-default"] = "tag-read-only";
  m["view-details"] = "view-detail";
  exports.RETIRED_SLUGS = m;
})(
  typeof module !== "undefined"
    ? module.exports
    : (window.dsRetiredSlugs = window.dsRetiredSlugs || {}),
);
