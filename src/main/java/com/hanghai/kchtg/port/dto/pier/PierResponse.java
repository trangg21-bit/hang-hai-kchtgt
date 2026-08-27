package com.hanghai.kchtg.port.dto.pier;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.port.entity.PierType;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class PierResponse {
    private UUID id;
    private String pierCode;
    private String pierName;
    private UUID berthId;
    private String berthName;
    private BigDecimal length;
    private BigDecimal designLoad;
    private PierType pierType;
    private String operationalFunction;
    private OperationalStatus operationalStatus;
    private ApprovalStatus approvalStatus;
   private UUID orgUnitId;
    private String orgUnitName;
   private UUID createdBy;
    private UUID updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID mapSymbolId;
    private UUID spatialId;
    private GisGeometryType geometryType;
    private String coordinates;

    // ── Spec Group A: Basic info ──
    private UUID portId;
    private UUID navigationChannelId;
    private String province;
    private String detailedLocation;
    private Integer constructionGrade;
    private Integer structureType;
    private Integer conditionStatus;

    // ── Spec Group B: Technical ──
    private BigDecimal width;
    private String currentWaterDepth;
    private String designBedElevation;
    private String publishedVesselDWT;

    // ── Spec Group C: Dates ──
    private String maintenanceApprovalDate;
    private String safetyAssessmentDate;
    private String lastInspectionDate;

    // ── Spec Group D: Quantities ──
    private Integer operatingPierCount;
    private Integer publishedPierCount;
    private Integer investmentAgreementPierCount;
    private BigDecimal cargoThroughput;

    // ── Spec Group E: ATHH ──
    private Boolean receivesLargeVessel;
    private String documentNumber;
    private LocalDate documentDate;

    // ── Spec Group F: Opening announcement ──
    private LocalDate openingAnnouncementDate;
    private String openingDecision;
    private String investmentAgreementDoc;

    // ── Spec Group G: GIS additional ──
    private String waterAreaNeutralScope;
    private Integer coordinateSystem;
    private String displayRule;

    // ── Two-level approval tracking (mirror BerthResponse) ────────
    private LocalDateTime submittedForApprovalAt;
    private String submittedForApprovalBy;
    private LocalDateTime portAuthorityApprovedAt;
    private String portAuthorityApprovedBy;
    private LocalDateTime departmentApprovedAt;
    private String departmentApprovedBy;
    private String portAuthorityApprovalContent;
    private String departmentApprovalContent;
}
