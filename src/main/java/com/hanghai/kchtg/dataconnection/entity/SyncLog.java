package com.hanghai.kchtg.dataconnection.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * Nhật ký đồng bộ dữ liệu - ghi lại mọi lần sync giữa các hệ thống liên thông.
 */
@Entity
@Table(name = "sync_logs")
@Getter
@Setter
@NoArgsConstructor
public class SyncLog extends BaseEntity {

    /** ID của data connection được đồng bộ. */
    @Column(name = "connection_id", nullable = false)
    private UUID connectionId;

    /** Thời gian bắt đầu đồng bộ. */
    @Column(name = "start_time", nullable = false)
    private java.time.LocalDateTime startTime;

    /** Thời gian kết thúc đồng bộ (null nếu đang chạy). */
    @Column(name = "end_time")
    private java.time.LocalDateTime endTime;

    /** Số record đã xử lý thành công. */
    @Column(name = "records_processed", nullable = false)
    private int recordsProcessed = 0;

    /** Số record xử lý thất bại. */
    @Column(name = "records_failed", nullable = false)
    private int recordsFailed = 0;

    /** Trạng thái đồng bộ. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SyncStatus status;

    /**
     * Trạng thái đồng bộ.
     */
    public enum SyncStatus {
        PENDING,
        RUNNING,
        COMPLETED,
        FAILED,
        PARTIAL
    }

    /**
     * Tạo mới SyncLog vỏi trạng thái PENDING.
     */
    public static SyncLog createPending(UUID connectionId) {
        SyncLog log = new SyncLog();
        log.setConnectionId(connectionId);
        log.setStartTime(java.time.LocalDateTime.now());
        log.setStatus(SyncStatus.PENDING);
        return log;
    }

    /**
     * Hoàn tất sync log.
     */
    public void complete(int processed, int failed) {
        this.endTime = java.time.LocalDateTime.now();
        this.recordsProcessed = processed;
        this.recordsFailed = failed;
        this.status = failed > 0 ? SyncStatus.PARTIAL : SyncStatus.COMPLETED;
    }

    /**
     * Đánh dấu sync thất bại.
     */
    public void fail(String reason) {
        this.endTime = java.time.LocalDateTime.now();
        this.recordsFailed++;
        this.status = SyncStatus.FAILED;
    }
}
