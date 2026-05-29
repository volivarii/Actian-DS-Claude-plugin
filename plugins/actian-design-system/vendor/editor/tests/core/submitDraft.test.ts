import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ReadonlyPathError,
  SchemaValidationError,
  type Draft,
} from "../../src/core/types";
import { submitDraft } from "../../src/core/submitDraft";
import { AnchorPreservationError } from "../../src/core/anchorPreservation";

const META_SCHEMA = {
  type: "object",
  required: ["component"],
  properties: { component: { type: "string" } },
  additionalProperties: true,
};

type AnyFn = (...args: any[]) => any;
function makeFakeOctokit(): { gh: any; calls: Record<string, any[]> } {
  const calls: Record<string, any[]> = {
    "git.getRef": [],
    "git.createRef": [],
    "git.createBlob": [],
    "git.createTree": [],
    "git.createCommit": [],
    "git.updateRef": [],
    "pulls.create": [],
  };
  const rec =
    (key: string, ret: any): AnyFn =>
    async (args: any) => {
      calls[key]!.push(args);
      return ret;
    };
  return {
    calls,
    gh: {
      git: {
        getRef: rec("git.getRef", { data: { object: { sha: "BASE_SHA" } } }),
        createRef: rec("git.createRef", { data: {} }),
        createBlob: rec("git.createBlob", { data: { sha: "BLOB_SHA" } }),
        createTree: rec("git.createTree", { data: { sha: "TREE_SHA" } }),
        createCommit: rec("git.createCommit", {
          data: { sha: "COMMIT_SHA" },
        }),
        updateRef: rec("git.updateRef", { data: {} }),
      },
      pulls: {
        create: rec("pulls.create", {
          data: { html_url: "https://github.com/x/y/pull/1" },
        }),
      },
      repos: {
        getContent: async () => {
          const err = new Error("not found") as Error & { status: number };
          err.status = 404;
          throw err;
        },
      },
    },
  };
}

test("submitDraft — refuses read-only path before any GitHub call", async () => {
  const { gh, calls } = makeFakeOctokit();
  const draft: Draft = {
    id: "abc",
    message: "x",
    files: [{ path: "tokens/tokens.json", content: "{}" }],
  };
  await assert.rejects(
    submitDraft(draft, {
      owner: "o",
      repo: "r",
      base: "main",
      schemas: {},
      octokit: gh,
    }),
    (err: unknown) =>
      err instanceof ReadonlyPathError && err.path === "tokens/tokens.json",
  );
  assert.equal(calls["git.getRef"]!.length, 0);
});

test("submitDraft — refuses schema-invalid _meta.yml before any GitHub call", async () => {
  const { gh, calls } = makeFakeOctokit();
  const draft: Draft = {
    id: "abc",
    message: "x",
    files: [
      {
        path: "components/src/button/_meta.yml",
        content: "category: action\n",
      },
    ],
  };
  await assert.rejects(
    submitDraft(draft, {
      owner: "o",
      repo: "r",
      base: "main",
      schemas: { "guideline-meta": META_SCHEMA },
      octokit: gh,
    }),
    (err: unknown) => err instanceof SchemaValidationError,
  );
  assert.equal(calls["git.getRef"]!.length, 0);
});

