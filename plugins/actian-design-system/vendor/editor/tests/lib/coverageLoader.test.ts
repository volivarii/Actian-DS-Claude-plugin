import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildStubMeta,
  cellTarget,
  loadCoverage,
  summarize,
  type CoverageRow,
} from "../../src/lib/coverageLoader";

function b64(s: string): string {
  return Buffer.from(s, "utf-8").toString("base64");
}

function fakeGh(opts: {
  dirs: Array<{ name: string; type: "dir" | "file" }>;
  files: Record<string, string>;
  registry?: Record<string, { name: string; category?: string }>;
}) {
  return {
    repos: {
      getContent: async ({ path }: { path: string }) => {
        if (path === "components/src") {
          return { data: opts.dirs };
        }
        if (path === "components/dist/registries/dskit.json") {
          const body = JSON.stringify({ components: opts.registry ?? {} });
          return { data: { content: b64(body), encoding: "base64" } };
        }
        const content = opts.files[path];
        if (content === undefined) {
          const err = new Error("not found") as Error & { status: number };
          err.status = 404;
          throw err;
        }
        return { data: { content: b64(content), encoding: "base64" } };
      },
    },
  } as any;
}

const FIXTURE_DIRS = [
  { name: "button", type: "dir" as const },
  { name: "tabs", type: "dir" as const },
  { name: "categories", type: "dir" as const },
  { name: "guidelines", type: "dir" as const },
  { name: "AUTHORING.md", type: "file" as const },
];

const FIXTURE_FILES = {
  "components/src/button/_meta.yml": `
component: "Button"
category: action
domains:
  content: { status: approved, owner: content-team }
  usage: { status: draft }
  design: { status: inherited }
  behavior: { status: not-started }
  tokens: { status: not-started }
`,
  "components/src/tabs/_meta.yml": `
component: "Tabs"
category: navigation
domains:
  content: { status: approved }
  usage: { status: not-started }
  design: { status: inherited }
  behavior: { status: inherited }
  tokens: { status: not-started }
`,
};

test("loadCoverage: returns one row per non-skipped component dir", async () => {
  const gh = fakeGh({ dirs: FIXTURE_DIRS, files: FIXTURE_FILES });
  const rows = await loadCoverage(gh);
  assert.equal(rows.length, 2);
  assert.deepEqual(
    rows.map((r) => r.slug),
    ["button", "tabs"],
  );
});

test("loadCoverage: parses domain statuses from YAML", async () => {
  const gh = fakeGh({ dirs: FIXTURE_DIRS, files: FIXTURE_FILES });
  const rows = await loadCoverage(gh);
  const button = rows.find((r) => r.slug === "button")!;
  assert.equal(button.component, "Button");
  assert.equal(button.category, "action");
  assert.equal(button.domains.content.status, "approved");
  assert.equal(button.domains.content.owner, "content-team");
  assert.equal(button.domains.usage.status, "draft");
  assert.equal(button.domains.design.status, "inherited");
  assert.equal(button.domains.behavior.status, "not-started");
});

test("loadCoverage: missing _meta.yml falls back to all-not-started", async () => {
  const gh = fakeGh({
    dirs: [{ name: "orphan", type: "dir" }],
    files: {},
  });
  const rows = await loadCoverage(gh);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]!.slug, "orphan");
  assert.equal(rows[0]!.component, "orphan");
  assert.equal(rows[0]!.domains.content.status, "not-started");
});

test("loadCoverage: skips categories/ and guidelines/", async () => {
  const gh = fakeGh({ dirs: FIXTURE_DIRS, files: FIXTURE_FILES });
  const rows = await loadCoverage(gh);
  assert.ok(!rows.some((r) => r.slug === "categories"));
  assert.ok(!rows.some((r) => r.slug === "guidelines"));
});

test("summarize: counts authored (draft+approved) and inherited per domain", async () => {
  const gh = fakeGh({ dirs: FIXTURE_DIRS, files: FIXTURE_FILES });
  const rows = await loadCoverage(gh);
  const counts = summarize(rows);
  assert.equal(counts.total, 2);
  // both buttons + tabs have content=approved → 2 authored
  assert.equal(counts.perDomain.content.authored, 2);
  // button.usage=draft, tabs.usage=not-started → 1 authored
  assert.equal(counts.perDomain.usage.authored, 1);
  // both have design=inherited → 0 authored, 2 inherited
  assert.equal(counts.perDomain.design.authored, 0);
  assert.equal(counts.perDomain.design.inherited, 2);
  // button.behavior=not-started, tabs.behavior=inherited
  assert.equal(counts.perDomain.behavior.authored, 0);
  assert.equal(counts.perDomain.behavior.inherited, 1);
});

test("cellTarget: approved/draft → per-component domain file", () => {
  const row: CoverageRow = {
    slug: "button",
    component: "Button",
    category: "action",
    domains: {
      content: { status: "approved" },
      usage: { status: "draft" },
      design: { status: "inherited" },
      behavior: { status: "not-started" },
      tokens: { status: "not-started" },
    },
    origin: "authored",
  };
  assert.equal(cellTarget(row, "content"), "components/src/button/content.md");
  assert.equal(cellTarget(row, "usage"), "components/src/button/usage.md");
});

