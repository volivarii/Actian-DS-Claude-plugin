// CodeMirror 6 wrapper for plain markdown editing.
//
// Editor surface uses prose typography (Roboto 16px / line-height 1.6 /
// max-width 72ch) to match the preview pane. Line numbers are removed —
// prose editor, not code editor. Heading lines and syntax markers get
// visual treatment via proseHighlight and anchorMutePlugin.

import { useEffect, useRef } from "react";
import { EditorState, type Range } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  keymap,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { anchorCompletionExtension } from "./anchorCompletion";

export interface CodeMirrorEditorProps {
  initialText: string;
  onChange: (text: string) => void;
  onReady?: (view: EditorView) => void;
  onAnchorClick?: (slug: string, target: HTMLElement) => void;
  /** Fires on every selection change with the cursor's 0-indexed line.
   *  Used by the SectionFocusTracker to derive the right-pane Section
   *  context. Latched (only fires when the line actually changes) so
   *  same-line caret movement doesn't churn React state. */
  onCursorLineChange?: (line: number) => void;
}

const proseHighlight = HighlightStyle.define([
  { tag: tags.heading1, fontWeight: "700" },
  { tag: tags.heading2, fontWeight: "600", fontSize: "1.4em" },
  { tag: tags.heading3, fontWeight: "600", fontSize: "1.15em" },
  {
    tag: tags.monospace,
    fontFamily: "var(--zen-font-family-mono), ui-monospace, monospace",
    fontSize: "0.92em",
  },
  {
    tag: tags.comment,
    color: "var(--zen-color-neutral-400)",
    fontStyle: "italic",
  },
]);

// Keep this regex mirrored with editor/src/markdown-engine/anchorScan.ts.
// If they diverge, the editor decoration will misrepresent which markers
// are valid anchors per the guard's view.
const ANCHOR_RE = /\{#[a-z0-9][a-z0-9-]*\}/g;

const anchorDecoration = Decoration.mark({ class: "cm-anchor-marker" });

const anchorMutePlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = this.compute(view);
    }
    update(u: ViewUpdate) {
      if (u.docChanged || u.viewportChanged) {
        this.decorations = this.compute(u.view);
      }
    }
    compute(view: EditorView): DecorationSet {
      const ranges: Range<Decoration>[] = [];
      for (const { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to);
        for (const m of text.matchAll(ANCHOR_RE)) {
          if (m.index == null) continue;
          const start = from + m.index;
          ranges.push(anchorDecoration.range(start, start + m[0].length));
        }
      }
      return Decoration.set(ranges, true);
    }
  },
  { decorations: (v) => v.decorations },
);

export function CodeMirrorEditor({
  initialText,
  onChange,
  onReady,
  onAnchorClick,
  onCursorLineChange,
}: CodeMirrorEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const lastLineRef = useRef<number>(-1);

  useEffect(() => {
    if (!hostRef.current) return;
    const state = EditorState.create({
      doc: initialText,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        markdown(),
        syntaxHighlighting(proseHighlight),
        anchorMutePlugin,
        anchorCompletionExtension(),
        EditorView.domEventHandlers({
          click(event) {
            // CM6's markdown syntax highlighter splits the muted anchor
            // span into inner highlight tokens, so event.target is often a
            // deeper element. Walk up to the .cm-anchor-marker wrapper.
            const target = event.target;
            if (!(target instanceof Element)) return false;
            const el = target.closest(".cm-anchor-marker");
            if (!(el instanceof HTMLElement)) return false;
            const m = /\{#([a-z][a-z0-9-]*)\}/.exec(el.textContent ?? "");
            if (m && onAnchorClick) {
              onAnchorClick(m[1]!, el);
              return true;
            }
            return false;
          },
        }),
        EditorView.lineWrapping,
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onChange(u.state.doc.toString());
          if (u.selectionSet || u.docChanged) {
            const head = u.state.selection.main.head;
            const line = u.state.doc.lineAt(head).number - 1; // 0-indexed
            if (line !== lastLineRef.current) {
              lastLineRef.current = line;
              onCursorLineChange?.(line);
            }
          }
        }),
        EditorView.theme({
          "&": { height: "100%", fontSize: "16px" },
          ".cm-scroller": { overflow: "auto" },
          ".cm-content": {
            fontFamily:
              "var(--zen-font-family-text), system-ui, -apple-system, sans-serif",
            fontSize: "16px",
            lineHeight: "1.6",
            maxWidth: "72ch",
            marginInline: "auto",
            paddingInline: "24px",
            paddingBlock: "16px",
            caretColor: "var(--zen-color-text-primary)",
          },
        }),
      ],
    });
    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;
    onReady?.(view);
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // initialText intentionally NOT in deps — recreating the view on every
    // initialText prop change would destroy uncommitted local edits. Path
    // changes drive remounts via a `key` prop set at the call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={hostRef} style={{ height: "100%", overflow: "auto" }} />;
}
