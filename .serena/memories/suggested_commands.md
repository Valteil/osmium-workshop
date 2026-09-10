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
- Verify no silent renderer startup crash (see `mem:conventions` on why a clean build isn't
  sufficient): after `refresh-app`, launch with
  `ELECTRON_ENABLE_LOGGING=1 "./Dataset Tag Studio.exe" --enable-logging=stderr` (Bash tool;
  redirect to a log file and background it), wait a few seconds, grep the log for
  `error|uncaught|exception`, then `taskkill //IM "Dataset Tag Studio.exe" //F` to close every
  spawned instance (electron-builder unpacked builds spawn multiple processes).
- No test suite, linter, or formatter is configured in this repo — don't look for one.

**Windows/PowerShell-vs-Bash-tool notes:**
- The Bash tool here runs Git Bash (POSIX sh) — use `/c/Users/...` style paths in Bash commands,
  `C:\Users\...` style in file-editing tool arguments (Read/Edit/Write/Serena file tools). Don't
  mix within one call.
- `taskkill //IM "name.exe" //F` (double-slash flags — single-slash `/IM` gets swallowed by Git
  Bash's path-conversion).
- A `refresh-app` can transiently fail on `rcedit-x64.exe --set-version-string` with "Unable to
  commit changes" if a previous test instance still holds the exe file handle open — it
  auto-retries and the refresh still completes; confirm via the exe's modified timestamp rather
  than treating the retry message itself as failure.
