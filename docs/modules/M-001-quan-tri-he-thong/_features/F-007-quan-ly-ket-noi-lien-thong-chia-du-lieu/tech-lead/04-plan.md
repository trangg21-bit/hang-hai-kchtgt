# Tech Lead Plan: F-007 — Quản lý kết nối liên thông chia dữ liệu

## Context
Feature F-007 has BA content (feature-brief.md + ba/feature-brief.md) but no SA content.
This Tech Lead plan derives from BA specification including entities, business rules, API endpoints, and architecture notes.

## Derived Entity Design

Based on BA specification, the following entities are defined:

| Entity | Table | Purpose |
|---|---|---|
| `DataConnection` | `data_connections` | Core connection configuration (LGSP, NDXP, API) |
| `SyncLog` | `sync_logs` | Sync operation history |
| `ConnectionHealth` | `connection_health` | Health check status |

---

## 1. Implementation Tasks

### Backend Tasks (Estimated: 2.5–3.5 days)

| # | Task | File Path | Complexity |
|---|---|---|---|
| 1.1 | Entity: `DataConnection.java` | `src/main/java/vn/eg/haihang/model/entity/DataConnection.java` | Medium |
| 1.2 | Entity: `SyncLog.java` | `src/main/java/vn/eg/haihang/model/entity/SyncLog.java` | Low |
| 1.3 | Entity: `ConnectionHealth.java` | `src/main/java/vn/eg/haihang/model/entity/ConnectionHealth.java` | Low |
| 1.4 | Repository: `DataConnectionRepository.java` | `src/main/java/vn/eg/haihang/repository/DataConnectionRepository.java` | Medium |
| 1.5 | Repository: `SyncLogRepository.java` | `src/main/java/vn/eg/haihang/repository/SyncLogRepository.java` | Low |
| 1.6 | Repository: `ConnectionHealthRepository.java` | `src/main/java/vn/eg/haihang/repository/ConnectionHealthRepository.java` | Low |
| 1.7 | DTO: `ConnectionCreateDTO`, `ConnectionUpdateDTO`, `ConnectionResponseDTO`, `ConnectionTestDTO` | `src/main/java/vn/eg/haihang/dto/` | Medium |
| 1.8 | Service: `DataConnectionService.java` (CRUD + validation) | `src/main/java/vn/eg/haihang/service/DataConnectionService.java` | High |
| 1.9 | Service: `ConnectionHealthService.java` (health check logic) | `src/main/java/vn/eg/haihang/service/ConnectionHealthService.java` | Medium |
| 1.10 | Service: `SyncLogService.java` (sync history tracking) | `src/main/java/vn/eg/haihang/service/SyncLogService.java` | Low |
| 1.11 | Service: `ConnectionImportExportService.java` (JSON/YAML) | `src/main/java/vn/eg/haihang/service/ConnectionImportExportService.java` | Medium |
| 1.12 | Service: `ConnectionTestService.java` (test connection) | `src/main/java/vn/eg/haihang/service/ConnectionTestService.java` | High |
| 1.13 | Validator: `ConnectionValidator.java` (URL, TLS, IP whitelist, credentials) | `src/main/java/vn/eg/haihang/validator/ConnectionValidator.java` | High |
| 1.14 | Encryptor: `CredentialsEncryptor.java` (AES-256-GCM) | `src/main/java/vn/eg/haihang/security/CredentialsEncryptor.java` | Medium |
| 1.15 | Scheduler: `HealthCheckScheduler.java` (@Scheduled 5min) | `src/main/java/vn/eg/haihang/scheduler/HealthCheckScheduler.java` | Medium |
| 1.16 | Component: `SyncFailureAlertComponent.java` (≥10% failure alert) | `src/main/java/vn/eg/haihang/component/SyncFailureAlertComponent.java` | Medium |
| 1.17 | Config: `ConnectionProperties.java` (custom config class) | `src/main/java/vn/eg/haihang/config/ConnectionProperties.java` | Low |
| 1.18 | Controller: `DataConnectionController.java` | `src/main/java/vn/eg/haihang/controller/DataConnectionController.java` | High |
| 1.19 | Config: application.yml (TLS defaults, timeout, retry policy) | `src/main/resources/application.yml` | Low |

### Frontend Tasks (Estimated: 2–3 days)

