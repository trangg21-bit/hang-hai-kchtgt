package com.hanghai.kchtg.document.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "legal_document_history", indexes = {
        @Index(name = "idx_legal_document_history_document", columnList = "legal_document_id"),
        @Index(name = "idx_legal_document_history_changed_at", columnList = "changed_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalDocumentHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "legal_document_id", nullable = false)
    private LegalDocument legalDocument;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 40)
    private LegalDocumentHistoryAction action;

    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "changed_by")
    private UUID changedBy;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;

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
    @Column(name = "validity_status")
    private ValidityStatus validityStatus;

    @Column(name = "signer", length = 100)
    private String signer;

    @Column(name = "description", length = 500)
    private String description;
}
