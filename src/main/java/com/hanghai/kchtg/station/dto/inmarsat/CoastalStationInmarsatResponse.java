package com.hanghai.kchtg.station.dto.inmarsat;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO cho Đài thông tin vệ tinh Inmarsat (F-098..F-103).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldNameConstants
public class CoastalStationInmarsatResponse {

    private UUID id;

    private UUID orgUnitId;
    private String orgUnitName;

    private UUID operatingOrgId;
    private String operatingOrgName;

    private String code;
    private String deviceCode;

    private String name;
    private String stationName;

    private Integer provinceId;
    private String provinceName;

    private String locationAddress;
    private String locationDetail;

    private ConditionStatus conditionStatus;
    private String conditionStatusLabel;
    private Boolean isActive;

    // --- Thông số đặc thù Inmarsat ---
    private String coverageZone;
    private String coverageArea;
    private String services;
    private String frequency;
    private String notes;
    private String description;

    // --- GIS ---
    private UUID spatialId;
    private String symbolId;
    private String objectType;
    private String geometryType;
    private String symbol;
    private String coordinateSystem;
    private String displayRule;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String coordinates;

    // --- Phê duyệt 2 cấp (M-1006) ---
    private ApprovalStatus approvalStatus;
    private ApprovalLevel approvalLevel;

    private LocalDateTime submittedAt;
    private UUID submittedBy;
    private String submittedByName;

    private UUID approverLevel1;
    private String approverNameLevel1;
    private String approverLevel1Name;
    private LocalDateTime approvedDateLevel1;

    private UUID approverLevel2;
    private String approverNameLevel2;
    private String approverLevel2Name;
    private LocalDateTime approvedDateLevel2;

    private UUID approvedBy;
    private String approvedByName;
    private LocalDateTime approvedDate;

    private String rejectionReason;
    private String level1ApprovalContent;
    private String level2ApprovalContent;
    private String approvalContentLevel1;
    private String approvalContentLevel2;

    // --- Audit ---
    private UUID createdBy;
    private String createdByName;
    private LocalDateTime createdAt;

    private UUID updatedBy;
    private String updatedByName;
    private LocalDateTime updatedAt;

    private UUID deletedBy;
    private LocalDateTime deletedAt;
}
