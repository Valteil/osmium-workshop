# Commands

All run from this directory (the project root).

- `npm run build` — `tsc -p tsconfig.main.json` (main) + type-check + esbuild bundle (renderer).
  Run standalone to fast-check for compile errors before a full refresh.
- `npm run refresh-app` — build, then `electron-builder --dir` + copy the unpacked build over the
  project root (see `mem:core`). **The routine dev-verification loop** — always edit `src/` then
  run this, never hand-edit `main.js`/`preload.js`/`renderer/app.js` directly (they're build
  output).
- `npm start` — dev launch pointing at `renderer/` in the project folder directly.
- `npm run dist:zip` — full release build to `Shippable/`. Slow (`compression: "maximum"`); only
  run when a release is actually wanted, never for routine verification.
- **Sync scripts (edit the source, never the copy; run from the repo root):**
  - `node scripts/sync-comfy-core.js` — after editing `src/comfy-core.ts` / `src/shared-types.d.ts`,
    copy them into `comfy-bridge/src/`.
  - `node scripts/sync-synthdat-workflow.js` — after editing `renderer/data/synthdat-workflow.json`,
    copy it to Comfy Bridge desktop + mobile, `docs/demo/`, and the Capacitor Android asset.
  - `node mobile/sync-web.js` — after any renderer build, re-sync `renderer/app.js` + `renderer/data/`
    into `mobile/www/`.
  - `npm run build:shared` (from `comfy-bridge/`) — regenerate the bridge's `mobile/www/shared.js`
    + the `shared.css` copies.
- Verify no silent renderer startup crash (see `mem:conventions` on why a clean build isn't
  sufficient): after `refresh-app`, launch with
  `ELECTRON_ENABLE_LOGGING=1 "./Osmium Workshop.exe" --enable-logging=stderr` (Bash tool;
  redirect to a log file and background it), wait a few seconds, grep the log for
  `error|uncaught|exception`. **Do NOT `taskkill` the launched instance(s) afterward, and don't
  kill a pre-existing running instance before launching either** — per explicit user instruction,
  the user handles process lifecycle themselves; leave whatever's running alone once the log looks
  clean. (If `refresh-app` itself fails with an EBUSY-style lock error because the app is already
  running, report that rather than killing it — see the rcedit-retry note below for the difference
  between a transient retry and a real lock.)
- **`npm run refresh-app` runs in the FOREGROUND** (per explicit user instruction, 2026-09-21 —
  supersedes the earlier poll-the-log rule): no background process, no log file, no polling
  loop. Run it directly from the project root with a ~2-minute timeout (it normally takes
  10–15s), wait for exit, and decide success/failure by EXIT CODE. On failure show the last 20
  lines of output; on success tell the user the app needs a full quit + relaunch to pick up the
  new code. Don't add sleeps or extra verification steps.


**Windows shell notes (harness-dependent):**
- In THIS harness the Bash tool runs **PowerShell 5.1**, not Git Bash — so use `C:\Users\...`-style
  paths everywhere (file tools AND shell), `;` to chain, and `$env:NAME='...'` to set env vars; there
  is no `&&`. (If a future harness reports Git Bash again, its `/c/Users/...` paths and
  `taskkill //IM "name.exe" //F` double-slash flags apply instead — check the tool's own shell banner
  rather than assuming.)
- The file-editing tools (Read/Edit/Write/Serena) always take `C:\Users\...`-style paths regardless.
- A `refresh-app` can transiently fail on `rcedit-x64.exe --set-version-string` with "Unable to
  commit changes" if a previous test instance still holds the exe file handle open — it
  auto-retries and the refresh still completes; confirm via the exe's modified timestamp rather
  than treating the retry message itself as failure.
