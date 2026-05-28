import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import "../setup-dom";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import React from "react";
import { Outline } from "../../src/app/Outline";

afterEach(() => cleanup());

function wrap(node: React.ReactNode) {
  return <Theme>{node}</Theme>;
}

test("Outline: renders nothing-yet message when text has no headings", () => {
  render(wrap(<Outline text="just prose, no headings" view={null} />));
  assert.ok(screen.getByText(/No headings yet/i));
});

test("Outline: renders headings from text in source order", () => {
  const md = `# Top\n\n## Section A\n\n### Sub a1\n\n## Section B\n`;
  render(wrap(<Outline text={md} view={null} />));
  assert.ok(screen.getByText("Top"));
  assert.ok(screen.getByText("Section A"));
  assert.ok(screen.getByText("Sub a1"));
  assert.ok(screen.getByText("Section B"));
});

test("Outline: indents H2 deeper than H1, H3 deeper than H2", () => {
  const md = `# Top\n## Section\n### Sub\n`;
  const { container } = render(wrap(<Outline text={md} view={null} />));
  const items = container.querySelectorAll(
    '[title="Top"], [title="Section"], [title="Sub"]',
  );
  assert.equal(items.length, 3);
  const pads = Array.from(items).map((el) =>
    parseFloat((el as HTMLElement).style.paddingLeft),
  );
  // H1 < H2 < H3 indent
  assert.ok(pads[0]! < pads[1]!);
  assert.ok(pads[1]! < pads[2]!);
});

test("Outline: click on heading without a view does not throw", () => {
  const md = `# Top\n## Section\n`;
  render(wrap(<Outline text={md} view={null} />));
  // No throw, no view = no-op
  fireEvent.click(screen.getByText("Top"));
  assert.ok(true);
});

test("Outline: connection pill renders count from connectionCounts (H2 only)", () => {
  const md = `# Top\n\n## Section A\n\n## Section B\n`;
  const counts = new Map<string, number>([["section-a", 3]]);
  const opens: Array<{ anchor: string; count: number }> = [];
  render(
    wrap(
      <Outline
        text={md}
        view={null}
        file="foundations/src/x.md"
        connectionCounts={counts}
        onOpenConnectionsForSection={(s, el) =>
          opens.push({
            anchor: s.anchor,
            count: parseInt(el.textContent ?? "0"),
          })
        }
      />,
    ),
  );
  // Pill must exist on H2s, not on H1s.
  assert.ok(screen.getByTestId("connections-pill-section-a"));
  assert.ok(screen.getByTestId("connections-pill-section-b"));
  // H1 ("Top") does NOT get a pill.
  assert.equal(screen.queryByTestId("connections-pill-top"), null);
});

test("Outline: pill click fires onOpenConnectionsForSection with section + element", () => {
  const md = `# Top\n\n## Section A\n`;
  const opens: Array<{ anchor: string }> = [];
  render(
    wrap(
      <Outline
        text={md}
        view={null}
        file="foundations/src/x.md"
        connectionCounts={new Map([["section-a", 2]])}
        onOpenConnectionsForSection={(s) => opens.push({ anchor: s.anchor })}
      />,
    ),
  );
  fireEvent.click(screen.getByTestId("connections-pill-section-a"));
  assert.equal(opens.length, 1);
  assert.equal(opens[0]!.anchor, "section-a");
});

test("Outline: missing onOpenConnectionsForSection hides the pill entirely (legacy callers)", () => {
  const md = `# Top\n\n## Section A\n`;
  render(wrap(<Outline text={md} view={null} />));
  // No file / no callback / no counts → no pill rendered.
  assert.equal(screen.queryByTestId("connections-pill-section-a"), null);
});

test("Outline: click on heading WITH a fake view dispatches scroll effect", () => {
  const md = `# Top\n## Section\n`;
  const dispatched: unknown[] = [];
  let focused = false;
  const fakeView = {
    state: {
      doc: {
        line: (n: number) => ({ from: (n - 1) * 100 }),
        lineAt: (_pos: number) => ({ number: 1 }),
      },
    },
    dispatch: (spec: unknown) => dispatched.push(spec),
    focus: () => {
      focused = true;
    },
    scrollDOM: {
      addEventListener: () => {},
      removeEventListener: () => {},
    },
    viewport: { from: 0 },
  } as any;
  render(wrap(<Outline text={md} view={fakeView} />));
  fireEvent.click(screen.getByText("Section"));
  assert.equal(dispatched.length, 1);
  assert.ok(focused);
});
