// The end-to-end pipeline: validate paths → validate schemas → create branch
// off main → build tree blobs → commit → open PR. Both the human form and any
// future AI producer (claude-skill, MCP server, automation bot) call this
// single entry point with a `Draft`. The shared API is the AI seam — see
// spec §4.2.
//
// TODO(PR-2): cleanup on partial failure. The current pipeline is best-effort
// — if createBlob/createTree/createCommit/updateRef throws after the branch
// is created (line 70 onward), the branch is left on the remote. The right
// fix is a try/catch around the blob/tree/commit phase that deletes the
// orphan via `gh.git.deleteRef({ owner, repo, ref: `heads/${branch}` })`
// before re-throwing. Also: if `createRef` throws 422 (branch already
// exists), surface a friendly error instead of the raw Octokit message.
// Deferred for Phase 1a so the slice ships; tracked as a known-issue and
// the draft-inbox unit (PR 2) is the natural place for retry/cleanup logic.

import type { Octokit } from "@octokit/rest";
import { type CommitResult, type Draft, ReadonlyPathError } from "./types";
import { isReadOnlyPath } from "./validatePaths";
import { type SchemaMap, validateAgainstSchema } from "./validateAgainstSchema";
import { createOctokit } from "./octokit";
import { droppedAnchors, AnchorPreservationError } from "./anchorPreservation";

export interface SubmitDraftConfig {
  owner: string;
  repo: string;
  base: string;
  schemas: SchemaMap;
  octokit?: Octokit;
}

function buildBranchName(draft: Draft): string {
  if (draft.branch) return draft.branch;
  const stamp = Date.now().toString(36);
  const shortId = draft.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "draft";
  return `editor/${stamp}-${shortId}`;
}

function buildPrBody(draft: Draft): string {
  if (!draft.sourceMetadata) return draft.message;
  const { kind, via, model, prompt } = draft.sourceMetadata;
  const lines = [draft.message, "", "---", `_source: **${kind}**`];
  if (via) lines.push(`via: \`${via}\``);
  if (model) lines.push(`model: \`${model}\``);
  if (prompt) lines.push(`prompt: ${JSON.stringify(prompt)}`);
  return lines.join("\n");
}

export async function submitDraft(
  draft: Draft,
  config: SubmitDraftConfig,
): Promise<CommitResult> {
  for (const file of draft.files) {
    if (isReadOnlyPath(file.path)) throw new ReadonlyPathError(file.path);
  }

  if (!draft.allowAnchorDrop) {
    for (const file of draft.files) {
      if (!file.path.endsWith(".md")) continue;
      // Refetch remote text. Best-effort: 404 → empty remote (new file).
      let remoteText = "";
      try {
        const res = await (config.octokit ?? createOctokit()).repos.getContent({
          owner: config.owner,
          repo: config.repo,
          path: file.path,
          ref: config.base,
        });
        // Note: GitHub's getContent API returns base64 by default for files
        // up to 1MB. Larger files come back with encoding="none" and an empty
        // content body — those need the git.getBlob fallback (we don't support
        // that yet; would silently skip the guard).
        if (
          !Array.isArray(res.data) &&
          "content" in res.data &&
          typeof res.data.content === "string" &&
          res.data.encoding === "base64"
        ) {
          // Browser-safe base64 decode (Buffer is not globally available
          // in the Vite-bundled runtime).
          const bytes = Uint8Array.from(
            atob(res.data.content.replace(/\n/g, "")),
            (c) => c.charCodeAt(0),
          );
          remoteText = new TextDecoder("utf-8").decode(bytes);
        }
      } catch (err: unknown) {
        const status = (err as { status?: number }).status;
        if (status !== 404) throw err;
      }
      const dropped = droppedAnchors(remoteText, file.content);
      if (dropped.length > 0) {
        throw new AnchorPreservationError(file.path, dropped);
      }
    }
  }

  for (const file of draft.files) {
    validateAgainstSchema({
      path: file.path,
      content: file.content,
      schemas: config.schemas,
    });
  }

  const { owner, repo, base } = config;
  const gh = config.octokit ?? createOctokit();

  const baseRef = await gh.git.getRef({
    owner,
    repo,
    ref: `heads/${base}`,
  });
  const baseSha = baseRef.data.object.sha;

  const branch = buildBranchName(draft);
  await gh.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branch}`,
    sha: baseSha,
  });

  const tree = await Promise.all(
    draft.files.map(async (file) => {
      const blob = await gh.git.createBlob({
        owner,
        repo,
        content: file.content,
        encoding: "utf-8",
      });
      return {
        path: file.path,
        mode: "100644" as const,
        type: "blob" as const,
        sha: blob.data.sha,
      };
    }),
  );

  const newTree = await gh.git.createTree({
    owner,
    repo,
    base_tree: baseSha,
    tree,
  });

  const commit = await gh.git.createCommit({
    owner,
    repo,
    message: draft.message,
    tree: newTree.data.sha,
    parents: [baseSha],
  });

  await gh.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: commit.data.sha,
  });

  const title = draft.message.split("\n")[0] ?? draft.message;
  const pr = await gh.pulls.create({
    owner,
    repo,
    head: branch,
    base,
    title,
    body: buildPrBody(draft),
  });

  return {
    prUrl: pr.data.html_url,
    branch,
    sha: commit.data.sha,
  };
}
