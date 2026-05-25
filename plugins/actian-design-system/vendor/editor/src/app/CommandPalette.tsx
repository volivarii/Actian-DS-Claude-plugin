// Command palette via cmdk — global Cmd-K / Ctrl-K.
//
// Initial command set:
//   - Open coverage dashboard (= setActivePath(null))
//   - Open file → typeahead over the small set of "known" doc paths
//     (foundations + accessibility + per-component _meta/content/etc.)
//     For V1 just exposes the file picker via the sidebar; future iteration
//     could pull a deeper file index.
//   - Open settings
//
// V1 scope (PR 2b T5): the keyboard binding + a small initial command
// vocabulary that proves the seam. Cross-pane wiring (jump-to-heading,
// switch-domain, submit-current, add-to-batch) is straightforward to
// add later — each is a `{ id, label, hint, run }` entry.

import { useEffect, useMemo, useState } from "react";
import { Command } from "cmdk";
import { Box, Text } from "@radix-ui/themes";

export interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  group?: string;
  run: () => void;
}

export interface CommandPaletteProps {
  commands: CommandItem[];
  // Optional controlled open state (mostly for tests). When undefined,
  // the palette manages its own open/close via Cmd-K/Esc.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandPalette({
  commands,
  open: openProp,
  onOpenChange,
}: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  const groups = useMemo(() => groupCommands(commands), [commands]);

  if (!open) return null;

  return (
    <div
      className="cmdk-overlay"
      role="presentation"
      onClick={() => setOpen(false)}
    >
      <Box
        className="cmdk-modal"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        role="dialog"
        aria-label="Command palette"
      >
        <Command label="Command palette" loop>
          <Command.Input
            placeholder="Type a command or search…"
            className="cmdk-input"
            autoFocus
          />
          <Command.List className="cmdk-list">
            <Command.Empty>
              <Text size="2" color="gray">
                No commands match.
              </Text>
            </Command.Empty>
            {groups.map(({ name, items }) => (
              <Command.Group key={name} heading={name}>
                {items.map((c) => (
                  <Command.Item
                    key={c.id}
                    value={`${c.label} ${c.hint ?? ""}`.trim()}
                    onSelect={() => {
                      setOpen(false);
                      c.run();
                    }}
                  >
                    <Text size="2">{c.label}</Text>
                    {c.hint && (
                      <Text size="1" color="gray" ml="2">
                        {c.hint}
                      </Text>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </Box>
    </div>
  );
}

function groupCommands(
  commands: CommandItem[],
): Array<{ name: string; items: CommandItem[] }> {
  const map = new Map<string, CommandItem[]>();
  for (const c of commands) {
    const group = c.group ?? "Actions";
    if (!map.has(group)) map.set(group, []);
    map.get(group)!.push(c);
  }
  return Array.from(map.entries()).map(([name, items]) => ({ name, items }));
}
