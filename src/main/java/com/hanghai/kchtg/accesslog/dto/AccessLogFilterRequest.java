package com.hanghai.kchtg.accesslog.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Request DTO for filtering access-log entries in the list endpoint.
 * <p>
 * All fields are optional — only supplied criteria are applied.
 * F-005 adds {@code type}, {@code severity}, and {@code keyword} filters.
 * </p>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccessLogFilterRequest {

    private UUID userId;
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

    // ── F-005 v2 filters (email, orgUnit, sessionId) ───────────────────

    /** Filter by user email (denormalised on AccessLog). */
    private String email;

    /** Filter by organisational unit (denormalised on AccessLog). */
    private String orgUnit;

    /** Filter by session identifier. */
    private String sessionId;

    /** Filter by username. */
    private String username;

    /** Filter by granted permission status (true = access allowed, false = permission denied). */
    private Boolean granted;

}
