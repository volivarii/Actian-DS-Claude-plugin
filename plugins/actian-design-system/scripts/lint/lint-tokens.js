"use strict";

// Token-quality lint for the Actian DS vendored token files.
// Pure + dependency-free so it runs identically in CI and locally.

// Flags `var(--zen-*)` references in tokens.css that have no matching
// `--zen-*:` definition. Catches the class of bug where a manual token
// edit points at a variable that was never declared.
function lintCssVarRefs(cssText) {
  var defined = new Set();
  var defRe = /^\s*(--zen-[A-Za-z0-9-]+)\s*:/gm;
  var m;
  while ((m = defRe.exec(cssText))) defined.add(m[1]);

  var findings = [];
  var seen = new Set();
  var refRe = /var\(\s*(--zen-[A-Za-z0-9-]+)/g;
  while ((m = refRe.exec(cssText))) {
    var name = m[1];
    if (!defined.has(name) && !seen.has(name)) {
      seen.add(name);
      findings.push({
        rule: "broken-ref",
        severity: "error",
        token: name,
        message: "CSS references var(" + name + ") but it is never defined",
      });
    }
  }
  return findings;
}

module.exports = { lintCssVarRefs: lintCssVarRefs };
