# Migrations - Schema Versioning & Data Migration

**Last Updated:** 2026-02-04  
**Status:** Not Implemented

---

## Current State

### Schema Versioning

**Status:** ❌ No `schemaVersion` fields in storage objects

**Impact:** Cannot migrate data when schemas change. Breaking changes require manual data migration.

### Migration Runner

**Status:** ❌ No migration runner exists

---

## Schema Version Strategy

### Version Format

**Format:** Integer starting at 1  
**Increment:** On any breaking schema change

### Schema Version Fields

**Location:** Top-level field in all storage objects

```javascript
{
  schemaVersion: 1,  // Add to all storage objects
  // ... existing fields
}
```

### Version History

**Documentation:** Track schema changes in `docs/context/SCHEMA_VERSIONS.md`

**Example:**
```markdown
## Collection: wallets

### Version 1 (2026-02-04)
- Initial schema
- Fields: userId, gameId, currencies, createdAt, updatedAt

### Version 2 (2026-02-10)
- Added: transactionHistory array
- Breaking: No

### Version 3 (2026-02-15)
- Added: idempotencyKeys array
- Breaking: No
```

---

## Migration Runner Design

### Migration Script Structure

**File:** `data/modules/core/migrations.js` (to be created)

```javascript
var Migrations = {
    // Collection: version -> migration function
    wallets: {
        1: function(data) {
            // Version 1: Initial schema (no migration needed)
            return data;
        },
        2: function(data) {
            // Version 2: Add transactionHistory
            if (!data.transactionHistory) {
                data.transactionHistory = [];
            }
            return data;
        },
        3: function(data) {
            // Version 3: Add idempotencyKeys
            if (!data.idempotencyKeys) {
                data.idempotencyKeys = [];
            }
            return data;
        }
    },
    
    player_metadata: {
        1: function(data) {
            // Version 1: Initial schema
            return data;
        },
        2: function(data) {
            // Version 2: Add schemaVersion field
            if (!data.schemaVersion) {
                data.schemaVersion = 2;
            }
            return data;
        }
    }
};

var CURRENT_SCHEMA_VERSIONS = {
    wallets: 3,
    player_metadata: 2,
    daily_streaks: 1,
    mission_progress: 1
    // ... all collections
};
```

### Migration Execution

```javascript
function migrateStorageObject(collection, data) {
    var currentVersion = data.schemaVersion || 1;
    var targetVersion = CURRENT_SCHEMA_VERSIONS[collection];
    
    if (currentVersion >= targetVersion) {
        return data;  // Already up to date
    }
    
    var migrations = Migrations[collection];
    if (!migrations) {
        logger.warn("No migrations found for collection: " + collection);
        return data;
    }
    
    var migrated = data;
    for (var version = currentVersion + 1; version <= targetVersion; version++) {
        if (migrations[version]) {
            logger.info("Migrating " + collection + " from v" + (version - 1) + " to v" + version);
            migrated = migrations[version](migrated);
            migrated.schemaVersion = version;
        }
    }
    
    return migrated;
}
```

### Automatic Migration on Read

```javascript
function readStorageWithMigration(nk, logger, collection, key, userId) {
    var records = nk.storageRead([{
        collection: collection,
        key: key,
        userId: userId
    }]);
    
    if (records && records.length > 0) {
        var data = records[0].value;
        var migrated = migrateStorageObject(collection, data);
        
        // If migrated, save back
        if (migrated.schemaVersion !== data.schemaVersion) {
            nk.storageWrite([{
                collection: collection,
                key: key,
                userId: userId,
                value: migrated,
                permissionRead: 1,
                permissionWrite: 0
            }]);
        }
        
        return migrated;
    }
    
    return null;
}
```

---

## Migration Types

### 1. Additive Migrations (Non-Breaking)

**Example:** Add new optional field

```javascript
function migrateAddField(data) {
    if (!data.newField) {
        data.newField = defaultValue;
    }
    return data;
}
```

**Rollback:** Safe (field can be ignored by old code)

---

### 2. Transformative Migrations (Breaking)

**Example:** Rename field

