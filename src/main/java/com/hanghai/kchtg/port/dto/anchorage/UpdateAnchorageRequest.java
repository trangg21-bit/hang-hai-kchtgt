package com.hanghai.kchtg.port.dto.anchorage;

import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class UpdateAnchorageRequest {

    // private RecordSecurityLevel securityLevel;

    @NotNull(message = "ID không được để trống")
    private UUID id;

    @Size(max = 255)
    private String anchorageName;

    private UUID portId;

    private UUID orgUnitId;

    private UUID navigationChannelId;

    private UUID buoyStationId;

    private Integer provinceId;

    @Size(max = 500)
    private String detailedLocation;

    private OperationalStatus operationalStatus;

    private String shapeDescription;

    @DecimalMin("0")
    private BigDecimal area;

    @DecimalMin("0")
    private BigDecimal designWaterDepth;

    @DecimalMin("0")
    private BigDecimal currentWaterDepth;

    @DecimalMin("0")
    private BigDecimal bottomElevationDesign;

    @DecimalMin("0")
    private BigDecimal maxVesselDWT;

    private Integer activeAnchorageCount;

    private Integer publishedAnchorageCount;

    private Integer underInvestmentAnchorageCount;

    private String remarks;

    private LocalDateTime openingAnnouncementDate;

    @Size(max = 500)
    private String publicDecision;

    private String investmentAgreement;

    // ── GIS fields ─────────────────────────────────────────────────────
    private BigDecimal latitude;
    private BigDecimal longitude;
    private UUID mapSymbolId;
    private GisGeometryType geometryType;
    private String coordinates;
    private Integer coordinateSystem;
    private Integer displayRule;

    private List<MooringWaterAreaRequest> mooringWaterAreas;

    private String saveAction;
}
