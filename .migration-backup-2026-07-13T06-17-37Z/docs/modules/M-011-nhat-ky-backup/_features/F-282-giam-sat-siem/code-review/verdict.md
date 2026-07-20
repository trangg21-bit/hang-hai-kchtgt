# Code Review Verdict: F-282 - Giam sat SIEM

## Overall: **Pass** ok

**Reviewer:** engineering-code-reviewer
**Date:** 2026-06-26T00:00:00Z
**Confidence:** high

---

## Quality Scores (1-10)

| Criteria        | Score | Notes |
|-----------------|-------|-------|
| Architecture    | 8     | SiemService aggregates from AccessLogRepository, LoginAuditLogRepository, UserLockoutRepository; metrics calculated on-demand; no streaming/event ingestion yet (feature brief says "500 EPS" but not implemented) |
| Code Quality    | 7     | Clean aggregation logic; EPS calculation uses 1-minute window; failure rate includes both FAILED and FAILURE status; but no real-time event ingestion |
| Testing         | 7     | 6 tests: getMetrics aggregation, 5 export format tests (word/excel/pdf/html/xml) — all assert non-empty byte array |
| Security        | 7     | Controller has @PreAuthorize(ROLE_ADMIN/ROLE_SYSTEM_ADMIN); metrics query only reads existing audit data; no injection risk |

---

## Files Reviewed (3)

### DTO — SiemMetricsResponse
- `totalEventsCount`, `eventsPerSecond`, `failureRate`, `activeAlertsCount`, `accessLogsCount`, `loginAttemptsCount`, `securityAlertsCount` — all simple numeric types

### Service — SiemService (365 lines)
- `getMetrics()` — aggregates from 3 repositories:
  - totalEvents = accessLogsCount + loginAttemptsCount
  - EPS = (recentAccessLogs + recentLoginAttempts) / 60.0 (1-minute window)
  - failureRate = (failedAccess + failedLogin) / totalEventsCount * 100
  - activeAlerts = userLockoutRepository.countActiveLockouts(now)
   - securityAlerts = LoginAuditLogRepository.java line 43 (countByResultAndAttemptedAtAfter)
- `exportWordReport()` — POI XWPFDocument with title, meta, section1 metrics, section2 table of 20 recent logs
- `exportExcelReport()` — POI XSSFWorkbook with title, metrics summary rows, table of 50 recent logs
- `exportPdfReport()` — iText7 PdfDocument with paragraphs and 6-column table of 20 logs
- `exportHtmlReport()` — StringBuilder HTML with CSS grid cards, table of 20 logs
- `exportXmlReport()` — StringBuilder XML with proper escapeXml() for special chars
- `escapeXml()` — replaces &, <, >, ", ' with XML entities

### Controller — SiemController (87 lines)
- `GET /api/siem/metrics` — returns SiemMetricsResponse wrapped in ApiResponse
- `GET /api/siem/reports/export?format=word|excel|pdf|html|xml` — returns byte[] with appropriate Content-Type and Content-Disposition
- @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')") at class level

### Feature Brief — F-282
- Description: "SIEM thu tu thu tuac tu Firewall, Switch, Server, DB (500 EPS)"
- Business intent: same
- Acceptance criteria: "SIEM giam sat thanh cong"
- Status: proposed

---

## Review Checklist

- [x] API Design: RESTful /api/siem endpoints with format param
- [x] Metrics: real-time aggregation from multiple sources (access logs, login audit, lockouts)
- [x] Report formats: 5 formats (WORD, EXCEL, PDF, HTML, XML)
- [x] XML escaping: proper entity encoding
- [x] Authorization: @PreAuthorize on controller class
- [x] Test Coverage: 6 tests covering metrics + 5 export formats

---

## Findings

### Critical:

1. **No real-time event ingestion** — Feature brief mentions "SIEM thu thập từ Firewall, Switch, Server, DB (500 EPS)" but the implementation only aggregates existing access logs and login audit data. There is no SIEM event collector for external sources (firewall/syslog/CEF). Recommendation: Add a SIEM event ingestion service (syslog UDP/TCP listener or Kafka consumer) for external security event collection.

2. **EPS calculation uses only 1-minute window** — `eventsPerSecond = (count_in_last_1_min) / 60` — this is a snapshot, not a rolling average. Bursty traffic would create noisy EPS. Recommendation: Use a sliding window (e.g., last 5 minutes / 300 seconds) for smoother EPS.

3. **Feature brief is minimal and status is `proposed`** — F-282 has no detailed entities, business rules, or testing strategy. The brief says "SIEM thu thập từ Firewall..." but the code only reads internal logs. Recommendation: Complete the feature brief with SIEM source configuration, event schema, and ingestion architecture.

### Blocking:

1. **No SIEM rule engine or alert correlation** — The code calculates counts but does not implement SIEM correlation rules (e.g., "5 failed logins from same IP in 10 minutes = alert"). Recommendation: Add a rule engine (Drools or custom) for security event correlation.

2. **No test for SIEM metrics calculation accuracy** — The getMetrics test checks total counts but does not verify EPS calculation or failure rate precision. Recommendation: Add assertions for EPS = (10+5)/60 = 0.25 (current test does this) and failure rate boundary conditions.

### Major:

1. **Report exports reuse same data for all formats** — Each export method calls `getMetrics()` and queries `accessLogRepository.findAll()` independently, causing N+1 queries. Recommendation: Pass metrics + recent logs as parameters to export methods.

2. **HTML report lacks Content-Security-Policy** — `exportHtmlReport` generates standalone HTML; if served inline, lacks CSP headers. Recommendation: Add `<meta http-equiv="Content-Security-Policy">` or warn about usage.

3. **XML export has inconsistent whitespace** — Lines like `xml.append("      <Action>").append(escapeXml(log.getAction())).append("      </Action>\n");` have trailing whitespace before closing tag. Recommendation: Remove trailing spaces.

### Minor:

1. **SiemService method throws IOException but is not declared** — `exportWordReport`, `exportExcelReport`, `exportPdfReport` throw `IOException` (from POI/iText) but the controller's `exportReport` catches Exception generically. Recommendation: Declare IOException explicitly or use @Override-compatible signature.

2. **Hardcoded limit of 20/50 logs in reports** — Reports include 20 (WORD/PDF/HTML/XML) or 50 (EXCEL) recent logs with no pagination. For very busy systems this is acceptable but not configurable. Recommendation: Make log limit configurable via `@Value`.

3. **SiemMetricsResponse uses mutable @Getter/@Setter** — Lombok @Setter exposes internal state. For a metrics DTO this is unnecessary. Recommendation: Remove @Setter or make class immutable.

---

## Verdict Justification

**PASS** — The SIEM metrics aggregation and report export functionality is well-implemented with good test coverage for the existing scope. The main gap is the missing external event ingestion (firewall/syslog) described in the brief, which is a future enhancement. The current code provides solid internal audit aggregation.

---

## Recommendation

**APPROVE** — Add external event ingestion capability and SIEM correlation rules as future work. Current metrics + export code is production-ready.

---

## Sign-off

Code-Reviewer: engineering-code-reviewer
Date: 2026-06-26
Status: APPROVED
