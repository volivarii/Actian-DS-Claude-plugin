"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  matchesRange,
  resolveTargetTag,
  compareSemver,
  notifyIfNewerAvailable,
} = require("../../scripts/vendor/vendor-snapshot.js");

test("vendor-snapshot range resolution", async (t) => {
  await t.test("~ range matches same minor, any patch >=", () => {
    assert.equal(matchesRange("0.1.0", "~0.1.0"), true);
    assert.equal(matchesRange("0.1.5", "~0.1.0"), true);
    assert.equal(matchesRange("0.1.99", "~0.1.0"), true);
    assert.equal(matchesRange("0.2.0", "~0.1.0"), false);
    assert.equal(matchesRange("1.1.0", "~0.1.0"), false);
    assert.equal(matchesRange("0.0.9", "~0.1.0"), false);
  });

  await t.test("^ range on pre-1.0 behaves like ~ (patches only)", () => {
    assert.equal(matchesRange("0.1.0", "^0.1.0"), true);
    assert.equal(matchesRange("0.1.5", "^0.1.0"), true);
    assert.equal(matchesRange("0.2.0", "^0.1.0"), false);
  });

  await t.test("^ range on >=1.0 allows minor + patch", () => {
    assert.equal(matchesRange("1.1.0", "^1.0.0"), true);
    assert.equal(matchesRange("1.5.3", "^1.0.0"), true);
    assert.equal(matchesRange("2.0.0", "^1.0.0"), false);
    assert.equal(matchesRange("0.9.0", "^1.0.0"), false);
  });

  await t.test("exact version range matches only that version", () => {
    assert.equal(matchesRange("0.1.1", "0.1.1"), true);
    assert.equal(matchesRange("0.1.2", "0.1.1"), false);
  });

  await t.test("compareSemver orders correctly", () => {
    assert.equal(compareSemver("0.1.0", "0.1.1"), -1);
    assert.equal(compareSemver("0.1.1", "0.1.0"), 1);
    assert.equal(compareSemver("0.1.0", "0.1.0"), 0);
    assert.equal(compareSemver("0.2.0", "0.1.99"), 1);
    assert.equal(compareSemver("1.0.0", "0.99.99"), 1);
  });

  await t.test("resolveTargetTag returns highest matching", () => {
    const tags = ["v0.1.0", "v0.1.1", "v0.1.2", "v0.2.0"];
    assert.equal(resolveTargetTag(tags, "~0.1.0"), "v0.1.2");
    assert.equal(resolveTargetTag(tags, "~0.2.0"), "v0.2.0");
  });

  await t.test("resolveTargetTag returns null when no tag matches", () => {
    const tags = ["v0.1.0", "v0.1.1"];
    assert.equal(resolveTargetTag(tags, "~0.2.0"), null);
  });

  await t.test("resolveTargetTag returns null for empty tag list", () => {
    assert.equal(resolveTargetTag([], "~0.1.0"), null);
  });

  await t.test("resolveTargetTag ignores tags with invalid semver", () => {
    const tags = ["v0.1.0", "garbage", "v0.1.1", "not-a-tag"];
    assert.equal(resolveTargetTag(tags, "~0.1.0"), "v0.1.1");
  });

  await t.test("resolveTargetTag ignores pre-release suffixed tags", () => {
    const tags = ["v0.1.0", "v0.1.1-beta", "v0.1.0-rc.1", "v0.1.2-pre"];
    assert.equal(resolveTargetTag(tags, "~0.1.0"), "v0.1.0");
  });

  await t.test("resolveTargetTag handles tags without v prefix", () => {
    const tags = ["0.1.0", "0.1.1"];
    assert.equal(resolveTargetTag(tags, "~0.1.0"), "v0.1.1");
  });

  // ---- Less-than operator (2026-05-13) ----
  // Added to let consumers express "anything up to the next major" without
  // per-minor re-pinning. Useful for the federated-substrate model where
  // knowledge minor bumps are designed to be additive.

  await t.test("< range matches anything strictly less", () => {
    assert.equal(matchesRange("0.0.1", "<1.0.0"), true);
    assert.equal(matchesRange("0.5.0", "<1.0.0"), true);
    assert.equal(matchesRange("0.99.99", "<1.0.0"), true);
    assert.equal(matchesRange("1.0.0", "<1.0.0"), false);
    assert.equal(matchesRange("1.0.1", "<1.0.0"), false);
    assert.equal(matchesRange("2.0.0", "<1.0.0"), false);
  });

  await t.test("<= range matches everything up to and including bound", () => {
    assert.equal(matchesRange("0.5.0", "<=0.5.0"), true);
    assert.equal(matchesRange("0.4.99", "<=0.5.0"), true);
    assert.equal(matchesRange("0.5.1", "<=0.5.0"), false);
  });

  await t.test("< range tolerates whitespace", () => {
    assert.equal(matchesRange("0.5.0", "< 1.0.0"), true);
    assert.equal(matchesRange("0.5.0", "  <1.0.0  "), true);
  });

  await t.test(
    "resolveTargetTag with < range picks highest below bound",
    () => {
      const tags = ["v0.5.0", "v0.6.0", "v0.6.1", "v1.0.0", "v1.1.0"];
      assert.equal(resolveTargetTag(tags, "<1.0.0"), "v0.6.1");
    },
  );

  // ---- notifyIfNewerAvailable (Design E) ----
  // Emits ::warning:: when range excludes a newer-available tag. Captures
  // stdout to assert on the warning text.

  function captureStdout(fn) {
    const original = process.stdout.write.bind(process.stdout);
    const captured = [];
    process.stdout.write = (chunk) => {
      captured.push(String(chunk));
      return true;
    };
    try {
      fn();
    } finally {
      process.stdout.write = original;
    }
    return captured.join("");
  }

  await t.test(
    "notifyIfNewerAvailable warns when newer tag exists outside range",
    () => {
      const tags = ["v0.6.0", "v0.6.1", "v0.7.0", "v1.0.0"];
      const captured = captureStdout(() => {
        const warned = notifyIfNewerAvailable(tags, "~0.6.0", "v0.6.1");
        assert.equal(warned, true);
      });
      assert.match(captured, /^::warning::/);
      assert.match(captured, /v1\.0\.0/);
      assert.match(captured, /resolves to v0\.6\.1/);
    },
  );

  await t.test(
    "notifyIfNewerAvailable is silent when resolved is already highest",
    () => {
      const tags = ["v0.5.0", "v0.6.0", "v0.6.1"];
      const captured = captureStdout(() => {
        const warned = notifyIfNewerAvailable(tags, "<1.0.0", "v0.6.1");
        assert.equal(warned, false);
      });
      assert.equal(captured, "");
    },
  );

  await t.test(
    "notifyIfNewerAvailable ignores invalid/pre-release tags",
    () => {
      const tags = ["v0.6.1", "v0.7.0-rc.1", "garbage"];
      const captured = captureStdout(() => {
        const warned = notifyIfNewerAvailable(tags, "~0.6.0", "v0.6.1");
        assert.equal(warned, false);
      });
      assert.equal(captured, "");
    },
  );
});
