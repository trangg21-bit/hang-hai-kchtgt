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

@Entity
@Table(name = "access_logs", indexes = {
        @Index(name = "idx_type_createdAt", columnList = "type, createdAt"),
        @Index(name = "idx_severity_createdAt", columnList = "severity, createdAt"),
        @Index(name = "idx_action_createdAt", columnList = "action, createdAt"),
        @Index(name = "idx_userid_createdAt", columnList = "user_id, createdAt")
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

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getUsername() { return username; }
    public String getAction() { return action; }
    public String getModule() { return module; }
    public String getIpAddress() { return ipAddress; }
    public String getUserAgent() { return userAgent; }
    public String getEmail() { return email; }
    public String getOrgUnit() { return orgUnit; }
    public String getSessionId() { return sessionId; }
    public AccessLogStatus getStatus() { return status; }
    public String getDetail() { return detail; }
    public LogType getType() { return type; }
    public LogSeverity getSeverity() { return severity; }
    public String getTargetResource() { return targetResource; }
    public String getRequestPath() { return requestPath; }
    public Integer getResponseCode() { return responseCode; }
    public Integer getDurationMs() { return durationMs; }
    public String getMetadata() { return metadata; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void setId(UUID id) { this.id = id; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public void setUsername(String username) { this.username = username; }
    public void setAction(String action) { this.action = action; }
    public void setModule(String module) { this.module = module; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    public void setEmail(String email) { this.email = email; }
    public void setOrgUnit(String orgUnit) { this.orgUnit = orgUnit; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public void setStatus(AccessLogStatus status) { this.status = status; }
    public void setDetail(String detail) { this.detail = detail; }
    public void setType(LogType type) { this.type = type; }
    public void setSeverity(LogSeverity severity) { this.severity = severity; }
    public void setTargetResource(String targetResource) { this.targetResource = targetResource; }
    public void setRequestPath(String requestPath) { this.requestPath = requestPath; }
    public void setResponseCode(Integer responseCode) { this.responseCode = responseCode; }
    public void setDurationMs(Integer durationMs) { this.durationMs = durationMs; }
    public void setMetadata(String metadata) { this.metadata = metadata; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
