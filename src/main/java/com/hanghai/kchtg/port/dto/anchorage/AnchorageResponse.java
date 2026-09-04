package com.hanghai.kchtg.port.dto.anchorage;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class AnchorageResponse {
    private UUID id;
    // private RecordSecurityLevel securityLevel;
    private String anchorageCode;
    private String anchorageName;
    private UUID portId;
    private String portName;
    private String waterway;
    private UUID orgUnitId;
    private String orgUnitName;
    private UUID navigationChannelId;
    private UUID buoyStationId;
    private String buoyStationName;
    private Integer provinceId;
    private UUID mapSymbolId;
    private Integer coordinateSystem;
    private Integer displayRule;
    private GisGeometryType geometryType;
    private String coordinates;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private UUID spatialId;
    private List<MooringWaterAreaResponse> mooringWaterAreas;
    private String detailedLocation;
    private OperationalStatus operationalStatus;
    private ApprovalStatus approvalStatus;

    // ── Technical fields ───────────────────────────────────────────────
    private String shapeDescription;
    private BigDecimal area;
    private BigDecimal designWaterDepth;
    private BigDecimal currentWaterDepth;
    private BigDecimal bottomElevationDesign;
    private BigDecimal maxVesselDWT;
    private Integer activeAnchorageCount;
    private Integer publishedAnchorageCount;
    private Integer underInvestmentAnchorageCount;
    private String remarks;

    // ── Publication fields ─────────────────────────────────────────────
    private LocalDateTime openingAnnouncementDate;
    private String publicDecision;
    private String investmentAgreement;

    // ── Two-level approval tracking fields ─────────────────────────────
    private String activityStatus;
    private LocalDateTime submittedForApprovalAt;
    private String submittedForApprovalBy;
    private LocalDateTime portAuthorityApprovedAt;
    private String portAuthorityApprovedBy;
    private LocalDateTime departmentApprovedAt;
    private String departmentApprovedBy;
    private String portAuthorityApprovalContent;
    private String departmentApprovalContent;
    private String rejectionReason;

    // ── Audit fields ───────────────────────────────────────────────────
    private UUID createdBy;
    private UUID updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