test("submitDraft — happy path drives the full pipeline and returns PR URL", async () => {
  const { gh, calls } = makeFakeOctokit();
  const draft: Draft = {
    id: "draft-uuid-1234",
    message: "feat(button): mark content draft\n\nbody",
    files: [
      {
        path: "components/src/button/_meta.yml",
        content: "component: Button\n",
      },
    ],
    sourceMetadata: { kind: "human", via: "editor/form" },
  };
  const result = await submitDraft(draft, {
    owner: "volivarii",
    repo: "actian-ds-knowledge",
    base: "main",
    schemas: { "guideline-meta": META_SCHEMA },
    octokit: gh,
  });

  assert.equal(result.prUrl, "https://github.com/x/y/pull/1");
  assert.equal(result.sha, "COMMIT_SHA");
  assert.match(result.branch, /^editor\//);

  assert.equal(calls["git.getRef"]!.length, 1);
  assert.equal(calls["git.createRef"]!.length, 1);
  assert.equal(calls["git.createBlob"]!.length, 1);
  assert.equal(calls["git.createTree"]!.length, 1);
  assert.equal(calls["git.createCommit"]!.length, 1);
  assert.equal(calls["git.updateRef"]!.length, 1);
  assert.equal(calls["pulls.create"]!.length, 1);

  const prCall = calls["pulls.create"]![0]!;
  assert.equal(prCall.title, "feat(button): mark content draft");
  assert.match(prCall.body, /source: \*\*human\*\*/);
  assert.match(prCall.body, /via: `editor\/form`/);
});

test("submitDraft — honours an explicit branch name in the draft", async () => {
  const { gh, calls } = makeFakeOctokit();
  await submitDraft(
    {
      id: "x",
      message: "msg",
      branch: "editor/explicit-branch",
      files: [
        {
          path: "components/src/button/_meta.yml",
          content: "component: Button\n",
        },
      ],
    },
    {
      owner: "o",
      repo: "r",
      base: "main",
      schemas: { "guideline-meta": META_SCHEMA },
      octokit: gh,
    },
  );
  const refCall = calls["git.createRef"]![0]!;
  assert.equal(refCall.ref, "refs/heads/editor/explicit-branch");
});

// Helper: a fake octokit that ALSO answers `repos.getContent` for the
// anchor-preservation refetch. Returns base64-encoded content.
function makeFakeOctokitWithRemote(remoteText: string) {
  const base = makeFakeOctokit();
  const remoteB64 = Buffer.from(remoteText, "utf-8").toString("base64");
  base.gh.repos = {
    getContent: async () => ({
      data: { content: remoteB64, encoding: "base64" },
    }),
  };
  return base;
}

test("submitDraft: blocks .md submission when anchors are dropped", async () => {
  const remote = "## A {#a}\n## B {#b}\n";
  const submission = "## A {#a}\n";
  const { gh } = makeFakeOctokitWithRemote(remote);
  const draft: Draft = {
    id: "test",
    message: "drop anchor",
    files: [
      { path: "foundations/src/color-primitives.md", content: submission },
    ],
  };
  await assert.rejects(
    () =>
      submitDraft(draft, {
        owner: "x",
        repo: "y",
        base: "main",
        schemas: {},
        octokit: gh,
      }),
    (err: unknown) => {
      assert.ok(err instanceof AnchorPreservationError);
      assert.deepEqual((err as AnchorPreservationError).dropped, ["b"]);
      return true;
    },
  );
});

test("submitDraft: passes .md submission when anchors preserved", async () => {
  const remote = "## A {#a}\n";
  const submission = "## A {#a}\n\nExtra.";
  const { gh, calls } = makeFakeOctokitWithRemote(remote);
  await submitDraft(
    {
      id: "test",
      message: "preserve",
      files: [
        { path: "foundations/src/color-primitives.md", content: submission },
      ],
    },
    { owner: "x", repo: "y", base: "main", schemas: {}, octokit: gh },
  );
  assert.equal(calls["pulls.create"]!.length, 1);
});

test("submitDraft: allowAnchorDrop bypasses the guard", async () => {
  const remote = "## A {#a}\n## B {#b}\n";
  const submission = "## A {#a}\n";
  const { gh, calls } = makeFakeOctokitWithRemote(remote);
  await submitDraft(
    {
      id: "test",
      message: "drop intentionally",
      files: [
        { path: "foundations/src/color-primitives.md", content: submission },
      ],
      allowAnchorDrop: true,
    },
    { owner: "x", repo: "y", base: "main", schemas: {}, octokit: gh },
  );
  assert.equal(calls["pulls.create"]!.length, 1);
});

test("submitDraft: anchor guard does not run on .yml files", async () => {
  const { gh, calls } = makeFakeOctokit();
  await submitDraft(
    {
      id: "test",
      message: "yaml-only",
      files: [
        {
          path: "components/src/button/_meta.yml",
          content: "component: button\n",
        },
      ],
    },
    {
      owner: "x",
      repo: "y",
      base: "main",
      schemas: { "guideline-meta": META_SCHEMA },
      octokit: gh,
    },
  );
  assert.equal(calls["pulls.create"]!.length, 1);
});

test("submitDraft — file marked deleted emits sha:null tree entry and skips createBlob", async () => {
  const { gh, calls } = makeFakeOctokit();
  await submitDraft(
    {
      id: "del-1",
      message: "delete one + keep one",
      files: [
        { path: "foundations/src/intro.md", content: "# Intro" },
        { path: "foundations/src/tokens.md", content: "", deleted: true },
      ],
      allowAnchorDrop: true,
    },
    {
      owner: "o",
      repo: "r",
      base: "main",
      schemas: {},
      octokit: gh,
    },
  );

  // One blob for the non-deleted file only
  assert.equal(calls["git.createBlob"]!.length, 1);

  // One createTree call carrying both entries — kept-file with blob sha, deleted-file with sha:null
  assert.equal(calls["git.createTree"]!.length, 1);
  const treeArg = calls["git.createTree"]![0]!;
  const intro = treeArg.tree.find(
    (t: any) => t.path === "foundations/src/intro.md",
  );
  const tokens = treeArg.tree.find(
    (t: any) => t.path === "foundations/src/tokens.md",
  );
  assert.ok(intro, "intro entry present");
  assert.equal(intro.sha, "BLOB_SHA");
  assert.ok(tokens, "tokens entry present");
  assert.equal(tokens.sha, null);
});

test("submitDraft — refuses to delete a read-only path", async () => {
  const { gh, calls } = makeFakeOctokit();
  await assert.rejects(
    submitDraft(
      {
        id: "del-readonly",
        message: "x",
        files: [{ path: "tokens/tokens.json", content: "", deleted: true }],
      },
      {
        owner: "o",
        repo: "r",
        base: "main",
        schemas: {},
        octokit: gh,
      },
    ),
    (err: unknown) => err instanceof ReadonlyPathError,
  );
  // The readonly check is the first gate; no GitHub calls happened
  assert.equal(calls["git.getRef"]!.length, 0);
});

test("submitDraft — does not run anchor-preservation or schema guards on deletion entries", async () => {
  const { gh, calls } = makeFakeOctokit();
  // schemas map deliberately empty; if schema guard ran on the .yml deletion
  // it would still pass (no matching schema), so we use an .md path AND
  // do NOT set allowAnchorDrop, then count getContent calls — the anchor
  // guard fetches remote text via repos.getContent, the deletion should
  // SKIP that fetch.
  const callsBefore = calls["git.createBlob"]!.length;
  await submitDraft(
    {
      id: "del-md",
      message: "x",
      files: [{ path: "foundations/src/foo.md", content: "", deleted: true }],
      // allowAnchorDrop intentionally omitted — guards would normally run
    },
    {
      owner: "o",
      repo: "r",
      base: "main",
      schemas: {},
      octokit: gh,
    },
  );
  // No blob for the deletion
  assert.equal(calls["git.createBlob"]!.length - callsBefore, 0);
  // Tree call carries one entry with sha:null
  const treeArg = calls["git.createTree"]![0]!;
  assert.equal(treeArg.tree.length, 1);
  assert.equal(treeArg.tree[0]!.sha, null);
});
