import { test } from "node:test";
import assert from "node:assert/strict";
import { scanHeadings } from "../../src/lib/headingScan";

test("scanHeadings: extracts H1/H2/H3 with level + text + line", () => {
  const md = `# Top\n\n## Section A\n\n### Sub a1\n\nbody\n\n## Section B\n`;
  const h = scanHeadings(md);
  assert.deepEqual(h, [
    { level: 1, text: "Top", line: 0 },
    { level: 2, text: "Section A", line: 2 },
    { level: 3, text: "Sub a1", line: 4 },
    { level: 2, text: "Section B", line: 8 },
  ]);
});

test("scanHeadings: ignores H4 and below", () => {
  const md = `# H1\n#### H4 ignored\n##### H5 ignored\n`;
  const h = scanHeadings(md);
  assert.deepEqual(h, [{ level: 1, text: "H1", line: 0 }]);
});

test("scanHeadings: ignores headings inside fenced code blocks", () => {
  const md = `# Real\n\n\`\`\`\n## Not a heading\n### Also not\n\`\`\`\n\n## Real too\n`;
  const h = scanHeadings(md);
  assert.deepEqual(
    h.map((x) => x.text),
    ["Real", "Real too"],
  );
});

test("scanHeadings: strips trailing {#anchor} from display text", () => {
  const md = `## Color contrast {#color-contrast}\n### Focus rings {#focus}\n`;
  const h = scanHeadings(md);
  assert.equal(h[0]!.text, "Color contrast");
  assert.equal(h[1]!.text, "Focus rings");
});

test("scanHeadings: skips blank-text headings", () => {
  const md = `# \n##   \n# Real\n`;
  const h = scanHeadings(md);
  assert.equal(h.length, 1);
  assert.equal(h[0]!.text, "Real");
});

test("scanHeadings: empty input returns empty array", () => {
  assert.deepEqual(scanHeadings(""), []);
});

test("scanHeadings: line numbers are 0-indexed and accurate", () => {
  const md = `intro\n# First\nbody\nbody\n## Second\n`;
  const h = scanHeadings(md);
  assert.equal(h[0]!.line, 1);
  assert.equal(h[1]!.line, 4);
});

test("scanHeadings: requires space after #", () => {
  const md = `#NoSpace\n# WithSpace\n`;
  const h = scanHeadings(md);
  assert.equal(h.length, 1);
  assert.equal(h[0]!.text, "WithSpace");
});
