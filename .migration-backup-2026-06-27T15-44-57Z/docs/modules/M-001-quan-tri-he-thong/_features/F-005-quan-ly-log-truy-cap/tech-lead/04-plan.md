# Tech Lead Plan: F-005 — Quản lý log truy cập

## 1. Implementation Tasks

### Backend Tasks (Estimated: 2–3 days)

| # | Task | File Path | Complexity |
|---|---|---|---|
| 1.1 | Entity: `AccessLog.java` | `src/main/java/vn/eg/haihang/model/entity/AccessLog.java` | Low |
| 1.2 | Entity: `LogRetentionPolicy.java` | `src/main/java/vn/eg/haihang/model/entity/LogRetentionPolicy.java` | Low |
| 1.3 | Entity: `LogAggregate.java` | `src/main/java/vn/eg/haihang/model/entity/LogAggregate.java` | Low |
| 1.4 | Repository: `AccessLogRepository.java` (date-range, action queries) | `src/main/java/vn/eg/haihang/repository/AccessLogRepository.java` | Medium |
| 1.5 | Repository: `LogRetentionPolicyRepository.java` | `src/main/java/vn/eg/haihang/repository/LogRetentionPolicyRepository.java` | Low |
| 1.6 | Repository: `LogAggregateRepository.java` | `src/main/java/vn/eg/haihang/repository/LogAggregateRepository.java` | Low |
| 1.7 | DTO: `LogQueryDTO`, `LogResponseDTO`, `LogStatsDTO`, `ExportConfigDTO` | `src/main/java/vn/eg/haihang/dto/` | Medium |
| 1.8 | Filter: `AccessLogFilter` (OncePerRequestFilter, async write) | `src/main/java/vn/eg/haihang/filter/AccessLogFilter.java` | High |
| 1.9 | Service: `LogService.java` | `src/main/java/vn/eg/haihang/service/LogService.java` | Medium |
| 1.10 | Service: `LogExportService.java` (CSV streaming) | `src/main/java/vn/eg/haihang/service/LogExportService.java` | Medium |
| 1.11 | Service: `LogStatsService.java` (aggregation queries) | `src/main/java/vn/eg/haihang/service/LogStatsService.java` | Medium |
| 1.12 | Scheduler: `LogCleanupScheduler.java` (@Scheduled nightly) | `src/main/java/vn/eg/haihang/scheduler/LogCleanupScheduler.java` | Medium |
| 1.13 | Scheduler: `LogStatsScheduler.java` (daily aggregation) | `src/main/java/vn/eg/haihang/scheduler/LogStatsScheduler.java` | Medium |
| 1.14 | Component: `FailedLoginAlertChecker.java` (@Scheduled 5min) | `src/main/java/vn/eg/haihang/component/FailedLoginAlertChecker.java` | Medium |
| 1.15 | Controller: `LogController.java` | `src/main/java/vn/eg/haihang/controller/LogController.java` | High |
| 1.16 | Builder: `LogEntryBuilder.java` (HTTP request context → log entry) | `src/main/java/vn/eg/haihang/builder/LogEntryBuilder.java` | Medium |
| 1.17 | Config: Async executor, scheduler intervals, retention defaults | `src/main/resources/application.yml` | Low |

### Frontend Tasks (Estimated: 1.5–2.5 days)

| # | Task | File Path | Complexity |
|---|---|---|---|
| 2.1 | API client: `logApi.ts` | `src/services/api/logApi.ts` | Medium |
| 2.2 | Type definitions: `logTypes.ts` | `src/types/logTypes.ts` | Low |
| 2.3 | Hook: `useLogs.ts` (filter, search, pagination) | `src/hooks/useLogs.ts` | Medium |
| 2.4 | Page: `AccessLogListPage.tsx` | `src/pages/admin/AccessLogListPage.tsx` | High |
| 2.5 | Page: `AccessLogDetailPage.tsx` | `src/pages/admin/AccessLogDetailPage.tsx` | Medium |
| 2.6 | Page: `LogStatsPage.tsx` | `src/pages/admin/LogStatsPage.tsx` | High |
| 2.7 | Page: `LogRetentionPage.tsx` | `src/pages/admin/LogRetentionPage.tsx` | Low |
| 2.8 | Component: `LogTable.tsx` | `src/components/admin/LogTable.tsx` | Medium |
| 2.9 | Component: `LogFilters.tsx` (date range, action, status, IP) | `src/components/admin/LogFilters.tsx` | Medium |
| 2.10 | Component: `LogStatsChart.tsx` (recharts bar/line charts) | `src/components/admin/LogStatsChart.tsx` | High |
| 2.11 | Component: `LogDetailViewer.tsx` (JSON pretty print) | `src/components/admin/LogDetailViewer.tsx` | Medium |
| 2.12 | Routing: add admin routes in `App.tsx` | `src/App.tsx` | Low |

---

## 2. API Routes

| Method | Path | Handler | Auth |
|---|---|---|---|
| GET | `/api/v1/logs/access` | `LogController.listLogs()` | system-admin / security-admin |
| GET | `/api/v1/logs/access/{id}` | `LogController.getLogById()` | system-admin |
| GET | `/api/v1/logs/access/search` | `LogController.searchLogs()` | system-admin |
| GET | `/api/v1/logs/access/export` | `LogController.exportCSV()` | system-admin |
| POST | `/api/v1/logs/access/export/batch` | `LogController.exportBatch()` | system-admin |
| GET | `/api/v1/logs/stats/daily` | `LogController.getDailyStats()` | security-admin |
| GET | `/api/v1/logs/stats/hourly` | `LogController.getHourlyStats()` | security-admin |
| GET | `/api/v1/logs/stats/top-actions` | `LogController.getTopActions()` | security-admin |
| GET | `/api/v1/logs/stats/failure-trend` | `LogController.getFailureTrend()` | security-admin |
| GET | `/api/v1/logs/policy` | `LogController.getRetentionPolicy()` | system-admin |
| PUT | `/api/v1/logs/policy` | `LogController.updateRetentionPolicy()` | system-admin |
| GET | `/api/v1/logs?group=login` | `LogController.getLogsByGroup()` | security-admin |

