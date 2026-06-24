package com.hanghai.kchtg.integration.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Tracks synchronization jobs executed for physical infrastructure data ingestion.
 */
@Entity
@Table(name = "kchtgt_integration_sync_job")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IntegrationSyncJob extends BaseEntity {

    @Column(name = "feature_code", nullable = false, length = 50)
    private String featureCode;

    @Column(name = "source_url", length = 1000)
    private String sourceUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private SyncStatus status;

    @Column(name = "records_total")
    private Integer recordsTotal;

    @Column(name = "records_success")
    private Integer recordsSuccess;

    @Column(name = "records_failed")
    private Integer recordsFailed;

    @Column(name = "error_message", length = 4000)
    private String errorMessage;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "retry_count")
    private Integer retryCount;

    public enum SyncStatus {
        PENDING, RUNNING, COMPLETED, FAILED
    }
}