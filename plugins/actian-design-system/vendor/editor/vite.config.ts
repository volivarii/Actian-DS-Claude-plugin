import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Manual chunk routing — keep the largest libraries in their own
// chunks so first-load cost is split + downstream cache invalidation
// is scoped. Pre-split bundle was ~1.5 MB single JS chunk.
//
// CAUTION: splitting React or Radix into their own chunks created a
// runtime initialisation cycle in production builds (radix transitives
// like use-callback-ref, react-remove-scroll, etc. live in the vendor
// bucket and depend on React, which itself depends back into vendor).
// The cycle was silent during local dev (Vite hot-loads chunks lazily)
// but blew up on the first cold load from GitHub Pages with
// "Cannot read properties of undefined (reading 'forwardRef')". The
// safe shape: split ONLY libraries that have no React import path —
// today that's CodeMirror + Octokit + RJSF (Ajv is React-free). Anything
// React-flavoured (Radix, react-markdown, remark/rehype, cmdk, react-
// dom, scheduler) goes into the same `vendor` chunk so React and its
// consumers initialise together.
function chunkFor(id: string): string | undefined {
  if (!id.includes("node_modules")) return undefined;
  if (id.includes("@codemirror") || id.includes("@lezer")) return "codemirror";
  if (id.includes("@octokit")) return "octokit";
  if (
    id.includes("@rjsf") ||
    id.includes("/ajv/") ||
    id.includes("/ajv-formats/")
  )
    return "rjsf";
  return "vendor";
}

export default defineConfig({
  base: "/actian-ds-knowledge/editor/",
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: { manualChunks: chunkFor },
    },
  },
});
