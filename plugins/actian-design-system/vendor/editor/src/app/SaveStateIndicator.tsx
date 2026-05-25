// Header-bar badge surfacing draft-save state to the author.
//
// Three visible states (idle is hidden):
//   ● Unsaved changes    (warning amber, while a debounce timer pends)
//   ● Saving…            (neutral spinner, very briefly during the write)
//   ✓ Draft saved · …    (success green, with relative timestamp)
//
// Wording note: "Draft saved" — NOT "Saved". Removes ambiguity between
// local draft and remote commit. Authors who see "Saved" sometimes
// assume the file is pushed to GitHub; "Draft saved" makes the local
// scope explicit.

import { useEffect, useState } from "react";
import { Badge, Flex, Text } from "@radix-ui/themes";
import type { SaveState } from "../drafts/useSaveState";

export interface SaveStateIndicatorProps {
  state: SaveState;
}

function relativeTime(ts: number, now: number): string {
  const diffSec = Math.floor((now - ts) / 1000);
  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function SaveStateIndicator({ state }: SaveStateIndicatorProps) {
  // Tick every second so the relative timestamp re-renders.
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (state.kind !== "saved") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    // unref() prevents the timer from keeping the Node.js event loop alive
    // in test environments — has no effect in browsers.
    if (typeof (id as unknown as { unref?: () => void }).unref === "function") {
      (id as unknown as { unref: () => void }).unref();
    }
    return () => clearInterval(id);
  }, [state.kind]);

  if (state.kind === "idle") return null;

  if (state.kind === "unsaved") {
    return (
      <Badge variant="soft" color="amber" radius="full">
        <Dot color="var(--zen-color-icon-warning, #EF8D00)" />
        <Text size="1">Unsaved changes</Text>
      </Badge>
    );
  }

  if (state.kind === "saving") {
    return (
      <Badge variant="soft" color="gray" radius="full">
        <Dot color="var(--zen-color-neutral-400, #9898A7)" pulsing />
        <Text size="1">Saving…</Text>
      </Badge>
    );
  }

  // saved
  return (
    <Badge variant="soft" color="green" radius="full">
      <Check color="var(--zen-color-icon-success, #098900)" />
      <Text size="1">Draft saved · {relativeTime(state.savedAt, now)}</Text>
    </Badge>
  );
}

function Dot({ color, pulsing }: { color: string; pulsing?: boolean }) {
  return (
    <Flex
      align="center"
      justify="center"
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: color,
        animation: pulsing ? "save-pulse 1s ease-in-out infinite" : undefined,
        marginRight: 6,
      }}
    />
  );
}

function Check({ color }: { color: string }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      style={{ marginRight: 6 }}
      aria-hidden="true"
    >
      <path
        d="M2.5 6.5L5 9L9.5 3.5"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
