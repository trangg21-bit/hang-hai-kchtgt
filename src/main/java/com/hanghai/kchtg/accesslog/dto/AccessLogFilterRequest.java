package com.hanghai.kchtg.accesslog.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Request DTO for filtering access-log entries in the list endpoint.
 * <p>
 * All fields are optional — only supplied criteria are applied.
 * </p>
 */
public class AccessLogFilterRequest {

    private UUID userId;
    private String module;
    private LocalDateTime from;
    private LocalDateTime to;

    // ── Accessors ─────────────────────────────────────────────────

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getModule() {
        return module;
    }

    public void setModule(String module) {
        this.module = module;
    }

    public LocalDateTime getFrom() {
        return from;
    }

    public void setFrom(LocalDateTime from) {
        this.from = from;
    }

    public LocalDateTime getTo() {
        return to;
    }

    public void setTo(LocalDateTime to) {
        this.to = to;
    }
}
