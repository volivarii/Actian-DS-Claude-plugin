"use strict";

// Classifies a sync diff as additive / breaking / unchanged, and emits a
// human-readable Markdown changelog grouped by category.
//
// Used by sync-from-figma.js (Sprint 1) and the GitHub Action workflow:
// additive PRs auto-merge after CI green; breaking PRs require manual review.
//
// Surface:
//   classify({ before, after, fileKind: "registry" | "styles" })
//   → { category: "additive" | "breaking" | "unchanged",
//       changelog: "<markdown>",
//       reasons: ["short reason", …]   // breaking only; empty for additive }

function isRegistryUnchanged(beforeReg, afterReg) {
  // Compare components ignoring lastSynced.
  var bC = beforeReg.components || {};
  var aC = afterReg.components || {};
  var bSlugs = Object.keys(bC).sort();
  var aSlugs = Object.keys(aC).sort();
  if (bSlugs.length !== aSlugs.length) return false;
  if (bSlugs.join("|") !== aSlugs.join("|")) return false;
  for (var i = 0; i < bSlugs.length; i++) {
    var slug = bSlugs[i];
    if (!shallowEqualEntry(bC[slug], aC[slug])) return false;
  }
  return true;
}

function shallowEqualEntry(b, a) {
  if (!b || !a) return b === a;
  // Skip lastSynced; everything else must match
  var keys = [
    "name",
    "key",
    "nodeId",
    "importMethod",
    "description",
    "page",
    "guidelinesFile",
  ];
  for (var i = 0; i < keys.length; i++) {
    if (b[keys[i]] !== a[keys[i]]) return false;
  }
  if (JSON.stringify(b.properties || {}) !== JSON.stringify(a.properties || {}))
    return false;
  if (JSON.stringify(b.variants || {}) !== JSON.stringify(a.variants || {}))
    return false;
  if (
    JSON.stringify(b.nestedComponents || []) !==
    JSON.stringify(a.nestedComponents || [])
  )
    return false;
  return true;
}

function diffRegistry(before, after) {
  var bC = before.components || {};
  var aC = after.components || {};
  var bSlugs = Object.keys(bC);
  var aSlugs = Object.keys(aC);

  // Map by key (stable across renames); fall back to slug.
  var bKeyMap = {};
  bSlugs.forEach(function (slug) {
    var e = bC[slug];
    if (e.key) bKeyMap[e.key] = { slug: slug, entry: e };
  });
  var aKeyMap = {};
  aSlugs.forEach(function (slug) {
    var e = aC[slug];
    if (e.key) aKeyMap[e.key] = { slug: slug, entry: e };
  });

  var added = []; // {slug, entry}
  var removed = []; // {slug, entry}
  var renamed = []; // {fromSlug, toSlug, entry}
  var modified = []; // {slug, before, after, breakingReasons: []}

  // Walk old keys → renamed/removed/modified
  Object.keys(bKeyMap).forEach(function (key) {
    if (!aKeyMap[key]) {
      removed.push({ slug: bKeyMap[key].slug, entry: bKeyMap[key].entry });
      return;
    }
    var b = bKeyMap[key].entry;
    var a = aKeyMap[key].entry;
    var fromSlug = bKeyMap[key].slug;
    var toSlug = aKeyMap[key].slug;
    if (fromSlug !== toSlug || b.name !== a.name) {
      renamed.push({
        fromSlug: fromSlug,
        toSlug: toSlug,
        fromName: b.name,
        toName: a.name,
        entry: a,
      });
    }
    var reasons = entryBreakingReasons(b, a);
    if (reasons.length > 0 || !shallowEqualEntry(b, a)) {
      modified.push({
        slug: toSlug,
        before: b,
        after: a,
        breakingReasons: reasons,
      });
    }
  });

  // Walk new keys → added (when no matching old key)
  Object.keys(aKeyMap).forEach(function (key) {
    if (!bKeyMap[key]) {
      added.push({ slug: aKeyMap[key].slug, entry: aKeyMap[key].entry });
    }
  });

  // Entries without a key in either side: fall back to slug
  bSlugs.forEach(function (slug) {
    if (bC[slug].key) return;
    if (!(slug in aC)) removed.push({ slug: slug, entry: bC[slug] });
  });
  aSlugs.forEach(function (slug) {
    if (aC[slug].key) return;
    if (!(slug in bC)) added.push({ slug: slug, entry: aC[slug] });
  });

  return {
    added: added,
    removed: removed,
    renamed: renamed,
    modified: modified,
  };
}

