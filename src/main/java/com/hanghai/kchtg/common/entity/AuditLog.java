package com.hanghai.kchtg.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Audit log entity for tracking security-relevant events (including TOTP operations).
 */
@Entity
@Table(name = "audit_log")
@Getter
@Setter
public class AuditLog extends BaseEntity {

    /**
     * The user ID associated with this audit event.
     */
    @Column(name = "user_id", length = 36)
    private String userId;

    /**
     * The action performed (e.g. {@code TOTP_SETUP_INITIATED}, {@code TOTP_VERIFY_SUCCESS}).
     */
    @Column(name = "action", nullable = false, length = 100)
    private String action;

    /**
     * Free-form detail about the event.
     */
    @Column(name = "detail", length = 500)
    private String detail;

    /**
     * Optional structured metadata (JSON).
     */
    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    /**
     * IP address of the requester (if available).
     */
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    // NOTE: createdAt/updatedAt are inherited from {@link BaseEntity} via JPA auditing.
}