import {
  autocompletion,
  type CompletionContext,
  type CompletionResult,
  type Completion,
} from "@codemirror/autocomplete";
import { listSlugs, findReferences } from "../lib/anchorIndex";

const LINK_ANCHOR_BEFORE = /\[[^\]]*\]\(([^)\s]*#)([a-z0-9-]*)$/;
const YAML_REF_BEFORE = /\{\s*ref\s*:\s*([a-z0-9-]*)$/;

export function anchorCompletionSource(
  ctx: CompletionContext,
): CompletionResult | null {
  const before = ctx.state.doc.sliceString(Math.max(0, ctx.pos - 200), ctx.pos);

  const linkMatch = LINK_ANCHOR_BEFORE.exec(before);
  if (linkMatch) {
    const partial = linkMatch[2]!;
    return buildResult(ctx.pos - partial.length, partial);
  }

  const yamlMatch = YAML_REF_BEFORE.exec(before);
  if (yamlMatch) {
    const partial = yamlMatch[1]!;
    return buildResult(ctx.pos - partial.length, partial);
  }

  return null;
}

function buildResult(from: number, partial: string): CompletionResult | null {
  const slugs = listSlugs();
  if (slugs.length === 0) return null;
  const options: Completion[] = slugs
    .filter((s) => s.startsWith(partial))
    .map((slug) => {
      const refCount = findReferences(slug).length;
      return {
        label: slug,
        detail:
          refCount === 0
            ? "unused"
            : `${refCount} ref${refCount === 1 ? "" : "s"}`,
        type: "variable",
      };
    });
  if (options.length === 0) return null;
  return { from, options, validFor: /^[a-z0-9-]*$/ };
}

/** CM6 extension factory — register this in the editor's extension array. */
export function anchorCompletionExtension() {
  return autocompletion({
    override: [anchorCompletionSource],
    activateOnTyping: true,
  });
}
