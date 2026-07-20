# Code Review Verdict: F-280 - Sao luu CSDL tu dong

## Overall: **Fail** needs-fix

**Reviewer:** engineering-code-reviewer
**Date:** 2026-06-26T00:00:00Z
**Confidence:** high

---

## Quality Scores (1-10)

| Criteria        | Score | Notes |
|-----------------|-------|-------|
| Architecture    | 7     | Service handles backup logic with Strategy pattern for H2/PostgreSQL; but backup is synchronous with ProcessBuilder blocking; no async or queue |
| Code Quality    | 6     | Hardcoded JDBCPASSWORD via env var; PostgreSQL parsing fragile; error handling inconsistent (record saved even on partial failure); H2 SCRIPT/RUNSCRIPT may lose data |
| Testing         | 5     | 3 tests only — covers H2 backup, H2 restore success, restore failure. No PostgreSQL tests, no scheduledBackup test, no cleanup test, no disk-IO tests |
| Security        | 3     | Database password passed as `PGPASSWORD` env var to pg_dump/pg_restore processes — visible in process list; no encryption at rest for backup files |

---

## Files Reviewed (5)

### Entity — DatabaseBackup
- `id` (UUID, @GeneratedValue AUTO), `filename`, `filePath` (Length 500), `fileSize` (Long), `backupType` (MANUAL/AUTOMATIC), `status` (SUCCESS/FAILED), `errorDetail` (Length 4000), `createdAt`
- No soft-delete, no checksum/hash for integrity verification

### DTO — BackupResponse
- Maps from DatabaseBackup entity with same fields; enum values converted via `.name()`

### Repository — DatabaseBackupRepository
- `findAllByOrderByCreatedAtDesc()` — minimal, no pagination

### Service — BackupService (249 lines)
- `performBackup(BackupType)` — creates record with FAILED default, attempts backup, updates size/status on success, saves record, calls cleanup
- `restoreBackup(UUID)` — validates record exists and SUCCESS, checks file exists, runs H2/PostgreSQL restore
- `getAllBackups()` — returns all ordered by createdAt desc
- `backupH2(String)` — `jdbcTemplate.execute("SCRIPT TO '...'")`
- `restoreH2(String)` — `jdbcTemplate.execute("RUNSCRIPT FROM '...'")`
- `backupPostgres(String)` — ProcessBuilder pg_dump with -F c (custom format), -b (blobs), PGPASSWORD env
- `restorePostgres(String)` — ProcessBuilder pg_restore with -c (clean), -v (verbose), PGPASSWORD env
- `cleanupOldBackupFiles()` — filters SUCCESS backups sorted desc, deletes oldest beyond retentionCount, also deletes DB record
- `scheduledBackup()` — `@Scheduled(cron = "${cron.database-backup:0 0 0 * * SUN}")` weekly Sunday midnight

### Controller — BackupController (66 lines)
- `POST /api/backups` — manual trigger, @AuditLog(module="BACKUP", action="CREATE_BACKUP"), returns success or error response
- `GET /api/backups` — list all backups
- `POST /api/backups/{id}/restore` — restore, @AuditLog(module="BACKUP", action="RESTORE_BACKUP"), returns success or error

### Tests (1)
- BackupServiceTest — 3 tests: H2 backup success, H2 restore success, restore failure (FAILED status)

---

## Review Checklist

- [x] Entity Design: DatabaseBackup has all required fields including filename, filePath, fileSize, status, errorDetail
- [x] Repository: Simple with orderByCreatedAtDesc query
- [x] Service: Two-strategy backup (H2/PostgreSQL), cleanup retention, scheduled cron
- [x] Controller: @AuditLog on backup/restore actions, ApiResponse wrapper
- [x] Test Coverage: 3 tests — basic H2 paths covered, but insufficient for production backup/restore

---

## Findings

### Critical:

