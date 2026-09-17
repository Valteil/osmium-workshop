# Task completion checklist

A change here is not done until:

1. `npm run build` is clean (no tsc or esbuild errors).
2. `npm run refresh-app` succeeds and the exe's modified timestamp confirms a fresh build (see
   `mem:suggested_commands` re: transient rcedit retry noise).
3. Launched with `ELECTRON_ENABLE_LOGGING=1 --enable-logging=stderr`, log grepped for
   `error|uncaught|exception` — zero hits. This is the only reliable way to catch the
   "moved symbol never re-imported" class of bug (see `mem:conventions`); a clean build alone
   does not prove it.
4. Grep for leftover references to anything renamed/removed (old symbol names, deleted theme ids,
   old CSS classes) across `src/`, `renderer/*.html`, `renderer/styles.css` — no dangling hits.
5. For CSS edits specifically: brace-balance check (`{` count == `}` count) before trusting a
   large multi-block edit compiled correctly — esbuild doesn't validate `styles.css` at all, it's
   just copied as-is.
6. If the change is "major" per the doc-maintenance policy: the relevant `notes/` vault note(s)
   updated in the same pass (`notes/Maintenance-Policy.md` — `CLAUDE.md` itself is just a pointer
   into `notes/` now, not the real doc), AND a Serena memory added/updated if it's a durable,
   non-obvious CODE convention worth Serena surfacing on its own (see `mem:conventions`). These are
   two separate surfaces for two different audiences — update whichever apply, possibly both.
7. **Immediately after any change or verified fix, revise stale Serena memories in the same pass**
   — don't defer this to a later cleanup session. If a change renames/moves/removes something a
   memory currently asserts, or establishes a new durable convention, update the memory right then
   (`mcp__serena__edit_memory` for a targeted fix, `write_memory` for a new memory) rather than
   letting drift accumulate. This step is a standing habit per explicit user instruction
   (2026-09-15), not optional busywork.

Never run `npm run dist:zip` as part of routine verification — it's slow and only warranted when
the user explicitly wants a release artifact.
