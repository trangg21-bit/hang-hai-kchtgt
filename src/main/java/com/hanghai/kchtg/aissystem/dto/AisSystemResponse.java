package com.hanghai.kchtg.aissystem.dto;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.enums.UnitOfMeasure;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.vtssystem.dto.VtsSystemAttachmentResponse;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
public class AisSystemResponse {
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
    private String specifications;
    private String manufacturer;
    private Integer commissioningYear;
    private ConditionStatus conditionStatus;
    private String conditionStatusLabel;
    private String maintenanceInfo;
    private String note;
    private UUID spatialId;
    private GisGeometryType geometryType;
    private String coordinates;
    private String symbolId;
    private ApprovalStatus approvalStatus;
    private String approvalStatusLabel;
    private LocalDateTime submittedAt;
    private UUID submittedBy;
    private String submittedByName;
    private UUID approverLevel1;
    private String approverLevel1Name;
    private LocalDateTime approvedDateLevel1;
    private String approvalContentLevel1;
    private UUID approverLevel2;
    private String approverLevel2Name;
    private LocalDateTime approvedDateLevel2;
    private String approvalContentLevel2;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;
    private String createdByName;
    private UUID updatedBy;
    private String updatedByName;
    private List<VtsSystemAttachmentResponse> attachments;
}
