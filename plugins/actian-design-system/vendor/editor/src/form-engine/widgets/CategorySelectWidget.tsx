// RJSF custom widget — single-select over canonical category slugs.
//
// Replaces the free-text input that previously allowed any string
// matching ^[a-z][a-z0-9-]*$ (and thus allowed typos / drift from the
// real category set in components/src/categories/*.md).
//
// The list of category slugs is fetched lazily from the repo via the
// Octokit instance passed through RJSF's formContext.

import { useEffect, useState } from "react";
import type { WidgetProps } from "@rjsf/utils";
import { Select, Text } from "@radix-ui/themes";
import type { Octokit } from "@octokit/rest";
import { loadCategories } from "../../lib/categoriesLoader";

interface FormContextShape {
  octokit?: Octokit;
}

export function CategorySelectWidget(props: WidgetProps) {
  const { id, value, onChange, disabled, readonly, formContext } = props;
  const octokit = (formContext as FormContextShape | undefined)?.octokit;
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!octokit) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const next = await loadCategories(octokit);
      if (!cancelled) {
        setOptions(next);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [octokit]);

  const current = typeof value === "string" ? value : "";

  if (loading) {
    return (
      <Text size="1" color="gray">
        Loading categories…
      </Text>
    );
  }

  // If the current value isn't in the option set, surface it as an
  // extra option so we don't silently drop existing data. (e.g. a
  // category was renamed in the repo since this _meta.yml was authored.)
  const allOptions =
    current && !options.includes(current) ? [...options, current] : options;

  return (
    <Select.Root
      value={current || undefined}
      disabled={disabled || readonly}
      onValueChange={(v) => onChange(v === "" ? undefined : v)}
    >
      <Select.Trigger id={id} placeholder="Pick a category…" />
      <Select.Content>
        {allOptions.map((slug) => (
          <Select.Item key={slug} value={slug}>
            {slug}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}
