# components/dist/media

CI-generated per-component visual assets — Figma frame captures, state matrices, motion clips.

Layout: `{slug}/{role}.{ext}` (one directory per component, role-based filenames).

Authored by the media-preview sync phase (and future media-* phases). See manifest entry `components.media.ci`. Consumers read the relative path from `<guideline>.media.<role>` rather than globbing this tree directly.
