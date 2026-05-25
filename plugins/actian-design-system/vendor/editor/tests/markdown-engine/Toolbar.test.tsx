import { test } from "node:test";
import assert from "node:assert/strict";
import "../setup-dom";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { Theme } from "@radix-ui/themes";
import { Toolbar } from "../../src/markdown-engine/Toolbar";

function mountWithView(initialDoc: string) {
  const view = new EditorView({
    state: EditorState.create({ doc: initialDoc }),
  });
  const { container } = render(
    <Theme>
      <Toolbar view={view} />
    </Theme>,
  );
  return { view, container };
}

test("Toolbar: bold wraps selection with **...**", () => {
  const { view } = mountWithView("hello world");
  view.dispatch({ selection: { anchor: 0, head: 5 } });
  fireEvent.click(screen.getByRole("button", { name: /bold/i }));
  assert.equal(view.state.doc.toString(), "**hello** world");
  cleanup();
});

test("Toolbar: italic wraps selection with *...*", () => {
  const { view } = mountWithView("hello");
  view.dispatch({ selection: { anchor: 0, head: 5 } });
  fireEvent.click(screen.getByRole("button", { name: /italic/i }));
  assert.equal(view.state.doc.toString(), "*hello*");
  cleanup();
});

test("Toolbar: inline code wraps selection with backticks", () => {
  const { view } = mountWithView("foo");
  view.dispatch({ selection: { anchor: 0, head: 3 } });
  fireEvent.click(screen.getByRole("button", { name: /inline code/i }));
  assert.equal(view.state.doc.toString(), "`foo`");
  cleanup();
});

test("Toolbar: unordered list prefixes current line with '- '", () => {
  const { view } = mountWithView("item one");
  view.dispatch({ selection: { anchor: 3, head: 3 } });
  fireEvent.click(screen.getByRole("button", { name: /bullet list/i }));
  assert.equal(view.state.doc.toString(), "- item one");
  cleanup();
});

test("Toolbar: ordered list prefixes current line with '1. '", () => {
  const { view } = mountWithView("item one");
  view.dispatch({ selection: { anchor: 0, head: 0 } });
  fireEvent.click(screen.getByRole("button", { name: /numbered list/i }));
  assert.equal(view.state.doc.toString(), "1. item one");
  cleanup();
});

test("Toolbar: anchor button appends {#auto-slug} on heading line", () => {
  const { view } = mountWithView("## New Section");
  view.dispatch({ selection: { anchor: 14, head: 14 } });
  fireEvent.click(screen.getByRole("button", { name: /anchor/i }));
  assert.equal(view.state.doc.toString(), "## New Section  {#new-section}");
  cleanup();
});

test("Toolbar: anchor button on non-heading inserts {#anchor} at cursor", () => {
  const { view } = mountWithView("plain text");
  view.dispatch({ selection: { anchor: 5, head: 5 } });
  fireEvent.click(screen.getByRole("button", { name: /anchor/i }));
  assert.equal(view.state.doc.toString(), "plain{#anchor} text");
  cleanup();
});

test("Toolbar: code block inserts ``` fenced block at cursor", () => {
  const { view } = mountWithView("");
  view.dispatch({ selection: { anchor: 0, head: 0 } });
  fireEvent.click(screen.getByRole("button", { name: /code block/i }));
  assert.match(view.state.doc.toString(), /^[\s\S]*```[\s\S]*```[\s\S]*$/);
  cleanup();
});
