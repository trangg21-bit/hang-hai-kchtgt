package com.hanghai.kchtg.document.entity;

import java.util.UUID;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Tiến độ xử lý sự cố — incident progress tracking.
 * Used by F-131 Quản lý thông tin sự cố.
 */
@Entity
@Table(name = "processing_progress")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessingProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "progress_description", columnDefinition = "TEXT")
    private String progressDescription;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;
}
