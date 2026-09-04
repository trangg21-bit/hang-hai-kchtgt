package com.hanghai.kchtg.port.entity;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatusConverter;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import lombok.experimental.FieldNameConstants;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;


/**
 * Entity representing a ship repair yard (Cơ sở sửa chữa, đóng tàu) — child of Port.
 * Corresponds to table: ship_repair_yards.
 * FK: port_id → ports.id (NOT NULL), pier_id → piers.id (optional, Thuộc cầu cảng).
 * <p>
 * Uses BaseEntity for UUID PK, soft-delete, and JPA auditing.
 * The code (shipRepairYardCode) is immutable after creation, auto-generated as
 * {portCode}-SCDT-{seq}.
 * </p>
 */
@Entity
@Table(name = "ship_repair_yards",
        uniqueConstraints = @UniqueConstraint(columnNames = "ship_repair_yard_code"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldNameConstants
@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
// @org.hibernate.annotations.Filter(name = "recordSecurityLevelFilter", condition = "security_level <= :maxSecurityLevel")
public class ShipRepairYard extends BaseEntity {

    // @Enumerated(EnumType.ORDINAL)
    // @Column(name = "security_level", nullable = false, columnDefinition = "SMALLINT")
    // @Builder.Default
    // private RecordSecurityLevel securityLevel = RecordSecurityLevel.NORMAL;

    @Column(name = "ship_repair_yard_code", nullable = false, unique = true, length = 50)
    private String shipRepairYardCode;

    @Column(name = "ship_repair_yard_name", nullable = false, length = 255)
    private String shipRepairYardName;

    @Column(name = "port_id", nullable = false)
    private UUID portId;

    @Column(name = "pier_id")
    private UUID pierId;

    @Column(name = "org_unit_id")
    private UUID orgUnitId;

    @Column(name = "province_id")
    private Integer provinceId;

    @Column(name = "detailed_location", length = 500)
    private String detailedLocation;

    @Column(name = "operational_status")
    @Convert(converter = OperationalStatusConverter.class)
    private OperationalStatus operationalStatus;

    @Column(name = "approval_status", nullable = false)
    @Enumerated(EnumType.ORDINAL)
    private ApprovalStatus approvalStatus;

    // ── Thông tin đặc thù CSSCĐT ───────────────────────────────────────

    @Column(name = "usage_function", length = 255)
    private String usageFunction;          // Công năng sử dụng

    @Column(name = "workshop_area", precision = 15, scale = 2)
    private BigDecimal workshopArea;       // Diện tích nhà xưởng, kho bãi (m2)

    @Column(name = "vessel_type", length = 255)
    private String vesselType;             // Loại tàu đóng mới, sửa chữa

    @Column(name = "vessel_dwt", length = 100)
    private String vesselDwt;              // Cỡ tàu (DWT)

    @Column(name = "business_type", length = 255)
    private String businessType;           // Loại hình doanh nghiệp

    @Column(name = "activity", length = 255)
    private String activity;               // Hoạt động

    @Column(name = "slipway_count")
    private Integer slipwayCount;          // Số lượng triền đà

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;                // Ghi chú

    // ── GIS fields ─────────────────────────────────────────────────────
    @Column(name = "map_symbol_id")
    private UUID mapSymbolId;

    @Column(name = "coordinate_system")
    private Integer coordinateSystem;

    @Column(name = "display_rule")
    private Integer displayRule;

    @Column(name = "spatial_id")
    private UUID spatialId;

    // ── Two-level approval tracking fields ─────────────────────────────

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