test("cellTarget: inherited → category-level file", () => {
  const row: CoverageRow = {
    slug: "button",
    component: "Button",
    category: "action",
    domains: {
      content: { status: "approved" },
      usage: { status: "draft" },
      design: { status: "inherited" },
      behavior: { status: "not-started" },
      tokens: { status: "not-started" },
    },
    origin: "authored",
  };
  assert.equal(
    cellTarget(row, "design"),
    "components/src/categories/action.md",
  );
});

test("cellTarget: not-started → _meta.yml (so author can change status)", () => {
  const row: CoverageRow = {
    slug: "button",
    component: "Button",
    domains: {
      content: { status: "not-started" },
      usage: { status: "not-started" },
      design: { status: "not-started" },
      behavior: { status: "not-started" },
      tokens: { status: "not-started" },
    },
    origin: "authored",
  };
  assert.equal(cellTarget(row, "content"), "components/src/button/_meta.yml");
});

test("cellTarget: inherited but missing category falls back to _meta.yml", () => {
  const row: CoverageRow = {
    slug: "orphan",
    component: "orphan",
    domains: {
      content: { status: "inherited" },
      usage: { status: "not-started" },
      design: { status: "not-started" },
      behavior: { status: "not-started" },
      tokens: { status: "not-started" },
    },
    origin: "authored",
  };
  assert.equal(cellTarget(row, "content"), "components/src/orphan/_meta.yml");
});

test("loadCoverage: merges authored + unstarted from registry, marks origins", async () => {
  const gh = fakeGh({
    dirs: FIXTURE_DIRS,
    files: FIXTURE_FILES,
    registry: {
      // overlaps with authored
      button: { name: "Button", category: "Action" },
      // new ghosts
      "data-grid": { name: "Data grid", category: "Data Display" },
      tooltip: { name: "Tooltip", category: "Overlays" },
      // excluded by category
      "icon-arrow-up": { name: "Arrow up", category: "Icons" },
    },
  });
  const rows = await loadCoverage(gh);
  const slugs = rows.map((r) => r.slug);
  assert.ok(slugs.includes("button"));
  assert.ok(slugs.includes("tabs"));
  assert.ok(slugs.includes("data-grid"));
  assert.ok(slugs.includes("tooltip"));
  // Icon excluded.
  assert.equal(slugs.includes("icon-arrow-up"), false);
  // Authored origin preserved for _meta.yml dirs.
  assert.equal(rows.find((r) => r.slug === "button")!.origin, "authored");
  assert.equal(rows.find((r) => r.slug === "tabs")!.origin, "authored");
  // Ghost origin for registry-only.
  assert.equal(rows.find((r) => r.slug === "data-grid")!.origin, "unstarted");
  assert.equal(rows.find((r) => r.slug === "tooltip")!.origin, "unstarted");
  // Component name from registry, category slugified.
  const dg = rows.find((r) => r.slug === "data-grid")!;
  assert.equal(dg.component, "Data grid");
  assert.equal(dg.category, "data-display");
});

test("loadCoverage: registry fetch failure → authored-only (graceful)", async () => {
  const gh = {
    repos: {
      getContent: async ({ path }: { path: string }) => {
        if (path === "components/src") return { data: FIXTURE_DIRS };
        if (path === "components/dist/registries/dskit.json") {
          throw new Error("registry fetch failed");
        }
        const c = (FIXTURE_FILES as Record<string, string>)[path];
        if (c === undefined) throw new Error("not found");
        return { data: { content: b64(c), encoding: "base64" } };
      },
    },
  } as any;
  const rows = await loadCoverage(gh);
  // Only authored rows present.
  assert.equal(rows.length, 2);
  assert.ok(rows.every((r) => r.origin === "authored"));
});

test("summarize: counts authored vs unstarted rows separately", async () => {
  const gh = fakeGh({
    dirs: FIXTURE_DIRS,
    files: FIXTURE_FILES,
    registry: {
      "data-grid": { name: "Data grid", category: "Data Display" },
      tooltip: { name: "Tooltip", category: "Overlays" },
    },
  });
  const rows = await loadCoverage(gh);
  const c = summarize(rows);
  assert.equal(c.total, 4);
  assert.equal(c.authored, 2);
  assert.equal(c.unstarted, 2);
});

test("buildStubMeta: produces schema-aligned YAML with all 5 domains not-started", () => {
  const row: CoverageRow = {
    slug: "data-grid",
    component: "Data grid",
    category: "data-display",
    domains: {
      content: { status: "not-started" },
      usage: { status: "not-started" },
      design: { status: "not-started" },
      behavior: { status: "not-started" },
      tokens: { status: "not-started" },
    },
    origin: "unstarted",
    registryKey: "data-grid",
  };
  const yaml = buildStubMeta(row);
  assert.match(
    yaml,
    /\$schema=\.\.\/\.\.\/\.\.\/schemas\/guideline-meta\.json/,
  );
  assert.match(yaml, /component: "Data grid"/);
  assert.match(yaml, /category: data-display/);
  for (const d of ["content", "usage", "design", "behavior", "tokens"]) {
    assert.match(yaml, new RegExp(`${d}: \\{ status: not-started \\}`));
  }
});

test("buildStubMeta: omits category when not present", () => {
  const row: CoverageRow = {
    slug: "x",
    component: "X",
    domains: {
      content: { status: "not-started" },
      usage: { status: "not-started" },
      design: { status: "not-started" },
      behavior: { status: "not-started" },
      tokens: { status: "not-started" },
    },
    origin: "unstarted",
    registryKey: "x",
  };
  const yaml = buildStubMeta(row);
  assert.equal(yaml.includes("category:"), false);
});
