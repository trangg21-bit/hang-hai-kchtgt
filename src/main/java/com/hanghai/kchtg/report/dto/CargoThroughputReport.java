package com.hanghai.kchtg.report.dto;

import com.hanghai.kchtg.report.entity.ReportStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO cho Báo cáo lưu lượng hàng hóa qua cảng — Mẫu 05/06.
 * Tập trung vào khối lượng hàng hóa phân theo cảng, loại hàng, tháng/năm.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CargoThroughputReport {

    private String code;
    private String name;
    private String portCode;
    private String cargoType;
    private Integer month;
    private Integer year;
    private BigDecimal totalVolume;
    private ReportStatus status;
}
