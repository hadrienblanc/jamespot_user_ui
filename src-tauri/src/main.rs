// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;

use tauri::Manager;
use tauri_plugin_http::HttpExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            let app_handle = app.handle();
            db::init(&app_handle)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            db::get_credentials,
            db::save_credentials,
            db::clear_credentials,
            http_request,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn http_request(
    app: tauri::AppHandle,
    url: String,
    method: String,
    headers: Option<Vec<(String, String)>,
    body: Option<String>,
) -> Result<String, String> {
    let http = app.http();

    let mut builder = http.request(method.parse(&method).unwrap(), &url);

    if let Some(headers) = headers {
        for (key, value) in headers {
            builder = builder.header(key, value);
        }
    }

    if let Some(body) = body {
        builder = builder.body(body);
    }

    let response = builder.send().await
        .map_err(|e| format!("HTTP request failed: {}", e))?;

    Ok(response.into_text().await)
}
