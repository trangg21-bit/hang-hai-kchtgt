package com.hanghai.kchtg.document.dto;

import com.hanghai.kchtg.document.entity.DocumentType;
import com.hanghai.kchtg.document.entity.LegalDocumentHistoryAction;
import com.hanghai.kchtg.document.entity.ValidityStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalDocumentHistoryResponse {
    private UUID id;
    private LegalDocumentHistoryAction action;
    private UUID changedBy;
    private String changedByName;
    private LocalDateTime changedAt;
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
    private String note;
}
