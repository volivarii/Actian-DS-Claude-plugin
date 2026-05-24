// Shared types for the Commit-PR core (§4.2). The central AI seam — both the
// human form and any future AI producer build Draft objects and call
// submitDraft(), which validates and packages them as a Pull Request.

export interface FileChange {
  path: string;
  content: string;
}

export interface SourceMetadata {
  kind: "human" | "ai";
  via?: string;
  model?: string;
  prompt?: string;
}

export interface Draft {
  id: string;
  files: FileChange[];
  message: string;
  branch?: string;
  sourceMetadata?: SourceMetadata;
}

export interface CommitResult {
  prUrl: string;
  branch: string;
  sha: string;
}

export class ReadonlyPathError extends Error {
  constructor(public path: string) {
    super(`refused: ${path} is read-only`);
    this.name = "ReadonlyPathError";
  }
}

export class SchemaValidationError extends Error {
  constructor(
    public path: string,
    public errors: unknown[],
  ) {
    super(`schema validation failed: ${path}`);
    this.name = "SchemaValidationError";
  }
}
