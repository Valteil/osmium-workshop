# osmium-workshop-electron — entry point

Local Electron desktop app for managing AI training dataset tags (image/caption pairs). No
network calls. `README.md` (this dir) is the comprehensive, current entry point for humans —
features, quick start, dev workflow, project structure.

**Real architecture/decisions detail now lives in a Claude-maintained Obsidian vault at `notes/`**
(gitignored, local-only — not shared via git). `CLAUDE.md` (this dir, git-tracked) used to hold
that bulk directly but was migrated to be just a short pointer into `notes/` (commit "Migrate
CLAUDE.md's bulk into a local Obsidian vault", 2026-09-14) — don't expect real content in
`CLAUDE.md` itself anymore; start at `notes/Index.md` and follow links from there for anything
non-trivial. **The vault was restructured into a wiki on 2026-09-22** — subfolders `Architecture/`,
`Systems/`, `Features/`, `Apps/`, `Meta/`, and `Pitfalls/`, each with a consistent per-note template
(Purpose / Where it lives / How it works / Conventions & invariants / Related / Pitfalls); notes are
cross-linked by bare `[[Name]]` (folder-independent in Obsidian). `notes/Meta/Maintenance-Policy.md` is the doc-maintenance policy now (see `mem:conventions`
and `mem:task_completion` for how that interacts with these Serena memories). If `notes/` doesn't
exist in a fresh clone (gitignored), don't silently regenerate it — ask the user first.

`_archive/DEVELOPMENT_LOG.txt` is a **retired, frozen** chronological changelog (no new entries
going forward) — items from it are still cited by number from `notes/` where relevant for
historical root-causes (that citation habit moved along with the rest of `CLAUDE.md`'s old bulk),
but this project now relies on Serena (these memories) + `notes/` for ongoing codebase
understanding instead of appending to it. Prefer updating/adding a memory here (or a `notes/` note)
over writing a new changelog entry.

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
build.** `Osmium Workshop.exe`, `resources/`, `locales/`, the Chromium runtime files, and
`data/` all sit loose at this directory's top level, gitignored, alongside `src/`,
`package.json`, etc. This is deliberate, not clutter — `npm run refresh-app` regenerates them
from `dist/win-unpacked`.

**A second build target, `tauri-port/` (added 2026-09-11), was discontinued and deleted from the
repo on 2026-09-13** — the dual-maintenance cost of hand-porting every Electron change to Rust
outweighed its value at this project's stage. See `mem:conventions` and
`notes/Meta/Tauri-Port-Discontinued.md` if the old approach is ever worth referencing from git history.

**A third build target, `mobile/` (Android via Capacitor, added 2026-09-15), is active and NOT a
repeat of the Tauri mistake** — it reuses the desktop `renderer/` build output completely
unmodified (via `mobile/sync-web.js` + a JS shim polyfilling `window.showDirectoryPicker`/
`window.electronAPI`), rather than hand-porting `main.ts`/`preload.ts` logic to a second language
per change. See `notes/Apps/Mobile-Overview.md` (plus `Mobile-UI.md`/`Mobile-Networking.md`/`Mobile-History.md` in the same folder) for the full architecture. The desktop app itself remains
untouched by this — "Electron-only" above refers specifically to not reviving the old
hand-translated-Rust-backend approach, not a blanket rule against any cross-platform work.
