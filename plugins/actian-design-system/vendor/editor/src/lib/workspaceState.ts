// Status derivation for the Authoring Workspace.
//
// The workspace shows ONE row per domain, with status derived from
// observable state — NOT from an explicit picker. Rules:
//
//   inherited  : _meta.yml (cart or remote) declares this domain inherited
//   approved   : _meta.yml declares it approved
//   authored   : <domain>.md exists in cart or remote, and not inherited
//   not-started: nothing yet — file absent + status missing/not-started
//
// "authored" subsumes the deriver's draft/approved when the file exists;
// the workspace shows it as a single "Authored" state because the
// distinction (draft vs approved) is a review step, not an authoring step.

import type { Octokit } from "@octokit/rest";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { getTextFile } from "../app/githubApi";
import { submissionCartSingleton } from "../drafts/store-instance";
import type { SubmissionCart } from "../drafts/SubmissionCart";
import { fetchLatestCommit, type CommitInfo } from "./derivedFields";

export const DOMAINS = [
  "content",
  "usage",
  "design",
  "behavior",
  "tokens",
] as const;
export type Domain = (typeof DOMAINS)[number];

export const DOMAIN_LABEL: Record<Domain, string> = {
  content: "Content",
  usage: "Usage",
  design: "Design",
  behavior: "Behavior",
  tokens: "Tokens",
};

export const DOMAIN_HINT: Record<Domain, string> = {
  content: "Voice, tone, words to use, words to avoid for this component.",
  usage: "When to use this component vs alternatives. Anti-patterns.",
  design: "Visual rules — anatomy, spacing, sizing, variants.",
  behavior: "Interaction states, animation, focus, keyboard.",
  tokens: "Which DS tokens this component binds. Theming notes.",
};

const DSKIT_REGISTRY_PATH = "components/dist/registries/dskit.json";

interface RegistryEntry {
  name: string;
  category?: string;
}