| # | Task | File Path | Complexity |
|---|---|---|---|
| 2.1 | API client: `connectionApi.ts` | `src/services/api/connectionApi.ts` | Medium |
| 2.2 | Type definitions: `connectionTypes.ts` | `src/types/connectionTypes.ts` | Medium |
| 2.3 | Hook: `useConnections.ts` (pagination, filtering, health status) | `src/hooks/useConnections.ts` | Medium |
| 2.4 | Page: `ConnectionListPage.tsx` | `src/pages/admin/ConnectionListPage.tsx` | High |
| 2.5 | Page: `ConnectionDetailPage.tsx` | `src/pages/admin/ConnectionDetailPage.tsx` | Medium |
| 2.6 | Page: `ConnectionCreatePage.tsx` | `src/pages/admin/ConnectionCreatePage.tsx` | Medium |
| 2.7 | Page: `SyncLogPage.tsx` | `src/pages/admin/SyncLogPage.tsx` | Medium |
| 2.8 | Component: `ConnectionTable.tsx` | `src/components/admin/ConnectionTable.tsx` | Medium |
| 2.9 | Component: `ConnectionForm.tsx` (conditional credential fields) | `src/components/admin/ConnectionForm.tsx` | High |
| 2.10 | Component: `ConnectionTestButton.tsx` (test + spinner + result) | `src/components/admin/ConnectionTestButton.tsx` | Medium |
| 2.11 | Component: `HealthStatusBadge.tsx` (online/offline/error) | `src/components/admin/HealthStatusBadge.tsx` | Low |
| 2.12 | Component: `CredentialField.tsx` (masked display + toggle) | `src/components/admin/CredentialField.tsx` | Medium |
| 2.13 | Component: `IpWhitelistInput.tsx` (one IP per line, validate) | `src/components/admin/IpWhitelistInput.tsx` | Medium |
| 2.14 | Routing: add admin routes in `App.tsx` | `src/App.tsx` | Low |

---

## 2. API Routes

| Method | Path | Handler | Auth |
|---|---|---|---|
| GET | `/api/v1/connections` | `DataConnectionController.listConnections()` | system-admin |
| GET | `/api/v1/connections/{id}` | `DataConnectionController.getConnectionById()` | system-admin |
| POST | `/api/v1/connections` | `DataConnectionController.createConnection()` | system-admin |
| PUT | `/api/v1/connections/{id}` | `DataConnectionController.updateConnection()` | system-admin |
| DELETE | `/api/v1/connections/{id}` | `DataConnectionController.deleteConnection()` | system-admin |
| POST | `/api/v1/connections/{id}/health` | `DataConnectionController.manualHealthCheck()` | system-admin |
| GET | `/api/v1/connections/{id}/health` | `DataConnectionController.getHealthHistory()` | system-admin |
| GET | `/api/v1/connections/{id}/sync-log` | `DataConnectionController.getSyncLog()` | system-admin |
| GET | `/api/v1/connections/export` | `DataConnectionController.exportConfig()` | system-admin |
| POST | `/api/v1/connections/import` | `DataConnectionController.importConfig()` | system-admin |
| GET | `/api/v1/connections/search` | `DataConnectionController.searchConnections()` | system-admin |

---

## 3. Component Structure

```
src/
├── pages/
│   └── admin/
│       ├── ConnectionListPage.tsx     ← Bảng kết nối với type/status filter
│       ├── ConnectionDetailPage.tsx   ← Chi tiết + tabs (info, sync-log, health)
│       ├── ConnectionCreatePage.tsx   ← Form tạo kết nối
│       └── SyncLogPage.tsx            ← Lịch sử sync data
├── components/
│   └── admin/
│       ├── ConnectionTable.tsx        ← Bảng phân trang Ant Design
│       ├── ConnectionForm.tsx         ← Form (type, URL, auth, credentials, IP whitelist)
│       ├── ConnectionTestButton.tsx   ← Nút test + spinner + kết quả
│       ├── HealthStatusBadge.tsx      ← Badge online/offline/error
│       ├── CredentialField.tsx        ← Input ẩn/hiện credential (masked)
│       └── IpWhitelistInput.tsx       ← Textarea validate IP per line
├── hooks/
│   └── useConnections.ts              ← React Query hook (list, get, CRUD, test, health)
├── services/
│   └── api/
│       └── connectionApi.ts           ← axios instance + connection endpoints
├── types/
│   └── connectionTypes.ts             ← DataConnection, SyncLog, ConnectionHealth
└── App.tsx                            ← Router thêm routes admin/connections/*
```

---

## 4. Database Schema (Flyway Migrations)

