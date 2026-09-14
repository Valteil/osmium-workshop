# Dataset Tag Studio — Start Here

Local Electron desktop app for managing AI training dataset tags (image + `.txt` caption pairs,
LoRA/Stable-Diffusion-style). No network calls except one opt-in exception: the WD14 Autotagger /
SynthDat Overseer talk to a user-configured local ComfyUI instance.

## Real documentation lives in `notes/` (gitignored, local-only)

This file used to hold the full architecture/pitfalls/feature doc directly — it's been migrated to
a Claude-maintained Obsidian vault at **`notes/`** in this repo (not committed, not shared via
git — open the `notes/` folder in Obsidian if you want to browse it visually). Start at
**`notes/Index.md`** and follow links from there.

- Architecture, module conventions, build system → `notes/Source-Layout.md`,
  `notes/Module-Convention.md`, `notes/Build-System.md`.
- Every feature (SynthDat Overseer, Retroactive Merge/Void, WD14 Autotagger, themes, etc.) → its
  own note, linked from `notes/Index.md`.
- Every hard-won gotcha → `notes/Pitfalls/Index.md`. **Read the relevant pitfall note before
  touching an area it covers** — these exist specifically so a past mistake doesn't get repeated.
- Maintenance policy (what to update, and where, after a change) → `notes/Maintenance-Policy.md`.

If `notes/` doesn't exist yet in a fresh clone (it's gitignored — a new checkout won't have it),
say so and ask the user before recreating it wholesale; don't silently regenerate months of
distilled context from scratch.

## Serena (code navigation) — untouched by the above

This project uses **Serena** (MCP) for code exploration, separately from the `notes/` vault.
Activate the Serena project at this repo's root (name: `dataset-tag-studio-electron`) at the start
of any session and read its memory graph — `mem:core` → `mem:tech_stack` / `mem:conventions` /
`mem:suggested_commands` / `mem:task_completion` — before relying on assumptions about this
codebase. Serena's memories are for code-navigation conventions; `notes/` is for project
context/documentation. Some overlap is fine; don't try to unify them.

## The one-line version of everything below

TypeScript source in `src/`; `main.js`/`preload.js`/`renderer/app.js` are generated, never
hand-edit. `npm run build` compiles, `npm run refresh-app` is the dev loop. See
`notes/Build-System.md` for the rest.
