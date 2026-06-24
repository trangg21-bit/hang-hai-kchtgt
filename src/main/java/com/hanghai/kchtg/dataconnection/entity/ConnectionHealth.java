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
 * Sức khỏe kết nối dữ liệu - ghi lại kết quả health check định kỳ
 * cho mọi data connection (trạng thái HTTP, độ trễ, lỗi).
 */
@Entity
@Table(name = "connection_health")
@Getter
@Setter
@NoArgsConstructor
public class ConnectionHealth extends BaseEntity {

    /** ID của data connection được kiểm tra. */
    @Column(name = "connection_id", nullable = false)
    private UUID connectionId;

    /** Mã HTTP status trả về (200, 500, timeout, etc.). */
    @Column(name = "status_code")
    private Integer statusCode;

    /** Độ trễ của kết nối (ms). */
    @Column(name = "latency_ms")
    private Long latencyMs;

    /** Thời điểm kiểm tra. */
    @Column(name = "checked_at", nullable = false)
    private java.time.LocalDateTime checkedAt;

    /** Thông báo lỗi (nếu có). */
    @Column(name = "error_message", length = 500)
    private String errorMessage;

    /**
     * Tạo mới ConnectionHealth.
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