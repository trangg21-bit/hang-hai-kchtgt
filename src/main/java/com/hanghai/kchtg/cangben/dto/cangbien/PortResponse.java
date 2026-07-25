package com.hanghai.kchtg.cangben.dto.cangbien;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
    private String province;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal area;
    private BigDecimal maxVesselCapacity;
    private com.hanghai.kchtg.common.entity.TrangThaiHoatDong operationalStatus;
    private com.hanghai.kchtg.common.entity.ApprovalStatus approvalStatus;
    private UUID orgUnitId;
    private Integer portGroup;
    private String createdBy;
    private String updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private java.util.UUID mapSymbolId;
    private java.util.UUID spatialId;
    private com.hanghai.kchtg.gis.spatial.entity.GisGeometryType geometryType;
    private String coordinates;

    // â”€â”€ Extended fields (V53) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private String detailedLocation;
    private Integer portClass;
    private Integer coordinateSystem;
    private Integer displayRule;

    // â”€â”€ zobjDataSub fields â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
