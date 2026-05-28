// Substrate ref graph — scans every vendor MD's frontmatter to build
//   {slug → consumers[]}
// and classifies refs as resolved (the slug exists in taxonomy) or broken.
//
// File-scoped attachment (P8 Option A v1): all a11y_refs / motion_refs in a
// file's YAML frontmatter apply to the file's top H2 section. Section-level
// attachment is a future v2 ("Option B") concern; not modeled here.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Domain, Taxonomy } from "./taxonomy";
import {
  parseFrontmatter as parseFrontmatterImpl,
  type ParsedFrontmatter,
} from "./parseFrontmatter";

// Re-export the browser-safe parser so legacy callers keep working.
// Live in parseFrontmatter.ts because this module pulls node:fs/path and
// is unusable in the browser bundle (Vite externalises node:* modules
// and tree-shaking can't strip the value imports through a barrel).
export const parseFrontmatter = parseFrontmatterImpl;

export type RefType = "a11y_refs" | "motion_refs";

export interface Consumer {
  file: string;
  refType: RefType;
  note: string | null;
}

export interface OutgoingConnection {
  slug: string;
  refType: RefType;
  note: string | null;
  domain: Domain | null; // null if broken
}

export interface BrokenRef {
  file: string;
  refType: RefType;
  slug: string;
  note: string | null;
}

export interface RefGraph {
  consumersOf(slug: string): Consumer[];
  connectionsFromFile(file: string): OutgoingConnection[];
  connectionsFromSection(
    file: string,
    sectionAnchor: string,
  ): OutgoingConnection[];
  connectionsToSection(slug: string): Consumer[];
  brokenRefs(): BrokenRef[];
}

export interface BuildOpts {
  vendorRoot: string;
  taxonomy: Taxonomy;
}

const TOP_H2_RE =
  /^##\s+(?:\d+(?:\.\d+)*\.?\s+)?(.+?)(?:\s+\{#([a-z][a-z0-9-]*)\})?\s*$/m;

interface FileEntry {
  file: string;
  topH2Slug: string | null;
  frontmatter: ParsedFrontmatter;
}

function deriveSlug(rawTitle: string): string {
  return rawTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function findTopH2Slug(body: string): string | null {
  TOP_H2_RE.lastIndex = 0;
  const m = body.match(TOP_H2_RE);
  if (!m) return null;
  return m[2] ?? deriveSlug(m[1] ?? "");
}

async function walkMd(
  dir: string,
  base = dir,
  acc: string[] = [],
): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkMd(full, base, acc);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      acc.push(path.relative(base, full));
    }
  }
  return acc;
}

export async function buildRefGraph(opts: BuildOpts): Promise<RefGraph> {
  const files = await walkMd(opts.vendorRoot);
  const fileEntries: FileEntry[] = [];
  for (const rel of files) {
    const raw = await readFile(path.join(opts.vendorRoot, rel), "utf8");
    const { frontmatter, body } = parseFrontmatter(raw);
    fileEntries.push({
      file: rel,
      topH2Slug: findTopH2Slug(body),
      frontmatter,
    });
  }

  const bySlug = new Map<string, Consumer[]>();
  const broken: BrokenRef[] = [];
  for (const entry of fileEntries) {
    for (const refType of ["a11y_refs", "motion_refs"] as const) {
      for (const item of entry.frontmatter[refType]) {
        const domain = opts.taxonomy.domainOfSlug(item.ref);
        const consumer: Consumer = {
          file: entry.file,
          refType,
          note: item.note,
        };
        if (domain === null) {
          broken.push({
            file: entry.file,
            refType,
            slug: item.ref,
            note: item.note,
          });
          continue;
        }
        const arr = bySlug.get(item.ref) ?? [];
        arr.push(consumer);
        bySlug.set(item.ref, arr);
      }
    }
  }

  const byFile = new Map<string, FileEntry>();
  for (const entry of fileEntries) byFile.set(entry.file, entry);

  function consumersOf(slug: string): Consumer[] {
    return bySlug.get(slug) ?? [];
  }
  function connectionsFromFile(file: string): OutgoingConnection[] {
    const entry = byFile.get(file);
    if (!entry) return [];
    const out: OutgoingConnection[] = [];
    for (const refType of ["a11y_refs", "motion_refs"] as const) {
      for (const item of entry.frontmatter[refType]) {
        out.push({
          slug: item.ref,
          refType,
          note: item.note,
          domain: opts.taxonomy.domainOfSlug(item.ref),
        });
      }
    }
    return out;
  }
  function connectionsFromSection(
    file: string,
    sectionAnchor: string,
  ): OutgoingConnection[] {
    const entry = byFile.get(file);
    if (!entry || entry.topH2Slug !== sectionAnchor) return [];
    return connectionsFromFile(file);
  }

  return {
    consumersOf,
    connectionsFromFile,
    connectionsFromSection,
    connectionsToSection(slug) {
      return consumersOf(slug);
    },
    brokenRefs() {
      return broken;
    },
  };
}
