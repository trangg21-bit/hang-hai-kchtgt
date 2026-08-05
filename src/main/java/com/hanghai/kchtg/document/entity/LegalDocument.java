package com.hanghai.kchtg.document.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import com.hanghai.kchtg.common.entity.BaseEntity;

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
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class LegalDocument extends BaseEntity {

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

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "document_type")
    private DocumentType documentType;

    @Column(name = "application_area", length = 100)
    private String applicationArea;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "status")
    private ValidityStatus validityStatus;

    @Column(name = "signer", length = 100)
    private String signer;

    @Column(name = "description", length = 500)
    private String description;

    @OneToMany(mappedBy = "legalDocument", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AttachedDocument> attachedDocuments = new ArrayList<>();

    public void softDelete(UUID operatorId) {
        super.softDelete(operatorId);
        this.validityStatus = ValidityStatus.EXPIRED;
    }
}
