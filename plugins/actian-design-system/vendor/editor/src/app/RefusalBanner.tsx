import { Button, Callout, Flex, Text } from "@radix-ui/themes";

interface RefusalBannerProps {
  path: string;
  onBack: () => void;
}

const REASONS: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /AUTHORING\.md$/,
    message: "AUTHORING.md is a meta-doc and not edited in the editor.",
  },
  {
    pattern: /^tokens\/token-reference\.md$/,
    message: "tokens/token-reference.md is auto-generated from tokens.json.",
  },
];

export function RefusalBanner({ path, onBack }: RefusalBannerProps) {
  const reason =
    REASONS.find((r) => r.pattern.test(path))?.message ??
    "This file isn't in the PR 2a editable set.";
  return (
    <Callout.Root color="amber">
      <Flex direction="column" gap="2">
        <Text>This file type isn't editable yet.</Text>
        <Text size="2">{reason}</Text>
        <Text size="2">
          Class C JSON widgets, tier banners, draft inbox, and AI seam ship in
          PR 2b/2c.
        </Text>
        <Flex justify="end">
          <Button variant="soft" onClick={onBack}>
            ← Back
          </Button>
        </Flex>
      </Flex>
    </Callout.Root>
  );
}
