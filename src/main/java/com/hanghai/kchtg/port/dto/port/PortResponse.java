package com.hanghai.kchtg.port.dto.port;

import java.util.UUID;

import com.hanghai.kchtg.port.entity.PortStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

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
    private PortStatus portStatus;
    private UUID orgUnitId;
    private UUID managingUnitId;
    private String notes;
    private Integer portGroup;
    private UUID createdBy;
    private UUID updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID mapSymbolId;
    private UUID spatialId;
    private GisGeometryType geometryType;
    private String coordinates;

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

    // ── Composite sub-entities ───────────────────────────────────────

    private List<CoordinateResponse> portCoordinates;
    private List<InfrastructureResponse> portInfrastructures;
    private List<AttachmentResponse> attachments;
}
