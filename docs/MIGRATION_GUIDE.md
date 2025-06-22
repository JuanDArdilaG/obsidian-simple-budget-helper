# Migration Guide: From Dexie Cloud to Local File Persistence

## Overview

This guide explains the migration from Dexie Cloud (cloud-based sync) to a local file persistence system with conflict resolution and backup capabilities. The new system provides better data control, offline functionality, and enhanced data durability.

## Key Changes

### 1. Database Architecture

**Before (Dexie Cloud):**

-   Data synced to cloud via Dexie Cloud service
-   Automatic conflict resolution handled by cloud service
-   Data stored in IndexedDB with cloud sync

**After (Local File Persistence):**

-   Data stored locally in IndexedDB
-   Automatic sync to local JSON files in Obsidian vault
-   Manual conflict resolution with intelligent merging
-   Comprehensive backup system

### 2. File Structure

The new system creates the following structure in your Obsidian vault:

```
BudgetHelper/
├── {dbId}/
│   └── data.json          # Current data snapshot
└── backups/
    ├── backup-{dbId}-{timestamp}.json
    ├── backup-{dbId}-{timestamp}.json
    └── ...
```

### 3. Components

#### LocalDB (`src/contexts/Shared/infrastructure/persistence/local/local.db.ts`)

-   Main database class that replaces DexieDB
-   Manages IndexedDB operations
-   Coordinates file persistence and conflict resolution
-   Handles data versioning and migration

#### LocalFileManager (`src/contexts/Shared/infrastructure/persistence/local/local-file-manager.ts`)

-   Handles reading/writing data to local JSON files
-   Validates data structure integrity
-   Manages file paths and folder creation

#### ConflictResolver (`src/contexts/Shared/infrastructure/persistence/local/conflict-resolver.ts`)

-   Detects conflicts between IndexedDB and local files
-   Implements intelligent conflict resolution strategies:
    -   **Modification conflicts**: Prefer most recent data based on timestamps
    -   **Deletion conflicts**: Preserve deletions
    -   **Creation conflicts**: Keep new records
-   Supports manual conflict resolution for complex cases

#### BackupManager (`src/contexts/Shared/infrastructure/persistence/local/backup-manager.ts`)

-   Creates timestamped backups using Dexie export/import
-   Manages backup rotation and cleanup
-   Provides backup validation and restoration
-   Supports manual and automatic backup creation

#### DataVersioning (`src/contexts/Shared/infrastructure/persistence/local/data-versioning.ts`)

-   Handles data schema versioning
-   Supports data migration between versions
-   Ensures backward compatibility

## Migration Process

### 1. Automatic Migration

The migration happens automatically when you update the plugin:

1. **Data Export**: Existing Dexie Cloud data is exported
2. **Local Storage**: Data is saved to local JSON files
3. **Conflict Resolution**: Any conflicts are automatically resolved
4. **Backup Creation**: Initial backup is created
5. **IndexedDB Setup**: New LocalDB is initialized with local data

### 2. Manual Migration (if needed)

If automatic migration fails, you can manually migrate:

```typescript
// In the plugin console or settings
await plugin.exportDBBackup("pre-migration-backup");
await plugin.importDBBackup("pre-migration-backup");
```

## Features

### 1. Conflict Resolution

The system automatically detects and resolves conflicts:

-   **Timestamp-based resolution**: Uses `updatedAt` timestamps to determine most recent data
-   **Completeness-based fallback**: Prefers data with more complete information
-   **Manual override**: Complex conflicts can be resolved manually

### 2. Backup System

-   **Automatic backups**: Created before major operations
-   **Manual backups**: Available through plugin settings
-   **Backup rotation**: Keeps last 10 backups by default
-   **Backup validation**: Ensures backup integrity before restoration

### 3. Data Durability

-   **Dual storage**: Data stored in both IndexedDB and local files
-   **Versioning**: Data schema versioning for future migrations
-   **Validation**: Comprehensive data structure validation
-   **Error recovery**: Graceful handling of corruption scenarios

