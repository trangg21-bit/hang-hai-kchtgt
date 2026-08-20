package com.hanghai.kchtg.document.dto;

import com.hanghai.kchtg.document.entity.DocumentType;
import com.hanghai.kchtg.document.entity.ValidityStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.hanghai.kchtg.security.RecordSecurityLevel;
import lombok.experimental.FieldNameConstants;

/**
 * Response DTO for LegalDocument.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class LegalDocumentResponse {

    private UUID id;
    private RecordSecurityLevel securityLevel;
    private String documentName;
    private String documentNumber;
    private String issuingAuthority;
    private LocalDate issueDate;
    private LocalDate effectiveDate;
    private LocalDate expirationDate;
    private DocumentType documentType;
    private String applicationArea;
    private ValidityStatus validityStatus;
    private String signer;
    private String description;
    private UUID createdBy;
    private LocalDateTime createdDate;
    private UUID updatedBy;
    /** Display name resolved from app_users; updatedBy remains the audit UUID. */
    private String updatedByName;
    private LocalDateTime updatedDate;
    private List<AttachedDocumentResponse> attachedDocuments;
    private boolean draft;
}
