package com.hanghai.kchtg.port.entity;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.common.entity.ApprovableEntity;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatusConverter;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import com.hanghai.kchtg.security.RecordSecurityLevel;
import lombok.Builder;
import lombok.experimental.FieldNameConstants;

/**
 * Entity representing a berth (Bến cảng) — child of Port.
 * Corresponds to table: berths (renamed from ben_cang).
 * FK: port_id → ports.id (NOT NULL)
 */
@Entity
@Table(name = "berths",
        uniqueConstraints = @UniqueConstraint(columnNames = "berth_code"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldNameConstants
@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
@org.hibernate.annotations.Filter(name = "recordSecurityLevelFilter", condition = "security_level <= :maxSecurityLevel")
public class Berth extends BaseEntity implements ApprovableEntity {

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "security_level", nullable = false, columnDefinition = "SMALLINT")
    @Builder.Default
    private RecordSecurityLevel securityLevel = RecordSecurityLevel.NORMAL;

    @Column(name = "berth_code", nullable = false, unique = true, length = 50)
    private String berthCode;

    @Column(name = "berth_name", nullable = false, length = 255)
    private String berthName;

    @Column(name = "port_id", nullable = false)
    private UUID portId;

    @Column(name = "waterway", length = 255)
    private String waterway;

    @Column(name = "waterway_id")
    private UUID waterwayId;



    @Column(name = "length", precision = 15, scale = 2)
    private BigDecimal length;

    @Column(name = "width", precision = 15, scale = 2)
    private BigDecimal width;

    @Column(name = "berth_type")
    @Convert(converter = BerthTypeConverter.class)
    private BerthType berthType;

    @Column(name = "channel_depth", precision = 10, scale = 2)
    private BigDecimal channelDepth;

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

    @Column(name = "operational_function", length = 255)
    private String operationalFunction;

    @Column(name = "map_symbol_id")
    private UUID mapSymbolId;

    @Column(name = "spatial_id")
    private UUID spatialId;

    // ── Extended fields from hh.csdl legacy Qlkc038Dto ────────────────

    @Column(name = "province_id")
    private Integer provinceId;

    @Column(name = "detailed_location", length = 500)
    private String detailedLocation;

    @Column(name = "coordinate_system")
    private Integer coordinateSystem;

    @Column(name = "display_rule")
    private Integer displayRule;

    @Column(name = "operator", length = 255)
    private String operator;

    @Column(name = "total_area", precision = 19, scale = 4)
    private BigDecimal totalArea;

    @Column(name = "design_throughput", precision = 19, scale = 4)
    private BigDecimal designThroughput;

    @Column(name = "current_throughput", precision = 19, scale = 4)
    private BigDecimal currentThroughput;

    @Column(name = "max_vessel_size", precision = 19, scale = 4)
    private BigDecimal maxVesselSize;

    @Column(name = "planned_throughput", precision = 19, scale = 4)
    private BigDecimal plannedThroughput;

    @Column(name = "latest_cargo_volume", precision = 19, scale = 4)
    private BigDecimal latestCargoVolume;

    @Column(name = "opening_announcement_date")
    private LocalDateTime openingAnnouncementDate;

    @Column(name = "opening_decision", length = 500)
    private String openingDecision;

    @Column(name = "investment_agreement", length = 2000)
    private String investmentAgreement;

    @Column(name = "structure_type")
    private Integer structureType;

    // ── Two-level approval tracking fields ────────────────────────────

    @Column(name = "activity_status", length = 50)
    private String activityStatus;

    @Column(name = "submitted_for_approval_at")
    private LocalDateTime submittedForApprovalAt;

    @Column(name = "submitted_for_approval_by", length = 100)
    private String submittedForApprovalBy;

    @Column(name = "port_authority_approved_at")
    private LocalDateTime portAuthorityApprovedAt;

    @Column(name = "port_authority_approved_by", length = 100)
    private String portAuthorityApprovedBy;

    @Size(max = 1000)
    @Column(name = "port_authority_approval_content")
    private String portAuthorityApprovalContent;

    @Column(name = "department_approved_at")
    private LocalDateTime departmentApprovedAt;

    @Column(name = "department_approved_by", length = 100)
    private String departmentApprovedBy;

    @Size(max = 1000)
    @Column(name = "department_approval_content")
    private String departmentApprovalContent;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;
}
