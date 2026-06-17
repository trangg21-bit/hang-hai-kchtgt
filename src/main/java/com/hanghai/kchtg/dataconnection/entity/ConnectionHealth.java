package com.hanghai.kchtg.dataconnection.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * S?c kh?e k?t n?i d? li?u — ghi l?i k?t qu? health check d?nh k?
 * cho m?i data connection (tr?ng thái HTTP, d? tr?, l?i).
 */
@Entity
@Table(name = "connection_health")
@Getter
@Setter
@NoArgsConstructor
public class ConnectionHealth extends BaseEntity {

    /** ID c?a data connection du?c ki?m tra. */
    @Column(name = "connection_id", nullable = false)
    private UUID connectionId;

    /** Mă HTTP status tr? v? (200, 500, timeout, etc.). */
    @Column(name = "status_code")
    private Integer statusCode;

    /** Đ? tr? c?a k?t n?i (ms). */
    @Column(name = "latency_ms")
    private Long latencyMs;

    /** Th?i di?m ki?m tra. */
    @Column(name = "checked_at", nullable = false)
    private java.time.LocalDateTime checkedAt;

    /** Thông báo l?i (n?u có). */
    @Column(name = "error_message", length = 500)
    private String errorMessage;

    /**
     * T?o m?i ConnectionHealth.
     */
    public static ConnectionHealth create(UUID connectionId, int statusCode, long latencyMs,
                                           String errorMessage) {
        ConnectionHealth health = new ConnectionHealth();
        health.setConnectionId(connectionId);
        health.setStatusCode(statusCode);
        health.setLatencyMs(latencyMs);
        health.setErrorMessage(errorMessage);
        health.setCheckedAt(java.time.LocalDateTime.now());
        return health;
    }
}
