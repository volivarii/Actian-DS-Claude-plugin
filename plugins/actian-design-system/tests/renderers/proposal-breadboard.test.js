"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var bb = require("../../scripts/renderers/proposal-breadboard.js");

function board() {
  return {
    places: [
      { id: "studio", name: "Data product", app: "studio", row: 0, col: 0,
        affordances: ["Output ports", "Linked catalogs", "Share with a group"] },
      { id: "share", name: "Exposed items", app: "studio", row: 0, col: 1,
        affordances: ["The product itself", "Its output ports"] },
      { id: "group", name: "Group", app: "administration", row: 0, col: 2,
        affordances: ["Members", "No view of the share"] },
      { id: "revoke", name: "Access from shares", app: "administration", row: 1, col: 2, isNew: true,
        affordances: ["Every item, and what carried it", "Revoke one item"] },
    ],
    connections: [
      { from: "studio/3", to: "share", label: "carries" },
      { from: "share", to: "group", label: "reaches" },
      { from: "group", to: "revoke", isNew: true },
    ],
  };
}

describe("proposal-breadboard layout", function () {
  var l = bb.layout(board());

  it("places every box on its grid cell at a fixed width", function () {
    assert.strictEqual(Object.keys(l.boxes).length, 4);
    assert.strictEqual(l.boxes.studio.w, bb.BOX_W);
    assert.strictEqual(l.boxes.studio.x, 0);
    assert.strictEqual(l.boxes.share.x, bb.BOX_W + 108, "column 1 clears column 0 plus the gutter");
    assert.strictEqual(l.boxes.group.x, 2 * (bb.BOX_W + 108), "column 2");
    assert.strictEqual(l.boxes.studio.y, 0, "row 0 starts at the top");
    assert.ok(l.boxes.revoke.y >= l.boxes.group.y + l.boxes.group.h + 48, "row 1 clears the tallest box in row 0 plus the gutter");
  });

  it("sizes a box from its affordance count, not from its neighbours", function () {
    assert.strictEqual(l.boxes.studio.h, 79 + 24 * 2 + 15, "three affordances");
    assert.strictEqual(l.boxes.share.h, 79 + 24 + 15, "two affordances");
    assert.ok(l.boxes.studio.h > l.boxes.share.h, "a box with more affordances is taller");
  });

  it("records a baseline for every affordance so a connection can leave one", function () {
    assert.strictEqual(l.boxes.studio.affY.length, 3);
    assert.strictEqual(l.boxes.studio.affY[0], l.boxes.studio.y + 79);
    assert.strictEqual(l.boxes.studio.affY[2], l.boxes.studio.y + 79 + 48);
  });

  it("routes a connection from the named affordance, not from the box centre", function () {
    var e = l.edges[0];
    assert.strictEqual(e.points[0][1], l.boxes.studio.affY[2] - 4, "leaves the third affordance's line");
    assert.strictEqual(e.points[0][0], l.boxes.studio.x + bb.BOX_W, "leaves the right edge");
    assert.strictEqual(e.points[e.points.length - 1][0], l.boxes.share.x, "arrives at the left edge");
  });

  it("routes a vertical connection between rows through the column", function () {
    var e = l.edges[2];
    assert.strictEqual(e.points[0][0], e.points[e.points.length - 1][0], "one column, so one straight vertical");
    assert.strictEqual(e.points[0][1], l.boxes.group.y + l.boxes.group.h, "leaves the bottom edge");
    assert.strictEqual(e.points[e.points.length - 1][1], l.boxes.revoke.y, "arrives at the top edge");
  });

  it("sizes the canvas to hold every box", function () {
    assert.strictEqual(l.width, 3 * bb.BOX_W + 2 * 108);
    assert.strictEqual(l.height, l.boxes.revoke.y + l.boxes.revoke.h);
  });

  it("lays a board with no row or col out as one row in declaration order", function () {
    var flat = { places: [
      { id: "a", name: "A", app: "studio", affordances: ["one"] },
      { id: "b", name: "B", app: "studio", affordances: ["one"] },
    ], connections: [] };
    var f = bb.layout(flat);
    assert.strictEqual(f.boxes.a.y, f.boxes.b.y, "same row");
    assert.ok(f.boxes.b.x > f.boxes.a.x, "in order across");
  });

  it("fans two arrows arriving at one place across the edge they arrive on", function () {
    var b = board();
    b.connections.push({ from: "explorer-ish", to: "share", label: "resolves via" });
    b.places.push({ id: "explorer-ish", name: "Consumer", app: "explorer", row: 1, col: 0, affordances: ["Opens a shared item"] });
    var l = bb.layout(b);
    var into = l.edges.filter(function (e) {
      var last = e.points[e.points.length - 1];
      return last[0] === l.boxes.share.x;
    });
    assert.strictEqual(into.length, 2, "two arrows arrive on the same edge");
    var ys = into.map(function (e) { return e.points[e.points.length - 1][1]; });
    assert.notStrictEqual(ys[0], ys[1], "and they land on different points, not on top of each other");
    ys.forEach(function (y) {
      assert.ok(y > l.boxes.share.y && y < l.boxes.share.y + l.boxes.share.h, "each inside the edge");
    });
  });

  it("still lands a lone arrow dead centre", function () {
    var l = bb.layout(board());
    var into = l.edges[1];
    assert.strictEqual(into.points[into.points.length - 1][1], l.boxes.group.y + l.boxes.group.h / 2);
  });

  it("refuses a connection naming a place or an affordance that does not exist", function () {
    var bad = board();
    bad.connections.push({ from: "studio", to: "nowhere" });
    assert.throws(function () { bb.layout(bad); }, /breadboard:.*nowhere/);
    var bad2 = board();
    bad2.connections.push({ from: "share/9", to: "group" });
    assert.throws(function () { bb.layout(bad2); }, /breadboard:.*share\/9/);
  });
});

