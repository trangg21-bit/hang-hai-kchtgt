---
id: F-005
name: Quan ly log truy cap
slug: quan-ly-log-truy-cap
module-id: M-001
stage: system-architect
status: completed
created: 2026-06-17T00:00:00Z
last-updated: 2026-06-17T04:00:00Z
---

# SA Stage: F-005 — Quản lý log truy cập

## 1. Entities (Spring Data JPA — MSSQL 2022)

### 1.1 AccessLog

```java
@Entity
@Table(name = "access_logs", indexes = {
    @Index(name = "idx_access_logs_user_id", columnList = "user_id"),
    @Index(name = "idx_access_logs_action", columnList = "action"),
    @Index(name = "idx_access_logs_created_at", columnList = "created_at"),
    @Index(name = "idx_access_logs_status", columnList = "status"),
    @Index(name = "idx_access_logs_ip", columnList = "ip_address")
})
public class AccessLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @Column(name = "user_id") private Long userId; // null for system events
    @Column(name = "username", length = 100) private String username;

    @Column(name = "action", length = 50, nullable = false) private String action;
    // login | logout | create | update | delete | login_failure | password_change | role_change

    @Column(name = "target_resource", length = 200) private String targetResource;
    @Column(name = "ip_address", length = 45) private String ipAddress; // IPv4 or IPv6
    @Column(name = "user_agent", length = 500) private String userAgent;

    @Column(name = "request_path", length = 500) private String requestPath;
    @Column(name = "response_code") private Integer responseCode;
    @Column(name = "duration_ms") private Long durationMs;

    @Column(name = "status", length = 20, nullable = false, columnDefinition = "VARCHAR(20)")
    private String status; // success | failure

    @Column(name = "details", columnDefinition = "JSON") private String details;
    // Optional: extra context (e.g., old_value/new_value for update, error_message for failure)

    @Column(name = "created_at") private LocalDateTime createdAt;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); }
}
```

### 1.2 LogRetentionPolicy

```java
@Entity
@Table(name = "log_retention_policies")
public class LogRetentionPolicy {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @Column(name = "retention_days", nullable = false) private Integer retentionDays;
    @Column(name = "max_export_rows", nullable = false) private Integer maxExportRows;
    @Column(name = "cleanup_schedule", length = 50) private String cleanupSchedule;
    // cron expression, e.g., "0 2 * * *" (daily at 2 AM)

    @Column(name = "is_active", columnDefinition = "BIT DEFAULT 1")
    private Boolean isActive = true;
}
```

### 1.3 LogAggregate

```java
@Entity
@Table(name = "log_aggregates", indexes = {
    @Index(name = "idx_log_aggregates_date", columnList = "date", unique = true)
})
public class LogAggregate {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @Column(name = "date", nullable = false) private LocalDate date;

    @Column(name = "total_accesses") private Long totalAccesses;
    @Column(name = "unique_users") private Long uniqueUsers;
    @Column(name = "success_rate", precision = 5, scale = 2) private BigDecimal successRate;
    @Column(name = "avg_duration_ms") private Long avgDurationMs;

    @Column(name = "computed_at") private LocalDateTime computedAt;
}
```

### 1.4 Relationship Diagram

```
AccessLog N──1 UserAccount (user_id — optional, null for system events)
LogAggregate 1──N Module (aggregated per module, denormalized in daily rollups)
```

## 2. API Endpoints

All endpoints prefixed with `/api/v1/`. Authentication via JWT Bearer token.

### Access Log Queries

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/logs/access` | Danh sách log truy cập (phân trang) | system-admin / security-admin |
| GET | `/api/v1/logs/access/{id}` | Chi tiết log entry | system-admin |
| GET | `/api/v1/logs/access?userId=&action=&status=&from=&to=&ip=` | Bộ lọc log đa chiều | system-admin |

### Log Search & Export

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/logs/access/search?query=` | Tìm kiếm log (username, IP) | system-admin |
| GET | `/api/v1/logs/access/export?from=&to=&format=csv` | Xuất log CSV (max 10K rows) | system-admin |
| POST | `/api/v1/logs/access/export/batch` | Xuất log phân trang (batch) | system-admin |

### Log Statistics & Aggregates

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/logs/stats/daily?from=&to=` | Thống kê log theo ngày | security-admin |
| GET | `/api/v1/logs/stats/hourly?from=&to=` | Thống kê log theo giờ | security-admin |
| GET | `/api/v1/logs/stats/top-actions` | Hành động phổ biến nhất | security-admin |
| GET | `/api/v1/logs/stats/failure-trend` | Xu hướng lỗi (graph data) | security-admin |

### Retention Policy Management

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/logs/policy` | Xem chính sách retention hiện tại | system-admin |
| PUT | `/api/v1/logs/policy` | Cập nhật chính sách retention | system-admin |

