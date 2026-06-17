---
id: F-007
name: Quan ly ket noi lien thong chia du lieu
slug: quan-ly-ket-noi-lien-thong-chia-du-lieu
module-id: M-001
stage: system-architect
status: completed
created: 2026-06-17T00:00:00Z
last-updated: 2026-06-17T04:00:00Z
---

# SA Stage: F-007 — Quản lý kết nối liên thông chia sẻ dữ liệu

## 1. Entities (Spring Data JPA — MSSQL 2022)

### 1.1 DataConnection

```java
@Entity
@Table(name = "data_connections", indexes = {
    @Index(name = "idx_data_conn_name", columnList = "name"),
    @Index(name = "idx_data_conn_code", columnList = "code", unique = true),
    @Index(name = "idx_data_conn_type", columnList = "connection_type"),
    @Index(name = "idx_data_conn_status", columnList = "status")
})
public class DataConnection {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @Column(name = "name", length = 200, nullable = false) private String name;
    @Column(name = "code", length = 100, nullable = false) private String code;

    @Column(name = "connection_type", length = 30, nullable = false,
        columnDefinition = "VARCHAR(30)")
    private String connectionType; // api | rest | graphql | database

    @Column(name = "endpoint_url", length = 1000, nullable = false) private String endpointUrl;

    @Column(name = "auth_type", length = 30, columnDefinition = "VARCHAR(30)")
    private String authType; // none | basic | oauth2 | apikey

    @Column(name = "auth_config", columnDefinition = "NVARCHAR(MAX)")
    private String authConfig; // JSON: encrypted credentials (AES-256)
    // { "apiKey": "encrypted_base64", "clientId": "encrypted_base64", ... }

    @Column(name = "config", columnDefinition = "NVARCHAR(MAX)")
    private String config; // JSON: timeout, retry, custom headers, IP whitelist
    // { "timeoutMs": 10000, "retryMax": 3, "retryBackoffMs": 1000,
    //     "whitelistedIps": ["10.0.0.0/8"], "customHeaders": {} }

    @Column(name = "status", length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'inactive'")
    private String status; // active | inactive | error | connecting

    @Column(name = "health_check_url", length = 1000) private String healthCheckUrl;
    @Column(name = "last_health_check") private LocalDateTime lastHealthCheck;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "created_by")
    private UserAccount createdBy;

    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;
    @Column(name = "deleted_at") private LocalDateTime deletedAt;

    @PrePersist void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }
}
```

### 1.2 SyncLog

```java
@Entity
@Table(name = "sync_logs", indexes = {
    @Index(name = "idx_sync_log_conn_id", columnList = "connection_id"),
    @Index(name = "idx_sync_log_start_time", columnList = "start_time"),
    @Index(name = "idx_sync_log_status", columnList = "status")
})
public class SyncLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "connection_id", nullable = false)
    private DataConnection connection;

    @Column(name = "start_time", nullable = false) private LocalDateTime startTime;
    @Column(name = "end_time") private LocalDateTime endTime;

    @Column(name = "records_processed") private Long recordsProcessed;
    @Column(name = "records_failed") private Long recordsFailed;

    @Column(name = "status", length = 20, nullable = false) private String status;
    // success | partial | failed

    @Column(name = "error_details", columnDefinition = "NVARCHAR(MAX)")
    private String errorDetails; // JSON: error message, stack trace, failed records

    @Column(name = "triggered_by") private Long triggeredBy; // user_id or "scheduler"
}
```

### 1.3 ConnectionHealth

```java
@Entity
@Table(name = "connection_health", indexes = {
    @Index(name = "idx_conn_health_conn_id", columnList = "connection_id"),
    @Index(name = "idx_conn_health_checked_at", columnList = "checked_at")
})
public class ConnectionHealth {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "connection_id", nullable = false)
    private DataConnection connection;

    @Column(name = "status_code") private Integer statusCode;
    @Column(name = "latency_ms") private Long latencyMs;

    @Column(name = "checked_at", nullable = false) private LocalDateTime checkedAt;

    @Column(name = "error_message", length = 1000) private String errorMessage;
}
```

### 1.4 Relationship Diagram

```
DataConnection 1──N SyncLog
DataConnection 1──N ConnectionHealth
DataConnection N──1 UserAccount (created_by)
DataConnection 1──N DataConnection (via connectionId in SyncLog — many-to-one)
```

