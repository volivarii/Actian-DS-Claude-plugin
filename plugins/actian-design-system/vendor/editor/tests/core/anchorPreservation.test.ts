import { test } from "node:test";
import assert from "node:assert/strict";
import {
  droppedAnchors,
  AnchorPreservationError,
} from "../../src/core/anchorPreservation";

test("droppedAnchors: returns [] when all preserved", () => {
  const remote = "## A {#a}\n## B {#b}\n";
  const submission = "## A {#a}\n## B {#b}\n\nExtra paragraph.";
  assert.deepEqual(droppedAnchors(remote, submission), []);
});

test("droppedAnchors: detects a single dropped anchor", () => {
  const remote = "## A {#a}\n## B {#b}\n";
  const submission = "## A {#a}\n## B renamed\n";
  assert.deepEqual(droppedAnchors(remote, submission), ["b"]);
});

test("droppedAnchors: detects multiple dropped anchors (sorted)", () => {
  const remote = "## A {#color}\n## B {#spacing}\n## C {#typography}\n";
  const submission = "## A {#color}\n";
  assert.deepEqual(droppedAnchors(remote, submission), ["spacing", "typography"]);
});

test("droppedAnchors: anchors added in submission don't count as dropped", () => {
  const remote = "## A {#a}\n";
  const submission = "## A {#a}\n## B {#b-new}\n";
  assert.deepEqual(droppedAnchors(remote, submission), []);
});

test("droppedAnchors: empty remote returns []", () => {
  assert.deepEqual(droppedAnchors("", "## Anything {#anything}"), []);
});

test("AnchorPreservationError is a real Error subclass", () => {
  const err = new AnchorPreservationError("foundations.md", ["color", "spacing"]);
  assert.ok(err instanceof Error);
  assert.equal(err.name, "AnchorPreservationError");
  assert.equal(err.path, "foundations.md");
  assert.deepEqual(err.dropped, ["color", "spacing"]);
  assert.match(err.message, /color/);
  assert.match(err.message, /spacing/);
});
