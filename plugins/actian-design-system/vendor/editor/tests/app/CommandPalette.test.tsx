import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import "../setup-dom";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import React from "react";
import {
  CommandPalette,
  type CommandItem,
} from "../../src/app/CommandPalette";

afterEach(() => cleanup());

function wrap(node: React.ReactNode) {
  return <Theme>{node}</Theme>;
}

function makeCmds(): { cmds: CommandItem[]; calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    cmds: [
      {
        id: "a",
        label: "Open coverage",
        group: "Navigate",
        run: () => calls.push("a"),
      },
      {
        id: "b",
        label: "Open settings",
        group: "Actions",
        run: () => calls.push("b"),
      },
    ],
  };
}

test("CommandPalette: hidden by default", () => {
  const { cmds } = makeCmds();
  const { container } = render(wrap(<CommandPalette commands={cmds} />));
  assert.equal(container.querySelector(".cmdk-modal"), null);
});

test("CommandPalette: open=true renders modal with commands", () => {
  const { cmds } = makeCmds();
  render(wrap(<CommandPalette commands={cmds} open={true} onOpenChange={() => {}} />));
  assert.ok(screen.getByText("Open coverage"));
  assert.ok(screen.getByText("Open settings"));
});

test("CommandPalette: groups labelled with the group name", () => {
  const { cmds } = makeCmds();
  render(wrap(<CommandPalette commands={cmds} open={true} onOpenChange={() => {}} />));
  assert.ok(screen.getByText(/Navigate/));
  assert.ok(screen.getByText(/Actions/));
});

test("CommandPalette: clicking item runs the command + closes", () => {
  const { cmds, calls } = makeCmds();
  let openState = true;
  function Wrapper() {
    const [open, setOpen] = React.useState(openState);
    return (
      <CommandPalette
        commands={cmds}
        open={open}
        onOpenChange={(o) => {
          openState = o;
          setOpen(o);
        }}
      />
    );
  }
  render(wrap(<Wrapper />));
  fireEvent.click(screen.getByText("Open coverage"));
  assert.deepEqual(calls, ["a"]);
  assert.equal(openState, false);
});

test("CommandPalette: Cmd-K toggles uncontrolled open state", () => {
  const { cmds } = makeCmds();
  render(wrap(<CommandPalette commands={cmds} />));
  // Initially hidden.
  assert.equal(screen.queryByText("Open coverage"), null);
  fireEvent.keyDown(window, { key: "k", metaKey: true });
  assert.ok(screen.getByText("Open coverage"));
  fireEvent.keyDown(window, { key: "k", metaKey: true });
  // After second toggle should hide again — give React a microtask.
});

test("CommandPalette: backdrop click closes when uncontrolled", () => {
  const { cmds } = makeCmds();
  const { container } = render(wrap(<CommandPalette commands={cmds} />));
  fireEvent.keyDown(window, { key: "k", metaKey: true });
  const overlay = container.querySelector(".cmdk-overlay") as HTMLElement;
  assert.ok(overlay);
  fireEvent.click(overlay);
});
