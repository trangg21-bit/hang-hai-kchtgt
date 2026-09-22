package com.hanghai.kchtg.port.dto.port;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO for Port entity.
 */
@Data
@Builder
public class PortResponse {

    private UUID id;
    private String portCode;
    private String portName;
    private Integer provinceId;
    private String province;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal area;
    private BigDecimal maxVesselCapacity;
    private OperationalStatus operationalStatus;
    private ApprovalStatus approvalStatus;
    private UUID orgUnitId;
    private String orgUnitName;
    private Integer portGroup;
    private UUID createdBy;
    private UUID updatedBy;
    private String createdByName;
    private String updatedByName;
    private UUID submittedBy;
    private String submittedByName;
    private LocalDateTime submittedAt;
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
    private LocalDateTime deletedAt;
    private UUID deletedBy;
    private UUID mapSymbolId;
    private String mapSymbolName;
    private UUID spatialId;
    private GisGeometryType geometryType;
    private String coordinates;
    private List<PortCoordinateDto> coordinateList;
    private List<PortInfrastructureDto> infrastructureList;
    private List<PortAttachmentDto> attachments;
    private List<PortWharfAreaDto> wharfAreas;

    // ── Extended fields (V53) ────────────────────────────────────────

    private String detailedLocation;
    private Integer portClass;
    private Integer coordinateSystem;
    private Integer displayRule;

    // ── zobjDataSub fields ───────────────────────────────────────────

    private String waterAreaScope;
    private Integer totalBerths;
    private Integer totalAnchoragesTransshipment;
    private Integer totalPublicChannels;
    private Integer totalDedicatedChannels;
    private BigDecimal totalPublicChannelLength;
    private BigDecimal totalDedicatedChannelLength;
    private Integer totalBuoysBeacons;
    private Integer totalDikes;
    private BigDecimal totalDikeLength;
    private Integer totalLighthouses;
    private Integer buoyBerthCount;
    private Integer anchorageCount;
    private Integer transshipmentCount;
    private String otherWaterAreas;
    private String remarks;
}