describe("proposal-breadboard svg", function () {
  var svg = bb.breadboardSvg(board());

  it("is one svg element carrying its own viewBox", function () {
    assert.strictEqual(svg.split("<svg").length - 1, 1);
    assert.ok(/^<svg /.test(svg) && /<\/svg>$/.test(svg.trim()), "one element, nothing around it");
    var l = bb.layout(board());
    assert.ok(svg.indexOf('viewBox="0 0 ' + l.width + " " + l.height + '"') !== -1, "viewBox matches the layout");
  });

  it("carries no colour of its own: every fill and stroke comes from a class", function () {
    assert.ok(!/#[0-9a-fA-F]{3,6}\b/.test(svg), "no hex");
    assert.ok(!/\brgba?\(/.test(svg), "no rgb");
    assert.ok(!/\sfill="(?!none)/.test(svg), "no fill attribute except fill=none");
    assert.ok(!/\sstroke="/.test(svg), "no stroke attribute");
  });

  it("prints every place, its app, its name and its affordances", function () {
    board().places.forEach(function (p) {
      assert.ok(svg.indexOf(">" + p.name + "<") !== -1, p.id + " name");
      assert.ok(svg.indexOf(">" + p.app.toUpperCase() + "<") !== -1, p.id + " app label, uppercase");
      p.affordances.forEach(function (a) {
        assert.ok(svg.indexOf(">" + a + "<") !== -1, p.id + " affordance " + a);
      });
    });
  });

  it("marks what the feature adds with a class, in the line as well as the box", function () {
    assert.ok(svg.indexOf("bb__box--new") !== -1, "the new place");
    assert.strictEqual(svg.split("bb__box--new").length - 1, 1, "only the one marked isNew");
    assert.ok(svg.indexOf("bb__line--new") !== -1, "the new connection");
  });

  it("prints a connection label uppercase and centred on its first segment", function () {
    assert.ok(svg.indexOf(">CARRIES<") !== -1, "uppercased");
    assert.ok(svg.indexOf('text-anchor="middle"') !== -1, "centred, so it may overhang the gutter");
    assert.strictEqual(svg.indexOf(">undefined<"), -1, "a connection with no label prints none");
  });

  it("keeps a bent route's label clear of the bend it belongs to", function () {
    // A two-bend route's segments are each half a gutter. A label centred on one of
    // them crosses the vertical, which is what the first drawing of this showed.
    var l = bb.layout(board());
    var bent = l.edges[0];
    assert.ok(bent.points.length === 4, "the fixture's first connection does bend");
    var m = /<text class="bb__label"[^>]*x="([\d.]+)"[^>]*y="([\d.]+)"[^>]*>CARRIES</.exec(svg);
    assert.ok(m, "the label is drawn");
    var xs = bent.points.map(function (p) { return p[0]; });
    var ys = bent.points.map(function (p) { return p[1]; });
    assert.strictEqual(Number(m[1]), (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2,
      "centred on the route's whole horizontal extent, which is the middle of the gutter");
    assert.ok(Number(m[2]) < Math.min.apply(null, ys), "and above every run of the route");
  });

  it("puts a label beside a route that has no horizontal extent", function () {
    var b = board();
    b.connections[2].label = "revokes";
    var out = bb.breadboardSvg(b);
    var m = /<text class="bb__label" text-anchor="(start|middle)"[^>]*>REVOKES</.exec(out);
    assert.ok(m, "drawn");
    assert.strictEqual(m[1], "start", "beside the line: a pure vertical has no room above it");
  });

  it("escapes markup in a place name", function () {
    var b = board();
    b.places[0].name = 'Data <b>"product"</b> & more';
    var out = bb.breadboardSvg(b);
    assert.ok(out.indexOf("&lt;b&gt;") !== -1, "angle brackets escaped");
    assert.ok(out.indexOf("&amp; more") !== -1, "ampersand escaped");
    assert.ok(out.indexOf("<b>") === -1, "no raw tag reaches the document");
  });

  it("describes itself for a screen reader", function () {
    assert.ok(svg.indexOf('role="img"') !== -1, "role");
    var m = /aria-label="([^"]*)"/.exec(svg);
    assert.ok(m, "aria-label present");
    assert.ok(m[1].indexOf("Data product") !== -1, "names the places");
    assert.ok(m[1].indexOf("carries") !== -1, "names the connections");
  });

  it("renders the same bytes twice", function () {
    assert.strictEqual(bb.breadboardSvg(board()), bb.breadboardSvg(board()));
  });
});