function entryBreakingReasons(b, a) {
  var reasons = [];

  // Variant axes
  var bVar = b.variants || {};
  var aVar = a.variants || {};
  Object.keys(bVar).forEach(function (axis) {
    if (!(axis in aVar)) {
      reasons.push(
        "removed variant axis '" + axis + "' on " + (a.name || b.name),
      );
      return;
    }
    var bVals = bVar[axis] || [];
    var aVals = aVar[axis] || [];
    bVals.forEach(function (v) {
      if (aVals.indexOf(v) === -1) {
        reasons.push(
          "removed variant value '" +
            axis +
            "=" +
            v +
            "' on " +
            (a.name || b.name),
        );
      }
    });
  });

  // Properties
  var bP = b.properties || {};
  var aP = a.properties || {};
  Object.keys(bP).forEach(function (key) {
    if (!(key in aP)) {
      reasons.push("removed property '" + key + "' on " + (a.name || b.name));
      return;
    }
    if (bP[key].type !== aP[key].type) {
      reasons.push(
        "property type change '" +
          key +
          "' " +
          bP[key].type +
          " → " +
          aP[key].type +
          " on " +
          (a.name || b.name),
      );
    }
    if (bP[key].default !== aP[key].default && bP[key].type === aP[key].type) {
      reasons.push(
        "property default change '" +
          key +
          "' " +
          JSON.stringify(bP[key].default) +
          " → " +
          JSON.stringify(aP[key].default) +
          " on " +
          (a.name || b.name),
      );
    }
  });

  return reasons;
}

// Returns human-readable additive notes for a modified entry — new variant
// axes/values, new properties. Used to flesh out the changelog beyond just
// breaking reasons.
function entryAdditiveNotes(b, a) {
  var notes = [];

  var bVar = b.variants || {};
  var aVar = a.variants || {};
  Object.keys(aVar).forEach(function (axis) {
    if (!(axis in bVar)) {
      notes.push(
        "added variant axis '" +
          axis +
          "' = [" +
          (aVar[axis] || []).join(", ") +
          "]",
      );
      return;
    }
    var bVals = bVar[axis] || [];
    var aVals = aVar[axis] || [];
    aVals.forEach(function (v) {
      if (bVals.indexOf(v) === -1) {
        notes.push("added variant value '" + axis + "=" + v + "'");
      }
    });
  });

  var bP = b.properties || {};
  var aP = a.properties || {};
  Object.keys(aP).forEach(function (key) {
    if (!(key in bP)) {
      notes.push("added property '" + key + "' (" + aP[key].type + ")");
    }
  });

  return notes;
}

function buildRegistryChangelog(diff) {
  var lines = [];
  if (diff.added.length > 0) {
    lines.push("## Added (" + diff.added.length + ")");
    diff.added.forEach(function (e) {
      lines.push(
        "- " +
          e.entry.name +
          " (`" +
          e.slug +
          "`, importMethod=" +
          e.entry.importMethod +
          ")",
      );
    });
    lines.push("");
  }
  if (diff.renamed.length > 0) {
    lines.push("## Renamed (" + diff.renamed.length + ")");
    diff.renamed.forEach(function (e) {
      lines.push(
        "- " +
          e.fromName +
          " → " +
          e.toName +
          " (slug `" +
          e.fromSlug +
          "` → `" +
          e.toSlug +
          "`)",
      );
    });
    lines.push("");
  }
  if (diff.removed.length > 0) {
    lines.push("## Removed (" + diff.removed.length + ")");
    diff.removed.forEach(function (e) {
      lines.push("- " + e.entry.name + " (`" + e.slug + "`)");
    });
    lines.push("");
  }
  if (diff.modified.length > 0) {
    lines.push("## Modified (" + diff.modified.length + ")");
    diff.modified.forEach(function (e) {
      lines.push(
        "- " + (e.after.name || e.before.name) + " (`" + e.slug + "`)",
      );
      e.breakingReasons.forEach(function (r) {
        lines.push("  - ⚠ " + r);
      });
      var additive = entryAdditiveNotes(e.before, e.after);
      additive.forEach(function (n) {
        lines.push("  - + " + n);
      });
    });
    lines.push("");
  }
  return lines.join("\n");
}

