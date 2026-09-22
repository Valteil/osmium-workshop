# Tech stack

- Electron 31, TypeScript 5, esbuild (renderer bundling only — main process compiled straight
  to JS by tsc, no bundler). No framework (React/Vue/etc.) — vanilla DOM manipulation throughout.
- Source: `src/main.ts` (→ compiled `main.js` at repo root), `src/preload.ts` (→ `preload.js`),
  `src/renderer/*.ts` (→ bundled into `renderer/app.js` via esbuild). `renderer/index.html` and
  `renderer/styles.css` are hand-authored, not generated.
- **Typed end to end.** `tsconfig.renderer.json` (`strict: true`) type-checks every renderer module
  (shared types in `src/renderer/types.ts`; no `@ts-nocheck` anywhere). `tsconfig.main.json` is
  `strict: true` too — `src/main.ts`/`src/preload.ts`/`src/wd14-local.ts` import real `electron`
  types and share the IPC contract in `src/ipc-types.ts` (a type-only module both tsconfigs pull in,
  alongside the ambient `src/ws.d.ts` for the `ws` package). A clean `tsc` now catches shape
  mismatches at the IPC boundary.
- Packaging: electron-builder. `npm run dist:zip` → `Shippable/` (release artifact, slow,
  `compression: "maximum"` — only run when a release is actually wanted, not for routine
  verification). `npm run refresh-app` → `electron-builder --dir` + copies the unpacked build
  over the project root itself (see `mem:core`) — this is the routine dev-verification path, fast.
- No test suite / linter / formatter configured — "done" is a clean `npm run build` plus a
  manual/log-verified launch, not a green test run (see `mem:task_completion`).
