"use strict";

/**
 * proposal-breadboard.js: draws the terrain of a proposal as one inline SVG,
 * computed from { places[], connections[] }. Places are boxes, affordances are
 * the lines inside them, connections are orthogonal arrows routed through the
 * gutters. What the feature adds is dashed as well as coloured, so the drawing
 * survives greyscale and print.
 *
 * The module emits no colour: every drawn element carries a bb__* class that
 * the document stylesheet owns, so the diagram follows the Fat Marker palette
 * without a hex value anywhere in this file.
 *
 * The app label is drawn INSIDE its box as the first line. Drawn above the box
 * it would sit exactly where a connector entering from above has to run, and a
 * long label would be crossed by the arrow. Inside, no such collision exists
 * and the router is free to use any edge.
 *
 * No side effects at load.
 */

var renderer = require("../lib/renderer.js");
var esc = renderer.fmHtmlMap.esc;

var BOX_W = 300;
var GAP_X = 108;
var GAP_Y = 48;
var PAD_X = 16;
var APP_BASE = 21;
var NAME_BASE = 45;
var RULE_Y = 57;
var AFF_FIRST = 79;
var AFF_STEP = 24;
var DESCENDER = 15;
var LABEL_LIFT = 9;   // a connection label sits this far above its segment
var ARROW_GAP = 4;    // a line leaving an affordance sits just above its baseline

function boxHeight(n) {
  return (n ? AFF_FIRST + AFF_STEP * (n - 1) : RULE_Y) + DESCENDER;
}

// "studio/3" -> { id: "studio", aff: 3 }; "studio" -> { id: "studio", aff: 0 }
function parseEnd(ref) {
  var s = String(ref == null ? "" : ref);
  var slash = s.indexOf("/");
  if (slash === -1) return { id: s, aff: 0, raw: s };
  return { id: s.slice(0, slash), aff: Number(s.slice(slash + 1)) || 0, raw: s };
}

function layout(board) {
  var places = (board && board.places) || [];
  var connections = (board && board.connections) || [];
  var boxes = {};
  var cells = [];

  places.forEach(function (p, i) {
    var row = p.row == null ? 0 : p.row;
    var col = p.col == null ? i : p.col;
    cells.push({ p: p, row: row, col: col, h: boxHeight((p.affordances || []).length) });
  });

  var rowHeight = {};
  var maxCol = 0;
  cells.forEach(function (c) {
    rowHeight[c.row] = Math.max(rowHeight[c.row] || 0, c.h);
    if (c.col > maxCol) maxCol = c.col;
  });
  var rows = Object.keys(rowHeight).map(Number).sort(function (a, b) { return a - b; });
  var rowY = {};
  var y = 0;
  rows.forEach(function (r) {
    rowY[r] = y;
    y += rowHeight[r] + GAP_Y;
  });
  var height = y - (rows.length ? GAP_Y : 0);

  cells.forEach(function (c) {
    var bx = c.col * (BOX_W + GAP_X);
    var by = rowY[c.row];
    var affY = (c.p.affordances || []).map(function (_, i) { return by + AFF_FIRST + AFF_STEP * i; });
    boxes[c.p.id] = { x: bx, y: by, w: BOX_W, h: c.h, row: c.row, col: c.col, affY: affY, place: c.p };
  });

  function need(end) {
    var b = boxes[end.id];
    if (!b) throw new Error('breadboard: connection names place "' + end.raw + '", which does not exist');
    if (end.aff && !b.affY[end.aff - 1])
      throw new Error('breadboard: connection names "' + end.raw + '", but that place has ' + b.affY.length + " affordances");
    return b;
  }

  // Which edge of the target a connection arrives on, from the relative grid position.
  function sideOf(A, Z) {
    if (Z.col > A.col) return "left";
    if (Z.col < A.col) return "right";
    return Z.row > A.row ? "top" : "bottom";
  }

  // Two arrows arriving at one place used to land on the same point, which reads as
  // one arrow. Count the arrivals per edge first, then fan them across it: a single
  // arrival still lands dead centre, so the common case is unchanged.
  var arrivals = {};
  connections.forEach(function (c) {
    var A = need(parseEnd(c.from));
    var z = parseEnd(c.to);
    var key = z.id + ":" + sideOf(A, need(z));
    arrivals[key] = (arrivals[key] || 0) + 1;
  });
  var placed = {};
  function entry(A, Z, z) {
    var side = sideOf(A, Z);
    var key = z.id + ":" + side;
    var n = arrivals[key];
    var i = placed[key] || 0;
    placed[key] = i + 1;
    var t = (i + 1) / (n + 1);
    return side === "left" || side === "right"
      ? { side: side, x: side === "left" ? Z.x : Z.x + Z.w, y: Z.y + Z.h * t }
      : { side: side, x: Z.x + Z.w * t, y: side === "top" ? Z.y : Z.y + Z.h };
  }

  // Orthogonal router with at most two bends. The exit and entry edges follow
  // the relative grid position, so a diagram never routes a line back through
  // a box it did not come from.
  var edges = connections.map(function (c) {
    var a = parseEnd(c.from);
    var z = parseEnd(c.to);
    var A = need(a);
    var Z = need(z);
    var e = entry(A, Z, z);
    var yA = a.aff ? A.affY[a.aff - 1] - ARROW_GAP : A.y + A.h / 2;
    var yZ = e.y;
    var pts;
    if (Z.col > A.col) {
      var mx = (A.x + A.w + Z.x) / 2;
      pts = yA === yZ ? [[A.x + A.w, yA], [e.x, yZ]] : [[A.x + A.w, yA], [mx, yA], [mx, yZ], [e.x, yZ]];
    } else if (Z.col < A.col) {
      var mx2 = (Z.x + Z.w + A.x) / 2;
      pts = yA === yZ ? [[A.x, yA], [e.x, yZ]] : [[A.x, yA], [mx2, yA], [mx2, yZ], [e.x, yZ]];
    } else if (Z.row > A.row) {
      pts = [[e.x, A.y + A.h], [e.x, e.y]];
    } else if (Z.row < A.row) {
      pts = [[e.x, A.y], [e.x, e.y]];
    } else {
      throw new Error('breadboard: connection from "' + a.raw + '" to "' + z.raw + '" joins one cell to itself');
    }
    return { points: pts, label: c.label, isNew: !!c.isNew };
  });

  return { width: maxCol * (BOX_W + GAP_X) + BOX_W, height: height, boxes: boxes, edges: edges };
}

