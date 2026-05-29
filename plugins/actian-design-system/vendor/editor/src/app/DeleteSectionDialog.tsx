import { useEffect, useState } from "react";
import {
  Box,
  Dialog,
  Flex,
  Text,
  Button,
  Callout,
  Checkbox,
} from "@radix-ui/themes";

export interface DeleteSectionDialogProps {
  open: boolean;
  slug: string;
  title: string;
  domain: string;
  refCount: number;
  sampleRefs: string[];
  loading?: boolean;
  onConfirm: (slug: string) => void;
  onCancel: () => void;
}

export function DeleteSectionDialog({
  open,
  slug,
  title,
  domain,
  refCount,
  sampleRefs,
  loading = false,
  onConfirm,
  onCancel,
}: DeleteSectionDialogProps) {
  const [ack, setAck] = useState(false);

  useEffect(() => {
    if (!open) setAck(false);
  }, [open]);

  const needsAck = refCount > 0;
  const canDelete = !loading && (!needsAck || ack);
  const extras = Math.max(0, refCount - sampleRefs.length);

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onCancel()}>
      <Dialog.Content style={{ maxWidth: 460 }}>
        <Dialog.Title>Delete "{title}"?</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="3">
          This will remove{" "}
          <code data-detail="path">{`${domain}/src/${slug}.md`}</code> and drop
          it from the section order.
        </Dialog.Description>

        {loading && (
          <Text size="2" color="gray" mb="3" as="p">
            Checking references…
          </Text>
        )}

        {!loading && needsAck && (
          <Callout.Root color="orange" mt="2" mb="3">
            <Callout.Text>
              <Text weight="bold">
                Referenced by {refCount} file{refCount === 1 ? "" : "s"}
              </Text>
            </Callout.Text>
            <Box mt="2">
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {sampleRefs.map((r) => (
                  <li key={r} data-detail="path">
                    <Text size="1">{r}</Text>
                  </li>
                ))}
              </ul>
              {extras > 0 && (
                <Text size="1" mt="1" as="div">
                  +{extras} more
                </Text>
              )}
            </Box>
          </Callout.Root>
        )}

        {!loading && needsAck && (
          <Text
            as="label"
            size="2"
            mb="3"
            style={{ display: "flex", alignItems: "flex-start", gap: 8 }}
          >
            <Checkbox
              checked={ack}
              onCheckedChange={(c) => setAck(c === true)}
              aria-label="Acknowledge references will break"
            />
            I understand these references will break and need to be updated in a
            follow-up.
          </Text>
        )}

        <Flex gap="2" justify="end" mt="2">
          <Button variant="soft" color="gray" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            color="red"
            disabled={!canDelete}
            onClick={() => onConfirm(slug)}
          >
            Delete
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