### V1__F-007_init_data_connections.sql
```sql
-- Data Connections table
CREATE TABLE data_connections (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    code VARCHAR(30) NOT NULL,
    connection_type VARCHAR(30) NOT NULL CHECK (connection_type IN ('LGSP', 'NDXP', 'API')),
    endpoint_url NVARCHAR(500) NOT NULL,
    auth_type VARCHAR(30) DEFAULT 'none' CHECK (auth_type IN ('none', 'JWT', 'API-Key', 'Basic-Auth', 'OAuth2')),
    api_key NVARCHAR(MAX) NULL,       -- AES-256 encrypted
    api_secret NVARCHAR(MAX) NULL,     -- AES-256 encrypted
    jwt_secret NVARCHAR(MAX) NULL,     -- AES-256 encrypted
    config NVARCHAR(MAX),              -- JSON: custom configuration
    timeout_ms INT DEFAULT 30000,
    retry_count INT DEFAULT 3,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
    health_check_url NVARCHAR(500) NULL,
    last_health_check DATETIME2 NULL,
    last_sync_at DATETIME2 NULL,
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    deleted_at DATETIME2 NULL
);
GO

CREATE UNIQUE INDEX idx_data_connections_code ON data_connections(code);
CREATE UNIQUE INDEX idx_data_connections_name ON data_connections(name)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_data_connections_type ON data_connections(connection_type);
CREATE INDEX idx_data_connections_status ON data_connections(status);
CREATE INDEX idx_data_connections_endpoint ON data_connections(endpoint_url(100));

CREATE TRIGGER trg_data_connections_updated
ON data_connections
AFTER UPDATE
AS
BEGIN
    UPDATE data_connections SET updated_at = SYSUTCDATETIME()
    WHERE id IN (SELECT id FROM inserted);
END;
GO
```

### V2__F-007_init_sync_logs.sql
```sql
-- Sync Logs (append-only, history of sync operations)
CREATE TABLE sync_logs (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    connection_id BIGINT NOT NULL FOREIGN KEY REFERENCES data_connections(id) ON DELETE CASCADE,
    start_time DATETIME2 NOT NULL,
    end_time DATETIME2 NULL,
    records_processed INT DEFAULT 0,
    records_failed INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed', 'partial')),
    error_details NVARCHAR(MAX) NULL,
    created_at DATETIME2 DEFAULT SYSUTCDATETIME()
);
GO

CREATE INDEX idx_sync_logs_connection_id ON sync_logs(connection_id);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);
CREATE INDEX idx_sync_logs_created_at ON sync_logs(created_at);
```

### V3__F-007_init_connection_health.sql
```sql
-- Connection Health history
CREATE TABLE connection_health (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    connection_id BIGINT NOT NULL FOREIGN KEY REFERENCES data_connections(id) ON DELETE CASCADE,
    status_code INT NULL,
    latency_ms INT NULL,
    checked_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    error_message NVARCHAR(MAX) NULL
);
GO

CREATE INDEX idx_connection_health_connection_id ON connection_health(connection_id);
CREATE INDEX idx_connection_health_checked_at ON connection_health(checked_at);
```

---

## 5. Business Rules Implementation

| Rule | Implementation |
|---|---|
| BR-034: HTTPS enforcement | `ConnectionValidator.validateUrl()` — reject non-HTTPS (except localhost) |
| BR-035: No delete if sync data exists | `DataConnectionService.delete()` — count sync_logs > 0 → throw `ConnectionInUseException` |
| BR-036: Health check 5min/10s timeout | `@Scheduled(fixedRate=300000)` + `RestTemplate` with 10s connect/read timeout |
| BR-037: Retry exponential backoff | `ConnectionTestService` — 1s → 2s → 4s, max 3 retries |
| BR-038: AES-256 credential encryption | `CredentialsEncryptor` — `SecretKeySpec` + `GCMParameterSpec` |
| BR-039: Sync failure ≥10% alert | `SyncFailureAlertComponent` — compute failure rate, alert via SLF4J |

---

## 6. Estimated Complexity

| Area | Complexity | Notes |
|---|---|---|
| Credentials Encryption | High | AES-256-GCM with secure key management |
| Health Check Scheduler | Medium | @Scheduled + HTTP call + timeout handling |
| Connection Test Service | Medium | External HTTP call, retry with backoff, timeout |
| URL/Security Validation | Medium | HTTPS enforcement, IP whitelist format validation |
| Frontend (Form + Credentials) | Medium-High | Conditional fields, masked credential display, IP whitelist input |
| Frontend (CRUD + Health) | Medium | Table + form + test button + health badge |
| **Overall** | **Medium-High** | Encryption + external API calls + validation = security-sensitive |

---

## 7. Sprint Breakdown (Wave 1)

| Sprint | Tasks | Deliverable |
|---|---|---|
| Sprint 1 (Days 1–2) | Entities, Repositories, DTOs, V1–V3 migrations | DB schema ready |
| Sprint 2 (Days 3–4) | DataConnectionService, CredentialsEncryptor, ConnectionValidator, DataConnectionController | CRUD + validation + encryption |
| Sprint 3 (Day 5) | ConnectionTestService, HealthCheckScheduler, ConnectionHealthService | Health check + test connection |
| Sprint 4 (Day 6) | SyncLogService, SyncFailureAlertComponent, ImportExportService | Sync log + import/export |
| Sprint 5 (Days 7–8) | Frontend: ConnectionListPage, ConnectionTable, ConnectionForm, APIs | Connection CRUD UI |
| Sprint 6 (Day 9) | Frontend: CredentialField, IpWhitelistInput, ConnectionTestButton | Form components |
| Sprint 7 (Day 10) | Integration testing, encryption verification, E2E tests | Feature ready for QA |
