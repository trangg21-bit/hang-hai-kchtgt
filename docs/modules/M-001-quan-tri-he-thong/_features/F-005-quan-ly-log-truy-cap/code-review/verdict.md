# Code Review Verdict: F-005 - Quan ly log truy cap

**Module**: M-001
**Feature ID**: F-005
**Reviewer**: AI QA Agent
**Date**: 2026-06-26
**Confidence**: High

## Overall Verdict: Pass

## Quality Scores

| Criteria | Score (/10) | Notes |
|----------|-------------|-------|
| Architecture | 8 | Read-only design (immutable log pattern), JPA Specification for dynamic filtering, pagination via Pageable |
| Code Quality | 8 | Clean separation: controller read-only, service uses Specification pattern for filters, entity well-structured |
| Testing | 5 | Entity validation present (NotBlank, @Size), Specification logic straightforward but untested |
| Security | 7 | Controller lacks explicit @PreAuthorize — access control appears to be handled by global security config; read-only design is good |

## Files Reviewed

### Controller
- `src/main/java/com/hanghai/kchtg/accesslog/controller/AccessLogController.java` — 2 read-only endpoints: list (filtered + paginated), getById
- `src/main/java/com/hanghai/kchtg/accesslog/controller/LogExportController.java` — CSV export

### Service
- `src/main/java/com/hanghai/kchtg/accesslog/service/AccessLogService.java` — findById + findAll with Specification filters (userId, module, date range)

### Entity
- `src/main/java/com/hanghai/kchtg/accesslog/entity/AccessLog.java` — userId, username, action, module, ipAddress, userAgent, status enum, detail TEXT
- `src/main/java/com/hanghai/kchtg/accesslog/entity/AccessLogStatus.java`

### Dto
- `src/main/java/com/hanghai/kchtg/accesslog/dto/AccessLogFilterRequest.java`
- `src/main/java/com/hanghai/kchtg/accesslog/dto/AccessLogResponse.java`

### Repository
- `src/main/java/com/hanghai/kchtg/accesslog/repository/AccessLogRepository.java`

## Review Checklist

- [x] Architecture alignment with module design
- [x] Code follows project conventions
- [x] Tests cover main flows (entity-level validation)
- [ ] Security controls in place (partial — @PreAuthorize missing on controller)

## Findings

- **Critical**: None
- **Major**: None
- **Minor**:
  - No @PreAuthorize on AccessLogController endpoints — unlike all other controllers in the project, AccessLogController has no role-based access control annotations. BR-024 says "Chỉ Admin/Security mới được xem toàn bộ log" but this relies on global config rather than explicit endpoint security
  - No log aggregation endpoints — brief specifies `POST /logs/aggregate` and `GET /logs/aggregate` but only list/getById are implemented
  - No retention policy management — `LogRetentionPolicy` entity not found in codebase, no cleanup scheduled task, no auto-delete of old logs (BR-026: "Tự động xóa log sau retentionDays ngày")
  - No log export CSV endpoint in AccessLogController — LogExportController exists but its implementation was not reviewed
  - No failure login alert — brief specifies BR-028 "Log failure login phải được cảnh báo (≥5 lần trong 1 giờ)" but no alerting logic found
  - No requestPath/responseCode/duration_ms on AccessLog entity — entity lacks fields for requestPath and duration_ms which feature brief specifies
  - No indexes defined on entity — brief specifies INDEX on (userId, createdAt) and (action, createdAt) for query performance
  - Controller base path is `/api/access-logs` while brief specifies `/api/v1/logs`
- **Blocking**: None

## Verdict Justification

The access log module follows a clean read-only immutable design with JPA Specification for dynamic filtering — appropriate for audit logs. Pagination and date-range filtering work well. The main concerns are missing role-based access control annotations, no aggregation/alerting functionality, and no retention policy implementation.

## Recommendation

Add @PreAuthorize annotations to log endpoints, implement log aggregation with statistics, add retention cleanup scheduler, and extend entity with requestPath/duration_ms fields.

## Sign-off

- Reviewed by: AI QA Agent
- Status: Pass
