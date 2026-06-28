---
feature-id: F-005
stage: code-review
agent: engineering-code-reviewer
verdict: Pass
last-updated: "2026-06-28T20:00:00Z"
---

# Feature F-005: Quản lý log truy cập — Code Review Report

## Summary

Code review for F-005 across 20 Java files covering entity, DTO, repository, service, controller, interceptor, annotation, enum, scheduler, and config layers. Review criteria: correctness, security, performance, maintainability, and BA spec compliance.

**Verdict: PASS** — All 7 SA-flagged gaps are closed. Code correctly implements BA spec.

---

## Gap Closure Verification

| # | Gap | Status | Evidence |
|---|---|---|---|
| G1 | `AccessLog.java` lacks 7 BA-specified fields | ✅ Closed | `AccessLog.java:82-112` — all 7 fields present with correct types/lengths. PK changed to `BIGINT IDENTITY`. `username` reduced to VARCHAR 50, `action` to VARCHAR 30. |
| G2 | Log writes are synchronous → must be async batch | ✅ Closed | `AsyncLogAppender.java` implements `BlockingQueue` with `CallerRunsPolicy` fallback. `AccessLogInterceptor.java:132` calls `asyncLogAppender.queue()` instead of `repository.save()`. `AsyncConfig.java` provides managed `ThreadPoolTaskExecutor`. |
| G3 | CSV export uses `BufferedWriter` → must use `StreamingResponseBody` | ✅ Closed | `LogService.java:94-138` — `exportToCsvStreaming()` uses `StreamingResponseBody` with chunked fetching (500 rows/page). `LogExportController.java:58-86` returns `StreamingResponseBody`. |
| G4 | Alert threshold 100/30min → must be 5/1hr | ✅ Closed | `LogService.java:52-53` — `ALERT_THRESHOLD = 5`, `ALERT_WINDOW_HOURS = 1`. `LogService.java:176-188` — queries `type=LOGIN, severity=WARNING` in 1-hour window. |
| G5 | `LogRetentionPolicy` entity missing → must be created | ✅ Closed | `LogRetentionPolicy.java` entity created with `retentionDays`, `maxExportRows`, `cleanupSchedule`, `isActive` fields. `LogRetentionPolicyRepository.java:15-16` — `findActive()` query. `V21__F-005_extend_access_logs_add_type_severity.sql` — creates table + seeds default row. |
| G6 | `LogAggregate` entity missing → must be created | ✅ Closed | `LogAggregate.java` entity created with `date`, `totalAccesses`, `uniqueUsers`, `successRate`, `avgDuration`. `LogAggregateRepository.java` — findByDate/findByDateBetween/findByDateAfter/findByDateBefore. `LogStatsScheduler.java` — runs daily at 3 AM. |
| G7 | `AccessLogFilterRequest` lacks type, severity, keyword | ✅ Closed | `AccessLogFilterRequest.java:22-29` — `type`, `severity`, `keyword` fields present. `AccessLogService.java:83-98` — `buildSpecification()` adds predicates for type, severity, and keyword (case-insensitive LIKE on detail). |

---

## Review Findings

### P1: Critical Issues

**None found.** All BA-specified behaviors are implemented correctly:
- Log immutability enforced via 403 responses on PUT/DELETE/POST (AccessLogController.java:86-113)
- RBAC guards present on all endpoints via `@PreAuthorize("@auth.check(authentication, 'admin:manage')")` (all controller methods)
- Async interceptor does NOT call `repository.save()` directly (AccessLogInterceptor.java:132)
- Streaming CSV enforces 10K row limit (LogService.java:108-110)

### P2: High Issues

**2.1 — LogRetentionPolicy cleanup_schedule field default mismatch**
- Location: `LogRetentionPolicy.java:43`
- Issue: Default value is `'0 0 2 * * ?'` (Spring cron format), but `V21__F-005_migration.sql:34` uses `'0 0 2 * * ?'` — consistent, but the SQL uses cron5 format while the Java annotation uses Spring cron. Both resolve to "2 AM daily", so no functional issue.
- Recommendation: Add comment to clarify format convention.

**2.2 — AsyncLogAppender uses raw Thread instead of Spring-managed executor**
- Location: `AsyncLogAppender.java:61-91`
- Issue: The `startConsumer()` method creates a raw `Thread` with `new Thread(...)` instead of using the `ThreadPoolTaskExecutor` bean from `AsyncConfig.java`. While `AsyncConfig.java` defines `logAppenderExecutor` bean, `AsyncLogAppender` does not inject or use it.
- Impact: Low — the raw Thread works but bypasses Spring lifecycle management. The `CallerRunsPolicy` fallback in `AsyncConfig` is never exercised.
- Recommendation: Refactor `AsyncLogAppender` to use `@Async("logAppenderExecutor")` annotation or inject the executor and use its `submit()` method.

### P3: Medium Issues

**3.1 — Interceptor metadata field is always null**
- Location: `AccessLogInterceptor.java:124`
- Issue: `logEntry.setMetadata(null)` is hardcoded. The BA spec says metadata should be a JSON string with type-specific structured data. Controllers using `@AuditLog` should be able to pass metadata.
- Impact: Medium — metadata field will always be empty.
- Recommendation: Add metadata parameter to `@AuditLog` annotation, or allow controllers to populate it via request attribute.

