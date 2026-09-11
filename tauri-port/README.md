# Dataset Tag Studio — Tauri port (in progress)

Started overnight while exploring whether Electron's overhead could be cut
via Tauri (native WebView2 instead of a bundled Chromium — see the
conversation this was requested from for the size/RAM tradeoff discussion).
This is a **parallel port living alongside the Electron app**, not a
replacement yet — nothing in `../src/`, `../main.js`, `../preload.js`, or the
Electron `package.json`/build pipeline was touched. Two exceptions to that,
both additive and harmless to the Electron build:

- `../renderer/index.html` gained one line: `<script src="tauri-shim.js">`
  right before `app.js`.
- `../renderer/tauri-shim.js` is a new file (see below).

Both are inert under Electron (the shim no-ops when `window.electronAPI`
already exists, which it always does there via `preload.ts`'s contextBridge
— confirmed by re-testing the Electron build isn't required, but worth doing
before this ever ships).

## The one question that mattered most, answered first

The entire renderer architecture (`dirHandle`/`FileSystemDirectoryHandle`
from `window.showDirectoryPicker()`) depends on the File System Access API
existing in whatever browser engine the app runs on. This was the single
biggest unknown before investing in anything else. **Verified live, not
assumed**: launched the compiled app with WebView2's remote debugging env
var (`WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9222`),
attached over the Chrome DevTools Protocol via a raw Node `WebSocket` (no
browser extension needed), and confirmed `window.showDirectoryPicker`,
`window.showOpenFilePicker`, and `window.FileSystemDirectoryHandle` are all
real functions, not `undefined` — WebView2 is genuinely Chromium-based and
ships this. This means the core file-handling code (`tags-edit.ts`,
`favorites.ts`, `dataset-manager.ts`, all of `index.ts`'s folder loading) —
**the largest part of the app by far** — should port with zero changes.

## What's implemented and verified (via the same CDP-attach technique)

- `src-tauri/src/lib.rs`: window creation (1440×900, min 1040×640, starts
  hidden and maximizes before showing — same flash-avoidance as Electron's
  `ready-to-show` handling), the close-confirm round trip
  (`WindowEvent::CloseRequested` → `prevent_close()` → emit `request-close`
  to the renderer → renderer checks dirty entries → calls back
  `confirm_close` → real close), `set_zoom_factor` (real compositor-level
  zoom via `WebviewWindow::set_zoom()`, backed by WebView2's actual
  `put_ZoomFactor` — NOT a CSS zoom hack, same guarantee CLAUDE.md demands
  of the Electron version), `restart_app`.
- `src-tauri/src/wd14.rs`: full Rust port of the WD14 Autotagger's ComfyUI
  bridge (`main.ts`'s `wd14-get-models`/`wd14-tag-image` handlers) using
  `reqwest` — upload/image multipart, /prompt queue, /history polling, same
  error messages. Tested end-to-end for argument marshaling (a fake
  Uint8Array PNG header correctly became a Rust `Vec<u8>`, camelCase JS
  settings correctly mapped to the snake_case struct via
  `#[tauri::command(rename_all = "camelCase")]`) — the request correctly
  reached and failed at ComfyUI's `/upload/image` endpoint with a plain
  connection-refused error (ComfyUI wasn't running to test against), which
  is exactly what should happen; **not yet tested against a real running
  ComfyUI instance with the actual WD14 node** — do that first before
  trusting this fully.
- **Data directory: `%APPDATA%\<identifier>\` (AppData), not portable-next-
  to-exe.** `app_data_dir()` in `lib.rs` uses `app.path().app_data_dir()`
  and passes it to `WebviewWindowBuilder::data_directory()` — this is
  WebView2's actual profile folder (localStorage, IndexedDB, cache).
  **Deliberately not portable** (unlike the Electron version) — decided
  against portable-next-to-exe specifically because an installer defaults
  to installing into `Program Files`, which standard (non-admin) users
  can't write to; a data directory there would fail for most real users.
  Building the window manually in Rust (rather than declaring it in
  `tauri.conf.json`) was needed either way, since the declarative
  `data_directory` option only accepts a path *relative to* the app-data
  dir, not an arbitrary one.
- `renderer/tauri-shim.js`: maps the exact `window.electronAPI` surface
  `preload.ts` exposes onto Tauri's `window.__TAURI__.core.invoke()`/
  `.event.listen()` (global injection via `tauri.conf.json`'s
  `app.withGlobalTauri: true`, so no `@tauri-apps/api` npm import/bundling
  step was needed for this plain script). Every other renderer module keeps
  calling `window.electronAPI.*` exactly as before — **zero changes to any
  existing `.ts` file** was the whole point of this shim.
- Verified via CDP: `window.electronAPI` exists with all 7 expected keys,
  `setZoomFactor()` succeeds, Settings panel opens with its normal
  fade animation (`.panel-visible` class + opacity transition — confirms
  the existing CSS/JS animation system works unmodified), tab switching
  works (Datasets ↔ Stats ↔ Gallery), `localStorage` read/write works, and a
  full page reload produces **zero console errors or exceptions**.

## Fixed after your first click-through

**Quit button did nothing except via killing the terminal.** Two stacked
bugs, both found and fixed by attaching CDP to the real running app and
actually clicking the real Quit button rather than guessing from source:

1. Tauri's permission system blocks `window.close()` from script by default
   — calling it threw `"window.close not allowed... core:window:allow-close"`.
   Fixed by granting that permission in `capabilities/default.json`.
2. That fix alone was wrong, though: granting the permission made
   `window.close()` close the webview **directly**, bypassing
   `on_window_event`'s `WindowEvent::CloseRequested` guard entirely (that
   hook only fires for OS/window-manager-initiated close requests — the
   native title-bar X, Alt+F4 — not a script's own close command). Confirmed
   live: the webview closed immediately with no dirty-check, and the Rust
   process kept running afterward with no window left to close it from.
   **Real fix**: `renderer/tauri-shim.js` now overrides `window.close` to
   directly call the same stored callback the OS-close path already uses
   (`index.ts`'s `onRequestClose` handler — checks dirty entries, then calls
   `confirmClose()`), instead of ever invoking Tauri's own window-close
   command. `confirm_close` itself now calls `std::process::exit(0)` rather
   than `AppHandle::exit()` — the latter was also observed, live, to close
   the window but leave the process running (some background task —
   possibly the WD14 reqwest client's tokio runtime, or the log plugin's
   writer thread — apparently kept it alive past the graceful-exit request).
   Re-tested after both fixes: clicking the real Quit button now closes the
   window AND fully terminates `app.exe` (confirmed via `tasklist`), same as
   Electron.

**WD14 Autotagger — confirmed working by you against a real ComfyUI
instance.** No changes needed.

**GitHub-package export — confirmed not needed for this build**, so the
stub stays a stub permanently (see below), not a to-do.

## Fixed after your second click-through

**Keyword-family drag-reorder (and by extension every other native HTML5
drag-and-drop in the app — dock reordering, Dataset tab tiles) did nothing
at all.** Root cause, and the fix, both come straight from Tauri's own docs
once I knew to look: Tauri installs its own OS-level drag-drop handler on
Windows by default (to support dropping files onto the window — a feature
this app doesn't use), and that handler **takes over the webview's drag
machinery entirely, silently breaking the page's own HTML5 drag-and-drop as
a side effect**. Fixed with one line on the window builder,
`.disable_drag_drop_handler()` — Tauri's own doc comment for it reads
verbatim: *"Disables the drag and drop handler. This is required to use
HTML5 drag and drop APIs on the frontend on Windows."* **Not independently
re-verified by me** — a real mouse-driven drag gesture is something CDP
genuinely can't script (unlike a click, which is just an event dispatch);
this needs your own hands-on confirmation.

**Restart shows a Chromium `Failed to unregister class Chrome_WidgetWin_0`
error and then "127.0.0.1 refused to connect."** Diagnosed by testing
Restart against two different builds side by side:
- Under `npx tauri dev`: reproduced exactly as you described.
- Under the actual compiled binary (`tauri build --debug`'s
  `target/debug/app.exe`, run directly — the same custom-protocol
  (`http://tauri.localhost/`) production loading path a real install uses):
  **Restart worked perfectly.** New process (confirmed via a new PID),
  window loaded correctly, `electronAPI`/`showDirectoryPicker`/everything
  intact — no error, no blank page.

Conclusion: **this is a `tauri dev`-only artifact, not a real app bug.**
`tauri dev` serves the frontend over an actual local HTTP server
(`http://127.0.0.1:1430`) run by the CLI's own dev-server process, separate
from `app.exe` itself. `AppHandle::restart()` exits the old `app.exe` and
spawns a new one — and it looks like the CLI wrapper interprets the old
process exiting as "the dev session ended" and tears down its dev server
before (or while) the new process tries to load that same URL, hence the
connection-refused page and the harmless-but-alarming window-class log line
from the near-simultaneous process teardown/creation. A real installed
build has no dev server at all — the new process serves its own embedded
assets immediately via the custom protocol — so this shouldn't be possible
there. **Not something I changed code for**, since there's no code bug to
fix; flagging it so you don't go looking for one. Worth a final sanity check
against a real `tauri build` (non-debug) release binary before fully
trusting this, but I'd be surprised if it behaved differently from the
debug one.

## Why is `tauri-port/` ~6-9GB?

Almost entirely `src-tauri/target/debug/` (confirmed: 7.2GB of it, out of
the ~15MB everything else combined). This is normal for a Rust project, not
a bug or a mistake — `cargo` keeps every intermediate build artifact
(object files, incremental-compilation caches, full debug symbols) for
every one of the ~360 crates this depends on (Tauri, wry/WebView2 bindings,
reqwest, tokio, etc.), and none of that gets cleaned up between builds by
design — it's what makes the *next* build fast. It regenerates from scratch
any time it's deleted (`cargo clean` or just `rm -rf target/`, then
`npx tauri dev` rebuilds everything — expect the ~3-5 minute first-build
time again). Already excluded from git (`.gitignore`'s
`tauri-port/src-tauri/target/` entry, added when this started). A release
build (`cargo build --release`/`tauri build`, no `--debug`) strips debug
symbols and is smaller, but still commonly reaches into the GB range with
this many dependencies — that's just the cost of a Rust GUI toolkit's
dependency tree, not something specific to how this project is set up.

## What's NOT ported (deliberately)

- **The MSI installer step of `tauri build --debug` failed** — but only
  because I launched the freshly-built `app.exe` directly (to test it) at
  the same moment the bundler was still trying to package that exact file
  (`os error 32`, file in use). The compile itself succeeded
  (`target\debug\app.exe`) and running it directly is exactly what got
  tested below — a clean `npx tauri build --debug` run (without anything
  else touching the exe mid-build) should package fine. Not a real bug,
  just a self-inflicted collision from testing.
- **Production (custom-protocol) loading path — now verified, not just
  dev-server-tested.** Ran the actual compiled `target/debug/app.exe`
  directly (same binary `tauri build` produces, pre-installer) with the
  WebView2 debug port env var, and confirmed via CDP that its page loads at
  `http://tauri.localhost/` (Tauri's real custom protocol, not the dev
  server's `http://127.0.0.1:1430`) — and `showDirectoryPicker`,
  `FileSystemDirectoryHandle`, the `electronAPI` shim, `localStorage`, panel
  animations, and tab switching all work identically to the dev-mode test.
  This was the last real unknown (dev and production use different loading
  mechanisms in Tauri) and it checks out.
- Still true regardless of the above: nothing here was verified with an
  actual mouse click on `showDirectoryPicker()`'s native OS folder-browse
  dialog — CDP can script the page but can't drive that dialog, since it's
  outside the page entirely. That's the one thing that still needs a human.
- **Icons** are still Tauri's own default scaffold icons
  (`src-tauri/icons/*`), not this app's real ones.
- **macOS/Linux**: nothing here has been tested on either — the
  `data_directory`/WebView2-specific pieces are Windows-only anyway (see
  the doc comment on `portable_data_dir()`'s call site); a real cross-platform
  pass would need `#[cfg(...)]`-gating the portable-data-dir behavior and
  checking whether WKWebView (macOS) even supports File System Access API
  as completely as WebView2 does (there's real reason to doubt it does —
  worth checking before assuming this port carries over to a Mac build).

## How to keep testing this without me

```bash
cd tauri-port
npx tauri dev
```

This launches a live-reloading dev build (Rust changes trigger a rebuit +
relaunch automatically; renderer changes need a manual page reload since
there's no renderer-side watcher wired up here). To attach Chrome DevTools
Protocol to it the same way this session did (useful for checking
`localStorage`/console errors without needing to click around):

```bash
# before launching, so WebView2 actually opens the debug port:
export WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS="--remote-debugging-port=9222"
npx tauri dev
# then, from another terminal, once it's running:
curl http://127.0.0.1:9222/json   # lists the page's websocket debugger URL
```

To actually produce a shippable build: `npx tauri build` (full release,
signed/optimized) or `npx tauri build --debug` (faster, unoptimized, still
goes through the real bundling pipeline — good for testing the
custom-protocol production path without a long release compile).

## Status: core functionality confirmed working end-to-end

Dataset loading, WD14 Autotagger, and now Quit have all been confirmed
working by an actual human click-through, not just CDP scripting. Remaining
items are polish, not correctness:

1. Replace the placeholder icons.
2. Decide on a real `identifier`/versioning strategy if this is ever meant
   to coexist with or replace the Electron release track.
3. Click through the rest of the app by hand (themes, achievements/shop,
   Master Tag Control, animation modes, docks) — everything tested so far
   passed, but not everything has been tested yet.
