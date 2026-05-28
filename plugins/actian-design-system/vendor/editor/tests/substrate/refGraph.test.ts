import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildRefGraph } from "../../src/substrate/refGraph";
import { loadTaxonomy } from "../../src/substrate/taxonomy";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.resolve(HERE, "../fixtures/substrate");
const VENDOR_DIR = path.join(FIXTURES, "vendor-mds");
const A11Y_FIXTURE = path.join(FIXTURES, "a11y-index.fixture.json");
const MOTION_FIXTURE = path.join(FIXTURES, "motion.fixture.json");

async function buildFixtureGraph() {
  const taxonomy = await loadTaxonomy({ a11yIndexPath: A11Y_FIXTURE, motionPath: MOTION_FIXTURE });
  return buildRefGraph({ vendorRoot: VENDOR_DIR, taxonomy });
}

test("buildRefGraph: indexes a11y_refs entries", async () => {
  const graph = await buildFixtureGraph();
  const consumers = graph.consumersOf("color-contrast");
  assert.equal(consumers.length, 2);
  const files = consumers.map((c) => c.file).sort();
  assert.deepEqual(files, ["file-a.md", "file-d.md"]);
});

test("buildRefGraph: captures notes when present", async () => {
  const graph = await buildFixtureGraph();
  const consumers = graph.consumersOf("color-contrast");
  const fileA = consumers.find((c) => c.file === "file-a.md");
  assert.equal(fileA?.note, "preserves contrast under theming");
});

test("buildRefGraph: indexes motion_refs entries", async () => {
  const graph = await buildFixtureGraph();
  const consumers = graph.consumersOf("state-transitions");
  assert.equal(consumers.length, 1);
  assert.equal(consumers[0]?.file, "file-a.md");
  assert.equal(consumers[0]?.refType, "motion_refs");
});

test("buildRefGraph: files without frontmatter contribute nothing", async () => {
  const graph = await buildFixtureGraph();
  const sectionC = graph.connectionsFromFile("file-c.md");
  assert.deepEqual(sectionC, []);
});

test("buildRefGraph: orphaned refs collected in brokenRefs[]", async () => {
  const graph = await buildFixtureGraph();
  const broken = graph.brokenRefs();
  assert.equal(broken.length, 1);
  assert.equal(broken[0]?.slug, "defunct-slug-not-in-taxonomy");
  assert.equal(broken[0]?.file, "file-d.md");
});

test("buildRefGraph: connectionsFromFile returns outgoing refs", async () => {
  const graph = await buildFixtureGraph();
  const outgoing = graph.connectionsFromFile("file-a.md");
  assert.equal(outgoing.length, 2);
  const slugs = outgoing.map((c) => c.slug).sort();
  assert.deepEqual(slugs, ["color-contrast", "state-transitions"]);
});

test("buildRefGraph: connectionsToSection returns incoming refs", async () => {
  const graph = await buildFixtureGraph();
  const incoming = graph.connectionsToSection("color-contrast");
  assert.equal(incoming.length, 2);
});

test("buildRefGraph: connectionsFromSection returns refs scoped to a section anchor", async () => {
  // File-scoped attachment (P8 Option A v1): all refs on a file are
  // attached to its TOP H2. connectionsFromSection returns refs only when
  // the requested anchor matches the file's top H2.
  const graph = await buildFixtureGraph();
  const refsAtTopH2 = graph.connectionsFromSection("file-a.md", "section-a");
  assert.equal(refsAtTopH2.length, 2);
  const refsAtNonTop = graph.connectionsFromSection("file-a.md", "subsection-not-top");
  assert.deepEqual(refsAtNonTop, []);
});
