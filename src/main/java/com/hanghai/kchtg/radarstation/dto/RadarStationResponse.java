package com.hanghai.kchtg.radarstation.dto;

import java.util.UUID;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RadarStationResponse {
    private UUID id;
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
    private com.hanghai.kchtg.radarstation.entity.RadarStationApprovalStatus approvalStatus;
    private Boolean approvedLevel1;
    private UUID approverLevel1;
    private LocalDateTime approvedDateLevel1;
    private Boolean approvedLevel2;
    private UUID approverLevel2;
    private LocalDateTime approvedDateLevel2;
    private String rejectionReason;
    private UUID createdBy;
    private LocalDateTime createdDate;
    private UUID updatedBy;
    private LocalDateTime updatedDate;
    private List<RadarStationAttachmentResponse> attachments;

    private UUID spatialId;
    private GisGeometryType geometryType;
    private String coordinates;

    private BigDecimal towerHeight;
    private BigDecimal radarRange;

    private UUID vtsSystemId;
    private String vtsSystemName;
}
