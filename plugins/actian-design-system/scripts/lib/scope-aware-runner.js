"use strict";

function parseScope(s) {
  if (!s) return { kind: "full" };
  if (s === "full") return { kind: "full" };
  if (s.indexOf("single-unit:") === 0) {
    var id = s.slice("single-unit:".length);
    if (!id) return { kind: "full", unrecognized: true };
    return { kind: "single-unit", ids: [id] };
  }
  if (s.indexOf("multi-unit:") === 0) {
    var raw = s.slice("multi-unit:".length).replace(/^\[|\]$/g, "");
    var ids = raw.split(",").map(function (x) {
      return x.trim();
    }).filter(function (x) {
      return x.length > 0;
    });
    if (ids.length === 0) return { kind: "full", unrecognized: true };
    return { kind: "multi-unit", ids: ids };
  }
  return { kind: "full", unrecognized: true };
}

function matchesPattern(scope, pattern) {
  if (pattern === scope.raw) return true;
  if (pattern.indexOf(":*") !== -1) {
    var prefix = pattern.slice(0, pattern.indexOf(":*") + 1);
    return (scope.raw || "").indexOf(prefix) === 0;
  }
  return false;
}

function runGate(gateModule, data, opts) {
  opts = opts || {};
  var raw = opts.scope || "full";
  var scope = parseScope(raw);
  scope.raw = raw;

  var cfg = gateModule.gateConfig || {};

  if (Array.isArray(cfg.skipWhenScope)) {
    for (var i = 0; i < cfg.skipWhenScope.length; i++) {
      if (matchesPattern(scope, cfg.skipWhenScope[i])) {
        return {
          skipped: true,
          reason:
            "scope=" +
            raw +
            " matched skip pattern '" +
            cfg.skipWhenScope[i] +
            "'",
          findings: [],
        };
      }
    }
  }

  var result = gateModule.run(data, opts);
  if (
    typeof cfg.filterFindingsByScope === "function" &&
    Array.isArray(result.findings)
  ) {
    result.findings = result.findings.filter(function (f) {
      return cfg.filterFindingsByScope(f, scope);
    });
  }
  return result;
}

module.exports = { parseScope, runGate, matchesPattern };
