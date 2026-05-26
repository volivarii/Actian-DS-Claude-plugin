// Outline panel — renders headings from the active markdown doc.
//
// Click a heading → editor scrolls to it (CM6 scrollIntoView). Active
// heading bolds as the user scrolls (closest heading at or above the
// current viewport top).
//
// Layout: third pane left of editor + preview at ≥1280px; icon-only
// rail at 1024-1279px; hidden <1024px (consistent with polish spec's
// narrow-viewport posture).

import { useEffect, useMemo, useState } from "react";
import { EditorView } from "@codemirror/view";
import { Box, Flex, Text } from "@radix-ui/themes";
import { scanHeadings, type Heading } from "../lib/headingScan";

export interface OutlineProps {
  text: string;
  view: EditorView | null;
}

export function Outline({ text, view }: OutlineProps) {
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
            <Text
              key={`${h.line}-${h.text}`}
              size="1"
              weight={isActive ? "bold" : "regular"}
              color={isActive ? undefined : "gray"}
              style={{
                cursor: "pointer",
                paddingLeft: 4 + (h.level - 1) * 12,
                paddingRight: 4,
                paddingBlock: 2,
                borderRadius: 3,
                background: isActive ? "var(--accent-3)" : "transparent",
              }}
              onClick={() => jumpTo(h)}
              title={h.text}
            >
              {h.text}
            </Text>
          );
        })}
      </Flex>
    </Box>
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
