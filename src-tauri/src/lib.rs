mod claude;

use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, WebviewWindow, WindowEvent};
use tauri_plugin_store::StoreExt;

const STORE_FILE: &str = "settings.json";
const POSITION_SAVE_DELAY: Duration = Duration::from_millis(500);

fn remember_position_enabled(app: &AppHandle) -> bool {
    app.store(STORE_FILE)
        .ok()
        .and_then(|store| store.get("settings"))
        .and_then(|settings| settings.get("rememberPosition").and_then(|v| v.as_bool()))
        .unwrap_or(true)
}

/// True when the point lies inside any connected monitor, so a saved position
/// from a disconnected display never leaves the widget off-screen.
fn is_on_screen(window: &WebviewWindow, x: i32, y: i32) -> bool {
    window
        .available_monitors()
        .map(|monitors| {
            monitors.iter().any(|m| {
                let pos = m.position();
                let size = m.size();
                x >= pos.x && y >= pos.y && x < pos.x + size.width as i32 - 40 && y < pos.y + size.height as i32 - 40
            })
        })
        .unwrap_or(true)
}

fn restore_window_position(window: &WebviewWindow) {
    let app = window.app_handle();
    if !remember_position_enabled(app) {
        return;
    }
    let Ok(store) = app.store(STORE_FILE) else { return };
    let Some(pos) = store.get("windowPosition") else { return };
    let (Some(x), Some(y)) = (
        pos.get("x").and_then(|v| v.as_i64()),
        pos.get("y").and_then(|v| v.as_i64()),
    ) else {
        return;
    };
    if is_on_screen(window, x as i32, y as i32) {
        let _ = window.set_position(tauri::PhysicalPosition::new(x as i32, y as i32));
    }
}

fn save_window_position(window: &WebviewWindow) {
    let app = window.app_handle();
    if !remember_position_enabled(app) {
        return;
    }
    if let (Ok(pos), Ok(store)) = (window.outer_position(), app.store(STORE_FILE)) {
        store.set("windowPosition", serde_json::json!({ "x": pos.x, "y": pos.y }));
        let _ = store.save();
    }
}

/// Writes the position once dragging has settled instead of on every move event.
fn spawn_position_saver(window: WebviewWindow, last_move: Arc<Mutex<Option<Instant>>>) {
    std::thread::spawn(move || loop {
        std::thread::sleep(POSITION_SAVE_DELAY);
        let mut pending = last_move.lock().unwrap();
        if matches!(*pending, Some(at) if at.elapsed() >= POSITION_SAVE_DELAY) {
            *pending = None;
            drop(pending);
            save_window_position(&window);
        }
    });
}

fn toggle_widget(app: &AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        if win.is_visible().unwrap_or(false) {
            let _ = win.hide();
        } else {
            let _ = win.show();
        }
    }
}

fn open_settings(app: &AppHandle) {
    if let Some(win) = app.get_webview_window("settings") {
        let _ = win.show();
        let _ = win.set_focus();
        return;
    }
    let _ = tauri::WebviewWindowBuilder::new(app, "settings", tauri::WebviewUrl::App("index.html?settings=1".into()))
        .title("Settings")
        .inner_size(380.0, 640.0)
        .resizable(false)
        .maximizable(false)
        .center()
        .build();
}

// Window creation must not run on the main thread's command dispatch on Windows.
#[tauri::command]
async fn show_settings_window(app: AppHandle) {
    open_settings(&app);
}

#[tauri::command]
fn quit_app(app: AppHandle) {
    app.exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.show();
            }
        }))
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, None))
        .invoke_handler(tauri::generate_handler![show_settings_window, quit_app, claude::claude_usage])
        .setup(|app| {
            let window = app.get_webview_window("main").expect("main window is defined in tauri.conf.json");
            restore_window_position(&window);
            let _ = window.show();

            let last_move = Arc::new(Mutex::new(None));
            spawn_position_saver(window.clone(), last_move.clone());
            window.on_window_event(move |event| {
                if let WindowEvent::Moved(_) = event {
                    *last_move.lock().unwrap() = Some(Instant::now());
                }
            });

            let toggle = MenuItem::with_id(app, "toggle", "Show/Hide Widget", true, None::<&str>)?;
            let settings = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let separator = PredefinedMenuItem::separator(app)?;
            let menu = Menu::with_items(app, &[&toggle, &settings, &separator, &quit])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().expect("bundle icon is configured").clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .tooltip("Daylo")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "toggle" => toggle_widget(app),
                    "settings" => {
                        let handle = app.clone();
                        tauri::async_runtime::spawn(async move { open_settings(&handle) });
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
                        toggle_widget(tray.app_handle());
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Daylo");
}
