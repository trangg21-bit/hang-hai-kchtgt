package com.hanghai.kchtg.accesslog.entity;

import com.hanghai.kchtg.accesslog.enums.LogSeverity;
import com.hanghai.kchtg.accesslog.enums.LogType;
import com.hanghai.kchtg.accesslog.interceptor.AccessLogInterceptor;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Records every user-facing access to the system for audit and traceability.
 * <p>
 * This entity is write-only from the application's perspective - the REST API
 * only exposes read operations. Log entries are typically created by an
 * {@link AccessLogInterceptor}
 * via {@link AsyncLogAppender}.
 * </p>
 */
@Entity
@Table(name = "access_logs", indexes = {
        @Index(name = "idx_type_createdAt", columnList = "type, createdAt"),
        @Index(name = "idx_severity_createdAt", columnList = "severity, createdAt"),
        @Index(name = "idx_action_createdAt", columnList = "action, createdAt"),
        @Index(name = "idx_userid_createdAt", columnList = "userId, createdAt")
})
@Getter
@Setter
@NoArgsConstructor
public class AccessLog {

    /** Primary key — UUID. */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /** ID of the user who performed the action. */
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    /** Login name at the time of the action (denormalised for query convenience). */
    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(max = 50, message = "Tên đăng nhập tối đa 50 ký tự")
    @Column(nullable = false, length = 50)
    private String username;

    /** Short description of the action (e.g. "LOGIN", "VIEW_REPORT", "CREATE_ORDER"). */
    @NotBlank(message = "Hành động không được để trống")
    @Size(max = 30, message = "Hành động tối đa 30 ký tự")
    @Column(nullable = false, length = 30)
    private String action;

    /** Logical module or feature area (e.g. "AUTH", "KCHT", "REPORT"). */
    @NotBlank(message = "Phân hệ không được để trống")
    @Size(max = 50, message = "Phân hệ tối đa 50 ký tự")
    @Column(nullable = false, length = 50)
    private String module;

    /** Client IP address captured at the edge. */
    @NotBlank(message = "Địa chỉ IP không được để trống")
    @Size(max = 45, message = "Địa chỉ IP tối đa 45 ký tự")
    @Column(name = "ip_address", nullable = false, length = 45)
    private String ipAddress;

    /** Client <code>User-Agent</code> header (may be empty for non-HTTP producers). */
    @Column(name = "user_agent", length = 500)
    private String userAgent;

    /** Email of the user (denormalised for fast filtering). */
    @Column(name = "email", length = 100)
    private String email;

    /** Organisational unit of the user (denormalised for fast filtering). */
    @Column(name = "org_unit", length = 100)
    private String orgUnit;

    /** Login session identifier. All actions in one session share this ID. */
    @Column(name = "session_id", length = 50)
    private String sessionId;

    /** Whether the action completed successfully or failed. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private AccessLogStatus status;

    /** Free-text detail - stack-trace, request body excerpt, or business context. */
    @Column(columnDefinition = "TEXT")
    private String detail;

    // ── F-005 new fields ─────────────────────────────────────────────

    /** Log type categorization: access, login, error, account, configuration. */
    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 20, nullable = false, columnDefinition = "VARCHAR(20) DEFAULT 'access'")
    private LogType type = LogType.ACCESS;

    /** Log severity level: info, warning, error, critical. */
    @Enumerated(EnumType.STRING)
    @Column(name = "severity", length = 20, nullable = false, columnDefinition = "VARCHAR(20) DEFAULT 'info'")
    private LogSeverity severity = LogSeverity.INFO;

    /** Target resource that was accessed or modified (e.g. "/api/users/123"). */
    @Column(name = "target_resource", length = 100)
    private String targetResource;

    /** Full request path captured at the interceptor level. */
    @Column(name = "request_path", length = 500)
    private String requestPath;

    /** HTTP response status code captured by the interceptor. */
    @Column(name = "response_code")
    private Integer responseCode;

    /** Request duration in milliseconds (computed by interceptor). */
    @Column(name = "duration_ms")
    private Integer durationMs;

    /** Structured metadata as a JSON string (log-type-specific payload). */
    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    /** Timestamp set once when the entity is first persisted. */
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    /** Timestamp that is automatically refreshed on every update. */
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
import com.hanghai.kchtg.accesslog.interceptor.AccessLogInterceptor;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Records every user-facing access to the system for audit and traceability.
 * <p>
 * This entity is write-only from the application's perspective - the REST API
 * only exposes read operations. Log entries are typically created by an
 * {@link AccessLogInterceptor}
 * via {@link AsyncLogAppender}.
 * </p>
 */
