// Initial content for new (404) markdown files.
//
// The author landed here for a path that doesn't exist on remote yet.
// The stub gives them a frame + a clearly-marked TODO so the canvas
// isn't blank.

const COMPONENT_DOMAIN_RE =
  /^components\/src\/([^/]+)\/(content|usage|design|behavior|tokens)\.md$/;
const CATEGORY_RE = /^components\/src\/categories\/([^/]+)\.md$/;

const DOMAIN_LABEL: Record<string, string> = {
  content: "Content",
  usage: "Usage",
  design: "Design",
  behavior: "Behavior",
  tokens: "Tokens",
};

function humanize(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export function buildMarkdownStub(
  path: string,
  opts?: { title?: string },
): string {
  const compDomain = COMPONENT_DOMAIN_RE.exec(path);
  if (compDomain) {
    const slug = compDomain[1]!;
    const domain = compDomain[2]!;
    const label = DOMAIN_LABEL[domain] ?? humanize(domain);
    return [
      `# ${humanize(slug)} — ${label}`,
      "",
      `<!-- Draft authoring stub. Replace this with the ${label.toLowerCase()} guidance for ${humanize(slug)}. -->`,
      "",
    ].join("\n");
  }

  const category = CATEGORY_RE.exec(path);
  if (category) {
    const slug = category[1]!;
    return [
      `# ${humanize(slug)} — category defaults`,
      "",
      `<!-- Draft authoring stub. Cross-component defaults for the ${humanize(slug)} category. -->`,
      "",
    ].join("\n");
  }

  // Generic fallback — use opts.title if provided, otherwise derive from basename.
  const base = path.split("/").pop()!.replace(/\.md$/, "");
  const heading = opts?.title?.trim() || humanize(base);
  return [
    `# ${heading}`,
    "",
    "<!-- Draft authoring stub. Replace with the file's content. -->",
    "",
  ].join("\n");
}
