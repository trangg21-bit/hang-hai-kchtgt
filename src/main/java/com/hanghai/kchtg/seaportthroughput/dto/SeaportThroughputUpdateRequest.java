package com.hanghai.kchtg.seaportthroughput.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;

import java.math.BigDecimal;

/**
 * Request sửa bản ghi sản lượng cảng biển — đơn vị quản lý (orgUnitId) không đổi khi sửa;
 * trường null = giữ nguyên giá trị hiện tại.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
public class SeaportThroughputUpdateRequest {

    /** Tháng tổng hợp, định dạng yyyy-MM (vd 2026-08). */
    private String reportMonth;

    private BigDecimal domesticContainerTon;
    private BigDecimal domesticContainerTonKm;
    private BigDecimal domesticDryTon;
    private BigDecimal domesticDryTonKm;
    private BigDecimal domesticLiquidTon;
    private BigDecimal domesticLiquidTonKm;
    private BigDecimal domesticOtherTon;
    private BigDecimal domesticOtherTonKm;

    private BigDecimal foreignContainerTon;
    private BigDecimal foreignContainerTonKm;
    private BigDecimal foreignDryTon;
    private BigDecimal foreignDryTonKm;
    private BigDecimal foreignLiquidTon;
    private BigDecimal foreignLiquidTonKm;
    private BigDecimal foreignOtherTon;
    private BigDecimal foreignOtherTonKm;

    private BigDecimal routeContainerTon;
    private BigDecimal routeContainerTonKm;
    private BigDecimal routeDryTon;
    private BigDecimal routeDryTonKm;
    private BigDecimal routeLiquidTon;
    private BigDecimal routeLiquidTonKm;
    private BigDecimal routeOtherTon;
    private BigDecimal routeOtherTonKm;

    private Long passengerTrips;

    private String note;
}
