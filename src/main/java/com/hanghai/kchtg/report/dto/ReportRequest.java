package com.hanghai.kchtg.report.dto;

import com.hanghai.kchtg.report.entity.ReportFormat;
import com.hanghai.kchtg.report.entity.ReportType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Map;

/**
 * Request DTO cho việc tạo / yêu cầu sinh báo cáo tổng hợp (M-016).
 * Bao gồm type, khoảng thời gian, định dạng đầu ra và các tham số động.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportRequest {

    @NotNull(message = "reportType không được để trống")
    private ReportType reportType;

    @NotNull(message = "startDate không được để trống")
    private LocalDate startDate;

    @NotNull(message = "endDate không được để trống")
    private LocalDate endDate;

    @NotNull(message = "outputFormat không được để trống")
    private ReportFormat outputFormat;

    private Map<String, Object> parameters;
}