// Slugify the registry's human category label so it matches the
// _meta.yml schema's expected pattern.
function slugifyCategory(cat?: string): string | undefined {
  if (!cat) return undefined;
  return cat
    .toLowerCase()
    .replace(/[()&,]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function loadRegistryEntry(
  gh: Octokit,
  slug: string,
): Promise<RegistryEntry | null> {
  try {
    const text = await getTextFile(gh, DSKIT_REGISTRY_PATH);
    const parsed = JSON.parse(text) as {
      components?: Record<string, { name: string; category?: string }>;
    };
    const entry = parsed.components?.[slug];
    if (!entry) return null;
    return { name: entry.name, category: slugifyCategory(entry.category) };
  } catch {
    return null;
  }
}

export type WorkspaceDomainStatus =
  | "not-started"
  | "authored"
  | "inherited"
  | "approved";

export interface WorkspaceDomain {
  domain: Domain;
  status: WorkspaceDomainStatus;
  /** True iff the <domain>.md file is in the submission cart right now. */
  hasCartMd: boolean;
  /** True iff the <domain>.md file exists on the remote (main). */
  hasRemoteMd: boolean;
  /** Latest commit touching the <domain>.md on main, when the file is on
   *  remote. null when no commit history (new file, cart-only, or fetch
   *  failed). T1.8 Phase 3a — replaces manual `updatedAt` + `owner`. */
  lastCommit?: CommitInfo | null;
}

export interface WorkspaceState {
  slug: string;
  /** Component human name (cart → remote → registry → humanized slug). */
  componentName: string;
  /** Category slug (cart → remote → registry-slugified → undefined). */
  category?: string;
  /** True iff _meta.yml itself is in the cart (i.e. staged for PR). */
  metaInCart: boolean;
  /** True iff _meta.yml is on remote (otherwise component is brand-new). */
  metaOnRemote: boolean;
  domains: WorkspaceDomain[];
  /** All cart entries scoped to this component's directory (for batch view). */
  cartEntries: { path: string; addedAt: number }[];
}

export function metaPathFor(slug: string): string {
  return `components/src/${slug}/_meta.yml`;
}

export function domainPathFor(slug: string, domain: Domain): string {
  return `components/src/${slug}/${domain}.md`;
}

interface ParsedMeta {
  component?: string;
  category?: string;
  domains?: Record<
    string,
    { status?: string; owner?: string; updatedAt?: string } | undefined
  >;
}

function safeParseMeta(text: string): ParsedMeta {
  try {
    const v = parseYaml(text);
    return (v && typeof v === "object" ? v : {}) as ParsedMeta;
  } catch {
    return {};
  }
}

async function tryGetText(gh: Octokit, path: string): Promise<string | null> {
  try {
    return await getTextFile(gh, path);
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 404) return null;
    throw err;
  }
}

export interface LoadWorkspaceOptions {
  cart?: SubmissionCart;
}

export async function loadWorkspaceState(
  gh: Octokit,
  slug: string,
  opts: LoadWorkspaceOptions = {},
): Promise<WorkspaceState> {
  const cart = opts.cart ?? submissionCartSingleton;
  const allCart = cart.list();
  const componentPrefix = `components/src/${slug}/`;
  const cartEntries = allCart
    .filter((e) => e.path.startsWith(componentPrefix))
    .map((e) => ({ path: e.path, addedAt: e.addedAt }));

  const metaPath = metaPathFor(slug);
  const metaCart = allCart.find((e) => e.path === metaPath) ?? null;
  const metaRemote = metaCart ? null : await tryGetText(gh, metaPath);
  // Registry lookup runs in parallel with the meta probe — used as the
  // fallback display name / category when _meta.yml isn't anywhere yet.
  const registry = await loadRegistryEntry(gh, slug);

  const metaText = metaCart?.content ?? metaRemote ?? "";
  const meta = metaText ? safeParseMeta(metaText) : {};
  const componentName = meta.component ?? registry?.name ?? humanizeSlug(slug);
  const category = meta.category ?? registry?.category ?? undefined;
  const metaInCart = metaCart !== null;
  const metaOnRemote = metaRemote !== null;

  // For each domain, probe remote (cheap — 5 parallel HEADs at most) AND
  // check the cart. Status is derived from those + the _meta.yml's
  // explicit declaration (which only carries "inherited" / "approved"
  // signal that isn't deducible from file presence alone).
  //
  // For domains with a remote file, ALSO fetch the latest commit — used
  // by the workspace to display derived "updated X ago · @author"
  // metadata (T1.8 Phase 3a). Fetches are cached per-session 5min.
  const domainResults = await Promise.all(
    DOMAINS.map(async (d) => {
      const path = domainPathFor(slug, d);
      const cartHit = allCart.some((e) => e.path === path);
      const remoteHit = cartHit ? false : (await tryGetText(gh, path)) !== null;
      const lastCommit = remoteHit ? await fetchLatestCommit(gh, path) : null;
      return {
        domain: d,
        hasCartMd: cartHit,
        hasRemoteMd: remoteHit,
        lastCommit,
      };
    }),
  );

  const domains: WorkspaceDomain[] = domainResults.map((r) => {
    const declared = meta.domains?.[r.domain]?.status;
    let status: WorkspaceDomainStatus;
    if (declared === "inherited") status = "inherited";
    else if (r.hasCartMd || r.hasRemoteMd) {
      status = declared === "approved" ? "approved" : "authored";
    } else {
      status = "not-started";
    }
    return { ...r, status };
  });

  return {
    slug,
    componentName,
    category,
    metaInCart,
    metaOnRemote,
    domains,
    cartEntries,
  };
}

function humanizeSlug(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

// Build a minimal schema-valid _meta.yml stub for a brand-new component.
export function buildStubMetaContent(
  componentName: string,
  category?: string,
): string {
  const lines: string[] = [
    "# yaml-language-server: $schema=../../../schemas/guideline-meta.json",
    `component: "${componentName.replace(/"/g, '\\"')}"`,
  ];
  if (category) lines.push(`category: ${category}`);
  lines.push("domains:");
  for (const d of DOMAINS) {
    lines.push(`  ${d}: { status: not-started }`);
  }
  lines.push("");
  return lines.join("\n");
}

// Idempotently ensure a _meta.yml entry exists in the cart for this slug.
// Returns the entry's content (caller may want to mutate further). If a
// cart entry already exists, returns its content unchanged. If a remote
// version exists, falls back to that (no need to stage — submitDraft
// only writes paths in `files[]`). If neither, builds a stub and stages.
async function ensureMetaInCart(
  gh: Octokit,
  slug: string,
  cart: SubmissionCart,
): Promise<string> {
  const metaPath = metaPathFor(slug);
  const existing = cart.list().find((e) => e.path === metaPath);
  if (existing) return existing.content;
  const remote = await tryGetText(gh, metaPath);
  if (remote) {
    cart.add({
      path: metaPath,
      content: remote,
      basedOnSha: "",
      addedAt: Date.now(),
    });
    return remote;
  }
  const registry = await loadRegistryEntry(gh, slug);
  const stub = buildStubMetaContent(
    registry?.name ?? humanizeSlug(slug),
    registry?.category,
  );
  cart.add({
    path: metaPath,
    content: stub,
    basedOnSha: "",
    addedAt: Date.now(),
  });
  return stub;
}

// User clicked "Write Content" on the workspace — stage the metadata
// stub if needed, then promote `domains.<d>.status` to "draft" so the
// declared metadata reflects the in-flight authoring.
//
// This is the first place that touches the cart for a new component:
// opening the workspace alone is read-only. Only a concrete authoring
// action (Write a domain, or Edit metadata) stages a stub.
export async function promoteDomainToDraft(
  gh: Octokit,
  slug: string,
  domain: Domain,
  cart: SubmissionCart = submissionCartSingleton,
): Promise<void> {
  const metaPath = metaPathFor(slug);
  const content = await ensureMetaInCart(gh, slug, cart);
  const parsed = safeParseMeta(content);
  const domains = parsed.domains ?? {};
  const current = domains[domain]?.status;
  if (!current || current === "not-started") {
    domains[domain] = { ...(domains[domain] ?? {}), status: "draft" };
    parsed.domains = domains;
    const next = stringifyYaml(parsed);
    cart.add({
      path: metaPath,
      content: next,
      basedOnSha: "",
      addedAt: Date.now(),
    });
  }
}

// User clicked "Edit metadata" on the workspace — stage the stub (if
// not already staged) so MetaEditScreen's cart-wins load picks it up.
// No status changes.
export async function stageMetadataForEdit(
  gh: Octokit,
  slug: string,
  cart: SubmissionCart = submissionCartSingleton,
): Promise<void> {
  await ensureMetaInCart(gh, slug, cart);
}

// Author explicitly marked a domain as inherited (or un-marked it).
// Sets `domains.<d>.status` to "inherited" or clears it back to
// "not-started" — the only two values authors can intend via the
// workspace's checkbox. (`draft`/`approved` come from file presence +
// review actions, not the author's pick.)
export async function setDomainInherited(
  gh: Octokit,
  slug: string,
  domain: Domain,
  inherited: boolean,
  cart: SubmissionCart = submissionCartSingleton,
): Promise<void> {
  const metaPath = metaPathFor(slug);
  const content = await ensureMetaInCart(gh, slug, cart);
  const parsed = safeParseMeta(content);
  const domains = parsed.domains ?? {};
  const targetStatus = inherited ? "inherited" : "not-started";
  domains[domain] = { ...(domains[domain] ?? {}), status: targetStatus };
  parsed.domains = domains;
  cart.add({
    path: metaPath,
    content: stringifyYaml(parsed),
    basedOnSha: "",
    addedAt: Date.now(),
  });
}

// Pre-submit coupling validation — checks every _meta.yml in the cart
// against the matching <domain>.md presence (cart or remote). Returns
// human-readable mismatch messages; empty array = OK to submit.
//
// Two failure shapes:
//   (A) declared-but-missing: domains.<d>.status === "draft"|"approved"
//       but components/src/<slug>/<d>.md is neither in cart nor remote
//   (B) orphan-file: the .md is in the cart but the meta declares the
//       domain as "not-started" or "inherited" (drift the workspace
//       should auto-correct, but a hand-edit might cause)
export interface CouplingMismatch {
  metaPath: string;
  slug: string;
  domain: Domain;
  kind: "declared-but-missing" | "orphan-file";
  declaredStatus?: string;
}

export async function validateCartCoupling(
  gh: Octokit,
  cart: SubmissionCart = submissionCartSingleton,
): Promise<CouplingMismatch[]> {
  const entries = cart.list();
  const metaEntries = entries.filter((e) =>
    /^components\/src\/[^/]+\/_meta\.yml$/.test(e.path),
  );
  const cartPaths = new Set(entries.map((e) => e.path));
  const out: CouplingMismatch[] = [];
  for (const meta of metaEntries) {
    const slug = meta.path.split("/")[2]!;
    const parsed = safeParseMeta(meta.content);
    const decls = parsed.domains ?? {};
    for (const d of DOMAINS) {
      const status = decls[d]?.status;
      const mdPath = domainPathFor(slug, d);
      const mdInCart = cartPaths.has(mdPath);
      // (A) declared-but-missing
      if (status === "draft" || status === "approved") {
        if (!mdInCart) {
          const onRemote = (await tryGetText(gh, mdPath)) !== null;
          if (!onRemote) {
            out.push({
              metaPath: meta.path,
              slug,
              domain: d,
              kind: "declared-but-missing",
              declaredStatus: status,
            });
          }
        }
      }
      // (B) orphan-file — md staged but meta says nothing/inherited
      if (
        mdInCart &&
        (!status || status === "not-started" || status === "inherited")
      ) {
        out.push({
          metaPath: meta.path,
          slug,
          domain: d,
          kind: "orphan-file",
          declaredStatus: status,
        });
      }
    }
  }
  return out;
}