@Entity
@Table(name = "access_logs", indexes = {
        @Index(name = "idx_type_createdAt", columnList = "type, createdAt"),
        @Index(name = "idx_severity_createdAt", columnList = "severity, createdAt"),
        @Index(name = "idx_action_createdAt", columnList = "action, createdAt"),
        @Index(name = "idx_userid_createdAt", columnList = "userId, createdAt")
})
@Getter
@Setter
@NoArgsConstructor
public class AccessLog {

    /** Primary key — UUID. */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /** ID of the user who performed the action. */
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    /** Login name at the time of the action (denormalised for query convenience). */
    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(max = 50, message = "Tên đăng nhập tối đa 50 ký tự")
    @Column(nullable = false, length = 50)
    private String username;

    /** Short description of the action (e.g. "LOGIN", "VIEW_REPORT", "CREATE_ORDER"). */
    @NotBlank(message = "Hành động không được để trống")
    @Size(max = 30, message = "Hành động tối đa 30 ký tự")
    @Column(nullable = false, length = 30)
    private String action;

    /** Logical module or feature area (e.g. "AUTH", "KCHT", "REPORT"). */
    @NotBlank(message = "Phân hệ không được để trống")
    @Size(max = 50, message = "Phân hệ tối đa 50 ký tự")
    @Column(nullable = false, length = 50)
    private String module;

    /** Client IP address captured at the edge. */
    @NotBlank(message = "Địa chỉ IP không được để trống")
    @Size(max = 45, message = "Địa chỉ IP tối đa 45 ký tự")
    @Column(name = "ip_address", nullable = false, length = 45)
    private String ipAddress;

    /** Client <code>User-Agent</code> header (may be empty for non-HTTP producers). */
    @Column(name = "user_agent", length = 500)
    private String userAgent;

    /** Email of the user (denormalised for fast filtering). */
    @Column(name = "email", length = 100)
    private String email;

    /** Organisational unit of the user (denormalised for fast filtering). */
    @Column(name = "org_unit", length = 100)
    private String orgUnit;

    /** Login session identifier. All actions in one session share this ID. */
    @Column(name = "session_id", length = 50)
    private String sessionId;

    /** Whether the action completed successfully or failed. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private AccessLogStatus status;

    /** Free-text detail - stack-trace, request body excerpt, or business context. */
    @Column(columnDefinition = "TEXT")
    private String detail;

    // ── F-005 new fields ─────────────────────────────────────────────

    /** Log type categorization: access, login, error, account, configuration. */
    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 20, nullable = false, columnDefinition = "VARCHAR(20) DEFAULT 'access'")
    private LogType type = LogType.ACCESS;

    /** Log severity level: info, warning, error, critical. */
    @Enumerated(EnumType.STRING)
    @Column(name = "severity", length = 20, nullable = false, columnDefinition = "VARCHAR(20) DEFAULT 'info'")
    private LogSeverity severity = LogSeverity.INFO;

    /** Target resource that was accessed or modified (e.g. "/api/users/123"). */
    @Column(name = "target_resource", length = 100)
    private String targetResource;

    /** Full request path captured at the interceptor level. */
    @Column(name = "request_path", length = 500)
    private String requestPath;

    /** HTTP response status code captured by the interceptor. */
    @Column(name = "response_code")
    private Integer responseCode;

    /** Request duration in milliseconds (computed by interceptor). */
    @Column(name = "duration_ms")
    private Integer durationMs;

    /** Structured metadata as a JSON string (log-type-specific payload). */
    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    /** Timestamp set once when the entity is first persisted. */
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    /** Timestamp that is automatically refreshed on every update. */
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
>>>>>>> company/main
