"use strict";

// Posts a semantic-diff comment on the PR after the derive workflow regenerates
// the foundations JSONs. Reads the git diff between HEAD~1 (pre-regenerate) and
// HEAD (post-regenerate) for foundation JSON files and produces a plain-language
// summary.

var { execSync } = require("child_process");
var fs = require("fs");

function gitShow(rev, file) {
  try {
    return execSync("git show " + rev + ":" + file, { encoding: "utf-8" });
  } catch (e) {
    return null; // file did not exist at that rev
  }
}

function listChangedFiles() {
  var out = execSync(
    "git diff --name-only HEAD~1 HEAD -- plugins/actian-design-system/docs/foundations/",
    { encoding: "utf-8" }
  );
  return out.trim().split("\n").filter(Boolean);
}

// Flatten an object/array into a key->value map keyed by dotted path.
// Skips _meta block (we don't want to noise the summary with auto-gen marker).
function flattenForDiff(obj, prefix) {
  var result = {};
  if (obj === null || typeof obj !== "object") {
    result[prefix || "(root)"] = obj;
    return result;
  }
  if (Array.isArray(obj)) {
    obj.forEach(function (v, i) {
      Object.assign(result, flattenForDiff(v, prefix + "[" + i + "]"));
    });
    return result;
  }
  Object.keys(obj).forEach(function (k) {
    if (k === "_meta") return;
    var p = prefix ? prefix + "." + k : k;
    Object.assign(result, flattenForDiff(obj[k], p));
  });
  return result;
}

function diffEntries(beforeFlat, afterFlat) {
  var added = [], removed = [], changed = [];
  Object.keys(afterFlat).forEach(function (k) {
    if (!(k in beforeFlat)) {
      added.push(k);
    } else if (JSON.stringify(beforeFlat[k]) !== JSON.stringify(afterFlat[k])) {
      changed.push({ key: k, before: beforeFlat[k], after: afterFlat[k] });
    }
  });
  Object.keys(beforeFlat).forEach(function (k) {
    if (!(k in afterFlat)) removed.push(k);
  });
  return { added: added, removed: removed, changed: changed };
}

function summarizeFile(file) {
  var beforeRaw = gitShow("HEAD~1", file);
  var afterRaw = gitShow("HEAD", file);
  var before, after;
  try {
    before = beforeRaw ? JSON.parse(beforeRaw) : {};
  } catch (e) {
    before = {};
  }
  try {
    after = afterRaw ? JSON.parse(afterRaw) : {};
  } catch (e) {
    after = {};
  }
  var d = diffEntries(flattenForDiff(before, ""), flattenForDiff(after, ""));
  return {
    file: file,
    added: d.added.length,
    removed: d.removed.length,
    changed: d.changed.length,
    detail: d,
  };
}

function renderComment(summaries) {
  var lines = ["## Foundations regenerated", ""];
  lines.push("CI re-derived the foundation JSONs from `docs/foundations.md`. Summary of semantic changes:");
  lines.push("");
  summaries.forEach(function (s) {
    var shortFile = s.file.replace("plugins/actian-design-system/docs/foundations/", "");
    lines.push("**`" + shortFile + "`** — " +
      s.added + " added, " + s.removed + " removed, " + s.changed + " changed");
    if (s.detail.changed.length > 0 && s.detail.changed.length <= 10) {
      s.detail.changed.forEach(function (c) {
        lines.push("  - `" + c.key + "`: " + JSON.stringify(c.before) + " → " + JSON.stringify(c.after));
      });
    } else if (s.detail.changed.length > 10) {
      lines.push("  - (" + s.detail.changed.length + " changes — see file diff)");
    }
  });
  lines.push("");
  lines.push("_If anything looks wrong, edit `docs/foundations.md` and CI will regenerate._");
  return lines.join("\n");
}

function postComment(prNumber, body) {
  var tmpFile = "/tmp/foundations-comment.md";
  fs.writeFileSync(tmpFile, body);
  execSync("gh pr comment " + prNumber + " --body-file " + tmpFile, {
    stdio: "inherit",
    env: process.env,
  });
}

function main() {
  var prNumber = process.env.PR_NUMBER;
  if (!prNumber) {
    console.error("PR_NUMBER env var required");
    process.exit(1);
  }
  var files = listChangedFiles();
  if (files.length === 0) {
    console.log("No foundations file changes; skipping comment.");
    return;
  }
  var summaries = files.map(summarizeFile);
  var body = renderComment(summaries);
  postComment(prNumber, body);
  console.log("Posted comment on PR #" + prNumber);
}

main();
