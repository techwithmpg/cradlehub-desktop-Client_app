//! Rust-only, non-authoritative snapshot storage. No renderer IPC is registered.

mod schema;
mod store;

pub use schema::LOCAL_DB_SCHEMA_VERSION;
pub use store::{
    CacheDataset, LocalCacheStore, OpaqueParametersHash, SnapshotKey, SnapshotPayload,
    StoredSnapshot,
};

use std::fmt;
use std::fs;
use std::path::Path;

pub const DATABASE_FILENAME: &str = "cradlehub-cache.sqlite3";

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum LocalCacheError {
    PathUnavailable,
    OpenFailed,
    ConfigurationFailed,
    MigrationFailed,
    UnsupportedSchemaVersion(i32),
    InvalidKey,
    InvalidPayload,
    ReadFailed,
    WriteFailed,
    LockPoisoned,
}

impl fmt::Display for LocalCacheError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        // Never include an absolute path, SQL statement, or business payload.
        write!(f, "local cache {:?}", self)
    }
}

impl std::error::Error for LocalCacheError {}

pub enum LocalCacheState {
    Available(LocalCacheStore),
    Unavailable(LocalCacheError),
}

impl LocalCacheState {
    /// This is called only from Tauri setup with `app.path().app_data_dir()`.
    /// Failure is data-store degradation, never an application startup failure.
    pub(crate) fn initialize(app_data_dir: &Path) -> Self {
        let initialized = fs::create_dir_all(app_data_dir)
            .map_err(|_| LocalCacheError::PathUnavailable)
            .and_then(|()| LocalCacheStore::open(&app_data_dir.join(DATABASE_FILENAME)));
        match initialized {
            Ok(store) => Self::Available(store),
            Err(error) => Self::Unavailable(error),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn invalid_application_data_path_is_non_panicking_and_unavailable() {
        let dir = crate::local_cache::store::test_support::TemporaryDirectory::new();
        let file = dir.path().join("occupied-file");
        fs::write(&file, "stage-15-synthetic").unwrap();
        let state = LocalCacheState::initialize(&file);
        assert!(matches!(
            state,
            LocalCacheState::Unavailable(LocalCacheError::PathUnavailable)
        ));
    }
}