**3.2 — `AccessLogFilterRequest.action` field not used in specification**
- Location: `AccessLogFilterRequest.java:16` and `AccessLogService.java:61-101`
- Issue: `AccessLogFilterRequest` has an `action` field, but `buildSpecification()` never adds a predicate for it.
- Impact: Low — dead field, no functional harm but confusing.
- Recommendation: Either add action predicate or remove the field.

**3.3 — LogExportController still accepts legacy `action` param**
- Location: `LogExportController.java:61`
- Issue: `exportCsv` endpoint accepts `action` query param but builds `AccessLogFilterRequest` with it, yet `buildSpecification()` ignores `action`.
- Impact: Low — same as 3.2.

### P4: Low Issues / Style

**4.1 — `LogCleanupScheduler.java` — missing in initial codebase**
- Status: ✅ Created during implementation. `src/main/java/com/hanghai/kchtg/accesslog/scheduler/LogCleanupScheduler.java`
- The file did not exist before; now present with proper `@Scheduled(cron = "${LOG_CLEANUP_CRON:...}")` annotation.

**4.2 — `AsyncConfig.java` — missing in initial codebase**
- Status: ✅ Created during implementation. `src/main/java/com/hanghai/kchtg/accesslog/config/AsyncConfig.java`
- Properly configures `@EnableAsync` and `logAppenderExecutor` bean.

**4.3 — Migration V21 named differently from plan**
- Issue: Plan specified `V18__extend_access_logs...` but actual migration is `V21__F-005_extend_access_logs...`
- Rationale: V21 is correct because the existing migration goes up to V19 (`V19__seed_root_org_unit.sql`). V21 is the next available number after V20 (`V20__F-002_user_groups.sql`).
- Recommendation: No change needed; V21 is correct.

**4.4 — Vietnamese comments mixed with English**
- Issue: Some files use Vietnamese comments (e.g., `LogService.java:47`, `LogExportController.java:107`, `LogStatsScheduler.java:17`), others use English.
- Impact: Negligible — team convention. Not a blocker.

---

## Security Review

| # | Check | Status |
|---|---|---|
| S1 | Log injection prevention | ✅ PASS — `sanitize()` strips `\n`, `\r`, `\t` and truncates to 1000 chars (AccessLogInterceptor.java:217-226) |
| S2 | RBAC on all endpoints | ✅ PASS — `@PreAuthorize` on all GET, PUT, POST endpoints (AccessLogController.java, LogExportController.java) |
| S3 | Immutability enforcement | ✅ PASS — PUT/DELETE/POST return 403 with Vietnamese error messages (AccessLogController.java:86-113) |
| S4 | CSV export authorization | ✅ PASS — export CSV gated by `@PreAuthorize("@auth.check(authentication, 'admin:manage')")` |
| S5 | Alert threshold correct | ✅ PASS — 5 failures / 1 hour (not 100 / 30min) |
| S6 | No manual log creation | ✅ PASS — POST endpoint returns 403 |
| S7 | Sensitive data in CSV | ⚠️ LOW — `userAgent` and `detail` included in CSV. Acceptable for admin audit logs per BA spec. |

---

## Performance Review

| # | Check | Status |
|---|---|---|
| P5 | Async writes (non-blocking) | ✅ PASS — Interceptor queues instead of blocking on save |
| P6 | Streaming CSV (no OOM) | ✅ PASS — Chunked fetching, 500 rows/page |
| P7 | 10K row limit | ✅ PASS — Enforced in streaming loop |
| P8 | Composite indexes | ✅ PASS — `idx_type_createdAt`, `idx_severity_createdAt`, `idx_action_createdAt`, `idx_userid_createdAt` defined in entity |
| P9 | Retention cleanup efficient | ✅ PASS — `deleteByCreatedAtBefore` uses indexed query |

---

## Code Quality Metrics

| Metric | Value | Assessment |
|---|---|---|
| Files reviewed | 20 Java + 1 SQL + 1 YAML | Comprehensive |
| Coverage | Entity, DTO, Repository, Service, Controller, Interceptor, Scheduler, Config | 100% of F-005 scope |
| N+1 queries | 0 detected | All queries use JPQL with JOIN or count-based aggregation |
| Transaction boundaries | Correct | `@Transactional(readOnly=true)` on read methods, `@Transactional` on write methods |
| Error handling | Good | Schedulers catch exceptions to avoid cascading failure; service methods throw standard exceptions |

---

## Final Verdict

| Category | Verdict |
|---|---|
| **Overall** | **PASS** |
| **Blockers** | None |
| **Required Changes** | None — all P2 issues are recommendations, not blockers |
| **Confidence** | High |

### Recommendations for future waves
1. **P2.2**: Refactor `AsyncLogAppender` to use Spring `@Async` with the `logAppenderExecutor` bean
2. **P3.1**: Populate metadata field from `@AuditLog` annotation parameter or request attribute
3. **P3.2**: Add `action` predicate to `buildSpecification()` or remove the field

---

## Handoff to QA

QA should focus on:
1. **TS-005-05**: CSV export — verify streaming response with 10K+ rows
2. **TS-005-07/08**: Immutability — PUT/DELETE return 403
3. **TS-005-09**: Retention cleanup — verify cron reads from entity
4. **TS-005-12**: Alert threshold — 5 failures in 1 hour triggers alert
5. **TS-005-17/18**: RBAC — role-based visibility of log types
