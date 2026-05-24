import { useState } from "react";
import {
  Container,
  Flex,
  Heading,
  IconButton,
  Text,
  Theme,
  Tooltip,
} from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import "./styles/tokens.css";
import "./styles/base.css";
import { SettingsPanel } from "./settings/SettingsPanel";
import { MetaEditScreen } from "./app/MetaEditScreen";

function GearIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <Theme accentColor="indigo" radius="medium">
      <Container size="3" style={{ padding: "var(--space-6, 24px)" }}>
        <Flex justify="between" align="center" mb="4">
          <Heading>Knowledge Editor</Heading>
          <Tooltip content="Settings">
            <IconButton
              variant="ghost"
              onClick={() => setSettingsOpen(true)}
              aria-label="Open settings"
            >
              <GearIcon />
            </IconButton>
          </Tooltip>
        </Flex>
        <Text as="p" color="gray" mb="5">
          Phase 1a vertical slice — pick a component, edit its{" "}
          <code>_meta.yml</code>, open a PR.
        </Text>
        <MetaEditScreen onOpenSettings={() => setSettingsOpen(true)} />
        <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
      </Container>
    </Theme>
  );
}
