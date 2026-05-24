import { useState } from "react";
import { Button, Dialog, Flex, Link, Text, TextField } from "@radix-ui/themes";
import { PATVault } from "./PATVault";

export interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vault?: PATVault;
}

const PAT_HELP_URL = "https://github.com/settings/personal-access-tokens/new";

export function SettingsPanel({
  open,
  onOpenChange,
  vault,
}: SettingsPanelProps) {
  const activeVault = vault ?? new PATVault();
  const [draft, setDraft] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const currentToken = activeVault.get();

  function handleSave() {
    if (!draft.trim()) return;
    activeVault.set(draft.trim());
    setDraft("");
    setSavedAt(Date.now());
  }

  function handleClear() {
    activeVault.clear();
    setSavedAt(Date.now());
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="480px">
        <Dialog.Title>Settings</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          The editor uses a fine-grained GitHub Personal Access Token to open
          Pull Requests against <code>actian-ds-knowledge</code>. The token is
          stored in this browser&apos;s <code>localStorage</code> only.
        </Dialog.Description>

        <Flex direction="column" gap="3">
          <Text as="label" size="2" weight="bold" htmlFor="pat-input">
            GitHub Personal Access Token
          </Text>

          {currentToken ? (
            <Text as="div" size="2" color="grass">
              Signed in (token: {currentToken.slice(0, 7)}…
              {currentToken.slice(-4)})
            </Text>
          ) : (
            <Text as="div" size="2" color="gray">
              No token saved.
            </Text>
          )}

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
            Required permissions on <code>volivarii/actian-ds-knowledge</code>:{" "}
            <strong>Contents — Read and write</strong> +{" "}
            <strong>Pull requests — Read and write</strong>. Classic tokens may
            use the broader <code>repo</code> scope instead.
          </Text>

          <Flex gap="2" justify="end" mt="2">
            {currentToken && (
              <Button color="ruby" variant="soft" onClick={handleClear}>
                Sign out
              </Button>
            )}
            <Button onClick={handleSave} disabled={!draft.trim()}>
              {currentToken ? "Replace token" : "Save token"}
            </Button>
          </Flex>

          {savedAt && (
            <Text as="div" size="1" color="gray">
              Updated {new Date(savedAt).toLocaleTimeString()}.
            </Text>
          )}
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
