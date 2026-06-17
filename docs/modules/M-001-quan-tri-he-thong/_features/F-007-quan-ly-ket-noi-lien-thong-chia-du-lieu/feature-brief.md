---
status: proposed
last-updated: 2026-06-17T03:23:18Z
---
---
id: F-007
name: Quan ly ket noi lien thong chia du lieu
slug: quan-ly-ket-noi-lien-thong-chia-du-lieu
module-id: M-001
status: done
classification: local
priority: medium
created: 2026-06-16T04:40:32Z
last-updated: 2026-06-17T01:35:44Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quan ly ket noi lien thong chia du lieu

## Description

Cau hinh ket noi LGSP, NDXP, API qua HTTPS/TLS, JWT, IP whitelist

## Business Intent

Quan tri he thong - Cau hinh ket noi LGSP, NDXP, API

## Flow Summary

Quan tri he thong - Cau hinh ket noi LGSP, NDXP, API

## Acceptance Criteria

- Cau hinh ket noi thanh cong
- Xem lich su ket noi
- Cap nhat thong tin ket noi

## In Scope

- Tạo kết nối liên thông mới (tên, loại, endpoint, cấu hình xác thực)
- Chỉnh sửa cấu hình kết nối (endpoint, timeout, retry policy)
- Xóa kết nối (không xóa nếu đang có data sync)
- Kiểm tra trạng thái kết nối (health check, latency, status)
- Xem danh sách kết nối với bộ lọc (tên, loại, trạng thái, endpoint)
- Tìm kiếm kết nối (theo tên hoặc endpoint)
- Phân trang danh sách kết nối
- Import/export cấu hình kết nối (JSON/YAML)
- Log sync history (thời gian, số lượng record, thành công/thất bại)
- UI: Sidebar cố định, header avatar, table sticky header, toast notification, modal xác nhận

## Out of Scope

- Data transformation/ETL pipeline
- Real-time data streaming (WebSocket)
- API Gateway management (nằm ngoài scope M-001)

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Admin | Full access | Tạo, sửa, xóa, import/export kết nối |
| Chuyen vien | View + Edit | Xem và chỉnh sửa kết nối, import/export |
| Lanh dao | View | Chỉ xem danh sách kết nối, trạng thái |
| Can bo | View + Create | Xem và tạo mới, không xóa |

## Entities

- **DataConnection**: id(BIGINT PK), name(VARCHAR 100 NOT NULL), code(VARCHAR 30 UNIQUE NOT NULL), connectionType(VARCHAR 30 NOT NULL), endpointUrl(VARCHAR 500 NOT NULL), authType(VARCHAR 30 DEFAULT 'none'), apiKey(AES256_ENCRYPTED_TEXT NULL), apiSecret(AES256_ENCRYPTED_TEXT NULL), config(JSON), timeout_ms(INT DEFAULT 30000), retryCount(INT DEFAULT 3), status(VARCHAR 20 DEFAULT 'active'), healthCheckUrl(VARCHAR 500 NULL), lastHealthCheck(TIMESTAMP NULL), lastSyncAt(TIMESTAMP NULL), createdAt(TIMESTAMP), updatedAt(TIMESTAMP), deletedAt(TIMESTAMP NULL)
- **SyncLog**: id(BIGINT PK), connectionId(BIGINT FK→DataConnection), startTime(TIMESTAMP NOT NULL), endTime(TIMESTAMP NULL), recordsProcessed(INT DEFAULT 0), recordsFailed(INT DEFAULT 0), status(VARCHAR 20 DEFAULT 'running'), errorDetails(TEXT NULL), createdAt(TIMESTAMP)
- **ConnectionHealth**: id(BIGINT PK), connectionId(BIGINT FK→DataConnection), statusCode(INT NULL), latency_ms(INT NULL), checkedAt(TIMESTAMP DEFAULT CURRENT_TIMESTAMP), errorMessage(TEXT NULL)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/connections | Danh sách kết nối (phân trang) | Admin |
| GET | /api/v1/connections/{id} | Chi tiết kết nối | Admin |
| POST | /api/v1/connections | Tạo kết nối mới | Admin |
| PUT | /api/v1/connections/{id} | Chỉnh sửa kết nối | Admin |
| DELETE | /api/v1/connections/{id} | Xóa kết nối | Admin |
| POST | /api/v1/connections/{id}/health | Health check thủ công | Admin |
| GET | /api/v1/connections/{id}/health | Lịch sử health check | Admin |
| GET | /api/v1/connections/{id}/sync-log | Lịch sử sync data | Admin |
| GET | /api/v1/connections/export | Export cấu hình | Admin |
| POST | /api/v1/connections/import | Import cấu hình | Admin |
| GET | /api/v1/users | Danh sách người dùng | JWT |
| GET | /api/v1/groups | Danh sách nhóm | JWT |
| GET | /api/v1/roles | Danh sách vai trò | JWT |

## Architecture Notes

- **Pattern**: Repository Pattern + Observer Pattern cho health check
- **Health Check**: @Scheduled(fixedRate=300000) chạy mỗi 5 phút, timeout 10s
- **Retry Policy**: Exponential backoff (1s → 2s → 4s) với max 3 retries
- **API Key Encryption**: AES-256-GCM trong application.properties (không lưu trong DB plain text)
- **Sync Logging**: @Async cho mỗi sync operation, không blocking main thread
- **Streaming**: Chunked HTTP client (OkHttp/RestTemplate) cho export/import lớn
- **Validation**: URL validation, HTTPS enforcement (trừ localhost), timeout config
- **Alert**: SLF4J MDC + Kafka/RabbitMQ publisher cho sync failure alerts (≥10%)

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-034 | Endpoint URL phải là HTTPS (trừ localhost) | Connection Config | UC-026 |
| BR-035 | Không được xóa kết nối đang có sync data | Delete Connection | UC-028 |
| BR-036 | Health check chạy mỗi 5 phút, timeout 10s | Health Check | UC-027 |
| BR-037 | Retry policy: tối đa 3 lần, backoff exponential | Connection Config | UC-027 |
| BR-038 | API Key phải được mã hóa (AES-256) | Security | UC-029 |
| BR-039 | Sync failure ≥10% → cảnh báo đến admin | Alert | UC-027 |

## Testing Strategy

- Unit tests: URL validation, encryption, retry backoff, health check timeout
- Integration tests: CRUD DataConnection with sync associations
- E2E tests: Create connection → health check → sync → verify log
- UI tests: Responsive sidebar, sticky header, pagination, search, import/export, health status indicator
