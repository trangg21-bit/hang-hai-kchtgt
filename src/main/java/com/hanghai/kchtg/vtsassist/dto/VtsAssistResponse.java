package com.hanghai.kchtg.vtsassist.dto;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for VTS Assist entity.
 */
@Data
@Builder
public class VtsAssistResponse {

    private UUID id;
    private RecordSecurityLevel securityLevel;
    private String deviceCode;
    private String deviceName;
    private String detailedLocation;
    private Integer quantity;
    private String manufacturer;
    private String model;
    private UUID orgUnitId;
    private String orgUnitName;
    private UUID operatingUnitId;
    private String operatingUnitName;
    private String provinceName;
    private Integer attachedInfrastructureType;
    private UUID attachedInfrastructureId;
    private String attachedInfrastructureName;
    private Integer unitOfMeasure;
    private Integer yearOfUse;
    private OperationalStatus operationalStatus;
    private ApprovalStatus approvalStatus;
    private UUID approverLevel1;
    private String approverLevel1Name;
    private LocalDateTime approvedDateLevel1;
    private UUID approverLevel2;
    private String approverLevel2Name;
    private LocalDateTime approvedDateLevel2;
    private String rejectionReason;
    private LocalDateTime submittedDate;
    private UUID submittedBy;
    private String submittedByName;
    private String approvalContentLevel1;
    private String approvalContentLevel2;
    private String specifications;
    private String maintenanceInformation;
    private String note;
    private Integer objectType;
    private UUID mapSymbolId;
    private String mapSymbolName;
    private Integer coordinateSystem;
    private Integer displayRule;
    private UUID spatialId;
    private GisGeometryType geometryType;
    private String coordinates;
    private UUID createdBy;
    private UUID updatedBy;
    private String createdByName;
    private String updatedByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