```javascript
function migrateRenameField(data) {
    if (data.oldFieldName && !data.newFieldName) {
        data.newFieldName = data.oldFieldName;
        delete data.oldFieldName;
    }
    return data;
}
```

**Rollback:** Requires reverse migration

---

### 3. Structural Migrations (Breaking)

**Example:** Change data structure

```javascript
function migrateRestructure(data) {
    if (data.oldStructure) {
        data.newStructure = {
            field1: data.oldStructure.field1,
            field2: data.oldStructure.field2
        };
        delete data.oldStructure;
    }
    return data;
}
```

**Rollback:** Complex, may lose data

---

## Migration Execution Strategy

### Phase 1: Backfill Schema Versions

**Goal:** Add `schemaVersion: 1` to all existing records

**Approach:**
1. Create migration script
2. Read all records in each collection
3. Add `schemaVersion: 1` if missing
4. Write back

**RPC:** `admin_migrate_schema_versions` (one-time)

---

### Phase 2: Enable Automatic Migration

**Goal:** Migrate on read automatically

**Approach:**
1. Replace all `nk.storageRead()` calls with `readStorageWithMigration()`
2. Migrate records lazily on access
3. Save migrated records back

---

### Phase 3: Batch Migration (Optional)

**Goal:** Migrate all records upfront

**Approach:**
1. Create admin RPC: `admin_migrate_collection`
2. Read all records in collection
3. Migrate each record
4. Write back

**Use Case:** When migration is expensive or needs to run offline

---

## Rollback Strategy

### Migration Rollback

**Approach:** Keep reverse migrations

```javascript
var ReverseMigrations = {
    wallets: {
        3: function(data) {
            // Rollback from v3 to v2
            delete data.idempotencyKeys;
            data.schemaVersion = 2;
            return data;
        },
        2: function(data) {
            // Rollback from v2 to v1
            delete data.transactionHistory;
            data.schemaVersion = 1;
            return data;
        }
    }
};
```

### Data Backup

**Before Migration:**
1. Backup affected collections
2. Store backup location
3. Document rollback procedure

---

## Migration Checklist

### Phase 1: Schema Versioning (Week 1)

- [ ] Add `schemaVersion: 1` to all new storage writes
- [ ] Create `CURRENT_SCHEMA_VERSIONS` constant
- [ ] Document current schemas
- [ ] Create migration runner framework

### Phase 2: Backfill (Week 2)

- [ ] Create backfill script for existing records
- [ ] Run backfill for critical collections (wallets, player_metadata)
- [ ] Verify backfill success

### Phase 3: Automatic Migration (Week 3)

- [ ] Implement `readStorageWithMigration()`
- [ ] Replace storage reads with migration-aware reads
- [ ] Test migration on read

### Phase 4: Future Migrations (Ongoing)

- [ ] Document schema changes
- [ ] Create migration functions
- [ ] Test migrations
- [ ] Deploy with rollback plan

---

## Critical Migrations Needed

### 1. Add Schema Version to All Collections

**Collections:** All (30+ collections)  
**Migration:** Add `schemaVersion: 1` field  
**Priority:** P0

### 2. Add Idempotency Keys to Transaction Logs

**Collection:** `transaction_logs`  
**Migration:** Add `idempotencyKey` field (nullable initially)  
**Priority:** P0

### 3. Standardize Key Patterns

**Collections:** Multiple  
**Migration:** Rename keys to standard patterns  
**Priority:** P1

---

## Migration Testing

### Test Strategy

1. **Unit Tests:** Test migration functions with sample data
2. **Integration Tests:** Test migration on read
3. **Smoke Tests:** Verify migrated data structure
4. **Rollback Tests:** Test reverse migrations

### Test Data

```javascript
var testData = {
    wallets: {
        v1: { userId: "abc", gameId: "def", currencies: {} },
        v2: { userId: "abc", gameId: "def", currencies: {}, transactionHistory: [] },
        v3: { userId: "abc", gameId: "def", currencies: {}, transactionHistory: [], idempotencyKeys: [] }
    }
};
```

---

**See Also:**
- [STORAGE_CATALOG.md](./STORAGE_CATALOG.md) - Current storage schemas
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
