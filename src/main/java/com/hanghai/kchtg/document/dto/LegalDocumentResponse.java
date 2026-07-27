package com.hanghai.kchtg.document.dto;

import java.util.UUID;

import com.hanghai.kchtg.document.entity.DocumentType;
import com.hanghai.kchtg.document.entity.ValidityStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for LegalDocument.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalDocumentResponse {

    private UUID id;
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
    private LocalDateTime updatedDate;
    private List<AttachedDocumentResponse> attachedDocuments;
}