function classifyRegistry(before, after) {
  if (isRegistryUnchanged(before, after)) {
    return {
      category: "unchanged",
      changelog: "_No registry changes._",
      reasons: [],
    };
  }
  var diff = diffRegistry(before, after);
  var reasons = [];
  diff.removed.forEach(function (e) {
    reasons.push("removed component '" + (e.entry.name || e.slug) + "'");
  });
  diff.renamed.forEach(function (e) {
    reasons.push("renamed component '" + e.fromName + "' → '" + e.toName + "'");
  });
  diff.modified.forEach(function (e) {
    reasons.push.apply(reasons, e.breakingReasons);
  });
  var category = reasons.length > 0 ? "breaking" : "additive";
  var changelog = buildRegistryChangelog(diff);
  return { category: category, changelog: changelog, reasons: reasons };
}

// ---------- Styles kind ----------

function stylesIdent(s) {
  // Compare by key when present; fall back to name.
  return s.key || s.name;
}

function diffStylesArr(beforeArr, afterArr) {
  var bMap = {},
    aMap = {};
  (beforeArr || []).forEach(function (s) {
    bMap[stylesIdent(s)] = s;
  });
  (afterArr || []).forEach(function (s) {
    aMap[stylesIdent(s)] = s;
  });

  var added = [],
    removed = [],
    modified = [];
  Object.keys(bMap).forEach(function (id) {
    if (!aMap[id]) {
      removed.push(bMap[id]);
      return;
    }
    if (JSON.stringify(bMap[id]) !== JSON.stringify(aMap[id])) {
      modified.push({ before: bMap[id], after: aMap[id] });
    }
  });
  Object.keys(aMap).forEach(function (id) {
    if (!bMap[id]) added.push(aMap[id]);
  });
  return { added: added, removed: removed, modified: modified };
}

function classifyStyles(before, after) {
  var t = diffStylesArr(before.textStyles, after.textStyles);
  var e = diffStylesArr(before.effectStyles, after.effectStyles);
  var added = t.added.length + e.added.length;
  var removed = t.removed.length + e.removed.length;
  var modified = t.modified.length + e.modified.length;
  if (added === 0 && removed === 0 && modified === 0) {
    return {
      category: "unchanged",
      changelog: "_No style changes._",
      reasons: [],
    };
  }
  var reasons = [];
  t.removed.concat(e.removed).forEach(function (s) {
    reasons.push("removed style '" + s.name + "'");
  });
  t.modified.concat(e.modified).forEach(function (m) {
    reasons.push("changed style '" + m.after.name + "'");
  });
  var category = reasons.length > 0 ? "breaking" : "additive";

  var lines = [];
  if (t.added.length + e.added.length > 0) {
    lines.push("## Added styles (" + (t.added.length + e.added.length) + ")");
    t.added.forEach(function (s) {
      lines.push("- text: " + s.name);
    });
    e.added.forEach(function (s) {
      lines.push("- effect: " + s.name);
    });
    lines.push("");
  }
  if (t.modified.length + e.modified.length > 0) {
    lines.push(
      "## Modified styles (" + (t.modified.length + e.modified.length) + ")",
    );
    t.modified.forEach(function (m) {
      lines.push("- text: " + m.after.name);
    });
    e.modified.forEach(function (m) {
      lines.push("- effect: " + m.after.name);
    });
    lines.push("");
  }
  if (t.removed.length + e.removed.length > 0) {
    lines.push(
      "## Removed styles (" + (t.removed.length + e.removed.length) + ")",
    );
    t.removed.forEach(function (s) {
      lines.push("- text: " + s.name);
    });
    e.removed.forEach(function (s) {
      lines.push("- effect: " + s.name);
    });
    lines.push("");
  }
  return { category: category, changelog: lines.join("\n"), reasons: reasons };
}

function classify(input) {
  var fileKind = input.fileKind;
  if (fileKind === "registry")
    return classifyRegistry(input.before, input.after);
  if (fileKind === "styles") return classifyStyles(input.before, input.after);
  throw new Error("changelog-classifier: unknown fileKind '" + fileKind + "'");
}

module.exports = classify;
module.exports._diffRegistry = diffRegistry;
module.exports._diffStylesArr = diffStylesArr;
