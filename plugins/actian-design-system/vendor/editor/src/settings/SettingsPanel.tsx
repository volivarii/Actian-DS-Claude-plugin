import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  Flex,
  Link,
  Text,
  TextField,
} from "@radix-ui/themes";
import { getSession, signOut, signInWithPAT } from "../auth";
import { DEFAULT_COORDS } from "../config/coords";

export interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAT_HELP_URL = "https://github.com/settings/personal-access-tokens/new";

export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
  const session = getSession();
  const [draft, setDraft] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  function handleSave() {
    if (!draft.trim()) return;
    try {
      signInWithPAT(draft.trim());
      setDraft("");
      setSavedAt(Date.now());
      setSaveError(null);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save token.",
      );
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="480px">
        <Dialog.Title>Settings</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          The editor uses a fine-grained GitHub Personal Access Token to open
          Pull Requests against <code>{DEFAULT_COORDS.repo}</code>. The token is
          stored in this browser&apos;s <code>localStorage</code> only.
        </Dialog.Description>

        <Flex direction="column" gap="3">
          {session && (
            <Box
              mb="3"
              p="3"
              style={{ background: "var(--gray-2)", borderRadius: 6 }}
            >
              <Text size="2">
                Signed in via <strong>{session.method.toUpperCase()}</strong>
                {session.login && (
                  <>
                    {" "}
                    as <strong>{session.login}</strong>
                  </>
                )}
              </Text>
              <Box mt="2">
                <Button
                  variant="soft"
                  color="gray"
                  size="1"
                  onClick={() => signOut()}
                >
                  Sign out
                </Button>
              </Box>
            </Box>
          )}

          <Text as="label" size="2" weight="bold" htmlFor="pat-input">
            GitHub Personal Access Token
          </Text>

          <TextField.Root
            id="pat-input"
            type="password"
            placeholder="ghp_…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoComplete="off"
          />

          <Text as="div" size="1" color="gray">
            <Link href={PAT_HELP_URL} target="_blank" rel="noreferrer">
              Generate a fine-grained token →
            </Link>{" "}
            Required permissions on{" "}
            <code>
              {DEFAULT_COORDS.owner}/{DEFAULT_COORDS.repo}
            </code>
            : <strong>Contents — Read and write</strong> +{" "}
            <strong>Pull requests — Read and write</strong>. Classic tokens may
            use the broader <code>repo</code> scope instead.
          </Text>

          <Flex gap="2" justify="end" mt="2">
            <Button onClick={handleSave} disabled={!draft.trim()}>
              {session ? "Replace token" : "Save token"}
            </Button>
          </Flex>

          {saveError && (
            <Text as="div" size="1" color="red">
              {saveError}
            </Text>
          )}

          {savedAt && !saveError && (
            <Text as="div" size="1" color="gray">
              Updated {new Date(savedAt).toLocaleTimeString()}.
            </Text>
          )}
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
