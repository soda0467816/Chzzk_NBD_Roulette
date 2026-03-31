mod commands;
mod storage;

use commands::{app_state, unofficial_live};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(unofficial_live::UnofficialLiveController::default())
        .invoke_handler(tauri::generate_handler![
            app_state::load_app_state,
            app_state::save_app_state,
            unofficial_live::verify_unofficial_live,
            unofficial_live::start_unofficial_live_collector,
            unofficial_live::stop_unofficial_live_collector
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn main() {
    run();
}
