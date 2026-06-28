package com.hanghai.kchtg.accesslog.dto;

import java.time.LocalDateTime;

/**
 * Request DTO for filtering access-log entries in the list endpoint.
 * <p>
 * All fields are optional — only supplied criteria are applied.
 * F-005 adds {@code type}, {@code severity}, and {@code keyword} filters.
 * </p>
 */
public class AccessLogFilterRequest {

    private Long userId;
    private String module;
    private String action;
    private LocalDateTime from;
    private LocalDateTime to;

    // ── F-005 new filters ────────────────────────────────────────────

    /** Filter by log type (access, login, error, account, configuration). */
    private String type;

    /** Filter by log severity (info, warning, error, critical). */
    private String severity;

    /** Case-insensitive keyword search on detail/message field. */
    private String keyword;

    // ── Accessors ─────────────────────────────────────────────────────

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getModule() { return module; }
    public void setModule(String module) { this.module = module; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public LocalDateTime getFrom() { return from; }
    public void setFrom(LocalDateTime from) { this.from = from; }
    public LocalDateTime getTo() { return to; }
    public void setTo(LocalDateTime to) { this.to = to; }

    // ── F-005 accessors ──────────────────────────────────────────────

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getKeyword() { return keyword; }
    public void setKeyword(String keyword) { this.keyword = keyword; }
}