## 2. API Endpoints

All endpoints prefixed with `/api/v1/`. Authentication via JWT Bearer token.

### Connection CRUD

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/connections` | Danh sách kết nối | system-admin |
| GET | `/api/v1/connections/{id}` | Chi tiết kết nối (mask auth config) | system-admin |
| POST | `/api/v1/connections` | Tạo kết nối mới | system-admin |
| PUT | `/api/v1/connections/{id}` | Chỉnh sửa cấu hình kết nối | system-admin |
| DELETE | `/api/v1/connections/{id}` | Xóa kết nối (check sync data) | system-admin |

### Connection Health & Testing

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/connections/{id}/health` | Trạng thái kết nối (health check) | system-admin |
| POST | `/api/v1/connections/{id}/health-check` | Chạy health check thủ công | system-admin |
| GET | `/api/v1/connections/{id}/health-history` | Lịch sử health check | system-admin |

### Connection Testing & Verification

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/v1/connections/test` | Test kết nối (endpoint + auth) | system-admin |
| POST | `/api/v1/connections/{id}/test` | Test kết nối cụ thể | system-admin |

### Sync Log Queries

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/connections/{id}/sync-logs` | Lịch sử sync của kết nối | system-admin |
| GET | `/api/v1/connections/{id}/sync-logs/latest` | Sync gần nhất | system-admin |
| GET | `/api/v1/sync-logs?from=&to=&status=` | Toàn bộ sync log (filter) | system-admin |

### Connection Import/Export

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/v1/connections/import` | Import cấu hình kết nối (JSON/YAML) | system-admin |
| GET | `/api/v1/connections/{id}/export` | Export cấu hình (JSON) | system-admin |
| GET | `/api/v1/connections/export-all` | Export tất cả kết nối (ZIP) | system-admin |

## 3. Architecture Notes

### 3.1 Component Interactions

```
ReactJS (Admin UI)
    │
    ├── ConnectionController
    │       ├── ConnectionService ──► ConnectionRepository ──► MSSQL
    │       ├── HealthCheckService ──► HttpClient (REST endpoint test)
    │       ├── EncryptionService ──► AES-256 (auth_config encrypt/decrypt)
    │       └── SyncLogService ──► SyncLogRepository
    │
    ├── ConnectionHealthScheduler (@Scheduled)
    │       └── HealthCheckService — checks all active connections every 5 min
    │
    └── ConnectionTestService (endpoint validation)
```

**Key interactions:**
- `EncryptionService` uses AES-256-GCM to encrypt `authConfig` before persisting (BR-038)
- `HealthCheckService` sends HTTP HEAD/GET to `healthCheckUrl` — records statusCode + latency_ms
- `ConnectionHealthScheduler` runs every 5 minutes (300s), connection timeout 10s (BR-036)
- `SyncLogService` records start/end times, processed/failed counts, error details

### 3.2 Design Patterns

| Pattern | Application |
|---|---|
| **Repository Pattern** | `ConnectionRepository`, `SyncLogRepository` — Spring Data JPA with custom queries |
| **DTO Pattern** | `ConnectionCreateDTO`, `ConnectionUpdateDTO`, `ConnectionTestDTO`, `SyncLogResponseDTO` |
| **Adapter Pattern** | `ConnectionAdapter` — interface for different connection types (REST, GraphQL, DB) |
| **Strategy Pattern** | `AuthStrategy` — interchangeable auth implementations (NoneAuth, BasicAuth, OAuth2Auth, ApiKeyAuth) |
| **Observer Pattern** | `ApplicationEventPublisher` → `SyncFailureEventListener` → Alert admin on ≥10% failure (BR-039) |
| **Circuit Breaker** | `Resilience4j CircuitBreaker` on connection calls — opens after consecutive failures |
| **Builder Pattern** | `HttpClientBuilder` — configures connection with timeout, retry, headers per type |

### 3.3 Encryption (BR-038)

```java
@Component
public class EncryptionService {
    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final String SECRET_KEY =
        EnvironmentVariableResolver.get("CONNECTION_ENCRYPTION_KEY");

