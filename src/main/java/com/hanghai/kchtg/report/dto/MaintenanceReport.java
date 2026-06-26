package com.hanghai.kchtg.report.dto;

import com.hanghai.kchtg.report.entity.ReportStatus;
import lombok.*;

import java.math.BigDecimal;

/**
 * DTO cho Báo cáo bảo trì — Mẫu 08.
 * Thống kê số lượng bảo trì, tổng chi phí theo loại cơ sở hạ tầng.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceReport {

    private String code;
    private String name;
    private String facilityType;
    private String period;
    private Integer maintenanceCount;
    private BigDecimal totalCost;
    private ReportStatus status;
}
