package com.hanghai.kchtg.accesslog.entity;

import com.hanghai.kchtg.accesslog.enums.LogSeverity;
import com.hanghai.kchtg.accesslog.enums.LogType;
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

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id")
    private UUID userId;

    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(max = 50, message = "Tên đăng nhập tối đa 50 ký tự")
    @Column(nullable = false, length = 50)
    private String username;

    @NotBlank(message = "Hành động không được để trống")
    @Size(max = 30, message = "Hành động tối đa 30 ký tự")
    @Column(nullable = false, length = 30)
    private String action;

    @NotBlank(message = "Phân hệ không được để trống")
    @Size(max = 50, message = "Phân hệ tối đa 50 ký tự")
    @Column(nullable = false, length = 50)
    private String module;

    @NotBlank(message = "Địa chỉ IP không được để trống")
    @Size(max = 45, message = "Địa chỉ IP tối đa 45 ký tự")
    @Column(name = "ip_address", nullable = false, length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "org_unit", length = 100)
    private String orgUnit;

    @Column(name = "session_id", length = 50)
    private String sessionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private AccessLogStatus status;

    @Column(columnDefinition = "TEXT")
    private String detail;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 20, nullable = false, columnDefinition = "VARCHAR(20) DEFAULT 'access'")
    private LogType type = LogType.ACCESS;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", length = 20, nullable = false, columnDefinition = "VARCHAR(20) DEFAULT 'info'")
    private LogSeverity severity = LogSeverity.INFO;

    @Column(name = "target_resource", length = 100)
    private String targetResource;

    @Column(name = "request_path", length = 500)
    private String requestPath;

    @Column(name = "response_code")
    private Integer responseCode;

    @Column(name = "duration_ms")
    private Integer durationMs;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
