import { useEffect, useState } from "react";
import type { Octokit } from "@octokit/rest";
import { Badge, Box, Flex, Heading, Text } from "@radix-ui/themes";
import { listDirectories, listFilesByGlob } from "./githubApi";
import { submissionCartSingleton } from "../drafts/store-instance";
import { useCart } from "../drafts/useCart";

interface SidebarProps {
  octokit: Octokit;
  pendingPaths: Set<string>;
  activePath: string | null;
  // `null` selects the Coverage dashboard (the landing surface).
  onSelect: (path: string | null) => void;
}

// Same set as the original MetaEditScreen — components/src dirs that aren't
// editable components.
const SKIP_COMPONENT_DIRS = new Set(["categories", "guidelines"]);
const COMPONENT_VISIBLE_CAP = 20;

interface GroupedEntries {
  foundations: string[];
  accessibility: string[];
  patterns: string[];
  product: string[];
  writing: string[];
  components: string[];
}

type SectionKey =
  | "foundations"
  | "accessibility"
  | "patterns"
  | "product"
  | "writing"
  | "components";

const SECTION_KEYS: ReadonlyArray<SectionKey> = [
  "foundations",
  "accessibility",
  "patterns",
  "product",
  "writing",
  "components",
];

const SECTION_STORAGE_KEY = "sidebar.section.collapsed.v1";

function defaultCollapsed(): Record<SectionKey, boolean> {
  // All sections start collapsed — keeps the sidebar tight on first open;
  // the user expands only what they want to work in. Per-section state
  // persists across reloads via sessionStorage.
  return {
    foundations: true,
    accessibility: true,
    patterns: true,
    product: true,
    writing: true,
    components: true,
  };
}

function loadCollapsedSections(): Record<SectionKey, boolean> {
  try {
    const raw = sessionStorage.getItem(SECTION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Record<SectionKey, boolean>>;
      const result = defaultCollapsed();
      for (const k of SECTION_KEYS) {
        if (typeof parsed[k] === "boolean") result[k] = parsed[k]!;
      }
      return result;
    }
  } catch {
    /* ignore parse / storage errors */
  }
  return defaultCollapsed();
}

