use rusqlite::Connection;

use super::LocalCacheError;

pub const LOCAL_DB_SCHEMA_VERSION: i32 = 1;

const CREATE_V1: &str = r#"
CREATE TABLE cache_snapshots (
    user_scope TEXT NOT NULL CHECK (length(user_scope) > 0),
    branch_scope TEXT NOT NULL CHECK (length(branch_scope) > 0),
    dataset TEXT NOT NULL CHECK (length(dataset) > 0),
    parameters_hash TEXT NOT NULL CHECK (length(parameters_hash) = 64),
    model_version INTEGER NOT NULL CHECK (model_version > 0),
    payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
    stored_at_ms INTEGER NOT NULL CHECK (stored_at_ms >= 0),
    validated_at_ms INTEGER NOT NULL CHECK (validated_at_ms >= stored_at_ms),
    PRIMARY KEY (user_scope, branch_scope, dataset, parameters_hash, model_version)
) WITHOUT ROWID;
"#;

pub(super) fn read_version(connection: &Connection) -> Result<i32, LocalCacheError> {
    connection
        .pragma_query_value(None, "user_version", |row| row.get(0))
        .map_err(|_| LocalCacheError::MigrationFailed)
}

pub(super) fn migrate(connection: &mut Connection) -> Result<(), LocalCacheError> {
    let version = read_version(connection)?;
    match version {
        0 => {
            let transaction = connection
                .transaction()
                .map_err(|_| LocalCacheError::MigrationFailed)?;
            transaction
                .execute_batch(CREATE_V1)
                .map_err(|_| LocalCacheError::MigrationFailed)?;
            transaction
                .pragma_update(None, "user_version", LOCAL_DB_SCHEMA_VERSION)
                .map_err(|_| LocalCacheError::MigrationFailed)?;
            transaction
                .commit()
                .map_err(|_| LocalCacheError::MigrationFailed)?;
        }
        LOCAL_DB_SCHEMA_VERSION => {}
        newer if newer > LOCAL_DB_SCHEMA_VERSION => {
            return Err(LocalCacheError::UnsupportedSchemaVersion(newer));
        }
        _ => return Err(LocalCacheError::MigrationFailed),
    }

    // `user_version` by itself is not proof that the expected table still exists.
    connection
        .prepare(
            "SELECT user_scope, branch_scope, dataset, parameters_hash, model_version, \
             payload_json, stored_at_ms, validated_at_ms FROM cache_snapshots LIMIT 0",
        )
        .map_err(|_| LocalCacheError::MigrationFailed)?;
    Ok(())
}
