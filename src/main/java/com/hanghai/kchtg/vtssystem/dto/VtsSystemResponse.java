package com.hanghai.kchtg.vtssystem.dto;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import com.hanghai.kchtg.security.RecordSecurityLevel;
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
    private RecordSecurityLevel recordSecurityLevel;
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
    private UUID approverLevel1;
    private String approverLevel1Name;
    private LocalDateTime approvedDateLevel1;
    private String approvalContentLevel1;
    private UUID approverLevel2;
    private String approverLevel2Name;
    private LocalDateTime approvedDateLevel2;
    private String approvalContentLevel2;
    private String rejectionReason;
    private UUID createdBy;
    private String createdByName;
    private LocalDateTime createdDate;
    private String submittedByName;
    private LocalDateTime submittedDate;
    private UUID updatedBy;
    private String updatedByName;
    private LocalDateTime updatedDate;
    private List<VtsSystemAttachmentResponse> attachments;

    private UUID spatialId;
    private GisGeometryType geometryType;
    private String coordinates;
}
