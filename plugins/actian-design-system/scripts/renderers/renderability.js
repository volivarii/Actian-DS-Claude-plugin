#!/usr/bin/env node
"use strict";

/**
 * renderability.js — REPORT-ONLY predicates describing what an anatomy doc can
 * actually render, and how much of a render is blank placeholder boxes.
 *
 * Why this exists: `quality.ratio` (nodesNormalized/nodesTotal) is computed
 * UPSTREAM and measures whether the Figma component was drawn with auto-layout
 * and solid fills. It is a Figma HYGIENE score, not a renderability score, and
 * it is wrong in BOTH directions: `spinner` scores 0.83 and renders as five
 * grey boxes; `notification-dropdown` scores 0.50 with an EMPTY degraded[]
 * list yet every one of its instances is unresolved. These predicates read the
 * doc itself instead.
 *
 * NOTHING here gates the render path. The anatomy floor is retired by
 * ATTRITION (each slug earns a real leaf), not by flipping a gate: flipping it
 * before the leaves exist would demote 17 slugs to chips and make the
 * deliverable worse. This module exists so the coverage report can tell the
 * truth while that work lands.
 *
 * Pure: no fs, no side effects at load, never throws on a malformed doc.
 */
(function (exports) {
  "use strict";

  function isNonEmptyObject(o) {
    return !!o && typeof o === "object" && Object.keys(o).length > 0;
  }

  // Walk an anatomy doc's node tree and report what it actually carries.
  function docStats(doc) {
    var s = {
      nodes: 0,
      rootHasLayout: false,
      nonRoot: 0,
      placeable: 0,
      instances: 0,
      unresolved: 0,
    };
    if (!doc || !doc.root || typeof doc.root !== "object") return s;
    s.rootHasLayout = isNonEmptyObject(doc.root.layout);

    function walk(n, isRoot) {
      if (!n || typeof n !== "object") return;
      s.nodes++;
      if (!isRoot) {
        s.nonRoot++;
        // "placeable" = carries something to place (layout) or something to
        // paint (appearance). A node with neither emits a bare <div>: no box
        // model, no color, an invisible nothing.
        if (isNonEmptyObject(n.layout) || isNonEmptyObject(n.appearance)) {
          s.placeable++;
        }
      }
      if (n.kind === "instance") {
        s.instances++;
        if (n.unresolved) s.unresolved++;
      }
      var kids = Array.isArray(n.children) ? n.children : [];
      for (var i = 0; i < kids.length; i++) walk(kids[i], false);
    }
    walk(doc.root, true);
    return s;
  }

  // Can this doc render a credible component, or is the anatomy floor faking
  // it? Thresholds CALIBRATED against vendored knowledge v0.34.96: over the 37
  // non-override authorable slugs this admits 20 and rejects 17.
  function isRenderable(doc) {
    if (!doc || !doc.root || typeof doc.root !== "object") {
      return { ok: false, why: "no anatomy doc" };
    }
    var s = docStats(doc);

    // 1. No root layout => no box model. Children stack; nothing is sized or
    //    padded. This is why spinner/avatar/loading-skeleton/scroll-bar render
    //    as unsized blobs despite passing the upstream ratio gate.
    if (!s.rootHasLayout) return { ok: false, why: "root has no layout" };

    // 2. Under half the non-root nodes carry layout OR appearance => the tree
    //    is mostly invisible nothings.
    if (s.nonRoot > 0 && s.placeable / s.nonRoot < 0.5) {
      return {
        ok: false,
        why: "only " + s.placeable + "/" + s.nonRoot + " nodes placeable",
      };
    }

    // 3. Half or more instances unresolved => the render is mostly blank
    //    boxes. notification-dropdown is 9/9: a well-styled container full of
    //    nine empty menu items.
    if (s.instances > 0 && s.unresolved / s.instances >= 0.5) {
      return {
        ok: false,
        why: s.unresolved + "/" + s.instances + " instances unresolved",
      };
    }

    return { ok: true, why: "" };
  }

  // A BLANK BOX is an EMPTY placeholder div. ds-base.css paints these with
  // min-width/min-height var(--zen-size-md) and a neutral background so media
  // leaves do not collapse to 0x0, which is precisely what makes them read as
  // grey boxes on screen. This is the metric a PM actually sees.
  //
  // Deliberately requires the element to be EMPTY (`></div>` immediately after
  // the open tag): a placeholder that got real content is not a blank box.
  //
  // "image" is intentionally absent: the anatomy classifier emits "icon" (and
  // "vector"), never "image" (see appearance-render.js's C2 comment), so it
  // never matched here. Kept out rather than kept as dead weight.
  //
  // /g means this regex carries mutable lastIndex state. Safe only because
  // every caller uses String.prototype.match(), which resets lastIndex on
  // each call. If a future caller reaches for .test() or .exec() instead,
  // that call needs its own regex instance (or lastIndex reset first), or it
  // will silently miss matches on the second and later calls.
  var BLANK_BOX =
    /<div class="ds-appearance__(?:vector|icon|instance)"[^>]*><\/div>/g;

  function countBlankBoxes(html) {
    if (typeof html !== "string" || !html) return 0;
    var m = html.match(BLANK_BOX);
    return m ? m.length : 0;
  }

  exports.docStats = docStats;
  exports.isRenderable = isRenderable;
  exports.countBlankBoxes = countBlankBoxes;
})(
  typeof module !== "undefined"
    ? module.exports
    : (window.renderability = window.renderability || {}),
);
