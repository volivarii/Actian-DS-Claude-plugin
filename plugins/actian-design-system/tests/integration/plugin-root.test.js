"use strict";
/**
 * plugin-root.test.js: scripts/lib/plugin-root.sh must make CLAUDE_PLUGIN_ROOT
 * name the plugin root in every shell, including the Cowork VM where bash sees
 * the plugin under /sessions/<vm>/mnt/.remote-plugins/<id>/ and not the Mac
 * path the skill header names. Three layouts + the error path, run in real bash.
 * Run: "$NODE_BIN" --test tests/integration/plugin-root.test.js
 */
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var os = require("os");
var path = require("path");
var { spawnSync } = require("node:child_process");

var PLUGIN_ROOT = fs.realpathSync(path.resolve(__dirname, "..", ".."));
var SCRIPT = path.join(PLUGIN_ROOT, "scripts", "lib", "plugin-root.sh");
var CANON = path.join(PLUGIN_ROOT, "references", "context", "plugin-root.md");
var SKILLS_DIR = path.join(PLUGIN_ROOT, "skills");

function bash(cmd, envOverrides) {
  var env = Object.assign({}, process.env, envOverrides || {});
  delete env.CLAUDE_PLUGIN_ROOT;
  if (envOverrides && envOverrides.CLAUDE_PLUGIN_ROOT) env.CLAUDE_PLUGIN_ROOT = envOverrides.CLAUDE_PLUGIN_ROOT;
  var r = spawnSync("bash", ["-c", cmd], { env: env, encoding: "utf8" });
  return { status: r.status, out: (r.stdout || "").trim(), err: r.stderr || "" };
}

// A fake Cowork mount: the decoy sorts FIRST so a match by position would pick
// the wrong plugin; only a match by manifest name picks ours.
function fakeRemoteTree() {
  var tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plugin-root-"));
  var remote = path.join(tmp, "sessions", "vm-a", "mnt", ".remote-plugins");
  var decoy = path.join(remote, "plugin_01OTHER");
  var ours = path.join(remote, "plugin_02OURS");
  fs.mkdirSync(path.join(decoy, ".claude-plugin"), { recursive: true });
  fs.mkdirSync(path.join(ours, ".claude-plugin"), { recursive: true });
  fs.writeFileSync(path.join(decoy, ".claude-plugin", "plugin.json"), JSON.stringify({ name: "figma", version: "2.2.107" }));
  fs.writeFileSync(path.join(ours, ".claude-plugin", "plugin.json"), JSON.stringify({ name: "actian-design-system", version: "0.0.0" }));
  return { tmp: tmp, remote: remote, ours: fs.realpathSync(ours) };
}

function canonicalBlock() {
  var md = fs.readFileSync(CANON, "utf8");
  var m = md.match(/<!-- plugin-root:begin -->[\s\S]*?<!-- plugin-root:end -->/);
  assert.ok(m, "references/context/plugin-root.md must carry the plugin-root:begin/end markers");
  return m[0];
}

describe("scripts/lib/plugin-root.sh", function () {
  it("keeps CLAUDE_PLUGIN_ROOT when it is already set", function () {
    var r = bash('source "' + SCRIPT + '" && printf "%s" "$CLAUDE_PLUGIN_ROOT"', { CLAUDE_PLUGIN_ROOT: "/already/set" });
    assert.equal(r.status, 0, r.err);
    assert.equal(r.out, "/already/set");
  });

  it("resolves the mounted plugin by manifest name under CLAUDE_REMOTE_PLUGINS_ROOT, skipping other plugins", function () {
    var t = fakeRemoteTree();
    var r = bash('source "' + SCRIPT + '" && printf "%s" "$CLAUDE_PLUGIN_ROOT"', { CLAUDE_REMOTE_PLUGINS_ROOT: t.remote });
    assert.equal(r.status, 0, r.err);
    assert.equal(fs.realpathSync(r.out), t.ours);
  });

  it("falls back to the plugin that contains the script when no mount matches", function () {
    var empty = fs.mkdtempSync(path.join(os.tmpdir(), "plugin-root-empty-"));
    var r = bash('source "' + SCRIPT + '" && printf "%s" "$CLAUDE_PLUGIN_ROOT"', { CLAUDE_REMOTE_PLUGINS_ROOT: empty });
    assert.equal(r.status, 0, r.err);
    assert.equal(fs.realpathSync(r.out), PLUGIN_ROOT);
  });

  it("returns 1 and names both places it looked when nothing matches", function () {
    var tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plugin-root-nowhere-"));
    var copy = path.join(tmp, "scripts", "lib", "plugin-root.sh");
    fs.mkdirSync(path.dirname(copy), { recursive: true });
    fs.copyFileSync(SCRIPT, copy);
    var empty = fs.mkdtempSync(path.join(os.tmpdir(), "plugin-root-empty-"));
    var r = bash('source "' + copy + '" || exit 7; printf "%s" "$CLAUDE_PLUGIN_ROOT"', { CLAUDE_REMOTE_PLUGINS_ROOT: empty });
    assert.equal(r.status, 7, "source must return 1 so the caller can stop");
    assert.ok(r.err.indexOf(empty) !== -1, "error names the remote root it searched: " + r.err);
    assert.ok(r.err.indexOf("plugin.json") !== -1, "error names the manifest it looked for: " + r.err);
    assert.ok(r.err.indexOf("CLAUDE_PLUGIN_ROOT") !== -1, "error tells the reader what to export: " + r.err);
  });
});

describe("the skill preamble (references/context/plugin-root.md)", function () {
  it("its bash one-liner resolves the same fake mount without sourcing anything", function () {
    var block = canonicalBlock();
    var fence = block.match(/```bash\n([\s\S]*?)\n```/);
    assert.ok(fence, "the canonical block carries one bash fence");
    var t = fakeRemoteTree();
    var r = bash(fence[1] + '\nprintf "%s" "$CLAUDE_PLUGIN_ROOT"', { CLAUDE_REMOTE_PLUGINS_ROOT: t.remote });
    assert.equal(r.status, 0, r.err);
    assert.equal(fs.realpathSync(r.out), t.ours);
  });

  it("is copied verbatim, exactly once, into every skills/*/SKILL.md", function () {
    var block = canonicalBlock();
    var dirs = fs.readdirSync(SKILLS_DIR).filter(function (d) {
      return fs.existsSync(path.join(SKILLS_DIR, d, "SKILL.md"));
    });
    assert.ok(dirs.length >= 6, "expected the skill set to be present, found " + dirs.length);
    dirs.forEach(function (d) {
      var src = fs.readFileSync(path.join(SKILLS_DIR, d, "SKILL.md"), "utf8");
      var count = src.split(block).length - 1;
      assert.equal(count, 1, d + "/SKILL.md must carry the canonical plugin-root block exactly once (found " + count + ")");
      var h1 = src.indexOf("\n# ");
      assert.ok(src.indexOf(block) > h1, d + "/SKILL.md: the block sits after the H1");
    });
  });
});