### 4. Performance

-   **Lazy loading**: Data loaded from files only when needed
-   **Incremental sync**: Only changed data is written to files
-   **Efficient queries**: IndexedDB queries remain fast
-   **Background operations**: File operations don't block UI

## Usage

### 1. Normal Operation

The system works transparently - no changes needed to your workflow:

-   Data is automatically synced to local files
-   Conflicts are resolved automatically
-   Backups are created periodically

### 2. Manual Operations

#### Create Backup

```typescript
await plugin.db.createBackup("my-backup");
```

#### Restore Backup

```typescript
await plugin.db.restoreFromBackup("my-backup");
```

#### List Backups

```typescript
const backups = await plugin.db.getBackupList();
```

#### Force Sync

```typescript
await plugin.db.sync();
```

### 3. Settings

The plugin settings now include:

-   **Database ID**: Unique identifier for your database
-   **Backup Settings**: Configure backup frequency and retention
-   **Sync Settings**: Control automatic sync behavior
-   **Conflict Resolution**: Choose resolution strategies

## Troubleshooting

### 1. Data Loss Prevention

-   **Always backup before major changes**
-   **Check backup integrity regularly**
-   **Monitor sync status in plugin settings**

### 2. Common Issues

#### Sync Failures

-   Check file permissions in Obsidian vault
-   Ensure sufficient disk space
-   Verify vault is not in read-only mode

#### Conflict Resolution

-   Review conflict logs in plugin settings
-   Manual resolution available for complex conflicts
-   Backup before manual interventions

#### Performance Issues

-   Large datasets may slow initial sync
-   Consider data cleanup for old records
-   Monitor IndexedDB size

### 3. Recovery Procedures

#### Corrupted Data

1. Restore from latest backup
2. If backup is corrupted, try earlier backup
3. As last resort, start with fresh database

#### Missing Files

1. Check if files were moved or deleted
2. Restore from backup
3. Recreate missing folder structure

## Benefits

### 1. Data Control

-   Complete control over your data
-   No dependency on external cloud services
-   Data stays within your Obsidian vault

### 2. Privacy

-   No data transmitted to external servers
-   Local-only storage and processing
-   Enhanced privacy protection

### 3. Reliability

-   Works offline without internet connection
-   No cloud service outages affecting functionality
-   Local backup and recovery options

### 4. Performance

-   Faster data access (no network latency)
-   Reduced bandwidth usage
-   Better performance on slow connections

### 5. Cost

-   No cloud service fees
-   No storage limits (except local disk space)
-   No usage-based pricing

## Future Enhancements

### 1. Multi-Device Sync

-   Manual file-based sync between devices
-   Git-based version control integration
-   Cloud storage integration (optional)

### 2. Advanced Conflict Resolution

-   Visual conflict resolution interface
-   Custom conflict resolution rules
-   Conflict history and audit trail

### 3. Enhanced Backup

-   Encrypted backups
-   Cloud backup integration
-   Automated backup scheduling

### 4. Data Analytics

-   Usage statistics and analytics
-   Data health monitoring
-   Performance optimization recommendations

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review plugin logs for error details
3. Create backup before attempting fixes
4. Contact plugin support with detailed information

## Migration Checklist

-   [ ] Plugin updated to latest version
-   [ ] Automatic migration completed successfully
-   [ ] Data verified in plugin interface
-   [ ] Initial backup created and validated
-   [ ] Settings configured to preferences
-   [ ] Tested basic operations (create, read, update, delete)
-   [ ] Verified conflict resolution works
-   [ ] Confirmed backup/restore functionality
-   [ ] Checked performance with existing data
-   [ ] Documented any custom configurations

## Rollback Plan

If you need to rollback to Dexie Cloud:

1. Export current data to JSON
2. Reinstall previous plugin version
3. Import data into Dexie Cloud
4. Verify data integrity
5. Test cloud sync functionality

**Note**: Rolling back will lose any local-only features and conflict resolution history.
