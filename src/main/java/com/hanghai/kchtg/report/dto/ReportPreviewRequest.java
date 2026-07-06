package com.hanghai.kchtg.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportPreviewRequest {
    private String reportCode;
    private LocalDate startDate;
    private LocalDate endDate;
    private String orgUnitId;
    private String format;
    private String bcNoiDung;
}
