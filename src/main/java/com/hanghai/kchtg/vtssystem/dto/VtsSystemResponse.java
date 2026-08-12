package com.hanghai.kchtg.vtssystem.dto;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VtsSystemResponse {
    private UUID id;
    private String systemName;


    private ConditionStatus conditionStatus;
    private String responsibilityLevel;
    private String source;
    private String partner;
    private UUID orgUnitId;
    private String orgUnitName;
    private UUID owningOrgId;
    private String owningOrgName;
    private UUID operatingOrgId;
    private String operatingOrgName;
    private UUID portId;
    private String portName;
    private List<VtsZoneDto> zones;
    private String code;
    private Integer provinceId;
    private String address;
    private String maritimeNotice;
    private LocalDate operationStartDate;
    private String scope;
    private String note;
    private ApprovalStatus approvalStatus;
    private Boolean approvedLevel1;
    private UUID approverLevel1;
    private LocalDateTime approvedDateLevel1;
    private Boolean approvedLevel2;
    private UUID approverLevel2;
    private LocalDateTime approvedDateLevel2;
    private String rejectionReason;
    private UUID createdBy;
    private String createdByName;
    private LocalDateTime createdDate;
    private UUID updatedBy;
    private String updatedByName;
    private LocalDateTime updatedDate;
    private List<VtsSystemAttachmentResponse> attachments;

    private UUID spatialId;
    private GisGeometryType geometryType;
    private String coordinates;
}
