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
var CORRIDOR = 32;    // how far below the diagram a route between non-adjacent columns runs
var GUTTER = GAP_X / 2; // the middle of a column gutter, which holds no box at any row
var LANE = 24;        // vertical distance between two routes sharing the corridor

function boxHeight(n) {
  return (n ? AFF_FIRST + AFF_STEP * (n - 1) : RULE_Y) + DESCENDER;
}

// "studio/3" -> { id: "studio", aff: 3, suffixed: true }; "studio" -> { aff: 0 }.
// suffixed is separate from aff because 0 is falsy: "studio/0" used to read as no suffix
// at all, so an author who meant the first affordance got a line from the box centre and
// no complaint. A written suffix is always checked, whatever number it carries.
function parseEnd(ref) {
  var s = String(ref == null ? "" : ref);
  var slash = s.indexOf("/");
  if (slash === -1) return { id: s, aff: 0, suffixed: false, raw: s };
  return { id: s.slice(0, slash), aff: Number(s.slice(slash + 1)), suffixed: true, raw: s };
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
    if (end.suffixed && !(end.aff >= 1 && end.aff <= b.affY.length))
      throw new Error('breadboard: connection names "' + end.raw + '", but that place has ' + b.affY.length +
        " affordances; the index is 1-based");
    return b;
  }

  // Which edge of the target a connection arrives on, from the relative grid position.
  // A pair in one column meets top to bottom, unless they are not adjacent: a direct line
  // would cross every box between them, so a long route comes in from the side instead.
  function sideOf(A, Z) {
    if (Z.col > A.col) return "left";
    if (Z.col < A.col) return "right";
    return Math.abs(Z.row - A.row) > 1 ? "right" : (Z.row > A.row ? "top" : "bottom");
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

  // Two routes spanning the same column pair used to bend on the identical x, because the
  // bend was the gutter midpoint and the midpoint depends only on the columns. A label on
  // one then sat squarely on the other's vertical. Count the routes per gutter and spread
  // their bends across it; a lone route still bends at the middle.
  function gutterKey(A, Z) {
    return Math.min(A.col, Z.col) + ":" + Math.max(A.col, Z.col);
  }
  var gutterUse = {};
  connections.forEach(function (c) {
    var A = need(parseEnd(c.from));
    var Z = need(parseEnd(c.to));
    if (A.col === Z.col) return;
    var k = gutterKey(A, Z);
    gutterUse[k] = (gutterUse[k] || 0) + 1;
  });
  var gutterPlaced = {};
  function bendX(A, Z) {
    var left = A.col < Z.col ? A : Z;
    var right = A.col < Z.col ? Z : A;
    var from = left.x + left.w;
    var span = right.x - from;
    var k = gutterKey(A, Z);
    var n = gutterUse[k];
    var i = gutterPlaced[k] || 0;
    gutterPlaced[k] = i + 1;
    return from + span * ((i + 1) / (n + 1));
  }

  var baseWidth = maxCol * (BOX_W + GAP_X) + BOX_W;
  // One lane per route that needs the corridor, so two of them neither overlap nor land
  // their labels on the same point. The fan-out across an arrival edge and the spread
  // across a gutter both exist for that reason; the corridor needed its own.
  var lanes = 0;
  connections.forEach(function (c) {
    var A = need(parseEnd(c.from));
    var Z = need(parseEnd(c.to));
    if (Math.abs(Z.col - A.col) > 1) lanes++;
  });
  var laneTaken = 0;
  var corridorTop = height + CORRIDOR;
  var sideWidth = 0; // how far right a route beside a column has to reach, label included

  // A label anchored at the start of a line needs room after it or the viewBox clips it.
  function labelRoom(label) {
    return label ? 8 + Math.ceil(0.62 * 11 * String(label).length) + 8 : 8;
  }

  // Orthogonal router. The exit and entry edges follow the relative grid position, so a
  // diagram never routes a line back through a box it did not come from.
  //
  // Between adjacent cells every bend lands in a gutter, which is empty by construction.
  // Between NON-adjacent cells it does not: a run from column 0 to column 2 crossed
  // whatever sat in column 1, for the full width of that box, on any board of that shape.
  // Those routes travel in a corridor outside the diagram instead, which is always free,
  // and the canvas grows to hold it.
  var edges = connections.map(function (c) {
    var a = parseEnd(c.from);
    var z = parseEnd(c.to);
    var A = need(a);
    var Z = need(z);
    var e = entry(A, Z, z);
    var yA = a.suffixed ? A.affY[a.aff - 1] - ARROW_GAP : A.y + A.h / 2;
    var yZ = e.y;
    var dCol = Z.col - A.col;
    var dRow = Z.row - A.row;
    var pts;
    var labelAnchor = null;
    if (Math.abs(dCol) > 1) {
      // Down the gutter beside the source, along the corridor under every box, up the
      // gutter beside the target. Gutters hold no boxes at any row and the corridor is
      // below the last one, so every segment is in free space whatever else is on the
      // grid. An earlier version dropped straight out of the box, which crossed whatever
      // sat under it, and passed a test whose three boards happened to have nothing there.
      var corridorY = corridorTop + laneTaken * LANE;
      laneTaken += 1;
      var outX = dCol > 0 ? A.x + A.w + GUTTER : A.x - GUTTER;
      var inX = dCol > 0 ? Z.x - GUTTER : Z.x + Z.w + GUTTER;
      pts = [[dCol > 0 ? A.x + A.w : A.x, yA], [outX, yA], [outX, corridorY],
             [inX, corridorY], [inX, yZ], [e.x, yZ]];
      labelAnchor = { x: (outX + inX) / 2, y: corridorY - LABEL_LIFT, anchor: "middle" };
    } else if (dCol === 0 && Math.abs(dRow) > 1) {
      // Out into the gutter beside the column, along it, and back in. The gutter is free
      // at every row; running to the right of the whole diagram instead would have crossed
      // every box between this column and the edge.
      var gx = A.x + A.w + GUTTER;
      sideWidth = Math.max(sideWidth, gx + labelRoom(c.label));
      pts = [[A.x + A.w, yA], [gx, yA], [gx, yZ], [e.x, yZ]];
      labelAnchor = { x: gx + 8, y: (yA + yZ) / 2, anchor: "start" };
    } else if (dCol > 0) {
      var mx = bendX(A, Z);
      pts = yA === yZ ? [[A.x + A.w, yA], [e.x, yZ]] : [[A.x + A.w, yA], [mx, yA], [mx, yZ], [e.x, yZ]];
    } else if (dCol < 0) {
      var mx2 = bendX(A, Z);
      pts = yA === yZ ? [[A.x, yA], [e.x, yZ]] : [[A.x, yA], [mx2, yA], [mx2, yZ], [e.x, yZ]];
    } else if (dRow > 0) {
      pts = [[e.x, A.y + A.h], [e.x, e.y]];
    } else if (dRow < 0) {
      pts = [[e.x, A.y], [e.x, e.y]];
    } else {
      throw new Error('breadboard: connection from "' + a.raw + '" to "' + z.raw + '" joins one cell to itself');
    }
    return { points: pts, label: c.label, isNew: !!c.isNew, labelAnchor: labelAnchor };
  });

  return {
    width: Math.max(baseWidth, sideWidth),
    height: height + (lanes ? CORRIDOR + (lanes - 1) * LANE + LABEL_LIFT : 0),
    boxes: boxes,
    edges: edges,
  };
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
    if (e.labelAnchor) {
      return out + '<text class="bb__label" text-anchor="' + e.labelAnchor.anchor + '" x="' + e.labelAnchor.x +
        '" y="' + e.labelAnchor.y + '">' + text + "</text>";
    }
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
