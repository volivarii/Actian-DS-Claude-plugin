# CLAUDE.md — actian-design-system-plugin

The Actian Product Design System plugin for Claude Code: skills, agents, and the vendored knowledge
snapshot. For what the plugin does and how to use it, read `README.md` and `USAGE.md`. This file
carries the cross-repo documentation rule that applies here.

## Changelog & PR doc hygiene (ecosystem-wide ground rule)

On every **notable** PR (new capability, skill or agent change, schema or contract change, anything a
user must know; not routine automated `vendor(knowledge)` refresh bumps), update the docs the change
touches, in the same PR:

1. root [`CHANGELOG.md`](CHANGELOG.md) ([Keep a Changelog](https://keepachangelog.com); the plugin
   uses CalVer `YYYY.MM.PATCH`): add the entry under `## [Unreleased]` (create the section if it is
   not present), link the PR.
2. [`README.md`](README.md) or [`USAGE.md`](USAGE.md) if the change alters what they state (a new
   skill, a changed capability, usage). Note: skill and doc **counts** in the README are auto-managed
   by a fixer, so do not hand-edit them.
3. any other relevant docs the change touches.
4. a plain-language summary into `actian-ds-ecosystem` (its bundle and `confluence/`), per the
   standing ecosystem-sync rule.

Bump the version field in `.claude-plugin/plugin.json` (CalVer `YYYY.MM.PATCH`) as part of the same
PR that changes plugin source, per the nested `plugins/actian-design-system/CLAUDE.md` Versioning
section; `check-version-bump.js` enforces this as a required PR gate. Routine nightly
`vendor(knowledge): refresh to vX.Y.Z` bumps are the one exception, automated by CI and not listed
individually unless they change user-facing behavior.

This is an **ecosystem-wide** rule shared by all four DS repos (`actian-ds-knowledge`,
`actian-design-system-plugin`, `actian-ds-docs`, `actian-ds-ecosystem`). The global cross-repo copy
of this rule lives in the shared-brain memory `feedback_changelog_discipline` (it auto-loads in every
repo's Claude context); this section is the authoritative checked-in copy for this repo.
