# Osmium Workshop — Start Here

Local-first AI dataset tagger (image + `.txt` pairs). Three apps: desktop manager (`src/`),
its Android port (`mobile/`), Comfy Bridge (`comfy-bridge/` + its own `mobile/`).

- Docs: `notes/` vault (gitignored) — **always** start at `notes/Index.md`, read the relevant
  note(s) for the area before changing it, and check `notes/Pitfalls/Index.md`.
  **If the vault and the code disagree, say so** — suggest the correction (wiki stale → fix the note;
  code behind a newer note → flag the code) instead of silently picking one. See
  `notes/Meta/Maintenance-Policy.md`.
- Cross-agent twin: `AGENTS.md` carries the same pointers for non-Claude agents — keep the two in
  sync.
- Builds: `main.js`/`preload.js`/`renderer/app.js` are generated — never hand-edit.
  Dev loop is `npm run refresh-app` (same loop inside `comfy-bridge/`).
- Bridge shares UI once via `comfy-bridge/src/renderer/shared/` — hand-authored source
  (ports of root modules, not synced). `npm run build:shared` only bundles it into
  `mobile/www/shared.js`; never hand-edit those outputs.
- Fresh clone has no `notes/` (gitignored): say so and ask before recreating it.
