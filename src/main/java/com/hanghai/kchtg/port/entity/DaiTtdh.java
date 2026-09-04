package com.hanghai.kchtg.port.entity;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatusConverter;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldNameConstants;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

/**
 * Entity representing a Đài Thông tin Duyên hải (Đài TTDH) — coastal radio station.
 * Corresponds to table: dai_ttdh.
 * <p>
 * Uses BaseEntity for UUID PK, soft-delete, and JPA auditing.
 * The code (daiTtdhCode) is immutable after creation, auto-generated as DTTDH-{seq}.
 * </p>
 */
@Entity
@Table(name = "dai_ttdh",
        uniqueConstraints = @UniqueConstraint(columnNames = "dai_ttdh_code"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldNameConstants
@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
// @org.hibernate.annotations.Filter(name = "recordSecurityLevelFilter", condition = "security_level <= :maxSecurityLevel")
public class DaiTtdh extends BaseEntity {

    // @Enumerated(EnumType.ORDINAL)
    // @Column(name = "security_level", nullable = false, columnDefinition = "SMALLINT")
    // @Builder.Default
    // private RecordSecurityLevel securityLevel = RecordSecurityLevel.NORMAL;

    @Column(name = "dai_ttdh_code", nullable = false, unique = true, length = 50)
    private String daiTtdhCode;

    @Column(name = "dai_ttdh_name", nullable = false, length = 255)
    private String daiTtdhName;

    @Column(name = "org_unit_id")
    private UUID orgUnitId;

    /** Đơn vị khai thác — bảng operating_units (giống BuoyBerth). */
    @Column(name = "operating_unit_id")
    private UUID operatingUnitId;

    /** Phân loại đài: 0=Loại I, 1=Loại II, ..., 4=Loại V. */
    @Column(name = "station_level", nullable = false, columnDefinition = "SMALLINT")
    @Builder.Default
    private Integer stationLevel = 0;

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

    @Column(name = "coverage_area", columnDefinition = "TEXT")
    private String coverageArea;

    /** Dịch vụ cung cấp — multi-select, lưu VARCHAR nối dấu phẩy (giống operationalFunctions). */
    @Column(name = "services_provided", length = 500)
    private String servicesProvided;

    @Size(max = 2000)
    @Column(name = "remarks", length = 2000)
    private String remarks;

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
    private java.time.LocalDateTime submittedForApprovalAt;

    @Column(name = "submitted_for_approval_by", length = 100)
    private String submittedForApprovalBy;

    @Column(name = "port_authority_approved_at")
    private java.time.LocalDateTime portAuthorityApprovedAt;

    @Column(name = "port_authority_approved_by", length = 100)
    private String portAuthorityApprovedBy;

    @Size(max = 1000)
    @Column(name = "port_authority_approval_content")
    private String portAuthorityApprovalContent;

    @Column(name = "department_approved_at")
    private java.time.LocalDateTime departmentApprovedAt;

    @Column(name = "department_approved_by", length = 100)
    private String departmentApprovedBy;

    @Size(max = 1000)
    @Column(name = "department_approval_content")
    private String departmentApprovalContent;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;
}
