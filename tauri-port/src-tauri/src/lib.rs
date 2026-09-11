mod wd14;

use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{Emitter, Manager, WindowEvent};
use tauri::utils::config::Color;
use tauri::{WebviewUrl, WebviewWindowBuilder};

// Unlike the Electron version, this does NOT try to be a portable
// carry-around folder — an installer (MSI/NSIS) defaults to installing into
// `Program Files`, which standard (non-admin) users can't write to, so a
// webview data directory next to the exe would fail there. Uses Tauri's
// normal per-user app-data location instead (`%APPDATA%\<identifier>\` on
// Windows) — the standard, always-writable place for this. Deliberate
// tradeoff, decided against the portable-next-to-exe design on purpose.
fn app_data_dir(app: &tauri::AppHandle) -> std::path::PathBuf {
    let dir = app.path().app_data_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
    let _ = std::fs::create_dir_all(&dir);
    dir
}

// Tracks whether the renderer has already confirmed it's OK to close (no
// unsaved changes, or the user confirmed anyway) — mirrors the Electron
// version's `win.__closeConfirmed` flag on the BrowserWindow instance. A
// renderer-side `beforeunload` handler alone can't drive this: browsers
// (and this webview) don't reliably show a "leave site?" prompt from it, so
// the actual guard has to live here, intercepting the OS-level close request
// itself and asking the renderer first over an event round-trip.
struct CloseConfirmed(AtomicBool);

// Native page zoom via WebView2's real compositor-level zoom (the same
// mechanism `set_zoom` maps to under the hood) — NOT CSS zoom. CLAUDE.md's
// Electron version explicitly warns against a CSS-zoom-based path because it
// scales an element's own box independently of its container and reliably
// causes overflow; this Tauri equivalent avoids that the same way Electron's
// `webContents.setZoomFactor()` did, just via a different underlying API.
#[tauri::command]
fn set_zoom_factor(window: tauri::WebviewWindow, factor: f64) -> Result<(), String> {
    if factor > 0.0 && factor <= 3.0 {
        window.set_zoom(factor).map_err(|e| e.to_string())?;
    }
    Ok(())
}

// Single-window app: once the renderer has confirmed it's OK to close,
// actually exit the whole process rather than just closing the window.
// Tauri (unlike Electron, which needed an explicit `window-all-closed` ->
// `app.quit()` handler for the same intent) doesn't reliably exit the
// process on its own once the last window closes — confirmed live: closing
// the window via this exact path left `app.exe` running at ~32MB with no
// window and no CDP endpoint, exactly matching the reported "Quit doesn't
// quit" bug (the OS never sees the process disappear). `app.exit(0)` is the
// explicit fix.
#[tauri::command]
fn confirm_close(state: tauri::State<CloseConfirmed>) {
    state.0.store(true, Ordering::SeqCst);
    // `AppHandle::exit()` posts a graceful exit request through the event
    // loop and was observed (live, via CDP) to close the window/webview but
    // then leave `app.exe` itself still running in the background — some
    // background task (tokio runtime from the WD14 reqwest client, or the
    // log plugin's writer thread) apparently keeps the process alive past
    // that point. A hard `std::process::exit` is the actually-reliable fix:
    // there is nothing left to save at this point (the renderer already
    // confirmed no unsaved changes, or the user accepted losing them), so
    // skipping any further graceful shutdown is fine here.
    std::process::exit(0);
}

#[tauri::command]
fn restart_app(app: tauri::AppHandle) {
    app.restart();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(CloseConfirmed(AtomicBool::new(false)))
        .invoke_handler(tauri::generate_handler![
            set_zoom_factor,
            confirm_close,
            restart_app,
            wd14::wd14_get_models,
            wd14::wd14_tag_image,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            // Built manually here (rather than declared in tauri.conf.json's
            // `windows` array) so `.data_directory(...)` can point at a path
            // computed at runtime — the declarative config option only
            // supports a path relative to the platform appDataDir, which is
            // exactly the non-portable location this needs to avoid.
            let window = WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
                .title("Dataset Tag Studio")
                .inner_size(1440.0, 900.0)
                .min_inner_size(1040.0, 640.0)
                .background_color(Color(0x16, 0x15, 0x1c, 0xff))
                .visible(false)
                .data_directory(app_data_dir(&app.handle()))
                // Tauri's own OS-level drag-drop handler (for dropping files
                // ONTO the window, a feature this app doesn't use) takes over
                // the webview's drag machinery on Windows and silently
                // breaks the frontend's own HTML5 drag-and-drop as a side
                // effect — confirmed live: keyword-family reordering
                // (tag-index.ts's native `draggable`/dragstart/drop) did
                // nothing at all under Tauri until this was disabled. Tauri's
                // own doc comment on this method says exactly that:
                // "Disables the drag and drop handler. This is required to
                // use HTML5 drag and drop APIs on the frontend on Windows."
                .disable_drag_drop_handler()
                .build()?;
            // visible(false) + this manual maximize-then-show avoids a
            // visible resize flash on launch, same intent as the Electron
            // version's `ready-to-show` + `maximize()` + `show()`.
            window.maximize()?;
            window.show()?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                let already_confirmed = window
                    .state::<CloseConfirmed>()
                    .0
                    .load(Ordering::SeqCst);
                if !already_confirmed {
                    api.prevent_close();
                    let _ = window.emit("request-close", ());
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