1. **Database password in process environment** — `pg_dump` and `pg_restore` receive password via `pb.environment().put("PGPASSWORD", datasourcePassword)`. This password is visible in `/proc/<pid>/environ` on Linux and `ps` output on some systems. Recommendation: Use `.pgpass` file with restricted permissions (600) instead of env var.

2. **No backup file integrity verification** — After backup completes, there's no checksum (MD5/SHA256) stored to verify backup file hasn't been corrupted. A corrupted backup would fail silently during restore. Recommendation: Compute and store file hash after backup; verify before restore.

3. **H2 RUNSCRIPT can lose all data** — `RUNSCRIPT FROM` drops everything and reloads — if the script is incomplete or interrupted, the database may be left in an inconsistent state. Recommendation: Create a snapshot backup of the H2 files before RUNSCRIPT as a safety net.

### Blocking:

1. **Test coverage insufficient for backup reliability** — Only 3 tests, all mocking the repository save but testing real file I/O. No PostgreSQL tests (pg_dump/pg_restore), no cleanup tests, no scheduledBackup test, no concurrent backup tests. Backup/restore is critical infrastructure — requires minimum 10-15 tests. Recommendation: Add tests for: backup failure handling, cleanup retention boundary, scheduledBackup trigger, restore with large file.

2. **Error handling leaves record with FAILED status but file may exist partially written** — `performBackup` creates record with FAILED on exception, but the backup file may be partially written on disk. The `cleanupOldBackupFiles` runs after save and might delete the partial file — but the DB record still exists with FAILED status pointing to a file that might be cleaned. Recommendation: Track partial files and clean them up, or add `backupFile` lifecycle management.

3. **PostgreSQL JDBC URL parsing is fragile** — `parseJdbcUrl` strips "jdbc:" prefix and parses as URI, but PostgreSQL JDBC URLs have format `jdbc:postgresql://host:port/dbname?...` — the query string with additional params would break URI parsing. Recommendation: Use proper PostgreSQL URL parsing or accept host/port/dbName as config properties.

### Major:

1. **No backup rotation/compression** — Backup files grow without compression (pg_dump -F c is custom format but not compressed). Recommendation: Add gzip compression for .sql files; consider `pg_dump -F c --compress=9` for PostgreSQL.

2. **cleanupOldBackupFiles loads ALL backups into memory** — `backupRepository.findAll()` loads every record before filtering. For large backup histories this is inefficient. Recommendation: Add pagination or count-then-fetch pattern.

3. **No notification on backup failure** — `performBackup` logs an ERROR but no alert is sent. Admin may not know a scheduled backup failed. Recommendation: Integrate with notification service on FAILED status.

### Minor:

1. **DatabaseBackup missing @EntityListeners** — Unlike `BaseEntity.java:31` which uses `@EntityListeners(AuditingEntityListener.class)` for automatic audit fields, DatabaseBackup sets `createdAt` manually via field initializer `private LocalDateTime createdAt = LocalDateTime.now();`. This is non-standard and does not auto-update on persistence events.

2. **Backup filename has no uniqueness guarantee** — `db_backup_YYYYMMdd_HHmmss.dump` is timestamp-based; rapid successive manual triggers could collide. Recommendation: Add UUID suffix.

3. **No backup metadata table** — No table to store backup metadata like source database name, size before/after, duration. Recommendation: Add `backupDuration` field.

---

## Verdict Justification

**FAIL** — The backup/restore implementation has fundamental security risks (password exposure), insufficient test coverage for critical infrastructure code, and error handling gaps that could leave the system in an inconsistent state. The architecture is reasonable but needs significant testing and security hardening before production use.

---

## Recommendation

**REJECT** — Must fix: (1) Replace env var password with .pgpass, (2) Add integrity checksum, (3) Add comprehensive test suite (minimum 10 tests), (4) Fix partial file handling, (5) Fix PostgreSQL URL parsing. Address these before re-submission.

---

## Sign-off

Code-Reviewer: engineering-code-reviewer
Date: 2026-06-26
Status: REJECTED
