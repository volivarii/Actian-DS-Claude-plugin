# Office assets — provenance & refresh

The corporate template and brand assets under `assets/office/` and the references in this
directory are a **vendored snapshot** of the `actian-pptx` skill (the official Actian 2026
corporate PowerPoint template + brand system). They are **not** auto-synced like the knowledge
repo — refresh is a manual owner-action.

## Source
- `actian-pptx.skill` (zip) — the official corporate PowerPoint skill bundle.

## What was vendored (PR1)
- `assets/office/Actian-Template-2026.pptx` ← `assets/Actian-Template-2026.pptx`
- `assets/office/logos/`, `assets/office/backgrounds/` ← `assets/*`
- `scripts/office/engine/pptx_helpers.py` ← `scripts/actian_helpers.py` (WORKING_TEMPLATE repointed)
- `scripts/office/engine/office/` ← `scripts/office/` (OOXML pack/unpack/validate + schemas)
- `references/office/brand.md`, `layouts.md` ← `brand.md`, `layouts.md`

## To refresh when Actian ships a new corporate template
1. Obtain the new `actian-pptx.skill` and unzip it.
2. Re-run the copy steps from the PR1 implementation plan (Task 1), re-pointing `WORKING_TEMPLATE`
   in `pptx_helpers.py` to `assets/office/Actian-Template-2026.pptx`.
3. Run `python3 -m pytest tests/office/ -v` — the 54-layout smoke test guards a bad copy.
4. Bump `plugin.json` PATCH and note the refresh here.
