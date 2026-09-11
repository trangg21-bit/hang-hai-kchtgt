package com.hanghai.kchtg.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportRecordDto {
    private UUID id;
    private UUID orgUnitId;
    private String orgUnitName;
    private String reportCode;
    private String reportPeriod;
    private Integer reportYear;
    private String status;
    private String reportData;
    private String notes;
    private Long version;
    private LocalDateTime createdDate;
    private LocalDateTime lastModifiedDate;
}
