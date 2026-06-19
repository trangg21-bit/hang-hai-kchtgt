package com.hanghai.kchtg.report.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportRequest {

    @NotBlank(message = "Mã báo cáo không được để trống")
    private String reportCode;

    private LocalDate startDate;
    private LocalDate endDate;
    private UUID orgUnitId;
    private String format; // PREVIEW, EXCEL, PDF
}
