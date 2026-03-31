use serde_json::Value;
use tauri::AppHandle;

use crate::storage::app_state_store;

#[tauri::command]
pub fn load_app_state(app: AppHandle) -> Result<Value, String> {
    app_state_store::load(&app)
}

#[tauri::command]
pub fn save_app_state(app: AppHandle, state: Value) -> Result<(), String> {
    app_state_store::save(&app, &state)
}

