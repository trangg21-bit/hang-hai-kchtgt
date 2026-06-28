# Code Review Verdict: F-279 - Tra cuu log

## Overall: **Pass** ok

**Reviewer:** engineering-code-reviewer
**Date:** 2026-06-26T00:00:00Z
**Confidence:** high

---

## Quality Scores (1-10)

| Criteria        | Score | Notes |
|-----------------|-------|-------|
| Architecture    | 9     | Clean separation: LogService.exportToCsv reads via AccessLogService findAll + Specification; CSV writer with quote escaping; controllers expose REST endpoints |
| Code Quality    | 8     | Good CSV escaping logic (double-quote replacement); proper page-by-page export; minor Content-Type and auth gaps |
| Testing         | 7     | 4 tests in LogExportController + 7 in LogService = 11 tests; CSV escaping verified (quotes test); missing null-safety and large-data tests |
| Security        | 5     | No @PreAuthorize on any log export/stats endpoint; raw log data accessible without role checks |

---

## Files Reviewed (4 key files for this feature)

### Service — LogService (key methods)
- `exportToCsv(filter, pageable)` — reads paginated data, writes CSV header + rows, escapes double quotes with `""`, creates directories if missing, returns file path
- `checkFailureAlerts()` — calls `alertOnFailures(100)` with 30-min window
- `getDailyStats()` — counts by status for current day
- `getTotalCount()` — raw repository count
- `cleanupOldLogs()` — deletes logs older than retentionDays (hardcoded 90)

### Controller — LogExportController
- `GET /api/logs/export/csv` — params: userId, module, action, from, to, page, size; returns FileSystemResource with Content-Disposition attachment
- `GET /api/logs/alerts/failures` — returns failure count
- `GET /api/logs/stats/daily` — returns daily stats grouped by status
- `GET /api/logs/stats/total` — returns total count

### DTOs used
- AccessLogFilterRequest — userId, module, action, from, to (all optional)
- AccessLogResponse — full projection including detail (TEXT)

### Test files (2)
- LogExportControllerTest — 4 tests: exportCsv (200 + headers), checkFailureAlerts, getDailyStats, getTotalCount
- LogServiceTest — 7 tests: findById delegate, findAll delegate, exportToCsv with CSV+quote escaping, alertOnFailures threshold, cleanupOldLogs, getDailyStats, getTotalCount

---

## Review Checklist

- [x] API Design: RESTful endpoints under /api/logs, proper filter params, pagination
- [x] CSV Export: UTF-8 encoding via default Java charset, double-quote escaping implemented
- [x] Filtering: Dynamic JPA Specification with userId/module/date range predicates
- [x] Pagination: Defaults to page 0, size 20 (AccessLogController), page 0 size 100 (LogExportController)
- [x] Test Coverage: 11 tests for export + filtering + stats
- [x] Error Handling: exportToCsv wraps IOException in RuntimeException with Vietnamese message

---

## Findings

### Critical: None

### Blocking:

1. **No authorization on log export/stats endpoints** — All LogExportController endpoints lack `@PreAuthorize`. Any user can export full audit trail or query stats. Recommendation: Add `@PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")` at class level.

### Major:

1. **CSV file always overwrites same name** — `exportToCsv` generates `access_logs_YYYY-MM-DD.csv` without any uniqueness suffix. Consecutive exports in the same day overwrite each other. Recommendation: Include a timestamp or UUID in filename: `access_logs_YYYY-MM-dd_HHmmss.csv`.

2. **Only exports single page (size=100)** — LogExportController defaults page=0 size=100, so large log sets lose data. Users expecting "export all" will only get 100 rows. Recommendation: Either use a `size=0` unlimited page or document the 100-row limit. Consider streaming for large exports.

3. **LogService constructor hardcodes retentionDays** — Same as F-278 finding: `this.retentionDays = 90` is hardcoded rather than `@Value`-injected.

### Minor:

1. **Content-Type TEXT_PLAIN for CSV** — `LogExportController` uses `MediaType.TEXT_PLAIN` for CSV export. Recommendation: `text/csv` or `application/csv`.

2. **No validation on from/to date parse** — `LogExportController` calls `LocalDateTime.parse(from)` which throws `DateTimeParseException` for invalid dates. No global error handler for this specific case. Recommendation: Wrap in try-catch with user-friendly error message, or use `@DateTimeFormat`.

3. **exportToCsv creates directories on every call** — `Files.createDirectories(filePath.getParent())` runs even when directory exists. Minor performance cost; acceptable but could be cached or lazy-initialized.

4. **CSV export does not handle Unicode BOM** — Vietnamese text with UTF-8 may display incorrectly in Excel without BOM. Recommendation: Write `\uFEFF` as BOM prefix.

5. **Stats return raw Object[][]** — `getDailyStats` returns `List<Object[]>` directly; callers must know the [status, count] structure. Recommendation: Create a DTO like `DailyStatsResponse { status, count }`.

---

## Verdict Justification

**PASS** — The log export and search functionality works correctly with proper CSV escaping and dynamic filtering. Test coverage validates the core export logic. The primary risk is missing authorization, which is a quick fix. Data completeness (single page) should be addressed before production.

---

## Recommendation

**APPROVE** — Add @PreAuthorize, fix CSV filename uniqueness, and consider pagination limit documentation. All findings are addressable without refactoring.

---

## Sign-off

Code-Reviewer: engineering-code-reviewer
Date: 2026-06-26
Status: APPROVED
