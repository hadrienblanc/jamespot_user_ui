// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle();
            db::init(&app_handle)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            db::get_credentials,
            db::save_credentials,
            db::clear_credentials,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