---

## 3. Component Structure

```
src/
├── pages/
│   └── admin/
│       ├── AccessLogListPage.tsx      ← Bảng log với filter phức tạp
│       ├── AccessLogDetailPage.tsx    ← Chi tiết log entry
│       ├── LogStatsPage.tsx           ← Thống kê + biểu đồ (recharts)
│       └── LogRetentionPage.tsx       ← Cấu hình retention policy
├── components/
│   └── admin/
│       ├── LogTable.tsx               ← Bảng phân trang Ant Design
│       ├── LogFilters.tsx             ← Form filter (date range, action, status, IP)
│       ├── LogStatsChart.tsx          ← Biểu đồ thống kê (bar chart, line chart)
│       ├── LogDetailViewer.tsx        ← JSON pretty print của details field
│       └── ExportButton.tsx           ← Nút export CSV với date range
├── hooks/
│   └── useLogs.ts                     ← React Query hook (list, search, stats, export)
├── services/
│   └── api/
│       └── logApi.ts                  ← axios instance + log endpoints
├── types/
│   └── logTypes.ts                    ← AccessLog, LogStats, LogRetentionPolicy
└── App.tsx                            ← Router thêm routes admin/logs/*
```

---

## 4. Database Schema (Flyway Migrations)

### V1__F-005_init_access_logs.sql
```sql
-- Access Logs (append-only, never update)
CREATE TABLE access_logs (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NULL,  -- null for system events
    username NVARCHAR(100),
    action VARCHAR(50) NOT NULL CHECK (action IN (
        'login','logout','create','update','delete',
        'login_failure','password_change','role_change'
    )),
    target_resource NVARCHAR(200),
    ip_address VARCHAR(45),
    user_agent NVARCHAR(500),
    request_path NVARCHAR(500),
    response_code INT,
    duration_ms BIGINT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failure')),
    details NVARCHAR(MAX),  -- JSON extra context
    created_at DATETIME2 DEFAULT SYSUTCDATETIME()
);
GO

CREATE INDEX idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX idx_access_logs_action ON access_logs(action);
CREATE INDEX idx_access_logs_created_at ON access_logs(created_at);
CREATE INDEX idx_access_logs_status ON access_logs(status);
CREATE INDEX idx_access_logs_ip ON access_logs(ip_address);
-- Composite index for common date-range + user queries
CREATE INDEX idx_access_logs_created_user ON access_logs(created_at, user_id);

-- Note: No UPDATE allowed on this table (enforced by application + policy)
```

### V2__F-005_init_log_retention_policies.sql
```sql
-- Log Retention Policy (singleton row)
CREATE TABLE log_retention_policies (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    retention_days INT NOT NULL DEFAULT 90,
    max_export_rows INT NOT NULL DEFAULT 10000,
    cleanup_schedule VARCHAR(50) DEFAULT '0 2 * * *',  -- cron: daily 2 AM
    is_active BIT DEFAULT 1
);
GO

-- Seed default retention policy
INSERT INTO log_retention_policies (retention_days, max_export_rows, cleanup_schedule)
VALUES (90, 10000, '0 2 * * *');
```

### V3__F-005_init_log_aggregates.sql
```sql
-- Daily log aggregates (pre-computed)
CREATE TABLE log_aggregates (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    date DATE NOT NULL,
    total_accesses BIGINT DEFAULT 0,
    unique_users BIGINT DEFAULT 0,
    success_rate DECIMAL(5,2),
    avg_duration_ms BIGINT,
    computed_at DATETIME2 DEFAULT SYSUTCDATETIME()
);
GO

CREATE UNIQUE INDEX idx_log_aggregates_date ON log_aggregates(date);
```

---

## 5. Estimated Complexity

| Area | Complexity | Notes |
|---|---|---|
| AccessLogFilter (async) | High | OncePerRequestFilter + @Async write, non-blocking |
| LogStatsService | Medium | Aggregation queries, daily rollup scheduler |
| LogExportService | Medium | Streaming CSV, large dataset handling |
| Cleanup + Alert Scheduler | Medium | @Scheduled jobs, batch delete |
| Frontend (Stats Charts) | High | recharts integration, data transformation |
| Frontend (Log Table + Filters) | Medium | Complex filter form, search, export |
| **Overall** | **Medium** | Async + scheduler adds complexity but UI is standard |

---

## 6. Sprint Breakdown (Wave 1)

| Sprint | Tasks | Deliverable |
|---|---|---|
| Sprint 1 (Days 1–2) | Entities, Repositories, DTOs, V1–V3 migrations | DB schema ready |
| Sprint 2 (Days 3–4) | AccessLogFilter, LogService, LogController, LogEntryBuilder | Auto-log on every HTTP request working |
| Sprint 3 (Day 5) | LogExportService, LogStatsService, LogRetentionService | Export + stats + retention APIs |
| Sprint 4 (Day 6) | LogCleanupScheduler, LogStatsScheduler, FailedLoginAlertChecker | Background jobs running |
| Sprint 5 (Days 7–8) | Frontend: AccessLogListPage, LogTable, LogFilters, APIs | Log list UI with search/filter |
| Sprint 6 (Day 9) | Frontend: LogStatsPage, LogStatsChart, RetentionPage | Stats UI + export |
| Sprint 7 (Day 10) | Integration testing, async verification, E2E tests | Feature ready for QA |
