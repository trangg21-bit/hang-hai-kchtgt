package com.hanghai.kchtg.document.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Kết quả tìm kiếm — stored search result snapshots.
 * Used by F-135 Tìm kiếm văn bản pháp lý.
 */
@Entity
@Table(name = "search_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchResultEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "document_id")
    private java.util.UUID documentId;

    @Column(name = "document_name", length = 300)
    private String documentName;

    @Column(name = "document_number", length = 100)
    private String documentNumber;

    @Column(name = "issuing_authority", length = 200)
    private String issuingAuthority;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "relevance_score", length = 500)
    private String relevanceScore;

    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;
}
