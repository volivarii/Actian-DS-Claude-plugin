// Pure operations on an `_order.json` array — the canonical sequence
// declaration for ordered substrate domains (foundations, accessibility).
//
// Every operation returns a *new* array; never mutates the input.
// All ops throw on referential errors (unknown slug, duplicate) so
// callers fail loudly instead of producing a silently-wrong manifest.

export function appendSlug(order: readonly string[], slug: string): string[] {
  if (order.includes(slug)) {
    throw new Error(`orderManifest.appendSlug: "${slug}" already exists`);
  }
  return [...order, slug];
}

export function removeSlug(order: readonly string[], slug: string): string[] {
  const i = order.indexOf(slug);
  if (i === -1) {
    throw new Error(`orderManifest.removeSlug: "${slug}" not found`);
  }
  const next = order.slice();
  next.splice(i, 1);
  return next;
}

export function moveSlug(
  order: readonly string[],
  slug: string,
  toIndex: number,
): string[] {
  const from = order.indexOf(slug);
  if (from === -1) {
    throw new Error(`orderManifest.moveSlug: "${slug}" not found`);
  }
  const clamped = Math.max(0, Math.min(order.length - 1, toIndex));
  if (from === clamped) return order.slice();
  const next = order.slice();
  const [item] = next.splice(from, 1);
  next.splice(clamped, 0, item!);
  return next;
}
