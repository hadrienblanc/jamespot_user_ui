use rusqlite::{Connection, OptionalExtension, params};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};

#[derive(Debug, Serialize, Deserialize)]
pub struct Credentials {
    pub url: String,
    pub email: String,
}

struct DbState(Mutex<Connection>);

pub fn init(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let app_dir = app.path().app_data_dir()?;
    std::fs::create_dir_all(&app_dir)?;

    let db_path = app_dir.join("jamespot.db");
    let conn = Connection::open(db_path)?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS credentials (
            id INTEGER PRIMARY KEY,
            url TEXT NOT NULL,
            email TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    app.manage(DbState(Mutex::new(conn)));
    Ok(())
}

#[tauri::command]
pub fn get_credentials(db: State<DbState>) -> Result<Option<Credentials>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT url, email FROM credentials ORDER BY id DESC LIMIT 1")
        .map_err(|e| e.to_string())?;

    let result = stmt
        .query_row([], |row| {
            Ok(Credentials {
                url: row.get(0)?,
                email: row.get(1)?,
            })
        })
        .optional()
        .map_err(|e| e.to_string())?;

    Ok(result)
}

#[tauri::command]
pub fn save_credentials(db: State<DbState>, url: String, email: String) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT OR REPLACE INTO credentials (id, url, email) VALUES (1, ?1, ?2)",
        params![url, email],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn clear_credentials(db: State<DbState>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM credentials", [])
        .map_err(|e| e.to_string())?;

    Ok(())
}
