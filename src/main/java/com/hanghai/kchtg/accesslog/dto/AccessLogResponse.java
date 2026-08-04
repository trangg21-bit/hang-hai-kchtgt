package com.hanghai.kchtg.accesslog.dto;

import com.hanghai.kchtg.accesslog.entity.AccessLogStatus;
import com.hanghai.kchtg.accesslog.enums.LogSeverity;
import com.hanghai.kchtg.accesslog.enums.LogType;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Projection DTO returned by the read-only access-log API.
 * <p>
 * F-005 extends this with type, severity, targetResource, requestPath,
 * responseCode, durationMs, and metadata fields.
 * </p>
 */
@Data
public class AccessLogResponse {

    private final UUID id;
    private final UUID userId;
    private final String username;
    private final String action;
    private final String module;
    private final String ipAddress;
    private final String userAgent;
    private final String email;
    private final String orgUnit;
    private final String sessionId;
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

    // ── Entity-to-DTO constructor ────────────────────────────────────

    public AccessLogResponse(com.hanghai.kchtg.accesslog.entity.AccessLog entity) {
        this.id = entity.getId();
        this.userId = entity.getUserId();
        this.username = entity.getUsername();
        this.action = entity.getAction();
        this.module = entity.getModule();
        this.ipAddress = entity.getIpAddress();
        this.userAgent = entity.getUserAgent();
        this.email = entity.getEmail();
        this.orgUnit = entity.getOrgUnit();
        this.sessionId = entity.getSessionId();
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

}
