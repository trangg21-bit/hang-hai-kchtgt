package com.hanghai.kchtg.seaportthroughput.dto;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** Response chi tiết bản ghi sản lượng cảng biển (bao gồm orgUnitName + approval metadata + files). */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeaportThroughputResponse {

    private UUID id;
    private UUID orgUnitId;
    private String orgUnitName;
    private LocalDate reportMonth;
    private String note;

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

    private long passengerTrips;

    private ApprovalStatus approvalStatus;
    private LocalDateTime submittedAt;
    private UUID submittedBy;
    private UUID approverLevel1;
    private LocalDateTime approvedDateLevel1;
    private String level1ApprovalContent;
    private UUID approverLevel2;
    private LocalDateTime approvedDateLevel2;
    private String level2ApprovalContent;
    private String rejectionReason;

    private UUID createdBy;
    private LocalDateTime createdAt;
    private UUID updatedBy;
    private LocalDateTime updatedAt;

    @Builder.Default
    private List<SeaportThroughputFileResponse> files = new ArrayList<>();
}
