package com.hanghai.kchtg.document.dto;

import com.hanghai.kchtg.document.entity.DocumentType;
import com.hanghai.kchtg.document.entity.ValidityStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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

    @NotBlank(message = "Số hiệu văn bản không được để trống")
    private String documentNumber;

    @NotBlank(message = "Cơ quan ban hành không được để trống")
    private String issuingAuthority;

    @NotNull(message = "Ngày ban hành không được để trống")
    private LocalDate issueDate;

    @NotNull(message = "Ngày có hiệu lực không được để trống")
    private LocalDate effectiveDate;
    private LocalDate expirationDate;
    @NotNull(message = "Loại văn bản không được để trống")
    private DocumentType documentType;
    private String applicationArea;
    private ValidityStatus validityStatus;
    private String signer;
    private String description;
    private UUID createdBy;
    private Boolean draft;
}
