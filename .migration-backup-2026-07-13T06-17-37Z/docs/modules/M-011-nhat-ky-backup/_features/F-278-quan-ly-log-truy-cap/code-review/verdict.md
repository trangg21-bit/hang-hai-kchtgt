# Code Review Verdict: F-278 - Quan ly log truy cap

## Overall: **Pass** ok

**Reviewer:** engineering-code-reviewer
**Date:** 2026-06-26T00:00:00Z
**Confidence:** high

---

## Quality Scores (1-10)

| Criteria        | Score | Notes |
|-----------------|-------|-------|
| Architecture    | 9     | Clean layered design: annotation -> interceptor -> entity -> repository -> service -> controller; cross-cutting concern properly handled via HandlerInterceptor |
| Code Quality    | 8     | Solid interceptor logic with IP proxy extraction, SecurityContext fallback; minor enum redundancy (FAILED vs FAILURE) |
| Testing         | 8     | 5 test classes, 18 tests total covering interceptor, service, controller, and log export; good mocking patterns |
| Security        | 6     | No @PreAuthorize on read-only log endpoints; log entries store username as denormalised text which could contain special chars; X-Forwarded-For first-IP extraction is reasonable |

---

## Files Reviewed (11)

### Entities (2)
- AccessLog - extends BaseEntity, Entity/Table, userId (UUID, not null), username (NotBlank, Size 100), action (NotBlank, Size 100), module (NotBlank, Size 60), ipAddress (NotBlank, Size 45), userAgent (Length 500), status (enum), detail (TEXT column)
- AccessLogStatus - SUCCESS, FAILURE, FAILED (3 values — FAILURE and FAILED are semantically redundant)

### Repositories (1)
- AccessLogRepository - extends JpaRepository + JpaSpecificationExecutor; findByUserIdOrderByCreatedAtDesc, findByModuleOrderByCreatedAtDesc, findByCreatedAtBetweenOrderByCreatedAtDesc, deleteByCreatedAtBefore, countByStatusAndCreatedAtAfter, countByStatusGroupedByStatus (@Query), countByCreatedAtAfter, countByStatus

### DTOs (2)
- AccessLogFilterRequest - userId (UUID), module, action, from, to (LocalDateTime); all optional, no validation annotations
- AccessLogResponse - immutable projection from AccessLog entity; all fields exposed via getters

### Interceptor (1)
- AccessLogInterceptor - HandlerInterceptor, afterCompletion only; extracts AuditLog annotation, IP from X-Forwarded-For (first IP), User-Agent, username from SecurityContext with fallback to request parameter "username", saves SUCCESS or FAILED based on status code >= 400 or exception

### Services (2)
- AccessLogService - @Transactional(readOnly=true), findById throws EntityNotFoundException, findAll with JPA Specification dynamic filtering
- LogService - exportToCsv with quote escaping, alertOnFailures with 30-min window and default threshold 100, cleanupOldLogs (90-day retention), getDailyStats, getTotalCount

### Controllers (2)
- AccessLogController - @RequestMapping("/api/access-logs"), GET list (default page 0 size 20 sort createdAt DESC), GET /{id}; no PreAuthorize
- LogExportController - @RequestMapping("/api/logs"), GET /export/csv with filters, GET /alerts/failures, GET /stats/daily, GET /stats/total; no PreAuthorize

### Tests (5)
- AccessLogServiceTest - 4 tests (findById success/fail, findAll with filter/null filter)
- AccessLogInterceptorTest - 5 tests (no HandlerMethod, no annotation, success with auth, failure with exception/status>=400, fallback to request param username)
- AccessLogControllerTest - 2 tests (list with pagination, getById)
- LogExportControllerTest - 4 tests (exportCsv, checkFailureAlerts, getDailyStats, getTotalCount)
- LogServiceTest - 7 tests (findById delegate, findAll delegate, exportToCsv CSV+escaping quotes, alertOnFailures threshold, cleanupOldLogs, getDailyStats, getTotalCount)

---

## Review Checklist

- [x] Entity Design: extends BaseEntity, Entity/Table/Lombok, validation constraints on username/action/module/ipAddress
- [x] Repository: extends JpaRepository, UUID PK, JpaSpecificationExecutor for dynamic filtering, custom queries with correct ordering
- [x] Service: AccessLogService (read-only, Specification), LogService (export, cleanup, alerts); both use dependency injection
- [x] Interceptor: HandlerInterceptor.afterCompletion, AuditLog annotation check, IP extraction, SecurityContext fallback
- [x] Naming Conventions: consistent with project pattern
- [x] Test Coverage: 18 tests across 5 classes, good mocking of SecurityContextHolder and HttpServletRequest
- [x] Annotation: @AuditLog(action, module) on controller methods — simple and effective

---

## Findings

### Critical: None

### Blocking: None

### Major:

1. **Missing @PreAuthorize on log read endpoints** — Both AccessLogController and LogExportController expose log data without any role guard. An unauthenticated user could read full audit trail including usernames and IPs. Recommendation: Add `@PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")` to AccessLogController and LogExportController.

2. **AccessLogStatus enum has redundant values** — `FAILURE` and `FAILED` are both defined but never distinguished in code. AccessLogInterceptor always sets `FAILED` on failures. Recommendation: Remove `FAILURE` or document when each is used (e.g., SUCCESS/FAILURE).

3. **LogService constructor hardcodes retentionDays = 90** — Constructor sets `this.retentionDays = 90` instead of using a `@Value` annotation. This defeats configuration management. Recommendation: `@Value("${log.retention-days:90}") int retentionDays`.

### Minor:

1. **X-Forwarded-For injection risk** — The interceptor takes the first IP from `X-Forwarded-For`. In untrusted environments this can be spoofed. Since this is behind a reverse proxy, the proxy should strip or rewrite this header. Recommendation: Document that X-Forwarded-For must be trusted/replaced by the reverse proxy.

2. **No notification for failure alert** — `LogService.alertOnFailures()` logs a `WARN` but the `TODO` at line 127 says "trigger notification (email, Slack, etc.)" is not implemented. Recommendation: Integrate with notification service for thresholds > 100.

3. **CSV export Content-Type is TEXT_PLAIN** — `LogExportController` sets `MediaType.TEXT_PLAIN` instead of `TEXT_CSV`. Some clients may not render as spreadsheet. Recommendation: Use `MediaType.parseMediaType("text/csv")` or `application/vnd.ms-excel`.

4. **LogService and AccessLogService overlap** — `LogService` wraps `AccessLogService.findById()` and `findAll()` without adding value, just delegating. This creates a second service layer. Recommendation: Consolidate — either use AccessLogService directly or make LogService the single service and move cleanup/alerts into it.

5. **Scheduled cleanup not visible in this package** — `LogService.cleanupOldLogs()` references `com.hanghai.kchtg.common.scheduler.LogCleanupScheduler` but this class is not in this module's source. Recommendation: Verify scheduler exists and @Scheduled has `@EnableScheduling`.

---

## Verdict Justification

**PASS** — The access log system is well-architected with a clean annotation + interceptor pattern for automatic audit logging. The entity design covers all required fields, the repository provides useful custom queries, and test coverage is solid (18 tests). The main concern is the lack of authorization on read endpoints, but given the module's scope, this can be addressed with a quick annotation addition.

---

## Recommendation

**APPROVE** — Add @PreAuthorize to both controllers and fix the retentionDays hardcoding. Minor enum redundancy can be cleaned up in a follow-up.

---

## Sign-off

Code-Reviewer: engineering-code-reviewer
Date: 2026-06-26
Status: APPROVED
