// Static taxonomy bundle baked into the editor at build time.
//
// Each editor build snapshots the current a11y-index + motion patterns
// from the knowledge repo's dist/ artifacts; refreshing the taxonomy in
// the running editor requires rebuilding the editor (acceptable per the
// SPA deploy model — the knowledge repo and editor ship in lockstep).
//
// Vite imports JSON natively as the default export when `resolveJsonModule`
// is enabled in tsconfig.json (it is). Both files are sibling-resolved
// from editor/src/substrate/ to the knowledge repo's dist artifacts.
//   ../../../accessibility/dist/a11y-index.json  → accessibility dist
//   ../../../foundations/dist/tokens/motion.json → motion dist
import a11yIndexRaw from "../../../accessibility/dist/a11y-index.json";
import motionRaw from "../../../foundations/dist/tokens/motion.json";

// We deliberately model the RAW shape here (matches what actually lands
// in dist/), not the loader's normalized internals. buildTaxonomyFromAssets
// is responsible for adapting body_excerpt → body and missing description
// → null without distorting the on-disk contract.
export interface A11ySectionRaw {
  slug: string;
  title: string;
  wcag?: string[];
  /** Real dist/a11y-index.json uses body_excerpt; test fixtures use body. */
  body?: string;
  body_excerpt?: string;
}

export interface MotionPatternRaw {
  slug: string;
  name: string;
  description?: string;
}

export interface A11yIndexRaw {
  _schema_version: number;
  sections: A11ySectionRaw[];
}

export interface MotionFileRaw {
  _schema_version: number;
  patterns: Record<string, MotionPatternRaw>;
}

export const a11yIndex = a11yIndexRaw as A11yIndexRaw;
export const motionPatterns = motionRaw as MotionFileRaw;
