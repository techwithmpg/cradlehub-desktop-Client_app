use std::path::Path;
use std::sync::Mutex;
use std::time::Duration;

use rusqlite::{params, Connection, OptionalExtension};
use serde_json::Value;

use super::{schema, LocalCacheError};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum CacheDataset {
    Today,
    BookingsList,
    BookingOptions,
    CustomersList,
    CustomerDetail,
    AttendanceWorkspace,
    AttendanceHistory,
    ScheduleDaily,
    ScheduleAvailability,
    ScheduleStaffFull,
    HomeServiceQueue,
    HomeServiceDrivers,
    HomeServiceBookingDetail,
    HomeServiceRecommendations,
    StaffRoster,
    StaffAssignableServices,
    StaffOnboardingRequests,
}

impl CacheDataset {
    fn storage_name(self) -> &'static str {
        match self {
            Self::Today => "today",
            Self::BookingsList => "bookings-list",
            Self::BookingOptions => "booking-options",
            Self::CustomersList => "customers-list",
            Self::CustomerDetail => "customer-detail",
            Self::AttendanceWorkspace => "attendance-workspace",
            Self::AttendanceHistory => "attendance-history",
            Self::ScheduleDaily => "schedule-daily",
            Self::ScheduleAvailability => "schedule-availability",
            Self::ScheduleStaffFull => "schedule-staff-full",
            Self::HomeServiceQueue => "home-service-queue",
            Self::HomeServiceDrivers => "home-service-drivers",
            Self::HomeServiceBookingDetail => "home-service-booking-detail",
            Self::HomeServiceRecommendations => "home-service-recommendations",
            Self::StaffRoster => "staff-roster",
            Self::StaffAssignableServices => "staff-assignable-services",
            Self::StaffOnboardingRequests => "staff-onboarding-requests",
        }
    }
}

impl TryFrom<&str> for CacheDataset {
    type Error = LocalCacheError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        match value {
            "today" => Ok(Self::Today),
            "bookings-list" => Ok(Self::BookingsList),
            "booking-options" => Ok(Self::BookingOptions),
            "customers-list" => Ok(Self::CustomersList),
            "customer-detail" => Ok(Self::CustomerDetail),
            "attendance-workspace" => Ok(Self::AttendanceWorkspace),
            "attendance-history" => Ok(Self::AttendanceHistory),
            "schedule-daily" => Ok(Self::ScheduleDaily),
            "schedule-availability" => Ok(Self::ScheduleAvailability),
            "schedule-staff-full" => Ok(Self::ScheduleStaffFull),
            "home-service-queue" => Ok(Self::HomeServiceQueue),
            "home-service-drivers" => Ok(Self::HomeServiceDrivers),
            "home-service-booking-detail" => Ok(Self::HomeServiceBookingDetail),
            "home-service-recommendations" => Ok(Self::HomeServiceRecommendations),
            "staff-roster" => Ok(Self::StaffRoster),
            "staff-assignable-services" => Ok(Self::StaffAssignableServices),
            "staff-onboarding-requests" => Ok(Self::StaffOnboardingRequests),
            _ => Err(LocalCacheError::InvalidKey),
        }
    }
}

/// The future caller must hash canonical parameters before constructing this key.
/// Raw customer searches and other query values cannot be used as a physical key.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct OpaqueParametersHash(String);

