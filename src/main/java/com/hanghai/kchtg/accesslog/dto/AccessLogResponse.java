package com.hanghai.kchtg.accesslog.dto;

import com.hanghai.kchtg.accesslog.entity.AccessLog;
import com.hanghai.kchtg.accesslog.entity.AccessLogStatus;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Projection DTO returned by the read-only access-log API.
 * <p>
 * Constructed from an {@link AccessLog} entity to avoid exposing JPA internals.
 * </p>
 */
public class AccessLogResponse {

    private final UUID id;
    private final UUID userId;
    private final String username;
    private final String action;
    private final String module;
    private final String ipAddress;
    private final String userAgent;
    private final AccessLogStatus status;
    private final String detail;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

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
    }

    // =========================================================================

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getUsername() {
        return username;
    }

    public String getAction() {
        return action;
    }

    public String getModule() {
        return module;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public AccessLogStatus getStatus() {
        return status;
    }

    public String getDetail() {
        return detail;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}