# Osmium Workshop — agent instructions

Local-first AI dataset tagger (image + `.txt` pairs). Three apps: the desktop manager (`src/`), its
Android port (`mobile/`), and Comfy Bridge (`comfy-bridge/` + its own `mobile/`). This file is the
project's **cross-agent** entry point; `CLAUDE.md` mirrors it — keep the two in sync.

## Before touching anything: read the wiki

The project's real documentation is a **local Obsidian vault at `notes/`** (gitignored — not in git,
local-only). It is the source of truth for architecture, features, and hard-won gotchas:

1. **Always** start at `notes/Index.md` — it has a "picking up X → read these notes" table.
2. **Always** read the relevant note(s) for the area *before* changing it — and
   `notes/Pitfalls/Index.md`, which exists specifically so a mistake doesn't get repeated.
3. If `notes/` is missing (fresh clone), say so and ask before recreating it.

## If the wiki and the code disagree, surface it — never silently pick one

- **Wiki stale** (a note asserts something the code no longer does) → say so and **suggest the note
  be corrected**, then correct it (per `notes/Meta/Maintenance-Policy.md`).
- **Code behind a newer wiki entry** (a note documents a decision or convention the code hasn't
  caught up to yet) → **flag it as a correction to be made**; don't quietly match the old code.
- **Never** resolve a discrepancy by reverting the newer side to the older one.

## Housekeeping

- Code nav: Serena MCP, project `osmium-workshop-electron` — activate it, read `mem:core` onward.
- `main.js` / `preload.js` / `renderer/app.js` are generated — never hand-edit. Dev loop:
  `npm run refresh-app` (same loop inside `comfy-bridge/`).
- `comfy-bridge/src/renderer/shared/` is generated from the root; `npm run build:shared`
  regenerates it — never hand-edit those copies either.
- After any change judged "major", update this vault **and** the Serena memories **in the same
  session** — see `notes/Meta/Maintenance-Policy.md`.
