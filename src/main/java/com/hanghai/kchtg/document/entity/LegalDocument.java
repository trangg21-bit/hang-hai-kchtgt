package com.hanghai.kchtg.document.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Văn bản pháp lý — records legal documents in the port administration system.
 * Used by F-128 Quản lý văn bản pháp lý.
 */
@Entity
@Table(name = "legal_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private UUID id;

    @Column(name = "document_name", nullable = false, length = 200)
    private String documentName;

    @Column(name = "document_number", length = 50)
    private String documentNumber;

    @Column(name = "issuing_authority", length = 200)
    private String issuingAuthority;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "effective_date")
    private LocalDate effectiveDate;

    @Column(name = "expiration_date")
    private LocalDate expirationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", length = 30)
    private DocumentType documentType;

    @Column(name = "application_area", length = 100)
    private String applicationArea;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30)
    private ValidityStatus validityStatus;

    @Column(name = "signer", length = 100)
    private String signer;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "created_by", length = 100)
    private UUID createdBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdDate;

    @Column(name = "updated_by", length = 100)
    private UUID updatedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedDate;

    @OneToMany(mappedBy = "legalDocument", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AttachedDocument> attachedDocuments = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdDate = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedDate = LocalDateTime.now();
    }
}
