// Generic RJSF wrapper. Keeps the schema-driven editing contract in one
// place: a JSON Schema in → a React form out, validated by Ajv 8.
//
// Per-domain schemas (guideline-meta, app-context, fm-to-ds-map, icon-groups)
// each ship a paired uiSchema under editor/src/uiSchemas/. Task 17 polishes
// the widget set to match Radix theming throughout.

import type { ComponentProps } from "react";
import Form from "@rjsf/core";
// The default @rjsf/validator-ajv8 export targets draft-07; the knowledge
// repo's schemas are draft-2020-12. customizeValidator + Ajv2020 swaps the
// validator at build time.
//
// Import shape — `@rjsf/validator-ajv8` ships dual CJS/ESM with no `exports`
// field, and the two surfaces are NOT symmetric:
//   - tsx/Node CJS bridge: `default` is the whole module.exports object, so
//     `default.customizeValidator` is the factory function.
//   - Vite/real ESM: `default` is `customizeValidator()` (a pre-built
//     validator instance — NOT a function), and `customizeValidator` is a
//     separate named export.
// Importing `*` and resolving the function from either spot covers both.
import * as rjsfValidatorAjv8Mod from "@rjsf/validator-ajv8";
import Ajv2020 from "ajv/dist/2020";
import type { RJSFSchema, UiSchema } from "@rjsf/utils";

type CustomizeValidatorFn = (opts: {
  AjvClass?: unknown;
  ajvOptionsOverrides?: Record<string, unknown>;
}) => unknown;

const mod = rjsfValidatorAjv8Mod as unknown as {
  customizeValidator?: CustomizeValidatorFn;
  default?: { customizeValidator?: CustomizeValidatorFn } | unknown;
};

const customizeValidator: CustomizeValidatorFn = (() => {
  if (typeof mod.customizeValidator === "function") {
    return mod.customizeValidator;
  }
  const onDefault = (
    mod.default as { customizeValidator?: CustomizeValidatorFn } | undefined
  )?.customizeValidator;
  if (typeof onDefault === "function") return onDefault;
  throw new Error(
    "RJSFForm: @rjsf/validator-ajv8 did not expose customizeValidator on the named export or the default export. " +
      "Has the package's export shape changed?",
  );
})();

const validator = customizeValidator({
  AjvClass: Ajv2020,
  ajvOptionsOverrides: { strict: false, allowUnionTypes: true },
}) as ComponentProps<typeof Form>["validator"];

export interface RJSFFormProps {
  schema: RJSFSchema;
  uiSchema?: UiSchema;
  formData: unknown;
  onChange: (next: unknown) => void;
  onSubmit?: (data: unknown) => void;
  disabled?: boolean;
  submitLabel?: string;
  children?: ComponentProps<typeof Form>["children"];
}

export function RJSFForm({
  schema,
  uiSchema,
  formData,
  onChange,
  onSubmit,
  disabled,
  submitLabel,
  children,
}: RJSFFormProps) {
  return (
    <Form
      schema={schema}
      uiSchema={uiSchema}
      validator={validator}
      formData={formData}
      disabled={disabled}
      onChange={(e) => onChange(e.formData)}
      onSubmit={(e) => onSubmit?.(e.formData)}
      showErrorList="bottom"
    >
      {children ?? (
        <div style={{ display: "flex", gap: "var(--space-2, 8px)" }}>
          <button type="submit" disabled={disabled}>
            {submitLabel ?? "Submit"}
          </button>
        </div>
      )}
    </Form>
  );
}
