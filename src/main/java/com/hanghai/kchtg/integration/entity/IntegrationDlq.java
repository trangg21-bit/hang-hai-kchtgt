package com.hanghai.kchtg.integration.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

import java.util.UUID;

/**
 * Stores failed records from integration sync jobs for later retry or inspection (Dead-Letter Queue).
 */
@Entity
@Table(name = "kchtgt_integration_dlq")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IntegrationDlq extends BaseEntity {

    @Column(name = "sync_job_id", nullable = false)
    private UUID syncJobId;

    @Column(name = "source_record", columnDefinition = "TEXT")
    private String sourceRecord;

    @Column(name = "error_type", length = 100)
    private String errorType;

    @Column(name = "error_detail", columnDefinition = "TEXT")
    private String errorDetail;

    @Column(name = "resolved")
    private Boolean resolved;
}