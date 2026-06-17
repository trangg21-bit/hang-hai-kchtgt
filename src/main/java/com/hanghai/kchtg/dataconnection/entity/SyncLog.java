package com.hanghai.kchtg.dataconnection.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * Nh?t kư d?ng b? d? li?u — ghi l?i m?i l?n sync gi?a các h? th?ng liên thông.
 */
@Entity
@Table(name = "sync_logs")
@Getter
@Setter
@NoArgsConstructor
public class SyncLog extends BaseEntity {

    /** ID c?a data connection du?c d?ng b?. */
    @Column(name = "connection_id", nullable = false)
    private UUID connectionId;

    /** Th?i gian b?t d?u d?ng b?. */
    @Column(name = "start_time", nullable = false)
    private java.time.LocalDateTime startTime;

    /** Th?i gian k?t thúc d?ng b? (null n?u dang ch?y). */
    @Column(name = "end_time")
    private java.time.LocalDateTime endTime;

    /** S? record dă x? lư thành công. */
    @Column(name = "records_processed", nullable = false)
    private int recordsProcessed = 0;

    /** S? record x? lư th?t b?i. */
    @Column(name = "records_failed", nullable = false)
    private int recordsFailed = 0;

    /** Tr?ng thái d?ng b?. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SyncStatus status;

    /**
     * Tr?ng thái d?ng b?.
     */
    public enum SyncStatus {
        PENDING,
        RUNNING,
        COMPLETED,
        FAILED,
        PARTIAL
    }

    /**
     * T?o m?i SyncLog v?i tr?ng thái PENDING.
     */
    public static SyncLog createPending(UUID connectionId) {
        SyncLog log = new SyncLog();
        log.setConnectionId(connectionId);
        log.setStartTime(java.time.LocalDateTime.now());
        log.setStatus(SyncStatus.PENDING);
        return log;
    }

    /**
     * Hoàn t?t sync log.
     */
    public void complete(int processed, int failed) {
        this.endTime = java.time.LocalDateTime.now();
        this.recordsProcessed = processed;
        this.recordsFailed = failed;
        this.status = failed > 0 ? SyncStatus.PARTIAL : SyncStatus.COMPLETED;
    }

    /**
     * Đánh d?u sync th?t b?i.
     */
    public void fail(String reason) {
        this.endTime = java.time.LocalDateTime.now();
        this.recordsFailed++;
        this.status = SyncStatus.FAILED;
    }
}
