package com.hanghai.kchtg.accesslog.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * Records every user-facing access to the system for audit and traceability.
 * <p>
 * This entity is write-only from the application's perspective â€” the REST API
 * only exposes read operations. Log entries are typically created by a
 * cross-cutting aspect or an event-listening component (not implemented here).
 * </p>
 */
@Entity
@Table(name = "access_logs")
@Getter
@Setter
@NoArgsConstructor
public class AccessLog extends BaseEntity {

    /** ID of the user who performed the action. */
    @Column(nullable = false)
    private UUID userId;

    /** Login name at the time of the action (denormalised for query convenience). */
    @NotBlank(message = "Username khong duoc de trong")
    @Size(max = 100, message = "Username toi da 100 ky tu")
    @Column(nullable = false, length = 100)
    private String username;

    /** Short description of the action (e.g. "LOGIN", "VIEW_REPORT", "CREATE_ORDER"). */
    @NotBlank(message = "Action khong duoc de trong")
    @Size(max = 100, message = "Action toi da 100 ky tu")
    @Column(nullable = false, length = 80)
    private String action;

    /** Logical module or feature area (e.g. "AUTH", "KCHT", "REPORT"). */
    @NotBlank(message = "Module khong duoc de trong")
    @Size(max = 50, message = "Module toi da 50 ky tu")
    @Column(nullable = false, length = 60)
    private String module;

    /** Client IP address captured at the edge. */
    @NotBlank(message = "IP address khong duoc de trong")
    @Size(max = 45, message = "IP address toi da 45 ky tu")
    @Column(name = "ip_address", nullable = false, length = 45)
    private String ipAddress;

    /** Client <code>User-Agent</code> header (may be empty for non-HTTP producers). */
    @Column(name = "user_agent", length = 500)
    private String userAgent;

    /** Whether the action completed successfully or failed. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private AccessLogStatus status;

    /** Free-text detail â€” stack-trace, request body excerpt, or business context. */
    @Column(columnDefinition = "TEXT")
    private String detail;
}
