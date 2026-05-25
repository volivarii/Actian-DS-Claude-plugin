// Renders the tier banner above an editor surface. Returns null for
// "writable" tier (the common case) so it's safe to mount unconditionally.

import { Callout, Flex, Text } from "@radix-ui/themes";
import { getPathTier } from "../lib/pathTiers";

export interface TierBannerProps {
  path: string;
}

export function TierBanner({ path }: TierBannerProps) {
  const info = getPathTier(path);
  if (info.severity === "none") return null;
  const color = info.severity === "red" ? "red" : "amber";
  return (
    <Callout.Root color={color} size="1" role="alert">
      <Flex direction="column" gap="1">
        <Text size="2" weight="bold">
          {info.label}
        </Text>
        <Callout.Text>{info.message}</Callout.Text>
      </Flex>
    </Callout.Root>
  );
}
