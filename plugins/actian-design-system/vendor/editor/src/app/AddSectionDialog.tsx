import { useEffect, useState } from "react";
import { Dialog, Flex, Text, TextField, Button } from "@radix-ui/themes";

const SLUG_RE = /^[a-z][a-z0-9-]*$/;

function deriveSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

// Humanizes a domain string that may contain a "/" separator.
// e.g. "content/patterns" → "Content / Patterns", "foundations" → "Foundations"
function humanize(s: string): string {
  return s
    .split("/")
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join(" / ");
}

export interface AddSectionDialogProps {
  open: boolean;
  domain: string;
  /** Pre-computed path prefix, e.g. "foundations/src" or "content/src/patterns". */
  pathPrefix: string;
  existingSlugs: string[];
  onConfirm: (value: { title: string; slug: string }) => void;
  onCancel: () => void;
}

export function AddSectionDialog({
  open,
  domain,
  pathPrefix,
  existingSlugs,
  onConfirm,
  onCancel,
}: AddSectionDialogProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setSlug("");
      setSlugTouched(false);
    }
  }, [open]);

  useEffect(() => {
    if (!slugTouched) setSlug(deriveSlug(title));
  }, [title, slugTouched]);

  const validShape = SLUG_RE.test(slug);
  const collides = existingSlugs.includes(slug);
  const canSubmit = title.trim().length > 0 && validShape && !collides;

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onCancel()}>
      <Dialog.Content style={{ maxWidth: 420 }}>
        <Dialog.Title>Add section</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="3">
          Adding to <strong>{humanize(domain)}</strong>.
        </Dialog.Description>

        <Flex direction="column" gap="3">
          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              Title
            </Text>
            <TextField.Root
              autoFocus
              aria-label="Title"
              value={title}
              placeholder="Layout primitives"
              onChange={(e) => setTitle(e.currentTarget.value)}
            />
          </label>

          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              Filename
            </Text>
            <TextField.Root
              aria-label="Filename"
              value={slug}
              placeholder="layout-primitives"
              onChange={(e) => {
                setSlug(e.currentTarget.value);
                setSlugTouched(true);
              }}
            />
            <Text size="1" color="gray" mt="1" data-detail="path">
              {`${pathPrefix}/${slug || "<slug>"}.md`}
            </Text>
            {title.trim().length > 0 && !validShape && (
              <Text size="1" color="red" mt="1">
                {slug.length === 0
                  ? "Filename must start with a lowercase letter."
                  : "Lowercase letters, digits, and hyphens only."}
              </Text>
            )}
            {collides && (
              <Text size="1" color="red" mt="1">
                A section with that name already exists.
              </Text>
            )}
          </label>
        </Flex>

        <Flex gap="2" justify="end" mt="4">
          <Button variant="soft" color="gray" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() => onConfirm({ title: title.trim(), slug })}
          >
            Add
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
