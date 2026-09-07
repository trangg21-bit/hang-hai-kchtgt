package com.hanghai.kchtg.radarstation.dto;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RadarStationResponse {
    private UUID id;
    private String code;
    private String stationName;
    private String location;
    private BigDecimal longitude;
    private BigDecimal latitude;
    private String stationType;
    private String coverage;
    private BigDecimal emissionArea;
    private String source;
    private String conditionStatus;
    private UUID orgUnitId;
    private String orgUnitName;
    private UUID seaportId;
    private String seaportName;
    private UUID vtsSystemId;
    private String vtsSystemName;
    private UUID vtsOperationCenterId;
    private String vtsOperationCenterName;
    private UUID operatingUnitId;
    private String operatingUnitName;
    private Integer provinceId;
    private String unitOfMeasure;
    private Integer quantity;
    private String note;
    private String status;
    private UUID submittedForApprovalBy;
    private LocalDateTime submittedForApprovalAt;
    private String submittedByName;
    private ApprovalStatus approvalStatus;
    private Boolean approvedLevel1;
    private UUID approverLevel1;
    private String approverLevel1Name;
    private LocalDateTime approvedDateLevel1;
    private Boolean approvedLevel2;
    private UUID approverLevel2;
    private String approverLevel2Name;
    private LocalDateTime approvedDateLevel2;
    private String rejectionReason;
    private String level1ApprovalContent;
    private String level2ApprovalContent;
    private UUID createdBy;
    private String createdByName;
    private LocalDateTime createdDate;
    private UUID updatedBy;
    private String updatedByName;
    private LocalDateTime updatedDate;
    private List<RadarStationAttachmentResponse> attachments;

    private UUID spatialId;
    private GisGeometryType geometryType;
    private String coordinates;

    private BigDecimal towerHeight;
    private BigDecimal radarRange;

    private String mapIcon;
}
