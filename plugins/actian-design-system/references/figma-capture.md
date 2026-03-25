# Figma Capture Flow

Shared procedure for capturing HTML output to Figma. Used by component-brief, generate-flow, and generate-presentation skills.

## Prerequisites

- An HTML file saved locally and ready to serve
- A target Figma file (fileKey + nodeId from the user's URL)

## Steps

### 1. Serve the HTML file locally

```bash
BASE_URL=$(scripts/ensure-server.sh . 8765)
```

### 2. Try calling `generate_figma_design` directly

Check if `mcp__plugin_figma_figma__generate_figma_design` or `mcp__claude_ai_Figma__generate_figma_design` is available. If yes, call it with:
- `outputMode: "existingFile"`
- `fileKey` from the user's target file
- `nodeId` from the user's target page
- The localhost URL for the served HTML

### 3. CLI fallback (if `generate_figma_design` is NOT available)

If the MCP tool isn't directly available (e.g., Claude Desktop doesn't expose it), use the CLI fallback:

```bash
claude -p --output-format text --allowedTools "mcp__plugin_figma_figma__generate_figma_design" "Call generate_figma_design with outputMode existingFile, fileKey {{FILE_KEY}}, and nodeId {{NODE_ID}} to capture the page at {{LOCALHOST_URL}}. Poll with captureId until completed. Do not edit any files. Return the final Figma link."
```

Replace `{{FILE_KEY}}`, `{{NODE_ID}}`, and `{{LOCALHOST_URL}}` with actual values. This spawns a Claude Code CLI subprocess that HAS access to `generate_figma_design`.

### 4. Poll for completion

Poll with `captureId` every 5 seconds (up to 10 times) until status is `completed`.

### 5. Share the Figma link with the user

## Rules

These rules exist because alternative approaches produce inferior results or fail silently:

- **Never fall back to `use_figma`** to build cards/frames programmatically. The capture tool renders HTML as-is with full CSS fidelity. Building with the Plugin API produces inferior results.
- **Never suggest manual workarounds** (browser, copy/paste, extensions). The capture flow is fully automated.
- **Never tell the user to open the HTML manually** in a browser.
- **Never capture to the first page** of a file without a nodeId.
- **Never delegate capture to a subagent.** Subagents do NOT have MCP tools.
- Each `captureId` is single-use — one capture per page.
- The `claude -p` CLI fallback is the ONLY acceptable alternative when `generate_figma_design` is not directly available.
