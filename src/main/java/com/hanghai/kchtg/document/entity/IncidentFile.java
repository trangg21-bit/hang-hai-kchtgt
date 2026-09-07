package com.hanghai.kchtg.document.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Tệp thông tin / kết quả xử lý sự cố (F-131 child table incident_file).
 * One table, two file intents: file_category 'INFO' (Thông tin sự cố)
 * vs 'RESULT' (Kết quả xử lý).
 */
@Entity
@Table(name = "incident_file")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class IncidentFile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(name = "file_type", length = 50)
    private String fileType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;

    @Column(name = "uploaded_by")
    private UUID uploadedBy;

    @Column(name = "file_category", length = 20)
    private String fileCategory;
}