export function Sidebar({
  octokit,
  pendingPaths,
  activePath,
  onSelect,
}: SidebarProps) {
  const [entries, setEntries] = useState<GroupedEntries | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [sectionCollapsed, setSectionCollapsed] = useState<
    Record<SectionKey, boolean>
  >(() => loadCollapsedSections());
  const cartEntries = useCart(submissionCartSingleton);
  const inboxActive = activePath === "inbox";

  function toggleSection(group: SectionKey) {
    setSectionCollapsed((prev) => {
      const next = { ...prev, [group]: !prev[group] };
      try {
        sessionStorage.setItem(SECTION_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  useEffect(() => {
    (async () => {
      const [foundations, accessibility, patterns, product, writing, comps] =
        await Promise.all([
          listFilesByGlob(octokit, "foundations/src", {
            extension: ".md",
            exclude: ["AUTHORING.md"],
          }).catch(() => [] as string[]),
          listFilesByGlob(octokit, "accessibility/src", {
            extension: ".md",
            exclude: ["AUTHORING.md"],
          }).catch(() => [] as string[]),
          listFilesByGlob(octokit, "content/src/patterns", {
            extension: ".md",
            exclude: ["AUTHORING.md"],
          }).catch(() => [] as string[]),
          listFilesByGlob(octokit, "content/src/product", {
            extension: ".md",
            exclude: ["AUTHORING.md"],
          }).catch(() => [] as string[]),
          listFilesByGlob(octokit, "content/src/writing", {
            extension: ".md",
            exclude: ["AUTHORING.md"],
          }).catch(() => [] as string[]),
          listDirectories(octokit, "components/src").catch(
            () => [] as string[],
          ),
        ]);
      setEntries({
        foundations,
        accessibility,
        patterns,
        product,
        writing,
        components: comps.filter((c) => !SKIP_COMPONENT_DIRS.has(c)),
      });
    })();
  }, [octokit]);

  if (!entries) {
    return (
      <Box p="3">
        <Text size="1" color="gray">
          Loading…
        </Text>
      </Box>
    );
  }

  function sectionHeader(
    key: SectionKey,
    label: string,
    count: number,
    listId: string,
  ) {
    const collapsed = sectionCollapsed[key];
    const headerId = `sidebar-section-${key}-header`;
    return (
      <Flex
        id={headerId}
        align="center"
        justify="between"
        gap="2"
        px="3"
        py="2"
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
        aria-controls={listId}
        style={{ cursor: "pointer", userSelect: "none" }}
        onClick={() => toggleSection(key)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleSection(key);
          }
        }}
      >
        <Flex align="center" gap="2">
          <span
            aria-hidden="true"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 16,
              height: 16,
              fontSize: 14,
              lineHeight: 1,
              fontWeight: 700,
              color: "var(--gray-12)",
              transition: "transform 120ms",
              transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
            }}
          >
            ▼
          </span>
          <Heading size="2">{label}</Heading>
        </Flex>
        <Text size="1" color="gray">
          {count}
        </Text>
      </Flex>
    );
  }

  function row(path: string, label: string) {
    const isActive = activePath === path;
    const isDraft = pendingPaths.has(path);
    return (
      <Flex
        key={path}
        justify="between"
        align="center"
        px="3"
        py="1"
        style={{
          cursor: "pointer",
          background: isActive ? "var(--accent-3)" : "transparent",
        }}
        onClick={() => onSelect(path)}
      >
        <Text size="2">{label}</Text>
        {isDraft && (
          <span
            className="draft-dot"
            aria-label="unsaved changes"
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--accent-9)",
              display: "inline-block",
            }}
          />
        )}
      </Flex>
    );
  }

  const componentsVisible = expanded
    ? entries.components
    : entries.components.slice(0, COMPONENT_VISIBLE_CAP);

  const coverageActive = activePath == null;
  return (
    <Flex
      direction="column"
      gap="2"
      style={{
        width: 260,
        minWidth: 260,
        flexShrink: 0,
        borderRight: "1px solid var(--gray-5)",
        height: "100%",
        overflow: "auto",
      }}
    >
      <Flex
        align="center"
        gap="2"
        px="3"
        py="2"
        style={{
          cursor: "pointer",
          background: coverageActive ? "var(--accent-3)" : "transparent",
        }}
        onClick={() => onSelect(null)}
        aria-current={coverageActive ? "page" : undefined}
      >
        <span aria-hidden="true">📊</span>
        <Text size="2" weight={coverageActive ? "bold" : "medium"}>
          Coverage
        </Text>
      </Flex>
      <Flex
        align="center"
        justify="between"
        gap="2"
        px="3"
        py="2"
        style={{
          cursor: "pointer",
          background: inboxActive ? "var(--accent-3)" : "transparent",
          borderBottom: "1px solid var(--gray-4)",
        }}
        onClick={() => onSelect("inbox")}
        aria-current={inboxActive ? "page" : undefined}
      >
        <Flex align="center" gap="2">
          <span aria-hidden="true">📥</span>
          <Text size="2" weight={inboxActive ? "bold" : "medium"}>
            Drafts
          </Text>
        </Flex>
        {cartEntries.length > 0 && (
          <Badge color="indigo" variant="soft" size="1">
            {cartEntries.length}
          </Badge>
        )}
      </Flex>

      {entries.foundations.length > 0 && (
        <Box>
          {sectionHeader(
            "foundations",
            "Foundations",
            entries.foundations.length,
            "sidebar-section-foundations-list",
          )}
          {!sectionCollapsed.foundations && (
            <Box
              id="sidebar-section-foundations-list"
              role="group"
              aria-labelledby="sidebar-section-foundations-header"
            >
              {entries.foundations.map((name) =>
                row(`foundations/src/${name}`, name),
              )}
            </Box>
          )}
        </Box>
      )}

      {entries.accessibility.length > 0 && (
        <Box>
          {sectionHeader(
            "accessibility",
            "Accessibility",
            entries.accessibility.length,
            "sidebar-section-accessibility-list",
          )}
          {!sectionCollapsed.accessibility && (
            <Box
              id="sidebar-section-accessibility-list"
              role="group"
              aria-labelledby="sidebar-section-accessibility-header"
            >
              {entries.accessibility.map((name) =>
                row(`accessibility/src/${name}`, name),
              )}
            </Box>
          )}
        </Box>
      )}

      {(["patterns", "product", "writing"] as const).map((group) => {
        const items = entries[group];
        if (items.length === 0) return null;
        const label = `Content — ${group[0]!.toUpperCase()}${group.slice(1)}`;
        const collapsed = sectionCollapsed[group];
        const listId = `sidebar-section-${group}-list`;
        return (
          <Box key={group}>
            {sectionHeader(group, label, items.length, listId)}
            {!collapsed && (
              <Box
                id={listId}
                role="group"
                aria-labelledby={`sidebar-section-${group}-header`}
              >
                {items.map((name) => row(`content/src/${group}/${name}`, name))}
              </Box>
            )}
          </Box>
        );
      })}

      {entries.components.length > 0 && (
        <Box>
          {sectionHeader(
            "components",
            "Components",
            entries.components.length,
            "sidebar-section-components-list",
          )}
          {!sectionCollapsed.components && (
            <Box
              id="sidebar-section-components-list"
              role="group"
              aria-labelledby="sidebar-section-components-header"
            >
              {componentsVisible.map((slug) => row(`workspace/${slug}`, slug))}
              {!expanded &&
                entries.components.length > COMPONENT_VISIBLE_CAP && (
                  <Box px="3" py="1">
                    <Text
                      size="1"
                      style={{
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                      onClick={() => setExpanded(true)}
                    >
                      Show all ({entries.components.length})
                    </Text>
                  </Box>
                )}
            </Box>
          )}
        </Box>
      )}
    </Flex>
  );
}
