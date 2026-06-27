# Code Review Verdict: F-281 - Phuc hoi du lieu

## Overall: **Fail** needs-fix

**Reviewer:** engineering-code-reviewer
**Date:** 2026-06-26T00:00:00Z
**Confidence:** high

---

## Quality Scores (1-10)

| Criteria        | Score | Notes |
|-----------------|-------|-------|
| Architecture    | 5     | Restore logic is embedded in BackupService.restoreBackup() — same class as backup. No RPO/RTO design; no point-in-time recovery |
| Code Quality    | 5     | Basic restore with H2/PostgreSQL paths; checks file exists; no rollback on partial failure; no transaction boundary on restore |
| Testing         | 3     | 1 test (restore failure on FAILED status); no success-path test, no file-not-found test, no H2/PostgreSQL specific tests |
| Security        | 4     | Restores run with same DB credentials as backup; no integrity check before restore; no confirmation/review step |

---

## Files Reviewed (shared with F-280)

### Service — BackupService.restoreBackup(UUID)
- Finds record by ID, throws IllegalArgumentException if not found
- Validates status == SUCCESS, throws if not
- Checks file exists on disk, throws IllegalArgumentException if missing
- Routes to restoreH2() or restorePostgres() based on datasource URL
- Catches exceptions, wraps in RuntimeException with message
- No pre-restore verification (checksum, backup integrity)
- No post-restore verification (row counts, table existence)
- No transaction boundary for the restore operation

### Controller — BackupController.restore(UUID)
- `POST /api/backups/{id}/restore` — calls backupService.restoreBackup(id)
- Catches all exceptions, returns 400 with error message
- @AuditLog(module="BACKUP", action="RESTORE_BACKUP")
- No PreAuthorize (only controller-level ROLE_SYSTEM_ADMIN)

### Feature Brief — F-281
- Description: "Phuc hoi du lieu <= 8 gio" (Restore data within 8 hours)
- Business intent: same as description
- Acceptance criteria: "Phuc hoi thanh cong trong <= 8 gio"
- Status: proposed (not implemented yet)
- No entities, business rules, or testing strategy defined

---

## Review Checklist

- [x] Restore triggers on backup record (find by ID, validate SUCCESS status)
- [x] File existence check before restore
- [x] H2 and PostgreSQL restore paths exist
- [x] @AuditLog on restore action
- [ ] RPO/RTO requirements addressed (feature brief says <= 8 hours, no code validates this)
- [ ] No entity or detailed design for F-281 (feature-brief.md is minimal)
- [ ] No dedicated test class for F-281 restore scenarios

---

## Findings

### Critical:

1. **No data integrity verification before restore** — `restoreBackup` does not verify backup file integrity (no checksum/hash). A corrupted backup would overwrite live data with garbage. Recommendation: Store SHA256 checksum after backup; verify before restore; abort if mismatch.

2. **No rollback mechanism** — If restore fails midway (e.g., pg_restore fails at 50%), the database is left in a partially restored, inconsistent state. Recommendation: For PostgreSQL, use a staging database for restore, then swap; for H2, create snapshot before RUNSCRIPT.

3. **No point-in-time recovery** — Feature brief requires "phục hồi <= 8 giờ" (RPO of 8 hours), but there's no mechanism to restore to a specific point in time — only the latest backup. Recommendation: Implement incremental backups or transaction log backup for PITR.

### Blocking:

1. **Feature brief is not implemented** — F-281 status is `proposed` with no detailed design, entities, or business rules. The restore logic exists in BackupService but there is no dedicated F-281 implementation. The brief mentions "phục hồi <= 8 giờ" RPO but there's no code enforcing or tracking this requirement. Recommendation: Complete the feature brief with entities, RPO/RTO tracking, and restore-to-time-point logic.

2. **No test coverage for F-281** — BackupServiceTest has 1 test for restore (failure case), but no test for: successful restore, file-not-found handling, PostgreSQL restore, H2 restore with data verification. Recommendation: Minimum 5 tests for restore scenarios.

3. **No RPO compliance tracking** — There is no mechanism to track when the last successful backup was, or to alert if the backup window exceeds 8 hours. Recommendation: Add `lastBackupTimestamp` tracking with alert on stale backup.

### Major:

1. **Restore is a destructive operation with no confirmation** — `POST /api/backups/{id}/restore` executes immediately without any confirmation or dry-run option. Recommendation: Add a two-step process: (1) `GET /backups/{id}/restore/preview` for validation, (2) `POST /backups/{id}/restore` with confirmation token.

2. **No backup versioning** — Only the latest backup is kept (retention count). If the latest backup is corrupted, there's no fallback. Recommendation: Keep at least 2 consecutive backups.

### Minor:

1. **restoreBackup throws RuntimeException on failure** — Controller catches and returns 400. The RuntimeException wrapping loses the original stack trace in some cases. Recommendation: Use a custom `RestoreFailedException` with error code.

2. **No post-restore verification** — After restore completes, there's no check that the database is healthy (table counts, row counts, etc.). Recommendation: Run a simple verification query after restore.

---

## Verdict Justification

**FAIL** — F-281 is in `proposed` status with minimal feature brief. The existing restore logic in BackupService lacks integrity verification, rollback capability, and any RPO tracking. This is critical infrastructure code that cannot be approved in its current state.

---

## Recommendation

**REJECT** — Must: (1) Complete F-281 feature brief with full design, (2) Add backup integrity checksum, (3) Implement pre-restore verification and post-restore health check, (4) Add RPO compliance tracking (8-hour window), (5) Add comprehensive test suite. Address before re-submission.

---

## Sign-off

Code-Reviewer: engineering-code-reviewer
Date: 2026-06-26
Status: REJECTED
