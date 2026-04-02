# Push to Figma — Shared Procedure

All three Figma-writing scripts (`flow-to-figma.js`, `brief-to-figma.js`, `slide-to-figma.js`) follow the same output and push pattern.

## Running the script

```
node ${CLAUDE_PLUGIN_ROOT}/scripts/<script>.js <data.json> \
  --target-node-id "<nodeId>" \
  --output-dir <project_dir>/<output_path>/.figma-calls
```

- Do NOT add `2>&1` — stderr has info/warning lines that would corrupt stdout
- The script validates the input and prints warnings to stderr

## Reading the output

1. Read `manifest.json` from the output directory:
   ```json
   {
     "totalCalls": 2,
     "calls": [
       { "callIndex": 1, "file": "call-1.js", "sizeBytes": 3857, "description": "..." },
       { "callIndex": 2, "file": "call-2.js", "sizeBytes": 41377, "description": "..." }
     ]
   }
   ```

2. For each call file listed in the manifest:
   - Read the `.js` file from the output directory
   - **Call 1:** pass code as-is to `use_figma` — creates wrapper frame, returns `{ wrapperId }`
   - **Call 2+:** replace `__WRAPPER_ID__` in the code with the `wrapperId` from call 1, then pass to `use_figma`

## Critical rules

- **Do NOT write freehand Figma code.** The script output IS the Figma code — pass it through.
- Do not write custom `findVariant`, `setProp`, or frame-building code.
- Do not write code to intermediate files or use `sed` to modify it.
- If text overrides don't apply, the fix is in the data JSON (wrong property name), not in post-push correction code.