    public String encrypt(String plaintext) {
        byte[] iv = new byte[12];
        SecureRandom.getInstanceStrong().nextBytes(iv);
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE,
            new SecretKeySpec(SECRET_KEY.getBytes(), "AES"),
            new GCMParameterSpec(128, iv));
        byte[] encrypted = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
        // iv + encrypted ciphertext
        return Base64.getEncoder().encodeToString(
            BytesUtils.concat(iv, encrypted));
    }

    public String decrypt(String encryptedBase64) {
        byte[] decoded = Base64.getDecoder().decode(encryptedBase64);
        byte[] iv = Arrays.copyOfRange(decoded, 0, 12);
        byte[] ciphertext = Arrays.copyOfRange(decoded, 12, decoded.length);
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE,
            new SecretKeySpec(SECRET_KEY.getBytes(), "AES"),
            new GCMParameterSpec(128, iv));
        return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
    }
}
```

### 3.4 Health Check Implementation (BR-036)

```java
@Component
public class ConnectionHealthScheduler {
    @Scheduled(fixedRate = 300000) // 5 minutes
    public void checkAllConnections() {
        List<DataConnection> activeConnections =
            connectionRepo.findByStatus("active");

        for (DataConnection conn : activeConnections) {
            HealthResult result = healthCheckService.check(conn);
            ConnectionHealth health = new ConnectionHealth();
            health.setConnection(conn);
            health.setStatusCode(result.getStatusCode());
            health.setLatencyMs(result.getLatencyMs());
            health.setErrorMessage(result.getErrorMessage());
            health.setCheckedAt(LocalDateTime.now());
            connectionHealthRepo.save(health);

            conn.setLastHealthCheck(health.getCheckedAt());
            conn.setStatus(result.isSuccess() ? "active" : "error");
            connectionRepo.save(conn);
        }
    }
}
```

### 3.5 Retry Policy with Exponential Backoff (BR-037)

```java
@Component
public class ConnectionRetryService {
    private static final int MAX_RETRIES = 3;
    private static final long INITIAL_BACKOFF_MS = 1000;

    public ResponseEntity executeWithRetry(DataConnection conn, HttpRequest request) {
        for (int attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                return httpClient.execute(request);
            } catch (Exception e) {
                if (attempt == MAX_RETRIES) throw e;
                long backoff = INITIAL_BACKOFF_MS * (1L << attempt); // 1s, 2s, 4s
                sleep(backoff);
            }
        }
        throw new IllegalStateException("Unreachable");
    }
}
```

### 3.6 Delete Protection (BR-035)

```java
public void deleteConnection(Long id) {
    DataConnection conn = connectionRepo.findById(id).orElseThrow();
    long syncCount = syncLogRepo.countByConnectionId(id);
    if (syncCount > 0) {
        throw new ConnectionInUseException(
            "Không thể xóa kết nối đang có sync data");
    }
    conn.setStatus("deleted");
    conn.setDeletedAt(LocalDateTime.now());
    connectionRepo.save(conn);
}
```

### 3.7 Transaction Boundaries

- `@Transactional` on `ConnectionService.create()` — creates connection + health record + sync log init
- `@Transactional` on `ConnectionService.update()` — re-encrypts auth config + updates connection
- `@Transactional(readOnly = true)` on list/search queries
- Health check scheduler: separate transaction per connection (no batch)

### 3.8 HTTPS Enforcement (BR-034)

```java
public void validateEndpointUrl(String url) {
    if (!"localhost".equals(host) && !url.startsWith("https://")) {
        throw new InvalidEndpointException("Endpoint URL phải là HTTPS (trừ localhost)");
    }
}
```

### 3.9 Database Indexes & Performance

- Unique index on `(code)` — prevents code duplication
- Index on `(connection_type, status)` for type-based queries
- Index on `(connection_id, start_time)` in SyncLog for chronological queries
- Index on `(connection_id, checked_at)` in ConnectionHealth for health history
- `auth_config` uses `NVARCHAR(MAX)` — consider encryption at rest (TDE) for MSSQL

### 3.10 Dependencies

| Dependency | Purpose |
|---|---|
| `spring-boot-starter-data-jpa` | ORM + MSSQL |
| `spring-boot-starter-web` | HTTP client for API connections |
| `resilience4j-spring-boot3` | Circuit breaker + retry |
| `spring-boot-starter-validation` | Bean validation |
| `snakeyaml` | YAML config import/export |
| `commons-io` | File handling |
