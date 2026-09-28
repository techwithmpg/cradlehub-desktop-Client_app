pub mod local_cache;

use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let state = match app.path().app_data_dir() {
                Ok(directory) => local_cache::LocalCacheState::initialize(&directory),
                Err(_) => local_cache::LocalCacheState::Unavailable(
                    local_cache::LocalCacheError::PathUnavailable,
                ),
            };
            if let local_cache::LocalCacheState::Unavailable(ref reason) = state {
                eprintln!("CradleHub local cache unavailable: {reason}");
            }
            app.manage(state);
            Ok(())
        })
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_http::init())
        .run(tauri::generate_context!())
        .expect("error while running CradleHub Desktop");
}
