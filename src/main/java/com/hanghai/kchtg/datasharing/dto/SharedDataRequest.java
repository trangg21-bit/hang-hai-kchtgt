package com.hanghai.kchtg.datasharing.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SharedDataRequest {
    @NotBlank
    private String dataType; // matches ShareDataType enum values

    @NotBlank
    private String sharedWith; // recipient organization

    private LocalDate sharedAt;
    private LocalDate expiresAt;

    private String fileUrl;
    private String fileFormat; // CSV, JSON, XML, PDF

    private Integer recordCount;
    private String description;
    private String approvedBy;
    private LocalDate approvedAt;
}
