package com.hanghai.kchtg.datasharing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SharedDataResponse {
    private Long id;
    private String code;
    private String name;
    private String dataType;
    private String shareStatus;
    private String sharedWith;
    private LocalDate sharedAt;
    private LocalDate expiresAt;
    private String fileUrl;
    private String fileFormat;
    private Integer recordCount;
    private String description;
    private String approvedBy;
    private LocalDate approvedAt;
    private String createdBy;
    private String updatedBy;
}
