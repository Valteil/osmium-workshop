# dataset-tag-studio-electron — entry point

Local Electron desktop app for managing AI training dataset tags (image/caption pairs). No
network calls. `README.md` (this dir) is the comprehensive, current entry point for humans —
features, quick start, dev workflow, project structure. `CLAUDE.md` (this dir) is the deeper
architecture/decisions doc, kept current by policy — read it for anything non-trivial; it's more
detailed than these memories should try to duplicate.

`_archive/DEVELOPMENT_LOG.txt` is a **retired, frozen** chronological changelog (no new entries
going forward) — still cited by item number from `CLAUDE.md` for historical root-causes, but this
project now relies on Serena (these memories) for ongoing codebase understanding instead of
appending to it. Prefer updating/adding a memory here over writing a new changelog entry.

No project-local `.mcp.json` — this project relies entirely on the global Claude Desktop MCP
config. Don't add a local `.mcp.json` back without a specific reason; it would shadow/duplicate
the global one.

**jCodeMunch is deprecated for this project (2026-09-10)** — it's being uninstalled here and
Serena is now the sole code-navigation tool for this repo, overriding the global
`~/.claude/CLAUDE.md` default that names jCodeMunch for other projects. Don't index this repo with
jCodeMunch or reach for its `order`/`route`/`menu` tools going forward.

Further memories:
- `mem:tech_stack` — stack, build pipeline, why source and build output coexist at this
  directory's own root.
- `mem:conventions` — Phase B module architecture (the `init(deps)` dependency-injection
  pattern), theme CSS system, doc-maintenance policy.
- `mem:suggested_commands` — build/refresh/verify commands, including Windows-specific
  gotchas (lingering exe locks, PowerShell vs Bash tool quirks).
- `mem:task_completion` — what "done" means for a change here before reporting it finished.

Non-obvious top-level fact: **this directory IS both the source tree and the portable test
build.** `Dataset Tag Studio.exe`, `resources/`, `locales/`, the Chromium runtime files, and
`data/` all sit loose at this directory's top level, gitignored, alongside `src/`,
`package.json`, etc. This is deliberate, not clutter — `npm run refresh-app` regenerates them
from `dist/win-unpacked`.