function ariaLabel(board, l) {
  var parts = (board.places || []).map(function (p) {
    return p.name + " in " + p.app + (p.isNew ? ", which this feature adds" : "");
  });
  var conns = l.edges.map(function (e, i) {
    var c = board.connections[i];
    var from = parseEnd(c.from).id;
    var fromName = l.boxes[from].place.name;
    return fromName + " " + (c.label || "reaches") + " " + l.boxes[parseEnd(c.to).id].place.name;
  });
  return "Breadboard. Places: " + parts.join("; ") + ". Connections: " + conns.join("; ") + ".";
}

function placeSvg(b) {
  var p = b.place;
  var out = '<rect class="bb__box' + (p.isNew ? " bb__box--new" : "") + '" x="' + b.x + '" y="' + b.y +
    '" width="' + b.w + '" height="' + b.h + '" rx="6" fill="none"/>';
  out += '<text class="bb__app" x="' + (b.x + PAD_X) + '" y="' + (b.y + APP_BASE) + '">' + esc(String(p.app).toUpperCase()) + "</text>";
  out += '<text class="bb__name" x="' + (b.x + PAD_X) + '" y="' + (b.y + NAME_BASE) + '">' + esc(p.name) + "</text>";
  out += '<line class="bb__rule" x1="' + (b.x + PAD_X) + '" y1="' + (b.y + RULE_Y) + '" x2="' + (b.x + b.w - PAD_X) + '" y2="' + (b.y + RULE_Y) + '"/>';
  (p.affordances || []).forEach(function (a, i) {
    out += '<text class="bb__aff" x="' + (b.x + PAD_X) + '" y="' + b.affY[i] + '">' + esc(a) + "</text>";
  });
  return out;
}

function edgeSvg(e) {
  var cls = "bb__line" + (e.isNew ? " bb__line--new" : "");
  var marker = e.isNew ? "bb-arrow-new" : "bb-arrow";
  var d = e.points.map(function (pt) { return pt[0] + "," + pt[1]; }).join(" ");
  var out = '<polyline class="' + cls + '" points="' + d + '" fill="none" marker-end="url(#' + marker + ')"/>';
  if (e.label) {
    // The label is centred on the route's whole horizontal extent and lifted above its
    // highest run, which for a bent route is the middle of the gutter with clear space
    // above it. Centring on a single segment does not work: a two-bend route's segments
    // are each half a gutter, and a two-word label centred on one of them crosses the
    // bend. A route with no horizontal extent at all has no room above it either, so its
    // label sits beside the line instead.
    var xs = e.points.map(function (q) { return q[0]; });
    var ys = e.points.map(function (q) { return q[1]; });
    var minX = Math.min.apply(null, xs);
    var maxX = Math.max.apply(null, xs);
    var minY = Math.min.apply(null, ys);
    var maxY = Math.max.apply(null, ys);
    var text = esc(String(e.label).toUpperCase());
    out += maxX === minX
      ? '<text class="bb__label" text-anchor="start" x="' + (minX + 8) + '" y="' + ((minY + maxY) / 2) + '">' + text + "</text>"
      : '<text class="bb__label" text-anchor="middle" x="' + ((minX + maxX) / 2) + '" y="' + (minY - LABEL_LIFT) + '">' + text + "</text>";
  }
  return out;
}

function breadboardSvg(board, opts) {
  var l = layout(board);
  var label = (opts && opts.ariaLabel) || ariaLabel(board, l);
  var defs =
    '<defs>' +
    '<marker id="bb-arrow" class="bb__head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z"/></marker>' +
    '<marker id="bb-arrow-new" class="bb__head bb__head--new" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z"/></marker>' +
    "</defs>";
  var body = Object.keys(l.boxes).map(function (id) { return placeSvg(l.boxes[id]); }).join("") +
    l.edges.map(edgeSvg).join("");
  return '<svg class="bb__svg" width="' + l.width + '" height="' + l.height + '" viewBox="0 0 ' + l.width + " " + l.height +
    '" role="img" aria-label="' + esc(label) + '">' + defs + body + "</svg>";
}

module.exports = {
  breadboardSvg: breadboardSvg,
  layout: layout,
  BOX_W: BOX_W,
  GAP_X: GAP_X,
  GAP_Y: GAP_Y,
};
