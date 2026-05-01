#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..");
var rules = require(
  path.join(PLUGIN_ROOT, "scripts", "component-property-rules.js"),
);

var KIT_HEADERS = {
  fm: { title: "Fat Marker Kit", source: "docs/generated/fmkit.json" },
  ds: {
    title: "Actian Design System 2026",
    source: "docs/generated/dskit.json",
  },
  meta: { title: "Meta Kit", source: "docs/generated/metakit.json" },
};

function formatVariants(variants) {
  if (!variants || typeof variants !== "object") return null;
  var keys = Object.keys(variants);
  if (keys.length === 0) return null;
  var parts = keys.map(function (k) {
    var values = (variants[k] || [])
      .map(function (v) {
        return "`" + v + "`";
      })
      .join(" · ");
    return "**" + k + ":** " + values;
  });
  return parts.join(" | ");
}

function formatTextOverrides(properties) {
  var names = Object.keys(properties || {}).filter(function (n) {
    return properties[n] && properties[n].type === "TEXT";
  });
  return names;
}

function formatRequiredOverrides(componentDef) {
  var required = rules.getRequiredOverrideProps(componentDef);
  if (required.length === 0) return null;
  var parts = required.map(function (r) {
    return (
      "`" +
      r.propName +
      '` (default `"' +
      r.defaultValue +
      '"` is a placeholder)'
    );
  });
  return parts.join(", ");
}

function formatDefaultTrueBooleans(componentDef) {
  var bools = rules.getDefaultTrueBooleans(componentDef);
  if (bools.length === 0) return null;
  var parts = bools.map(function (b) {
    return "`" + b.propName + "` (default: true) — set to `false` to hide";
  });
  return parts.join(" · ");
}

function renderComponent(componentDef, slug) {
  var lines = [];
  lines.push("### " + componentDef.name);
  lines.push("");
  if (componentDef.description) {
    lines.push(componentDef.description);
    lines.push("");
  }

  var variantStr = formatVariants(componentDef.variants);
  if (variantStr) {
    lines.push("- Variants: " + variantStr);
  } else {
    lines.push("- Single component (no variants)");
  }

  var textOverrides = formatTextOverrides(componentDef.properties);
  if (textOverrides.length > 0) {
    lines.push(
      "- Text overrides: " +
        textOverrides
          .map(function (n) {
            return "`" + n + "`";
          })
          .join(", "),
    );
  }

  var requiredStr = formatRequiredOverrides(componentDef);
  if (requiredStr) {
    lines.push("- **Required overrides:** " + requiredStr);
  }

  var booleanStr = formatDefaultTrueBooleans(componentDef);
  if (booleanStr) {
    lines.push("- Boolean properties: " + booleanStr);
  }

  lines.push(
    "- Node: `" + componentDef.nodeId + "` | Key: `" + componentDef.key + "`",
  );

  return lines.join("\n");
}

function renderRegistry(registry, kit) {
  var header = KIT_HEADERS[kit];
  if (!header) throw new Error("Unknown kit: " + kit);

  var components = (registry && registry.components) || {};
  var slugs = Object.keys(components).sort();

  var out = [];
  out.push("# " + header.title + " — Component Reference");
  out.push("");
  out.push(
    "Auto-generated from `" +
      header.source +
      "` by `scripts/render-component-reference.js`.",
  );
  out.push(slugs.length + " components.");
  out.push("");
  out.push("---");
  out.push("");

  for (var i = 0; i < slugs.length; i++) {
    out.push(renderComponent(components[slugs[i]], slugs[i]));
    if (i < slugs.length - 1) out.push("");
  }

  return out.join("\n") + "\n";
}

module.exports = {
  renderRegistry: renderRegistry,
  renderComponent: renderComponent,
};

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

if (require.main === module) {
  var args = process.argv.slice(2);
  var kitArg = "all";
  var outDir = path.join(PLUGIN_ROOT, "docs", "generated");

  for (var i = 0; i < args.length; i++) {
    if (args[i] === "--kit" && i + 1 < args.length) {
      kitArg = args[i + 1];
      i++;
    } else if (args[i] === "--output" && i + 1 < args.length) {
      outDir = path.resolve(args[i + 1]);
      i++;
    } else if (args[i] === "--help") {
      process.stdout.write(
        "Usage: render-component-reference.js [--kit fm|ds|meta|all] [--output <dir>]\n",
      );
      process.exit(0);
    }
  }

  var KIT_OUTPUTS = {
    fm: { registry: "fmkit.json", out: "fm-components.md" },
    ds: { registry: "dskit.json", out: "dskit-components.md" },
    meta: {
      registry: "metakit.json",
      out: path.join("meta-kit", "components.md"),
    },
  };

  var kits = kitArg === "all" ? ["fm", "ds", "meta"] : [kitArg];

  for (var k = 0; k < kits.length; k++) {
    var kit = kits[k];
    var spec = KIT_OUTPUTS[kit];
    if (!spec) {
      process.stderr.write("Unknown kit: " + kit + "\n");
      process.exit(1);
    }
    var registryPath = path.join(
      PLUGIN_ROOT,
      "docs",
      "generated",
      spec.registry,
    );
    var registry;
    try {
      registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
    } catch (e) {
      process.stderr.write(
        "Error reading " + registryPath + ": " + e.message + "\n",
      );
      process.exit(1);
    }
    var markdown;
    try {
      markdown = renderRegistry(registry, kit);
    } catch (e) {
      process.stderr.write("Error rendering " + kit + ": " + e.message + "\n");
      process.exit(1);
    }
    var outPath = path.join(outDir, spec.out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, markdown);
    process.stdout.write(
      "Wrote " +
        outPath +
        " (" +
        Object.keys(registry.components || {}).length +
        " components)\n",
    );
  }
}
