// Emits :root CSS custom properties from tokens/tokens.json (DTCG W3C format).
// Token leaves are detected by the `$value` field; intermediate keys become
// path segments. Keys starting with $ or _ are control fields and skipped.
//
// The editor's chrome consumes the resulting var(--zen-…) names. Token resolution
// for {alias.references} is deferred to a later task — for now, alias values
// pass through as-is and the editor falls back to Radix's defaults until a
// referenced token resolves.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOKENS_PATH = path.resolve(HERE, "..", "..", "tokens", "tokens.json");
const OUT = path.resolve(HERE, "..", "src", "styles", "tokens.css");

const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, "utf8"));

function sanitize(segment) {
  return segment.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
}

function flatten(obj, prefix = "--zen") {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("$") || k.startsWith("_")) continue;
    if (!v || typeof v !== "object") continue;
    const name = `${prefix}-${sanitize(k)}`;
    if ("$value" in v) {
      out.push([name, String(v.$value)]);
    } else {
      out.push(...flatten(v, name));
    }
  }
  return out;
}

const tuples = flatten(tokens);
const css =
  ":root {\n" +
  tuples.map(([k, v]) => `  ${k}: ${v};`).join("\n") +
  "\n}\n";

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, css);
console.log(`tokens.css written: ${OUT} (${tuples.length} custom properties)`);
