import { test } from "node:test";
import assert from "node:assert/strict";
import { computeFocusedSection } from "../../src/app/SectionFocusTracker";

const SAMPLE_MD = `## 3. Design Guidelines {#design-guidelines}

Intro paragraph.

### 3.1 Color Usage Rules {#color-usage-rules}

Rule body.

### 3.2 Typography Rules {#typography-rules}

Rule body.

## 4. Handoff Protocol

Protocol body.
`;

test("computeFocusedSection: cursor at line 0 falls in §3 (design-guidelines)", () => {
  const result = computeFocusedSection(SAMPLE_MD, 0);
  assert.equal(result?.anchor, "design-guidelines");
  assert.equal(result?.level, 2);
});

test("computeFocusedSection: cursor inside §3.1 returns color-usage-rules", () => {
  const result = computeFocusedSection(SAMPLE_MD, 6);
  assert.equal(result?.anchor, "color-usage-rules");
  assert.equal(result?.level, 3);
});

test("computeFocusedSection: cursor inside §3.2 returns typography-rules", () => {
  const result = computeFocusedSection(SAMPLE_MD, 10);
  assert.equal(result?.anchor, "typography-rules");
});

test("computeFocusedSection: cursor in §4 derives slug from title (no explicit anchor)", () => {
  const result = computeFocusedSection(SAMPLE_MD, 14);
  assert.equal(result?.anchor, "handoff-protocol");
});

test("computeFocusedSection: empty markdown returns null", () => {
  assert.equal(computeFocusedSection("", 0), null);
});

test("computeFocusedSection: cursor before first heading returns null", () => {
  const md = "Intro before any heading.\n\n## First heading\n";
  assert.equal(computeFocusedSection(md, 0), null);
});

test("computeFocusedSection: strips number prefix and emoji from derived slug", () => {
  const md = "## 2.11 Motion\n\nBody.\n";
  const result = computeFocusedSection(md, 1);
  assert.equal(result?.anchor, "motion");
});
