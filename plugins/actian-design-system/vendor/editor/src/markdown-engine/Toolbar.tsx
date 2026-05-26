// Markdown-syntax insertion toolbar — pure text mutation via CM6
// transactions. No parsing round-trip, no document-model conversion.

import { Button, Flex, Separator, Tooltip } from "@radix-ui/themes";
import type { EditorView } from "@codemirror/view";

export interface ToolbarProps {
  view: EditorView;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
}

function wrapSelection(view: EditorView, prefix: string, suffix: string) {
  const { from, to } = view.state.selection.main;
  view.dispatch({
    changes: {
      from,
      to,
      insert: prefix + view.state.sliceDoc(from, to) + suffix,
    },
    selection: { anchor: from + prefix.length, head: to + prefix.length },
  });
  view.focus();
}

function prefixLine(view: EditorView, prefix: string) {
  const sel = view.state.selection.main;
  const line = view.state.doc.lineAt(sel.from);
  view.dispatch({
    changes: { from: line.from, to: line.from, insert: prefix },
  });
  view.focus();
}

function insertAtCursor(view: EditorView, insert: string) {
  const { from, to } = view.state.selection.main;
  view.dispatch({
    changes: { from, to, insert },
    selection: { anchor: from + insert.length },
  });
  view.focus();
}

function insertAnchor(view: EditorView) {
  const sel = view.state.selection.main;
  const line = view.state.doc.lineAt(sel.from);
  const text = line.text;
  const headingMatch = text.match(/^(#{1,6})\s+(.+)$/);
  if (headingMatch && headingMatch[2]) {
    const slug = slugify(headingMatch[2]) || "anchor";
    const insert = `  {#${slug}}`;
    view.dispatch({ changes: { from: line.to, to: line.to, insert } });
  } else {
    insertAtCursor(view, "{#anchor}");
  }
  view.focus();
}

export function Toolbar({ view }: ToolbarProps) {
  return (
    <Flex className="md-toolbar" align="center" gap="2">
      {/* Group: Block-level */}
      <Flex gap="1" align="center">
        <Tooltip content="Heading 2">
          <Button
            size="1"
            variant="ghost"
            aria-label="Heading 2"
            onClick={() => prefixLine(view, "## ")}
          >
            H2
          </Button>
        </Tooltip>
        <Tooltip content="Heading 3">
          <Button
            size="1"
            variant="ghost"
            aria-label="Heading 3"
            onClick={() => prefixLine(view, "### ")}
          >
            H3
          </Button>
        </Tooltip>
        <Tooltip content="Bullet list">
          <Button
            size="1"
            variant="ghost"
            aria-label="Bullet list"
            onClick={() => prefixLine(view, "- ")}
          >
            •
          </Button>
        </Tooltip>
        <Tooltip content="Numbered list">
          <Button
            size="1"
            variant="ghost"
            aria-label="Numbered list"
            onClick={() => prefixLine(view, "1. ")}
          >
            1.
          </Button>
        </Tooltip>
      </Flex>

      <Separator orientation="vertical" size="1" />

      {/* Group: Inline */}
      <Flex gap="1" align="center">
        <Tooltip content="Bold (Cmd+B)">
          <Button
            size="1"
            variant="ghost"
            aria-label="Bold"
            onClick={() => wrapSelection(view, "**", "**")}
          >
            <strong>B</strong>
          </Button>
        </Tooltip>
        <Tooltip content="Italic (Cmd+I)">
          <Button
            size="1"
            variant="ghost"
            aria-label="Italic"
            onClick={() => wrapSelection(view, "*", "*")}
          >
            <em>I</em>
          </Button>
        </Tooltip>
        <Tooltip content="Inline code">
          <Button
            size="1"
            variant="ghost"
            aria-label="Inline code"
            onClick={() => wrapSelection(view, "`", "`")}
          >
            {"</>"}
          </Button>
        </Tooltip>
        <Tooltip content="Link">
          <Button
            size="1"
            variant="ghost"
            aria-label="Insert link"
            onClick={() => wrapSelection(view, "[", "](https://)")}
          >
            link
          </Button>
        </Tooltip>
      </Flex>

      <Separator orientation="vertical" size="1" />

      {/* Group: Structure */}
      <Flex gap="1" align="center">
        <Tooltip content="Code block">
          <Button
            size="1"
            variant="ghost"
            aria-label="Code block"
            onClick={() => insertAtCursor(view, "\n```\n\n```\n")}
          >
            {"```"}
          </Button>
        </Tooltip>
        <Tooltip content="Insert {#anchor} on this line">
          <Button
            size="1"
            variant="ghost"
            aria-label="Insert anchor"
            onClick={() => insertAnchor(view)}
          >
            {"{#…}"}
          </Button>
        </Tooltip>
      </Flex>
    </Flex>
  );
}
