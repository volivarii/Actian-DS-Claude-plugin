import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fetchLatestCommit,
  formatRelativeTime,
} from "../../src/lib/derivedFields";

test("formatRelativeTime: <60s → 'just now'", () => {
  const now = Date.parse("2026-05-24T12:00:00Z");
  assert.equal(formatRelativeTime("2026-05-24T11:59:30Z", now), "just now");
});

test("formatRelativeTime: minutes", () => {
  const now = Date.parse("2026-05-24T12:00:00Z");
  assert.equal(formatRelativeTime("2026-05-24T11:55:00Z", now), "5m ago");
});

test("formatRelativeTime: hours", () => {
  const now = Date.parse("2026-05-24T12:00:00Z");
  assert.equal(formatRelativeTime("2026-05-24T09:00:00Z", now), "3h ago");
});

test("formatRelativeTime: days", () => {
  const now = Date.parse("2026-05-24T12:00:00Z");
  assert.equal(formatRelativeTime("2026-05-22T12:00:00Z", now), "2d ago");
});

test("formatRelativeTime: months", () => {
  const now = Date.parse("2026-05-24T12:00:00Z");
  assert.equal(formatRelativeTime("2026-03-01T12:00:00Z", now), "2mo ago");
});

test("formatRelativeTime: years", () => {
  const now = Date.parse("2026-05-24T12:00:00Z");
  assert.equal(formatRelativeTime("2024-01-01T12:00:00Z", now), "2y ago");
});

test("formatRelativeTime: invalid input returns empty string", () => {
  assert.equal(formatRelativeTime("not-a-date"), "");
});

test("fetchLatestCommit: returns null when no commits found", async () => {
  const gh = {
    repos: {
      listCommits: async () => ({ data: [] }),
    },
  } as any;
  // Skip sessionStorage interference for this test.
  if (typeof globalThis.sessionStorage !== "undefined") {
    globalThis.sessionStorage.clear();
  }
  const info = await fetchLatestCommit(
    gh,
    "foundations/src/color-primitives.md",
  );
  assert.equal(info, null);
});

test("fetchLatestCommit: extracts author login + date from latest commit", async () => {
  const gh = {
    repos: {
      listCommits: async () => ({
        data: [
          {
            author: { login: "kristina" },
            commit: {
              author: { date: "2026-05-20T10:00:00Z" },
              committer: { date: "2026-05-20T10:00:00Z" },
            },
          },
        ],
      }),
    },
  } as any;
  if (typeof globalThis.sessionStorage !== "undefined") {
    globalThis.sessionStorage.clear();
  }
  const info = await fetchLatestCommit(gh, "components/src/button/content.md");
  assert.deepEqual(info, {
    author: "kristina",
    date: "2026-05-20T10:00:00Z",
  });
});

test("fetchLatestCommit: handles missing author gracefully", async () => {
  const gh = {
    repos: {
      listCommits: async () => ({
        data: [
          {
            author: null,
            commit: {
              author: { date: "2026-05-20T10:00:00Z" },
              committer: { date: "2026-05-20T10:00:00Z" },
            },
          },
        ],
      }),
    },
  } as any;
  if (typeof globalThis.sessionStorage !== "undefined") {
    globalThis.sessionStorage.clear();
  }
  const info = await fetchLatestCommit(gh, "components/src/button/usage.md");
  assert.equal(info?.author, null);
  assert.equal(info?.date, "2026-05-20T10:00:00Z");
});

test("fetchLatestCommit: returns null when fetch throws", async () => {
  const gh = {
    repos: {
      listCommits: async () => {
        throw new Error("rate limited");
      },
    },
  } as any;
  if (typeof globalThis.sessionStorage !== "undefined") {
    globalThis.sessionStorage.clear();
  }
  const info = await fetchLatestCommit(gh, "components/src/button/design.md");
  assert.equal(info, null);
});
