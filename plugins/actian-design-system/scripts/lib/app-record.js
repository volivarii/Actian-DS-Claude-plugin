"use strict";
// The app record (contract: project_simplify_contract_2026_09_29): each app's
// chrome as the knowledge writes it in app-context/src/apps/<app>.md. Read from
// the vendored app-context dist; never summarised: every field the record has
// is passed on. An old snapshot carries only label and id, which reads as one
// group with nothing at the bottom.
var fs = require("fs");
var PATHS = require("./paths.js");

// A missing snapshot is no record (prepare-flow then refuses the app; check-direct
// has no rail to compare). A corrupt one is an error: skipping it would let
// check-direct pass a rail it never compared.
function readApp(slug, file) {
  var f = file || PATHS.appContext;
  if (!fs.existsSync(f)) return null;
  var ctx;
  try {
    ctx = JSON.parse(fs.readFileSync(f, "utf8"));
  } catch (e) {
    throw new Error("app-record: " + f + " (the app-context snapshot) is not valid JSON: " + e.message);
  }
  return recordOf(ctx, slug);
}

// One app's record from a parsed app context, or null. Own names only:
// "constructor" or "__proto__" is not an app.
function recordOf(ctx, slug) {
  var key = String(slug || "").toLowerCase();
  var a = ctx && ctx.apps && Object.prototype.hasOwnProperty.call(ctx.apps, key) ? ctx.apps[key] : null;
  if (!a || typeof a !== "object") return null;
  return {
    header: a.header && typeof a.header === "object" ? a.header : {},
    sidebar: Array.isArray(a.sidebar) ? a.sidebar : [],
  };
}

// Children are drawn only while the parent or one of them is active (contract
// amendment approved 2026-09-29: Import is drawn closed otherwise).
function item(s, activeId) {
  var o = { label: s.label, id: s.id };
  ["icon", "kind"].forEach(function (k) {
    if (s[k] != null) o[k] = s[k];
  });
  var kids = Array.isArray(s.children) ? s.children : [];
  var open =
    activeId != null &&
    (s.id === activeId ||
      kids.some(function (c) {
        return c.id === activeId;
      }));
  if (kids.length && open)
    o.children = kids.map(function (c) {
      return { label: c.label, id: c.id };
    });
  return o;
}

// The rail as groups, in record order: a new group where `group` changes, and
// every `position: bottom` item in one last block, in order.
function railGroups(sidebar, activeId) {
  var top = [],
    bottom = [];
  (sidebar || []).forEach(function (s) {
    (s.position === "bottom" ? bottom : top).push(s);
  });
  var groups = [];
  top.forEach(function (s) {
    var last = groups[groups.length - 1];
    if (!last || last.key !== (s.group || "")) groups.push({ key: s.group || "", items: [] });
    groups[groups.length - 1].items.push(item(s, activeId));
  });
  var out = groups.map(function (g) {
    return { items: g.items, bottom: false };
  });
  if (bottom.length)
    out.push({
      items: bottom.map(function (s) {
        return item(s, activeId);
      }),
      bottom: true,
    });
  return out;
}

// The global header's props for the fields the record has (the knowledge
// renderer's names: Context, ContextValue, SearchScope, SearchPlaceholder).
function headerProps(h) {
  var p = {};
  if (h && h.context) {
    if (h.context.label != null) p.Context = h.context.label;
    if (h.context.value != null) p.ContextValue = h.context.value;
  }
  if (h && h.search) {
    if (h.search.scope != null) p.SearchScope = h.search.scope;
    if (h.search.placeholder != null) p.SearchPlaceholder = h.search.placeholder;
  }
  return p;
}

module.exports = { readApp: readApp, recordOf: recordOf, railGroups: railGroups, headerProps: headerProps };
