package com.hanghai.kchtg.document.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * File quy hoạch — planning document attachments.
 * Used by F-132 Quản lý quy hoạch bến cảng.
 */
@Entity
@Table(name = "planning_files")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanningFile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "port_planning_id")
    private java.util.UUID portPlanningId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "port_planning_id", insertable = false, updatable = false)
    private PortPlanning portPlanning;

    @Column(name = "file_name", length = 300)
    private String fileName;

    @Column(name = "file_type", length = 50)
    private String fileType;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "uploaded_at", updatable = false)
    private LocalDateTime uploadedAt;

    @Column(name = "uploaded_by", length = 100)
    private String uploadedBy;

    @PrePersist
    protected void onCreate() {
        this.uploadedAt = LocalDateTime.now();
    }
}
