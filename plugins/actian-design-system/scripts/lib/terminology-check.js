"use strict";

/**
 * terminology-check.js: the two copy checks every text a skill writes goes
 * through. findTerminologyIssues(data) flags a word the app context says not to
 * use (app-context.json `terminology[].notUse`), naming the word to use instead;
 * findAvoidWords(data) flags a word the content rules list under `avoid`
 * (words-to-avoid.json). Both read `data.screens[]`: each screen's
 * pageHeader.title and pageHeader.subtitle, and every node under
 * `content[]` (its `content` string and its string props). Each finding is
 * `{ severity: "P1", check, screen, screenId, path, value, found, suggestion }`
 * (avoid-word adds `reason`). No side effects at load; the vendored JSON is read
 * on each call.
 */

var fs = require("fs");
var path = require("path");

var PATHS = require(path.join(__dirname, "paths.js"));

// The prop keys that carry visible copy, lowercased. Only a prop whose base key
// (the part before any "#" suffix) is one of these is scanned for avoid-words,
// so a structural axis (State, Type, Variant, Size, Mode) is never read as
// copy: State "disabled", Type "primary" and State "press" all hold an avoid
// token and none of them is text a reader sees. When in doubt, a key stays out.
var COPY_PROP_KEYS_LOWER = (function () {
  var base = [
    "Label",
    "Input Text",
    "Title",
    "Subtitle",
    "Dropdown Text",
    "Label Text",
    "Caption Text",
    "Feature",
    "Flow",
    "User",
    "Text",
    "Body",
    "Placeholder",
    "Description",
    "Message",
    "Heading",
    "Helper Text",
    "Content",
    "Tab Text",
    "Tab label",
    "Value",
  ];
  var set = {};
  for (var i = 0; i < base.length; i++) {
    set[base[i].toLowerCase()] = true;
  }
  return set;
})();

// ---------------------------------------------------------------------------
// Walk content nodes recursively
// ---------------------------------------------------------------------------

function walkNodes(nodes, screenName, pathPrefix, visitor) {
  if (!Array.isArray(nodes)) return;
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    var nodePath = pathPrefix + "[" + i + "]";
    visitor(node, screenName, nodePath);
    if (node.children) {
      walkNodes(node.children, screenName, nodePath + ".children", visitor);
    }
  }
}


// ---------------------------------------------------------------------------
// Terminology: the app context's notUse words
// ---------------------------------------------------------------------------

function loadTerminology() {
  var appContextPath = PATHS.appContext;
  try {
    var appContext = JSON.parse(fs.readFileSync(appContextPath, "utf8"));
    return appContext.terminology || {};
  } catch (e) {
    return null;
  }
}

function buildTerminologyRules(terminology) {
  var rules = [];
  var keys = Object.keys(terminology);
  for (var i = 0; i < keys.length; i++) {
    var entry = terminology[keys[i]];
    if (!entry.notUse || entry.notUse.length === 0) continue;
    for (var j = 0; j < entry.notUse.length; j++) {
      var wrong = entry.notUse[j];
      // Strip parenthetical context notes like "dataset (when curated)"
      var cleanWrong = wrong.replace(/\s*\(.*?\)\s*$/, "").trim();
      if (cleanWrong.length < 3) continue;
      var escaped = cleanWrong.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      rules.push({
        pattern: new RegExp("\\b" + escaped + "\\b", "i"),
        wrong: cleanWrong,
        correct: entry.use,
      });
    }
  }
  return rules;
}

var TERMINOLOGY_SKIP_PROPS = {
  variant: 1,
  name: 1,
  template: 1,
  id: 1,
  dsslug: 1,
};

function knownTermsFrom(data, terminology) {
  var out = [],
    seen = {};
  function add(t) {
    if (typeof t !== "string") return;
    var s = t.trim();
    if (s.length < 3 || seen[s.toLowerCase()]) return;
    seen[s.toLowerCase()] = 1;
    out.push(s);
  }
  Object.keys(terminology || {}).forEach(function (k) {
    add(terminology[k] && terminology[k].use);
  });
  var g = data && data.meta && data.meta._glossary ? data.meta._glossary : {};
  if (g.chrome) {
    if (g.chrome.header) add(g.chrome.header.type);
    (g.chrome.sidebar || []).forEach(function (s) {
      add(s && s.label);
    });
  }
  (g.entityProperties || []).forEach(function (p) {
    add(p && p.label);
  });
  (g.relationships || []).forEach(function (r) {
    add(r && r.label);
  });
  return out;
}

