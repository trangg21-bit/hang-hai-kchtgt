package com.hanghai.kchtg.port.entity;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.common.entity.ApprovableEntity;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatusConverter;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import com.hanghai.kchtg.security.RecordSecurityLevel;
import lombok.Builder;
import lombok.experimental.FieldNameConstants;

/**
 * Entity representing a pier (Cầu cảng) — child of Berth.
 * Corresponds to table: piers (renamed from cau_cang).
 * FK: berth_id → berths.id (NOT NULL)
 */
@Entity
@Table(name = "piers",
        uniqueConstraints = @UniqueConstraint(columnNames = "pier_code"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldNameConstants
@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
@org.hibernate.annotations.Filter(name = "recordSecurityLevelFilter", condition = "security_level <= :maxSecurityLevel")
public class Pier extends BaseEntity implements ApprovableEntity {

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "security_level", nullable = false, columnDefinition = "SMALLINT")
    @Builder.Default
    private RecordSecurityLevel securityLevel = RecordSecurityLevel.NORMAL;

    @Column(name = "pier_code", nullable = false, unique = true, length = 50)
    private String pierCode;

    @Column(name = "pier_name", nullable = false, length = 255)
    private String pierName;

    @Column(name = "berth_id", nullable = false)
    private UUID berthId;

    @Column(name = "length", precision = 15, scale = 2)
    private BigDecimal length;

    @Column(name = "design_load", precision = 15, scale = 2)
    private BigDecimal designLoad;

    @Column(name = "pier_type")
    @Convert(converter = PierTypeConverter.class)
    private PierType pierType;

    @Column(name = "operational_status")
    @Convert(converter = OperationalStatusConverter.class)
    private OperationalStatus operationalStatus;

    @Column(name = "approval_status", nullable = false)
    @Enumerated(EnumType.ORDINAL)
    private ApprovalStatus approvalStatus;

    @Column(name = "org_unit_id")
    private UUID orgUnitId;

    // -- Phe duyet 2 cap (approval-2-level-spec 3.2) --
    // Vong 1 = Cang vu/Chi cuc, vong 2 = Cuc. Cac truong nay bat buoc de chong
    // tu duyet (BR-015) va truy vet ai duyet luc nao (BR-007).

    @Column(name = "approver_level1")
    private UUID approverLevel1;

    @Column(name = "approved_date_level1")
    private LocalDateTime approvedDateLevel1;

    @Column(name = "approver_level2")
    private UUID approverLevel2;

    @Column(name = "approved_date_level2")
    private LocalDateTime approvedDateLevel2;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "operational_function", length = 255)
    private String operationalFunction;

    @Column(name = "map_symbol_id")
    private UUID mapSymbolId;

    @Column(name = "spatial_id")
    private UUID spatialId;

    // ── Spec Group A: Basic info ──

    @Column(name = "port_id")
    private UUID portId;                         // #2 - Thuộc cảng biển

    @Column(name = "navigation_channel_id")
    private UUID navigationChannelId;            // #4 - Thuộc luồng hàng hải

    @Column(name = "province", length = 100)
    private String province;                     // #7 - Địa điểm (Tỉnh/TP)

    @Column(name = "detailed_location", length = 500)
    private String detailedLocation;             // #8 - Địa điểm chi tiết

    @Column(name = "construction_grade")
    private Integer constructionGrade;           // #9 - Phân cấp công trình

    @Column(name = "structure_type")
    private Integer structureType;               // #10 - Loại kết cấu

    @Column(name = "condition_status")
    private Integer conditionStatus;             // #12 - Tình trạng (default 1)

    // ── Spec Group B: Technical ──

    @Column(name = "width", precision = 15, scale = 2)
    private BigDecimal width;                    // #14 - Chiều rộng

    @Column(name = "current_water_depth", length = 20)
    private String currentWaterDepth;            // #15 - Độ sâu khu nước hiện tại

    @Column(name = "design_bed_elevation", length = 20)
    private String designBedElevation;           // #16 - Cao độ đáy bến thiết kế

    @Column(name = "published_vessel_dwt", length = 20)
    private String publishedVesselDWT;           // #17 - Cỡ tàu khai thác theo công bố

    // ── Spec Group C: Dates (zobjDataSub) ──

    @Column(name = "maintenance_approval_date", length = 7)
    private String maintenanceApprovalDate;      // #18 - MM/YYYY

    @Column(name = "safety_assessment_date", length = 7)
    private String safetyAssessmentDate;         // #19 - MM/YYYY

    @Column(name = "last_inspection_date", length = 7)
    private String lastInspectionDate;           // #20 - MM/YYYY

    // ── Spec Group D: Quantities ──

    @Column(name = "operating_pier_count")
    private Integer operatingPierCount;          // #21

    @Column(name = "published_pier_count")
    private Integer publishedPierCount;          // #22

    @Column(name = "investment_agreement_pier_count")
    private Integer investmentAgreementPierCount; // #23

    @Column(name = "cargo_throughput", precision = 15, scale = 2)
    private BigDecimal cargoThroughput;          // #24

    // ── Spec Group E: ATHH ──

    @Column(name = "receives_large_vessel")
    private Boolean receivesLargeVessel;         // #25 - 0/1

    @Column(name = "document_number", length = 200)
    private String documentNumber;               // #26

    @Column(name = "document_date")
    private LocalDate documentDate;              // #27

    // ── Spec Group F: Opening announcement ──

    @Column(name = "opening_announcement_date")
    private LocalDate openingAnnouncementDate;   // #28

    @Column(name = "opening_decision", length = 200)
    private String openingDecision;              // #29

    @Column(name = "investment_agreement_doc", length = 2000)
    private String investmentAgreementDoc;       // #30

    // ── Spec Group G: GIS additional ──

    @Column(name = "water_area_neutral_scope", length = 2000)
    private String waterAreaNeutralScope;        // G4

    @Column(name = "coordinate_system")
    private Integer coordinateSystem;

    @Column(name = "display_rule", length = 255)
    private String displayRule;

    // ── Two-level approval tracking (mirror berths V112) ────────────

    @Column(name = "submitted_for_approval_at")
    private LocalDateTime submittedForApprovalAt;

    @Column(name = "submitted_for_approval_by", length = 100)
    private String submittedForApprovalBy;

    @Column(name = "port_authority_approved_at")
    private LocalDateTime portAuthorityApprovedAt;

    @Column(name = "port_authority_approved_by", length = 100)
    private String portAuthorityApprovedBy;

    @Column(name = "department_approved_at")
    private LocalDateTime departmentApprovedAt;

    @Column(name = "department_approved_by", length = 100)
    private String departmentApprovedBy;

    @Column(name = "port_authority_approval_content", length = 1000)
    private String portAuthorityApprovalContent;

    @Column(name = "department_approval_content", length = 1000)
    private String departmentApprovalContent;
}
