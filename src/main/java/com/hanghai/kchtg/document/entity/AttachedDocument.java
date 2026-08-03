package com.hanghai.kchtg.document.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Tài liệu đính kèm văn bản pháp lý.
 * Used by F-128 Quản lý văn bản pháp lý.
 */
@Entity
@Table(name = "attached_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttachedDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private LegalDocument legalDocument;

    @Column(name = "document_name", nullable = false, length = 200)
    private String documentName;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "uploaded_at")
    private LocalDate uploadedAt;
}