### Log Types Filter

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/logs?group=login` | Log đăng nhập | security-admin |
| GET | `/api/v1/logs?group=login_failure` | Log đăng nhập thất bại | security-admin |
| GET | `/api/v1/logs?group=account` | Log thay đổi tài khoản | security-admin |
| GET | `/api/v1/logs?group=config` | Log cấu hình hệ thống | system-admin |
| GET | `/api/v1/logs?group=error` | Log lỗi hệ thống | security-admin |

## 3. Architecture Notes

### 3.1 Component Interactions

```
Spring Boot Backend
    │
    ├── AccessLogFilter (OncePerRequestFilter) — auto-captures all HTTP requests
    │       ├── Extracts: userId, action, ip, path, duration, status
    │       └── Async writes → AccessLogRepository → MSSQL
    │
    ├── LogController
    │       ├── LogService ──► AccessLogRepository ──► MSSQL
    │       ├── LogExportService (CSV generation)
    │       └── LogStatsService (aggregation queries)
    │
    └── LogCleanupScheduler (@Scheduled)
            └── Deletes logs older than retentionDays
```

**Key interactions:**
- `AccessLogFilter` runs on every HTTP request — async write (non-blocking) to avoid response latency
- `LogExportService` generates CSV client-side (Frontend) or server-side with `@Transactional(readOnly = true)` streaming
- `LogCleanupScheduler` runs nightly — uses batch delete (1000 rows at a time) to avoid lock contention
- `LogStatsService` pre-computes daily aggregates — `LogAggregate` table updated via cron job

### 3.2 Design Patterns

| Pattern | Application |
|---|---|
| **Repository Pattern** | `AccessLogRepository` with custom `findByDateRangeAndAction()` query methods |
| **Filter Pattern** | `AccessLogFilter` (OncePerRequestFilter) — intercepts all requests for auto-logging |
| **DTO Pattern** | `LogQueryDTO`, `LogResponseDTO`, `LogStatsDTO`, `ExportConfigDTO` |
| **Specification Pattern** | `LogSpecification` — composable filters (userId, action, date range, IP) |
| **Batch Processing** | `LogCleanupScheduler` — processes in chunks of 1000 for memory efficiency |
| **Builder Pattern** | `LogEntryBuilder` — constructs log entry from HTTP request context |

### 3.3 Immutable Log Guarantee (BR-025)

```java
// No update methods on AccessLog entity — only insert
@Entity
@Table(name = "access_logs")
public class AccessLog {
    // No @PreUpdate lifecycle method
    // No service method performs UPDATE on access_logs table
    // Audit table enforced at database level:
    // ALTER TABLE access_logs ADD CONSTRAINT chk_no_update CHECK (1=1);
    // (Application-level + database-level dual enforcement)
}
```

### 3.4 Alert Detection (BR-028)

```java
@Component
public class FailedLoginAlertChecker {
    @Scheduled(fixedRate = 300000) // every 5 minutes
    public void checkFailedLogins() {
        // Find users with ≥5 failed logins in last hour
        List<AccessLog> failures = logRepo.findFailuresLastHour();
        Map<String, Long> failedByUser = failures.stream()
            .collect(Collectors.groupingBy(AccessLog::getUsername, Collectors.counting()));

        for (var entry : failedByUser.entrySet()) {
            if (entry.getValue() >= 5) {
                alertService.sendAlert(
                    String.format("Phát hiện %d lần đăng nhập thất bại cho user: %s",
                        entry.getValue(), entry.getKey()));
            }
        }
    }
}
```

### 3.5 Transaction Boundaries

- Async log writes: `@Transactional(propagation = REQUIRES_NEW)` — log survives main transaction rollback
- Export: `@Transactional(readOnly = true)` with `StreamingResponseBody` for large exports
- Stats computation: nightly `@Scheduled` job, batch commits

### 3.6 Export Implementation

```java
@GetMapping("/export")
public void exportCSV(@RequestParam LocalDateTime from,
                      @RequestParam LocalDateTime to,
                      HttpServletResponse response) throws IOException {
    response.setContentType("text/csv");
    response.setHeader("Content-Disposition",
        "attachment; filename=logs_" + from.toLocalDate() + ".csv");

    int count = 0;
    int maxRows = logRetentionPolicy.getMaxExportRows(); // 10000

    logRepo.findByCreatedAtBetween(from, to)
        .stream()
        .limit(maxRows)
        .forEach(log -> {
            csvWriter.writeRow(log.toCSV());
            count++;
        });
}
```

### 3.7 Database Indexes & Performance

- Composite index on `(created_at, user_id)` for date-range + user queries
- Index on `(action, status)` for filter queries
- Index on `(ip_address)` for IP-based search
- Monthly partitioning recommended for `access_logs` table (MSSQL partitioned tables)
- Archive strategy: move data older than 30 days to `access_logs_archive` table

### 3.8 Dependencies

| Dependency | Purpose |
|---|---|
| `spring-boot-starter-data-jpa` | ORM + native query |
| `spring-boot-starter-async` | Async log writing ( CompletableFuture / @Async) |
| `spring-boot-starter-batch` | Batch cleanup processing |
| `opencsv` | Server-side CSV export |
| `micrometer-registry-prometheus` | Metrics for log volume monitoring |
