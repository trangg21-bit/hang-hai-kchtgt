package com.hanghai.kchtg.document.dto;

import com.hanghai.kchtg.document.entity.DocumentType;
import com.hanghai.kchtg.document.entity.ValidityStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

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
    private LocalDate issueDate;
    private LocalDate effectiveDate;
    private LocalDate expirationDate;
    private DocumentType documentType;
    private String applicationArea;
    private ValidityStatus validityStatus;
    private String signer;
    private String description;
    private UUID createdBy;
}