function maskKnownTerms(text, knownTerms) {
  var out = text;
  for (var i = 0; i < knownTerms.length; i++) {
    var escaped = knownTerms[i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    var re = new RegExp("\\b" + escaped + "s?\\b", "gi");
    out = out.replace(re, function (m) {
      return new Array(m.length + 1).join(" ");
    });
  }
  return out;
}

function findTerminologyIssuesRaw(data) {
  var terminology = loadTerminology();
  if (!terminology) return [];

  var rules = buildTerminologyRules(terminology);
  if (rules.length === 0) return [];

  var known = knownTermsFrom(data, terminology);
  var issues = [];

  function checkText(text, screenName, nodePath) {
    if (!text || typeof text !== "string") return;
    var masked = maskKnownTerms(text, known);
    for (var r = 0; r < rules.length; r++) {
      if (rules[r].pattern.test(masked)) {
        issues.push({
          severity: "P1",
          check: "terminology",
          screen: screenName,
          screenId: screen.id || "",
          path: nodePath,
          value: text,
          found: rules[r].wrong,
          suggestion: 'use "' + rules[r].correct + '"',
        });
      }
    }
  }

  for (var si = 0; si < data.screens.length; si++) {
    var screen = data.screens[si];
    var screenName = screen.name || "Screen " + (si + 1);

    if (screen.pageHeader) {
      checkText(screen.pageHeader.title, screenName, "pageHeader.title");
      checkText(screen.pageHeader.subtitle, screenName, "pageHeader.subtitle");
    }

    walkNodes(
      screen.content,
      screenName,
      "content",
      function (node, sName, nPath) {
        if (node.content) {
          checkText(node.content, sName, nPath + ".content");
        }
        if (node.props) {
          var propKeys = Object.keys(node.props);
          for (var pk = 0; pk < propKeys.length; pk++) {
            if (TERMINOLOGY_SKIP_PROPS[String(propKeys[pk]).toLowerCase()])
              continue;
            var val = node.props[propKeys[pk]];
            if (typeof val === "string") {
              checkText(val, sName, nPath + ".props." + propKeys[pk]);
            }
          }
        }
      },
    );
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Words to avoid: soft warnings from the knowledge's
// structured content rules. Mirrors the terminology check: load the vendored
// JSON, build word-boundary rules from each rule's avoid[] tokens, scan
// visible copy. Advisory rules (avoid: []) contribute no patterns.
// ---------------------------------------------------------------------------

function loadWordsToAvoid() {
  var p = PATHS.content && PATHS.content.wordsToAvoid;
  if (!p) return null;
  try {
    var doc = JSON.parse(fs.readFileSync(p, "utf8"));
    return Array.isArray(doc.rules) ? doc.rules : null;
  } catch (e) {
    return null;
  }
}

function buildAvoidWordRules(rules) {
  var out = [];
  for (var i = 0; i < rules.length; i++) {
    var rule = rules[i];
    if (!rule.avoid || rule.avoid.length === 0) continue; // advisory: no pattern
    for (var j = 0; j < rule.avoid.length; j++) {
      var token = String(rule.avoid[j]).trim();
      // Threshold is 2 (not 3 like the terminology check): "we"/"us" are valid 2-char avoid tokens.
      if (token.length < 2) continue;
      var escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out.push({
        pattern: new RegExp("\\b" + escaped + "\\b", "i"),
        wrong: token,
        reason: rule.reason,
        suggestion: (rule.example && rule.example.do) || "",
      });
    }
  }
  return out;
}

function findAvoidWordsRaw(data) {
  var rules = loadWordsToAvoid();
  if (!rules) return [];
  var avoidRules = buildAvoidWordRules(rules);
  if (avoidRules.length === 0) return [];

  var issues = [];

  function checkText(text, screenName, screen, nodePath) {
    if (!text || typeof text !== "string") return;
    for (var r = 0; r < avoidRules.length; r++) {
      if (avoidRules[r].pattern.test(text)) {
        issues.push({
          severity: "P1",
          check: "avoid-word",
          screen: screenName,
          screenId: screen.id || "",
          path: nodePath,
          value: text,
          found: avoidRules[r].wrong,
          suggestion: avoidRules[r].suggestion,
          reason: avoidRules[r].reason,
        });
      }
    }
  }

  for (var si = 0; si < data.screens.length; si++) {
    var screen = data.screens[si];
    var screenName = screen.name || "Screen " + (si + 1);

    if (screen.pageHeader) {
      checkText(
        screen.pageHeader.title,
        screenName,
        screen,
        "pageHeader.title",
      );
      checkText(
        screen.pageHeader.subtitle,
        screenName,
        screen,
        "pageHeader.subtitle",
      );
    }

    walkNodes(
      screen.content,
      screenName,
      "content",
      function (node, sName, nPath) {
        if (node.content)
          checkText(node.content, sName, screen, nPath + ".content");
        if (node.props) {
          var propKeys = Object.keys(node.props);
          for (var pk = 0; pk < propKeys.length; pk++) {
            // Only scan copy-bearing props. Strip any "#node-id" suffix (e.g.
            // "Label#15:0" → "Label") before the case-insensitive lookup.
            // Structural axes (State, Type, Size, Variant, Mode, etc.) are
            // excluded, preventing false-positives from values like "disabled",
            // "press", or "type-a" that are component variant identifiers, not
            // visible copy.
            var baseKey = propKeys[pk].split("#")[0];
            if (!COPY_PROP_KEYS_LOWER[baseKey.toLowerCase()]) continue;
            var val = node.props[propKeys[pk]];
            if (typeof val === "string")
              checkText(val, sName, screen, nPath + ".props." + propKeys[pk]);
          }
        }
      },
    );
  }

  return issues;
}

// A data file with no screens[] array has no copy to check.
function hasScreens(data) {
  return !!(data && Array.isArray(data.screens));
}

function findTerminologyIssues(data) {
  return hasScreens(data) ? findTerminologyIssuesRaw(data) : [];
}

function findAvoidWords(data) {
  return hasScreens(data) ? findAvoidWordsRaw(data) : [];
}

module.exports = {
  findTerminologyIssues: findTerminologyIssues,
  findAvoidWords: findAvoidWords,
};
