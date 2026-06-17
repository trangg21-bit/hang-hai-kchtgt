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
    private String action;
    private LocalDateTime from;
    private LocalDateTime to;

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getModule() { return module; }
    public void setModule(String module) { this.module = module; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public LocalDateTime getFrom() { return from; }
    public void setFrom(LocalDateTime from) { this.from = from; }
    public LocalDateTime getTo() { return to; }
    public void setTo(LocalDateTime to) { this.to = to; }
}