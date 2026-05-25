// RJSF custom widget — multi-select over the known component slug set.
//
// Replaces the free-text array (where authors could enter any slug
// pattern, including typos referencing components that don't exist) with
// a typeahead-filtered checklist of:
//   - authored components (components/src/<slug>/)
//   - DS Kit registry slugs (eligible non-icon)
//
// Selected slugs render as removable chips above the search +
// checkbox list. cmdk is already a dep (header palette), used here for
// the typeahead behavior.

import { useEffect, useMemo, useState } from "react";
import type { WidgetProps } from "@rjsf/utils";
import { Badge, Box, Button, Flex, Text } from "@radix-ui/themes";
import { Command } from "cmdk";
import type { Octokit } from "@octokit/rest";
import { loadComponentSlugs } from "../../lib/componentSlugs";

interface FormContextShape {
  octokit?: Octokit;
}

export function RelatedMultiSelectWidget(props: WidgetProps) {
  const { value, onChange, disabled, readonly, formContext } = props;
  const octokit = (formContext as FormContextShape | undefined)?.octokit;
  const [allSlugs, setAllSlugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!octokit) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const next = await loadComponentSlugs(octokit);
      if (!cancelled) {
        setAllSlugs(next);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [octokit]);

  // RJSF passes undefined or an array of strings for an array field.
  const selected: string[] = useMemo(
    () =>
      Array.isArray(value)
        ? value.filter((v): v is string => typeof v === "string")
        : [],
    [value],
  );

  const isDisabled = disabled || readonly;

  function toggle(slug: string) {
    if (isDisabled) return;
    if (selected.includes(slug)) {
      onChange(selected.filter((s) => s !== slug));
    } else {
      onChange([...selected, slug]);
    }
  }

  function remove(slug: string) {
    if (isDisabled) return;
    onChange(selected.filter((s) => s !== slug));
  }

  // Display order: selected first (in their saved order), then the rest.
  // Filtered by query.
  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    const pool = lower
      ? allSlugs.filter((s) => s.toLowerCase().includes(lower))
      : allSlugs;
    return pool;
  }, [allSlugs, query]);

  return (
    <Box>
      {selected.length > 0 && (
        <Flex gap="1" wrap="wrap" mb="2">
          {selected.map((slug) => (
            <Badge
              key={slug}
              color="indigo"
              variant="soft"
              size="2"
              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              {slug}
              {!isDisabled && (
                <Button
                  variant="ghost"
                  size="1"
                  color="gray"
                  aria-label={`Remove ${slug}`}
                  onClick={() => remove(slug)}
                  style={{ padding: 0, minWidth: 0, lineHeight: 1 }}
                >
                  ✕
                </Button>
              )}
            </Badge>
          ))}
        </Flex>
      )}
      {loading ? (
        <Text size="1" color="gray">
          Loading component slugs…
        </Text>
      ) : (
        <Box
          style={{
            border: "1px solid var(--gray-5)",
            borderRadius: 6,
            maxWidth: 480,
          }}
        >
          <Command label="Related component search" shouldFilter={false}>
            <Command.Input
              placeholder="Search components…"
              value={query}
              onValueChange={setQuery}
              disabled={isDisabled}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "none",
                outline: "none",
                borderBottom: "1px solid var(--gray-4)",
                background: "transparent",
                fontSize: 13,
              }}
            />
            <Command.List
              style={{
                maxHeight: 220,
                overflowY: "auto",
                padding: "4px 0",
              }}
            >
              <Command.Empty>
                <Text size="1" color="gray" as="div" style={{ padding: 12 }}>
                  No matches.
                </Text>
              </Command.Empty>
              {filtered.map((slug) => {
                const isSelected = selected.includes(slug);
                return (
                  <Command.Item
                    key={slug}
                    value={slug}
                    onSelect={() => toggle(slug)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "4px 12px",
                      cursor: isDisabled ? "not-allowed" : "pointer",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 12,
                        textAlign: "center",
                        color: isSelected ? "var(--accent-9)" : "transparent",
                      }}
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                    <Text size="2">{slug}</Text>
                  </Command.Item>
                );
              })}
            </Command.List>
          </Command>
        </Box>
      )}
    </Box>
  );
}
