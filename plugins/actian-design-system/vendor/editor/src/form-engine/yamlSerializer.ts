// Thin wrappers around the `yaml` package. The contract is *semantic*
// round-trip — parse → stringify → parse yields the same JS shape.
//
// `stringifyYaml` accepts an options bag:
//   - `originalText`: preserves the leading header (blank lines + `#`
//     comments above the first data line) from the source file. Load-bearing
//     for files like `components/src/<slug>/_meta.yml` that start with a
//     `# yaml-language-server: $schema=…` directive — stripping it would
//     break every author's IDE schema-hinting on the next checkout.
//   - `flowAtDepth`: switches every YAMLMap at that depth (1-based, root
//     map = depth 0) to flow style. Required for `_meta.yml` files: the
//     knowledge repo's restricted YAML parser at scripts/categories/
//     categories-parser.js rejects block-nested values under `domains.*`
//     with "nested values must be scalars in this subset (no deeper
//     nesting)". The `domains.<name>` maps live at depth 2, so the editor
//     calls stringifyYaml with flowAtDepth: 2.
//
// In-body / trailing comments are NOT preserved in Phase 1a. The `yaml`
// package's CST API supports it, but the document-mutate-via-JSON path is
// non-trivial and lands in PR 2 if authors hit a case where it bites.

import yaml from "yaml";

export interface StringifyOptions {
  originalText?: string;
  flowAtDepth?: number;
}

export function parseYaml<T = unknown>(text: string): T {
  return yaml.parse(text) as T;
}

export function stringifyYaml(
  value: unknown,
  opts?: StringifyOptions | string,
): string {
  const { originalText, flowAtDepth } =
    typeof opts === "string"
      ? { originalText: opts, flowAtDepth: undefined }
      : (opts ?? {});

  let body: string;
  if (flowAtDepth === undefined) {
    body = yaml.stringify(value, { lineWidth: 0 });
  } else {
    const doc = new yaml.Document(value);
    if (doc.contents) markFlowAtDepth(doc.contents, 0, flowAtDepth);
    body = doc.toString({ lineWidth: 0 });
  }

  if (!originalText) return body;
  const header = extractLeadingHeader(originalText);
  return header ? header + body : body;
}

function markFlowAtDepth(
  node: unknown,
  currentDepth: number,
  targetDepth: number,
): void {
  if (!node || typeof node !== "object") return;
  const map = node as {
    constructor?: { name?: string };
    items?: Array<{ value?: unknown }>;
    flow?: boolean;
  };
  if (map.constructor?.name !== "YAMLMap") return;
  if (currentDepth === targetDepth) {
    map.flow = true;
    return;
  }
  for (const item of map.items ?? []) {
    markFlowAtDepth(item.value, currentDepth + 1, targetDepth);
  }
}

function extractLeadingHeader(text: string): string {
  const lines = text.split("\n");
  const out: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) {
      out.push(line);
    } else {
      break;
    }
  }
  if (out.length === 0) return "";
  return out.join("\n") + "\n";
}
