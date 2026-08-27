package com.hanghai.kchtg.port.dto.buoyberth;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class BuoyBerthResponse {
    private UUID id;
    private RecordSecurityLevel securityLevel;
    private String buoyBerthCode;
    private String buoyBerthName;
    private UUID portId;
    private String portName;
    private String waterway;
    private UUID orgUnitId;
    private String orgUnitName;
    private UUID waterwayId;
    private String classification;
    private Integer provinceId;
    private UUID mapSymbolId;
    private Integer coordinateSystem;
    private Integer displayRule;
    private GisGeometryType geometryType;
    private String coordinates;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private UUID spatialId;
    private String detailedLocation;
    private OperationalStatus operationalStatus;
    private ApprovalStatus approvalStatus;
    private UUID operatingOrgId;
    private String operatingOrgName;

    // ── Technical & survey fields ──────────────────────────────────────
    private BigDecimal currentWaterDepth;
    private BigDecimal bottomElevationDesign;
    private BigDecimal maxVesselDWT;
    private BigDecimal plannedVesselDWT;
    private LocalDate lastInspectionDate;
    private LocalDate nextInspectionDate;
    private LocalDate operationExpiryDate;
    private BigDecimal designCapacity;
    private Integer activeBuoyBerthCount;
    private Integer publishedBuoyBerthCount;
    private Integer underInvestmentBuoyBerthCount;
    private BigDecimal cargoThroughput;

    // ── Publication fields ─────────────────────────────────────────────
    private LocalDateTime openingAnnouncementDate;
    private String publicDecision;
    private String investmentAgreement;
    private String mooringWaterAreaScope;

    // ── Two-level approval tracking fields ─────────────────────────────
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
