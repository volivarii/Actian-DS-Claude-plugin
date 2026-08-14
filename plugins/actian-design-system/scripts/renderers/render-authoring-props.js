#!/usr/bin/env node
"use strict";
// The built-leaf props section of references/generate-flow/ds-components-authoring.md
// is GENERATED from the substrate's render contract, the same way the vocabulary
// table above it is generated from the registry + BUILT_SLUGS
// (render-authoring-table.js). Regenerate with:
//   node scripts/renderers/render-authoring-props.js
//
// WHY
//
// That section had gone stale in the way a reader cannot detect. Its prose said
// "the following 19 slugs have real HTML leaf renderers" while the vocabulary
// table directly above it correctly marked 58, and it described 45 (slug, prop)
// bindings against the 177 the renderer exposes. So the screen generator knew a
// component could be rendered and did not know what to call any of its content.
// That failure is silent by construction: a prop name the renderer does not read
// is not an error, it renders an empty slot, which is exactly what the substrate's
// own gallery had been doing for the same reason.
//
// The fix is the relation, not a better list. Every fact below is read from
// vendor/components/render/dist/render-contract.json, which the substrate derives
// from its renderer, so this file cannot drift from what the renderer does.
//
// SCOPE: only the delimited block is generated. The worked examples beneath it
// stay hand-authored, because they carry semantics the contract cannot know
// ("use Critical for destructive actions", "never generic placeholder copy").
// The contract says what the renderer ACCEPTS; a human still says what is GOOD.

var fs = require("fs");
var path = require("path");
var PATHS = require(path.join(__dirname, "..", "lib", "paths.js"));

var MD_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "references",
  "generate-flow",
  "ds-components-authoring.md",
);

var BEGIN =
  "<!-- BEGIN GENERATED props: node scripts/renderers/render-authoring-props.js -->";
var END = "<!-- END GENERATED props -->";

function readContract() {
  return JSON.parse(fs.readFileSync(PATHS.components.render.contract, "utf8"));
}

// Markdown table cells cannot carry a raw pipe, and a prop name or a variant
// value is upstream data: `Size & Type` is already a real axis name, so a future
// `A|B` is not far-fetched. Escaped rather than stripped, so the reader still
// sees what the renderer actually keys on.
function cell(s) {
  return String(s).replace(/\|/g, "\\|");
}

function propsCell(props) {
  if (!props.length) return "none";
  return props
    .map(function (p) {
      var name = "`" + cell(p.name) + "`";
      return p.default ? name + ' ("' + cell(p.default) + '")' : name;
    })
    .join(", ");
}

function variantsCell(variants) {
  var axes = Object.keys(variants);
  if (!axes.length) return "none";
  return axes
    .map(function (axis) {
      return (
        "`" +
        cell(axis) +
        "` = " +
        variants[axis].values
          .map(function (v) {
            return cell(v);
          })
          .join(" / ")
      );
    })
    .join("<br>");
}

// The column that only a measured contract can fill: choosing one of these
// values changes the caption and nothing else, because the renderer draws it
// identically to the value it points at.
function sameAsCell(variants) {
  var out = [];
  Object.keys(variants).forEach(function (axis) {
    var rendersAs = variants[axis].rendersAs || {};
    Object.keys(rendersAs).forEach(function (value) {
      out.push(cell(value) + " = " + cell(rendersAs[value]));
    });
  });
  return out.length ? out.join("<br>") : "none";
}

function renderPropRows() {
  var slugs = readContract().slugs;
  return Object.keys(slugs)
    .sort()
    .map(function (slug) {
      var entry = slugs[slug];
      return (
        "| `" +
        slug +
        "` | " +
        propsCell(entry.props) +
        " | " +
        variantsCell(entry.variants) +
        " | " +
        sameAsCell(entry.variants) +
        " |"
      );
    });
}

function preamble(total, bindings) {
  return [
    "All " +
      total +
      " slugs below have real HTML leaf renderers. Prop names are case-sensitive and must match",
    "exactly: a name the renderer does not read is **not an error**, it renders an empty slot. A value",
    "in parentheses is the renderer's own fallback when the prop is omitted; a prop with no",
    "parenthesised value renders nothing until you supply it. " +
      bindings +
      " prop bindings in total.",
    "",
    "The last column is measured rather than documented: the substrate renders every variant value and",
    "compares the output, so a value listed there is decoration. Selecting it changes the label and",
    "nothing else. Prefer the value it points at, or ask for the variant to be built.",
    "",
    "| Slug | Props (fallback) | Variant axes | Renders the same as |",
    "|---|---|---|---|",
  ];
}

function replaceProps(md, rows) {
  var start = md.indexOf(BEGIN);
  var end = md.indexOf(END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(
      "generated-props markers not found (or out of order) in " +
        MD_PATH +
        ". Expected " +
        BEGIN +
        " ... " +
        END,
    );
  }
  var slugs = readContract().slugs;
  var bindings = Object.keys(slugs).reduce(function (n, s) {
    return n + slugs[s].props.length;
  }, 0);
  var block = [BEGIN]
    .concat(preamble(Object.keys(slugs).length, bindings))
    .concat(rows)
    .concat([""])
    .join("\n");
  return md.slice(0, start) + block + "\n" + md.slice(end);
}

module.exports = {
  renderPropRows: renderPropRows,
  replaceProps: replaceProps,
  readContract: readContract,
  MD_PATH: MD_PATH,
  BEGIN: BEGIN,
  END: END,
};

if (require.main === module) {
  var md = fs.readFileSync(MD_PATH, "utf8");
  var out = replaceProps(md, renderPropRows());
  if (out !== md) {
    fs.writeFileSync(MD_PATH, out);
    console.log(
      "[authoring-props] rewrote built-leaf props (" +
        renderPropRows().length +
        " slugs)",
    );
  } else {
    console.log("[authoring-props] no change");
  }
}
