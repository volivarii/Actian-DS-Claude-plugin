// Per-path schema validation. Phase 1a only needs the `_meta.yml` shape (the
// vertical slice edits one component's metadata). Task 11 extends this to
// every Class C JSON, every guideline domain, and every authored markdown.
//
// The validator picks the right schema by inspecting the path. Schemas are
// loaded from the repo via fetch at module init — in dev the editor serves
// from localhost and reaches schemas at /schemas/*.json (Vite serves the
// repo root as the public mount via a base config in Task 11). For now, the
// validator accepts a pre-loaded schema map so unit tests can inject fixtures
// and Phase 1a's UI loads the meta schema via fetch at boot.

// Use Ajv's draft-2020-12 build — the knowledge-repo schemas all declare
// `$schema: https://json-schema.org/draft/2020-12/schema`. The default `Ajv`
// import compiles against draft-07 and would throw "no schema with key or
// ref 'https://json-schema.org/draft/2020-12/schema'" at compile time.
import Ajv2020, { type ValidateFunction } from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { parseYaml } from "../form-engine/yamlSerializer";
import { SchemaValidationError } from "./types";

export type SchemaMap = Record<string, Record<string, unknown>>;

const ajv = new Ajv2020({
  allErrors: true,
  strict: false,
  allowUnionTypes: true,
});
addFormats(ajv);
const compiledCache = new WeakMap<object, ValidateFunction>();

function compile(schema: Record<string, unknown>): ValidateFunction {
  const cached = compiledCache.get(schema);
  if (cached) return cached;
  const fn = ajv.compile(schema);
  compiledCache.set(schema, fn);
  return fn;
}

function pickSchemaKey(path: string): string | null {
  if (path.endsWith("/_meta.yml")) return "guideline-meta";
  if (path === "app-context/app-context.json") return "app-context";
  if (path === "fm-to-ds-map/fm-to-ds-map.json") return "fm-to-ds-map";
  if (path === "components/src/icon-groups.json") return "icon-groups";
  return null;
}

function parseContent(path: string, content: string): unknown {
  if (path.endsWith(".yml") || path.endsWith(".yaml"))
    return parseYaml(content);
  if (path.endsWith(".json")) return JSON.parse(content);
  return content;
}

export interface ValidateAgainstSchemaArgs {
  path: string;
  content: string;
  schemas: SchemaMap;
}

export function validateAgainstSchema({
  path,
  content,
  schemas,
}: ValidateAgainstSchemaArgs): void {
  const key = pickSchemaKey(path);
  if (!key) return; // No schema applies — skip (Phase 1b expands coverage).
  const schema = schemas[key];
  if (!schema) {
    throw new SchemaValidationError(path, [
      { message: `no schema loaded for key "${key}"` },
    ]);
  }
  const data = parseContent(path, content);
  const validate = compile(schema);
  if (!validate(data)) {
    throw new SchemaValidationError(path, validate.errors ?? []);
  }
}
