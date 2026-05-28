// TopicPicker — typeahead for connecting a section to another topic.
// Vocabulary contract: never displays "slug", "ref", or the underlying
// frontmatter field name to the author. Results show title + domain chip
// + body excerpt. Guarded by tests/app/doctrine-guards.test.tsx (T10).

import React, { useMemo, useState } from "react";
import {
  Box,
  Badge,
  Button,
  Card,
  Flex,
  Text,
  TextField,
} from "@radix-ui/themes";
import type { SearchResult, Taxonomy } from "../substrate";

export interface PickedTopic {
  slug: string;
  domain: "accessibility" | "motion";
  title: string;
  note: string | null;
}

export interface TopicPickerProps {
  taxonomy: Taxonomy;
  onPick: (topic: PickedTopic) => void;
  onCancel: () => void;
}

export function TopicPicker(props: TopicPickerProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [note, setNote] = useState("");

  const results = useMemo(
    () => props.taxonomy.searchSections(query, { limit: 20 }),
    [query, props.taxonomy],
  );

  return (
    <Box p="3">
      <TextField.Root
        placeholder="Find a topic…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <Flex
        direction="column"
        gap="2"
        mt="3"
        style={{ maxHeight: 320, overflow: "auto" }}
      >
        {results.map((r) => {
          const isSelected = selected?.slug === r.slug;
          return (
            <Box
              key={`${r.domain}:${r.slug}`}
              onClick={() => setSelected(r)}
              style={{
                cursor: "pointer",
                padding: "10px 12px",
                background: isSelected ? "var(--accent-3)" : "var(--gray-2)",
                borderLeft: isSelected
                  ? "3px solid var(--accent-9)"
                  : "3px solid transparent",
                borderRadius: 4,
              }}
            >
              <Flex justify="between" align="center" gap="2" mb="1">
                <Text weight="medium" size="2">
                  {r.title}
                </Text>
                <Badge
                  color={r.domain === "accessibility" ? "blue" : "amber"}
                  size="1"
                  style={{ flexShrink: 0 }}
                >
                  {r.domain}
                </Badge>
              </Flex>
              {r.body ? (
                <Text
                  size="2"
                  color="gray"
                  as="p"
                  style={{ lineHeight: 1.45, marginTop: 4 }}
                >
                  {r.body.slice(0, 110)}
                  {r.body.length > 110 ? "…" : ""}
                </Text>
              ) : null}
            </Box>
          );
        })}
        {query.length > 0 && results.length === 0 ? (
          <Text size="2" color="gray">
            No topics match "{query}".
          </Text>
        ) : null}
      </Flex>

      {selected ? (
        <Box
          mt="3"
          p="2"
          style={{ background: "var(--gray-2)", borderRadius: 4 }}
        >
          <Text size="1" color="gray">
            Optional note
          </Text>
          <TextField.Root
            mt="1"
            placeholder="Note: how this section connects (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Box>
      ) : null}

      <Flex gap="2" mt="3">
        <Button
          disabled={!selected}
          onClick={() => {
            if (!selected) return;
            props.onPick({
              slug: selected.slug,
              domain: selected.domain,
              title: selected.title,
              note: note.trim().length > 0 ? note.trim() : null,
            });
          }}
        >
          Connect{selected ? ` to "${selected.title}"` : ""}
        </Button>
        <Button variant="ghost" onClick={props.onCancel}>
          Cancel
        </Button>
      </Flex>
    </Box>
  );
}
