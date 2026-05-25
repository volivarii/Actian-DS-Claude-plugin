import { useState } from "react";
import {
  Box,
  Button,
  Callout,
  Flex,
  Heading,
  Text,
  TextField,
} from "@radix-ui/themes";

export interface SignInScreenProps {
  onOAuthSignIn: () => Promise<void>;
  onPATSignIn: (pat: string) => void;
}

export function SignInScreen({
  onOAuthSignIn,
  onPATSignIn,
}: SignInScreenProps) {
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [patExpanded, setPatExpanded] = useState(false);
  const [patValue, setPatValue] = useState("");

  const handleOAuth = async () => {
    setOauthError(null);
    setOauthLoading(true);
    try {
      await onOAuthSignIn();
    } catch (err) {
      setOauthError((err as Error).message);
    } finally {
      setOauthLoading(false);
    }
  };

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      style={{ minHeight: "100vh", padding: "24px" }}
    >
      <Box style={{ maxWidth: 420, width: "100%" }}>
        <Heading size="6" mb="2">
          Actian DS Knowledge Editor
        </Heading>
        <Text size="2" color="gray" mb="5" as="p">
          Sign in to read and edit the knowledge substrate.
        </Text>

        <Button
          size="3"
          onClick={handleOAuth}
          loading={oauthLoading}
          style={{ width: "100%" }}
        >
          Sign in with GitHub →
        </Button>

        {oauthError && (
          <Callout.Root color="red" size="1" mt="3">
            <Callout.Text>{oauthError}</Callout.Text>
          </Callout.Root>
        )}

        <Box mt="5">
          <Text
            size="1"
            color="gray"
            style={{ cursor: "pointer" }}
            onClick={() => setPatExpanded(!patExpanded)}
          >
            {patExpanded ? "▾" : "▸"} Use a personal access token instead
          </Text>
        </Box>

        {patExpanded && (
          <Flex direction="column" gap="2" mt="2">
            <TextField.Root
              type="password"
              placeholder="Personal access token (ghp_…)"
              value={patValue}
              onChange={(e) => setPatValue(e.target.value)}
            />
            <Button
              variant="soft"
              onClick={() => {
                if (patValue.trim()) onPATSignIn(patValue.trim());
              }}
            >
              Save token
            </Button>
            <Text size="1" color="gray">
              Fine-grained PAT with <strong>Contents: read & write</strong> on{" "}
              <code>actian-ds-knowledge</code>.
            </Text>
          </Flex>
        )}
      </Box>
    </Flex>
  );
}
