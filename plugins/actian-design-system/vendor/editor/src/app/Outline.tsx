// Outline panel — renders headings from the active markdown doc.
//
// Click a heading → editor scrolls to it (CM6 scrollIntoView). Active
// heading bolds as the user scrolls (closest heading at or above the
// current viewport top).
//
// Each H2/H3 entry also carries a small connection pill ("🔗 N") to the
// right. Clicking the pill opens the Section Inspector as a popover
// anchored to that pill (in MarkdownEditScreen). The pill count is the
// number of outgoing connections currently attached to that section.
// Pill is dimmed when N === 0 — clicking still opens the inspector so
// the author can ADD a first connection.
//
// Layout: third pane left of editor + preview at ≥1280px; icon-only
// rail at 1024-1279px; hidden <1024px (consistent with polish spec's
// narrow-viewport posture).

import { useEffect, useMemo, useRef, useState } from "react";
import { EditorView } from "@codemirror/view";
import { Box, Flex, Text } from "@radix-ui/themes";
import { scanHeadings, type Heading } from "../lib/headingScan";
import { computeFocusedSection } from "./SectionFocusTracker";
import type { FocusedSectionContext } from "./EditorShell";

export interface OutlineProps {
  text: string;
  view: EditorView | null;
  /** File path of the document being edited — needed to build a
   *  FocusedSectionContext when the author opens the inspector via a
   *  pill. Optional so older callers (and tests that don't drive the
   *  inspector path) continue to work. */
  file?: string;
  /** Outgoing connection count per section anchor. Sections not present
   *  in the map render with a count of 0 (dimmed pill). The map is
   *  file-scoped today (per the v1 P8 model) but the API is keyed by
   *  section anchor so it can be tightened to section-scoped later
   *  without touching this component. */
  connectionCounts?: Map<string, number>;
  /** Pill click handler. Receives the section context + the pill DOM
   *  element to anchor a popover. No-op-omitted in tests that just
   *  exercise the navigation path. */
  onOpenConnectionsForSection?: (
    section: FocusedSectionContext,
    anchorEl: HTMLElement,
  ) => void;
}

export function Outline({
  text,
  view,
  file,
  connectionCounts,
  onOpenConnectionsForSection,
}: OutlineProps) {
  const headings = useMemo(() => scanHeadings(text), [text]);
  const activeLine = useActiveHeading(view, headings);

  function jumpTo(h: Heading) {
    if (!view) return;
    const pos = view.state.doc.line(h.line + 1).from;
    view.dispatch({
      selection: { anchor: pos },
      effects: EditorView.scrollIntoView(pos, { y: "start" }),
    });
    view.focus();
  }

  if (headings.length === 0) {
    return (
      <Box p="3">
        <Text size="1" color="gray">
          No headings yet.
        </Text>
      </Box>
    );
  }

  return (
    <Box p="2" style={{ overflowY: "auto", height: "100%" }}>
      <Text size="1" color="gray" weight="medium" mb="2" as="div">
        Outline
      </Text>
      <Flex direction="column" gap="1">
        {headings.map((h) => {
          const isActive = h.line === activeLine;
          return (
            <OutlineRow
              key={`${h.line}-${h.text}`}
              heading={h}
              isActive={isActive}
              text={text}
              file={file}
              connectionCounts={connectionCounts}
              onJump={() => jumpTo(h)}
              onOpenConnectionsForSection={onOpenConnectionsForSection}
            />
          );
        })}
      </Flex>
    </Box>
  );
}

function OutlineRow({
  heading,
  isActive,
  text,
  file,
  connectionCounts,
  onJump,
  onOpenConnectionsForSection,
}: {
  heading: Heading;
  isActive: boolean;
  text: string;
  file?: string;
  connectionCounts?: Map<string, number>;
  onJump: () => void;
  onOpenConnectionsForSection?: (
    section: FocusedSectionContext,
    anchorEl: HTMLElement,
  ) => void;
}) {
  const pillRef = useRef<HTMLButtonElement | null>(null);

  // Pills only attach to H2/H3 — H1 is the document title and doesn't
  // participate in the per-section connection model.
  const canHaveConnections = heading.level === 2 || heading.level === 3;

  // Resolve this heading's anchor (matches what computeFocusedSection
  // would return if the cursor was at this heading's line) so the count
  // lookup + popover context use the SAME slug derivation as cursor
  // tracking. Cheap call — scanHeadings is small.
  const section = useMemo(
    () =>
      canHaveConnections ? computeFocusedSection(text, heading.line) : null,
    [text, heading.line, canHaveConnections],
  );
  const count = section ? (connectionCounts?.get(section.anchor) ?? 0) : 0;

  return (
    <Flex align="center" gap="1">
      <Text
        size="1"
        weight={isActive ? "bold" : "regular"}
        color={isActive ? undefined : "gray"}
        style={{
          cursor: "pointer",
          paddingLeft: 4 + (heading.level - 1) * 12,
          paddingRight: 4,
          paddingBlock: 2,
          borderRadius: 3,
          background: isActive ? "var(--accent-3)" : "transparent",
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        onClick={onJump}
        title={heading.text}
      >
        {heading.text}
      </Text>
      {canHaveConnections && section && file && onOpenConnectionsForSection ? (
        <button
          ref={pillRef}
          type="button"
          aria-label={`Open connections for ${heading.text} (${count} connected)`}
          data-testid={`connections-pill-${section.anchor}`}
          onClick={(e) => {
            e.stopPropagation();
            const el = pillRef.current;
            if (!el) return;
            onOpenConnectionsForSection(
              { file, anchor: section.anchor, level: section.level, line: section.line },
              el,
            );
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
            padding: "1px 6px",
            border: "1px solid var(--gray-5)",
            borderRadius: 10,
            background: "transparent",
            cursor: "pointer",
            fontSize: 10,
            lineHeight: "14px",
            color: count > 0 ? "var(--accent-11)" : "var(--gray-9)",
            opacity: count > 0 ? 1 : 0.55,
            flexShrink: 0,
          }}
        >
          <span aria-hidden="true">🔗</span>
          <span>{count}</span>
        </button>
      ) : null}
    </Flex>
  );
}

// Track which heading is currently nearest the viewport top.
// Recomputes on scroll/doc change via a small CM6 update listener.
function useActiveHeading(
  view: EditorView | null,
  headings: Heading[],
): number | null {
  const [activeLine, setActiveLine] = useState<number | null>(
    headings[0]?.line ?? null,
  );

  useEffect(() => {
    if (!view) return;
    if (headings.length === 0) {
      setActiveLine(null);
      return;
    }
    const recompute = () => {
      const fromLine = view.state.doc.lineAt(view.viewport.from).number - 1;
      // Binary search: largest heading.line <= fromLine.
      let lo = 0,
        hi = headings.length - 1,
        best = headings[0]!.line;
      while (lo <= hi) {
        const mid = (lo + hi) >>> 1;
        if (headings[mid]!.line <= fromLine) {
          best = headings[mid]!.line;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      setActiveLine(best);
    };
    recompute();
    const ext = EditorView.updateListener.of((u) => {
      if (u.viewportChanged || u.docChanged) recompute();
    });
    // Append extension via reconfigure; simpler — use a one-off listener.
    const handler = () => recompute();
    view.scrollDOM.addEventListener("scroll", handler);
    return () => {
      view.scrollDOM.removeEventListener("scroll", handler);
      // ext is not actually mounted; left for future refactor if needed
      void ext;
    };
  }, [view, headings]);

  return activeLine;
}
