# Dataset Tag Studio — Start Here

Local-first AI dataset tagger (image + `.txt` pairs). Three apps: desktop manager (`src/`),
its Android port (`mobile/`), Comfy Bridge (`comfy-bridge/` + its own `mobile/`).

- Docs: `notes/` vault (gitignored) — start at `notes/Index.md`. Checkups live in
  `notes/Pitfalls/Index.md`: read the relevant one before touching that area.
- Code nav: Serena MCP, project `dataset-tag-studio-electron` — activate it and read
  `mem:core` onward first session.
- Builds: `main.js`/`preload.js`/`renderer/app.js` are generated — never hand-edit.
  Dev loop is `npm run refresh-app` (same loop inside `comfy-bridge/`).
- Bridge shares UI once via `comfy-bridge/src/renderer/shared/` — `npm run build:shared`
  regenerates its copies; never hand-edit those either.
- Fresh clone has no `notes/` (gitignored): say so and ask before recreating it.
