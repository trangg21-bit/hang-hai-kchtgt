package com.hanghai.kchtg.document.dto;

import java.util.UUID;

import com.hanghai.kchtg.document.entity.DocumentType;
import com.hanghai.kchtg.document.entity.ValidityStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a LegalDocument record.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalDocumentCreateRequest {

    @NotBlank(message = "Tên văn bản không được để trống")
    private String documentName;

    private String documentNumber;
    private String issuingAuthority;
    private java.time.LocalDate issueDate;
    private java.time.LocalDate effectiveDate;
    private java.time.LocalDate expirationDate;
    private DocumentType documentType;
    private String applicationArea;
    private ValidityStatus validityStatus;
    private String signer;
    private String description;
    private UUID createdBy;
}
