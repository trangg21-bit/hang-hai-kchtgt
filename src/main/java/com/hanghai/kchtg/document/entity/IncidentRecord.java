package com.hanghai.kchtg.document.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Biên bản sự cố — incident records with recovery measures.
 * Used by F-131 Quản lý thông tin sự cố.
 */
@Entity
@Table(name = "incident_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IncidentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private UUID id;

    @Column(name = "incident_id")
    private java.util.UUID incidentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id", insertable = false, updatable = false)
    private Incident incident;

    @Column(name = "detailed_description", columnDefinition = "TEXT")
    private String detailedDescription;

    @Column(name = "remedial_measures", columnDefinition = "TEXT")
    private String remedialMeasures;

    @Column(name = "processing_end_time")
    private LocalDateTime processingEndTime;

    @Column(name = "recorder", length = 100)
    private String recorder;

    @Column(name = "recorded_at", updatable = false)
    private LocalDateTime recordedAt;

    @Column(name = "attached_documents", length = 500)
    private String attachedDocuments;

    @PrePersist
    protected void onCreate() {
        this.recordedAt = LocalDateTime.now();
    }
}