impl OpaqueParametersHash {
    pub fn parse(value: &str) -> Result<Self, LocalCacheError> {
        if value.len() != 64
            || !value
                .bytes()
                .all(|byte| byte.is_ascii_hexdigit() && !byte.is_ascii_uppercase())
        {
            return Err(LocalCacheError::InvalidKey);
        }
        Ok(Self(value.to_owned()))
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct SnapshotKey {
    user_scope: String,
    branch_scope: String,
    dataset: CacheDataset,
    parameters_hash: OpaqueParametersHash,
    model_version: i64,
}

impl SnapshotKey {
    pub fn new(
        user_scope: &str,
        branch_scope: &str,
        dataset: CacheDataset,
        parameters_hash: OpaqueParametersHash,
        model_version: i64,
    ) -> Result<Self, LocalCacheError> {
        validate_scope(user_scope)?;
        validate_scope(branch_scope)?;
        if model_version <= 0 {
            return Err(LocalCacheError::InvalidKey);
        }
        Ok(Self {
            user_scope: user_scope.to_owned(),
            branch_scope: branch_scope.to_owned(),
            dataset,
            parameters_hash,
            model_version,
        })
    }
}

fn validate_scope(scope: &str) -> Result<(), LocalCacheError> {
    if scope.is_empty()
        || scope.len() > 128
        || scope.trim() != scope
        || scope.chars().any(char::is_control)
    {
        return Err(LocalCacheError::InvalidKey);
    }
    Ok(())
}

#[derive(Clone, Debug, PartialEq)]
pub struct SnapshotPayload(Value);

impl SnapshotPayload {
    pub fn parse(json: &str) -> Result<Self, LocalCacheError> {
        serde_json::from_str(json)
            .map(Self)
            .map_err(|_| LocalCacheError::InvalidPayload)
    }

    pub fn value(&self) -> &Value {
        &self.0
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct StoredSnapshot {
    pub payload: SnapshotPayload,
    pub stored_at_ms: i64,
    pub validated_at_ms: i64,
}

pub struct LocalCacheStore {
    connection: Mutex<Connection>,
}

impl LocalCacheStore {
    pub(crate) fn open(path: &Path) -> Result<Self, LocalCacheError> {
        let mut connection = Connection::open(path).map_err(|_| LocalCacheError::OpenFailed)?;
        connection
            .busy_timeout(Duration::from_secs(5))
            .map_err(|_| LocalCacheError::ConfigurationFailed)?;

        // A newer database must be left untouched by this older binary.
        let version = schema::read_version(&connection)?;
        if version > schema::LOCAL_DB_SCHEMA_VERSION {
            return Err(LocalCacheError::UnsupportedSchemaVersion(version));
        }

        connection
            .pragma_update(None, "foreign_keys", "ON")
            .map_err(|_| LocalCacheError::ConfigurationFailed)?;
        let journal_mode: String = connection
            .pragma_update_and_check(None, "journal_mode", "WAL", |row| row.get(0))
            .map_err(|_| LocalCacheError::ConfigurationFailed)?;
        if !journal_mode.eq_ignore_ascii_case("wal") {
            return Err(LocalCacheError::ConfigurationFailed);
        }
        // Cache data is regenerable; WAL + NORMAL avoids a full sync on every commit.
        connection
            .pragma_update(None, "synchronous", "NORMAL")
            .map_err(|_| LocalCacheError::ConfigurationFailed)?;
        schema::migrate(&mut connection)?;
        Ok(Self {
            connection: Mutex::new(connection),
        })
    }

    pub fn put_snapshot(
        &self,
        key: &SnapshotKey,
        payload: &SnapshotPayload,
        stored_at_ms: i64,
        validated_at_ms: i64,
    ) -> Result<(), LocalCacheError> {
        if stored_at_ms < 0 || validated_at_ms < stored_at_ms {
            return Err(LocalCacheError::InvalidPayload);
        }
        let serialized =
            serde_json::to_string(payload.value()).map_err(|_| LocalCacheError::InvalidPayload)?;
        let connection = self
            .connection
            .lock()
            .map_err(|_| LocalCacheError::LockPoisoned)?;
        connection
            .execute(
                "INSERT INTO cache_snapshots (
                    user_scope, branch_scope, dataset, parameters_hash, model_version,
                    payload_json, stored_at_ms, validated_at_ms
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
                ON CONFLICT (user_scope, branch_scope, dataset, parameters_hash, model_version)
                DO UPDATE SET payload_json = excluded.payload_json,
                              stored_at_ms = excluded.stored_at_ms,
                              validated_at_ms = excluded.validated_at_ms",
                params![
                    key.user_scope,
                    key.branch_scope,
                    key.dataset.storage_name(),
                    key.parameters_hash.0,
                    key.model_version,
                    serialized,
                    stored_at_ms,
                    validated_at_ms,
                ],
            )
            .map_err(|_| LocalCacheError::WriteFailed)?;
        Ok(())
    }

    pub fn get_snapshot(
        &self,
        key: &SnapshotKey,
    ) -> Result<Option<StoredSnapshot>, LocalCacheError> {
        let connection = self
            .connection
            .lock()
            .map_err(|_| LocalCacheError::LockPoisoned)?;
        let row: Option<(String, i64, i64)> = connection
            .query_row(
                "SELECT payload_json, stored_at_ms, validated_at_ms FROM cache_snapshots
                 WHERE user_scope = ?1 AND branch_scope = ?2 AND dataset = ?3
                   AND parameters_hash = ?4 AND model_version = ?5",
                params![
                    key.user_scope,
                    key.branch_scope,
                    key.dataset.storage_name(),
                    key.parameters_hash.0,
                    key.model_version,
                ],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .optional()
            .map_err(|_| LocalCacheError::ReadFailed)?;
        row.map(|(json, stored_at_ms, validated_at_ms)| {
            Ok(StoredSnapshot {
                payload: SnapshotPayload::parse(&json)?,
                stored_at_ms,
                validated_at_ms,
            })
        })
        .transpose()
    }

    pub fn delete_snapshot(&self, key: &SnapshotKey) -> Result<bool, LocalCacheError> {
        let connection = self
            .connection
            .lock()
            .map_err(|_| LocalCacheError::LockPoisoned)?;
        connection
            .execute(
                "DELETE FROM cache_snapshots WHERE user_scope = ?1 AND branch_scope = ?2
                 AND dataset = ?3 AND parameters_hash = ?4 AND model_version = ?5",
                params![
                    key.user_scope,
                    key.branch_scope,
                    key.dataset.storage_name(),
                    key.parameters_hash.0,
                    key.model_version,
                ],
            )
            .map(|removed| removed == 1)
            .map_err(|_| LocalCacheError::WriteFailed)
    }

    pub fn purge_user_scope(&self, user_scope: &str) -> Result<usize, LocalCacheError> {
        validate_scope(user_scope)?;
        let connection = self
            .connection
            .lock()
            .map_err(|_| LocalCacheError::LockPoisoned)?;
        connection
            .execute(
                "DELETE FROM cache_snapshots WHERE user_scope = ?1",
                [user_scope],
            )
            .map_err(|_| LocalCacheError::WriteFailed)
    }

    pub fn purge_user_branch_scope(
        &self,
        user_scope: &str,
        branch_scope: &str,
    ) -> Result<usize, LocalCacheError> {
        validate_scope(user_scope)?;
        validate_scope(branch_scope)?;
        let connection = self
            .connection
            .lock()
            .map_err(|_| LocalCacheError::LockPoisoned)?;
        connection
            .execute(
                "DELETE FROM cache_snapshots WHERE user_scope = ?1 AND branch_scope = ?2",
                params![user_scope, branch_scope],
            )
            .map_err(|_| LocalCacheError::WriteFailed)
    }

    pub fn count_snapshots(&self) -> Result<i64, LocalCacheError> {
        let connection = self
            .connection
            .lock()
            .map_err(|_| LocalCacheError::LockPoisoned)?;
        connection
            .query_row("SELECT COUNT(*) FROM cache_snapshots", [], |row| row.get(0))
            .map_err(|_| LocalCacheError::ReadFailed)
    }
}

#[cfg(test)]
pub(crate) mod test_support {
    use std::path::{Path, PathBuf};
    use std::sync::atomic::{AtomicU64, Ordering};
    use std::time::{SystemTime, UNIX_EPOCH};

    static NEXT: AtomicU64 = AtomicU64::new(0);

    pub struct TemporaryDirectory(PathBuf);

    impl TemporaryDirectory {
        pub fn new() -> Self {
            let nonce = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos();
            let path = std::env::temp_dir().join(format!(
                "cradlehub-stage15-synthetic-{}-{nonce}-{}",
                std::process::id(),
                NEXT.fetch_add(1, Ordering::Relaxed)
            ));
            std::fs::create_dir(&path).unwrap();
            Self(path)
        }

        pub fn path(&self) -> &Path {
            &self.0
        }
    }

    impl Drop for TemporaryDirectory {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.0);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::local_cache::LocalCacheState;

    fn key(
        user: &str,
        branch: &str,
        dataset: CacheDataset,
        hash_character: char,
        version: i64,
    ) -> SnapshotKey {
        SnapshotKey::new(
            user,
            branch,
            dataset,
            OpaqueParametersHash::parse(&hash_character.to_string().repeat(64)).unwrap(),
            version,
        )
        .unwrap()
    }

    fn synthetic_payload(label: &str) -> SnapshotPayload {
        SnapshotPayload::parse(&format!(r#"{{"probe":"stage-15-synthetic-{label}"}}"#)).unwrap()
    }

    #[test]
    fn creates_v1_schema_and_connection_configuration_without_business_rows() {
        let dir = test_support::TemporaryDirectory::new();
        let store = LocalCacheStore::open(&dir.path().join("cache.sqlite3")).unwrap();
        let connection = store.connection.lock().unwrap();
        assert_eq!(schema::read_version(&connection).unwrap(), 1);
        assert_eq!(
            connection
                .pragma_query_value(None, "foreign_keys", |r| r.get::<_, i64>(0))
                .unwrap(),
            1
        );
        assert_eq!(
            connection
                .pragma_query_value(None, "synchronous", |r| r.get::<_, i64>(0))
                .unwrap(),
            1
        );
        assert_eq!(
            connection
                .pragma_query_value(None, "journal_mode", |r| r.get::<_, String>(0))
                .unwrap()
                .to_lowercase(),
            "wal"
        );
        drop(connection);
        assert_eq!(store.count_snapshots().unwrap(), 0);
    }

    #[test]
    fn reopen_preserves_synthetic_snapshot_and_same_key_upsert_is_atomic() {
        let dir = test_support::TemporaryDirectory::new();
        let path = dir.path().join("cache.sqlite3");
        let exact = key(
            "synthetic-user-a",
            "synthetic-branch-a",
            CacheDataset::Today,
            'a',
            1,
        );
        {
            let store = LocalCacheStore::open(&path).unwrap();
            store
                .put_snapshot(&exact, &synthetic_payload("first"), 100, 110)
                .unwrap();
            store
                .put_snapshot(&exact, &synthetic_payload("replacement"), 120, 130)
                .unwrap();
            assert_eq!(store.count_snapshots().unwrap(), 1);
        }
        let store = LocalCacheStore::open(&path).unwrap();
        let saved = store.get_snapshot(&exact).unwrap().unwrap();
        assert_eq!(
            saved.payload.value()["probe"],
            "stage-15-synthetic-replacement"
        );
        assert_eq!((saved.stored_at_ms, saved.validated_at_ms), (120, 130));
        assert_eq!(store.count_snapshots().unwrap(), 1);
        assert_eq!(
            schema::read_version(&store.connection.lock().unwrap()).unwrap(),
            1
        );
        assert!(store.delete_snapshot(&exact).unwrap());
        assert!(!store.delete_snapshot(&exact).unwrap());
        assert!(store.get_snapshot(&exact).unwrap().is_none());
    }

    #[test]
    fn complete_composite_key_isolates_user_branch_dataset_hash_and_model_version() {
        let dir = test_support::TemporaryDirectory::new();
        let store = LocalCacheStore::open(&dir.path().join("cache.sqlite3")).unwrap();
        let keys = [
            key("user-a", "branch-a", CacheDataset::Today, 'a', 1),
            key("user-b", "branch-a", CacheDataset::Today, 'a', 1),
            key("user-a", "branch-b", CacheDataset::Today, 'a', 1),
            key("user-a", "branch-a", CacheDataset::BookingsList, 'a', 1),
            key("user-a", "branch-a", CacheDataset::Today, 'b', 1),
            key("user-a", "branch-a", CacheDataset::Today, 'a', 2),
        ];
        for (index, entry) in keys.iter().enumerate() {
            store
                .put_snapshot(entry, &synthetic_payload(&index.to_string()), 10, 10)
                .unwrap();
        }
        assert_eq!(store.count_snapshots().unwrap(), 6);
        for (index, entry) in keys.iter().enumerate() {
            assert_eq!(
                store.get_snapshot(entry).unwrap().unwrap().payload.value()["probe"],
                format!("stage-15-synthetic-{index}")
            );
        }
        assert!(store
            .get_snapshot(&key("missing", "branch-a", CacheDataset::Today, 'a', 1))
            .unwrap()
            .is_none());
    }

    #[test]
    fn user_and_branch_purges_remove_only_the_exact_namespace() {
        let dir = test_support::TemporaryDirectory::new();
        let store = LocalCacheStore::open(&dir.path().join("cache.sqlite3")).unwrap();
        let a = key("user-a", "branch-a", CacheDataset::Today, 'a', 1);
        let b = key("user-a", "branch-b", CacheDataset::Today, 'a', 1);
        let c = key("user-b", "branch-a", CacheDataset::Today, 'a', 1);
        for entry in [&a, &b, &c] {
            store
                .put_snapshot(entry, &synthetic_payload("purge"), 10, 10)
                .unwrap();
        }
        assert_eq!(
            store.purge_user_branch_scope("user-a", "branch-a").unwrap(),
            1
        );
        assert!(store.get_snapshot(&a).unwrap().is_none());
        assert!(store.get_snapshot(&b).unwrap().is_some());
        assert!(store.get_snapshot(&c).unwrap().is_some());
        assert_eq!(store.purge_user_scope("user-a").unwrap(), 1);
        assert!(store.get_snapshot(&b).unwrap().is_none());
        assert!(store.get_snapshot(&c).unwrap().is_some());
        assert_eq!(store.count_snapshots().unwrap(), 1);
    }

    #[test]
    fn rejects_malformed_payload_raw_query_keys_and_blocked_staff_week_dataset() {
        assert_eq!(
            SnapshotPayload::parse("{not-json"),
            Err(LocalCacheError::InvalidPayload)
        );
        assert_eq!(
            OpaqueParametersHash::parse("customer search"),
            Err(LocalCacheError::InvalidKey)
        );
        assert_eq!(
            CacheDataset::try_from("staff.schedule-week"),
            Err(LocalCacheError::InvalidKey)
        );
        assert_eq!(
            CacheDataset::try_from("settings"),
            Err(LocalCacheError::InvalidKey)
        );
        assert!(SnapshotKey::new(
            "",
            "branch-a",
            CacheDataset::Today,
            OpaqueParametersHash::parse(&"a".repeat(64)).unwrap(),
            1
        )
        .is_err());
    }

    #[test]
    fn newer_schema_is_preserved_and_state_degrades_without_panic() {
        let dir = test_support::TemporaryDirectory::new();
        let path = dir.path().join(super::super::DATABASE_FILENAME);
        let connection = Connection::open(&path).unwrap();
        connection.pragma_update(None, "user_version", 2).unwrap();
        drop(connection);

        assert!(matches!(
            LocalCacheState::initialize(dir.path()),
            LocalCacheState::Unavailable(LocalCacheError::UnsupportedSchemaVersion(2))
        ));
        let connection = Connection::open(&path).unwrap();
        assert_eq!(schema::read_version(&connection).unwrap(), 2);
    }
}
