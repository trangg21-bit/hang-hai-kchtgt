package com.hanghai.kchtg.aissystem.dto;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.enums.UnitOfMeasure;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
public class AisSystemListItem {
    private UUID id;
    private String code;
    private String name;
    private UUID vtsOperationCenterId;
    private String vtsOperationCenterName;
    private UUID vtsSystemId;
    private String vtsSystemName;
    private UUID radarStationId;
    private String radarStationName;
    private String locationTypeName;
    private String attachedLocationName;
    private UUID operatingOrgId;
    private String operatingOrgName;
    private UUID orgUnitId;
    private String orgUnitName;
    private Integer provinceId;
    private String provinceName;
    private String detailedLocation;
    private UnitOfMeasure unitOfMeasure;
    private String unitOfMeasureLabel;
    private Integer quantity;
    private String model;
    private String manufacturer;
    private Integer commissioningYear;
    private ConditionStatus conditionStatus;
    private ApprovalStatus approvalStatus;
    private String approvalStatusLabel;
    private LocalDateTime updatedAt;
    private UUID updatedBy;
    private String updatedByName;
    private LocalDateTime createdAt;
    private UUID createdBy;
    private String createdByName;
    private UUID approverLevel1;
    private String approverLevel1Name;
    private LocalDateTime approvedDateLevel1;
    private UUID approverLevel2;
    private String approverLevel2Name;
    private LocalDateTime approvedDateLevel2;
}
