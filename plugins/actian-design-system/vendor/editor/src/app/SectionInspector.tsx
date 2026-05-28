// SectionInspector — right-pane component showing the current section's
// transversal-ref connections (outgoing + incoming) + edit affordances.
//
// Vocabulary contract: this component MUST NOT render the strings "slug",
// "ref", "a11y_refs", "motion_refs", or "frontmatter" as author-visible
// text. Use "topic" / "connection" / "identifier" instead. Guarded by
// tests/app/doctrine-guards.test.tsx (T10).

import React from "react";
import { Box, Button, Flex, Heading, Text } from "@radix-ui/themes";
import type {
  BrokenRef,
  Consumer,
  OutgoingConnection,
  RefType,
  Taxonomy,
} from "../substrate";

export interface SectionInspectorProps {
  sectionTitle: string;
  outgoing: OutgoingConnection[];
  incoming: Consumer[];
  broken?: BrokenRef[];
  taxonomy: Taxonomy;
  /** P8 Option A file-scoped attachment: only the file's top H2 owns
   *  outgoing connections; sub-sections are read-only incoming views.
   *  When `"section"`, the outgoing list + "+ Connect" affordance are
   *  hidden and the empty-state copy is the incoming-reference framing. */
  scope: "file" | "section";
  onAddConnection: () => void;
  onRemoveConnection: (refType: RefType, slug: string) => void;
  onRepointConnection: (refType: RefType, slug: string) => void;
}

export function SectionInspector(props: SectionInspectorProps) {
  const {
    sectionTitle,
    outgoing,
    incoming,
    broken = [],
    taxonomy,
    scope,
  } = props;
  const isFileScope = scope === "file";

  return (
    <Box p="3">
      <Text
        size="1"
        color="gray"
        style={{ textTransform: "uppercase", letterSpacing: 0.5 }}
      >
        Currently editing
      </Text>
      <Heading size="3" mt="1">
        {sectionTitle}
      </Heading>

      {isFileScope && (
        <Box mt="4">
          <Text
            size="1"
            color="gray"
            weight="medium"
            style={{ textTransform: "uppercase", letterSpacing: 0.5 }}
          >
            Connected topics ({outgoing.length})
          </Text>
          <Text size="1" color="gray" as="p" mt="1">
            These connections apply to the whole file.
          </Text>
          {outgoing.length === 0 && broken.length === 0 ? (
            <Text size="2" color="gray" mt="2" as="p">
              This file has no connections yet.
            </Text>
          ) : (
            <Flex direction="column" gap="2" mt="2">
              {outgoing.map((conn) => (
                <ConnectionRow
                  key={`${conn.refType}:${conn.slug}`}
                  title={
                    taxonomy.getTitle(
                      conn.domain ?? "accessibility",
                      conn.slug,
                    ) ?? conn.slug
                  }
                  note={conn.note}
                  onRemove={() =>
                    props.onRemoveConnection(conn.refType, conn.slug)
                  }
                />
              ))}
              {broken.map((b) => (
                <BrokenRow
                  key={`broken:${b.slug}`}
                  identifierForDebug={b.slug}
                  onRemove={() => props.onRemoveConnection(b.refType, b.slug)}
                  onRepoint={() => props.onRepointConnection(b.refType, b.slug)}
                />
              ))}
            </Flex>
          )}
          <Button
            variant="outline"
            mt="3"
            style={{ width: "100%" }}
            onClick={props.onAddConnection}
          >
            + Connect to another topic
          </Button>
        </Box>
      )}

      {!isFileScope && (
        <Box mt="4">
          <Text size="2" color="gray" as="p">
            Connections live at the file level. To add or remove one, open the
            file's first section.
          </Text>
        </Box>
      )}

      {incoming.length > 0 && (
        <Box mt="4">
          <Text
            size="1"
            color="gray"
            weight="medium"
            style={{ textTransform: "uppercase", letterSpacing: 0.5 }}
          >
            Referenced by ({incoming.length})
          </Text>
          <Flex direction="column" gap="1" mt="2">
            {incoming.map((c) => (
              <Text key={c.file} size="2">
                {c.file}
                {c.note ? (
                  <Text color="gray" size="1">
                    {" "}
                    — {c.note}
                  </Text>
                ) : null}
              </Text>
            ))}
          </Flex>
        </Box>
      )}
    </Box>
  );
}

function ConnectionRow(props: {
  title: string;
  note: string | null;
  onRemove: () => void;
}) {
  return (
    <Box
      p="2"
      style={{
        background: "var(--gray-2)",
        borderLeft: "3px solid var(--green-9)",
        borderRadius: "0 3px 3px 0",
      }}
    >
      <Text weight="medium" size="2">
        {props.title}
      </Text>
      {props.note ? (
        <Text
          size="1"
          color="gray"
          as="p"
          mt="1"
          style={{ fontStyle: "italic" }}
        >
          "{props.note}"
        </Text>
      ) : null}
      <Flex gap="2" mt="1">
        <Button size="1" variant="ghost" color="red" onClick={props.onRemove}>
          disconnect
        </Button>
      </Flex>
    </Box>
  );
}

function BrokenRow(props: {
  identifierForDebug: string;
  onRemove: () => void;
  onRepoint: () => void;
}) {
  // identifierForDebug is intentionally NOT rendered in this v1 — the
  // doctrine guard test forbids exposing internal slug strings to authors.
  // The warning text + actions are enough; if support asks "which one?"
  // the author can click Repoint and see the current value in the picker.
  void props.identifierForDebug;
  return (
    <Box
      p="2"
      style={{
        background: "var(--red-2)",
        borderLeft: "3px solid var(--red-9)",
        borderRadius: "0 3px 3px 0",
      }}
    >
      <Text weight="medium" size="2" color="red">
        ⚠ Connection points to a topic that no longer exists.
      </Text>
      <Flex gap="2" mt="1">
        <Button size="1" variant="ghost" onClick={props.onRepoint}>
          Repoint…
        </Button>
        <Button size="1" variant="ghost" color="red" onClick={props.onRemove}>
          Remove
        </Button>
      </Flex>
    </Box>
  );
}
