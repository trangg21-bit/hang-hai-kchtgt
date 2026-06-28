package com.hanghai.kchtg.accesslog.dto;

import com.hanghai.kchtg.accesslog.entity.AccessLog;
import com.hanghai.kchtg.accesslog.entity.AccessLogStatus;
import com.hanghai.kchtg.accesslog.enums.LogSeverity;
import com.hanghai.kchtg.accesslog.enums.LogType;

import java.time.LocalDateTime;

/**
 * Projection DTO returned by the read-only access-log API.
 * <p>
 * F-005 extends this with type, severity, targetResource, requestPath,
 * responseCode, durationMs, and metadata fields.
 * </p>
 */
public class AccessLogResponse {

    private final Long id;
    private final Long userId;
    private final String username;
    private final String action;
    private final String module;
    private final String ipAddress;
    private final String userAgent;
    private final AccessLogStatus status;
    private final String detail;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    // ── F-005 new fields ─────────────────────────────────────────────

    private final LogType type;
    private final LogSeverity severity;
    private final String targetResource;
    private final String requestPath;
    private final Integer responseCode;
    private final Integer durationMs;
    private final String metadata;

    public AccessLogResponse(AccessLog entity) {
        this.id = entity.getId();
        this.userId = entity.getUserId();
        this.username = entity.getUsername();
        this.action = entity.getAction();
        this.module = entity.getModule();
        this.ipAddress = entity.getIpAddress();
        this.userAgent = entity.getUserAgent();
        this.status = entity.getStatus();
        this.detail = entity.getDetail();
        this.createdAt = entity.getCreatedAt();
        this.updatedAt = entity.getUpdatedAt();
        this.type = entity.getType();
        this.severity = entity.getSeverity();
        this.targetResource = entity.getTargetResource();
        this.requestPath = entity.getRequestPath();
        this.responseCode = entity.getResponseCode();
        this.durationMs = entity.getDurationMs();
        this.metadata = entity.getMetadata();
    }

    // ── Original accessors ───────────────────────────────────────────

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getUsername() { return username; }
    public String getAction() { return action; }
    public String getModule() { return module; }
    public String getIpAddress() { return ipAddress; }
    public String getUserAgent() { return userAgent; }
    public AccessLogStatus getStatus() { return status; }
    public String getDetail() { return detail; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // ── F-005 accessors ──────────────────────────────────────────────

    public LogType getType() { return type; }
    public LogSeverity getSeverity() { return severity; }
    public String getTargetResource() { return targetResource; }
    public String getRequestPath() { return requestPath; }
    public Integer getResponseCode() { return responseCode; }
    public Integer getDurationMs() { return durationMs; }
    public String getMetadata() { return metadata; }
}
