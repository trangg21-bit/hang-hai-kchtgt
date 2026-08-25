package com.hanghai.kchtg.cctv.entity;

import java.util.UUID;

import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatusConverter;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import lombok.experimental.FieldNameConstants;
import com.hanghai.kchtg.security.RecordSecurityLevel;

/**
 * Entity representing a CCTV system (Hệ thống CCTV) — M-NEW entity.
 * Corresponds to table: cctv.
 * <p>
 * Uses BaseEntity for UUID PK, soft-delete, and JPA auditing.
 * The device_code is immutable after creation.
 * </p>
 */
@Entity
@Table(name = "cctv",
        uniqueConstraints = @UniqueConstraint(columnNames = "device_code"))
@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
@org.hibernate.annotations.Filter(name = "recordSecurityLevelFilter", condition = "security_level <= :maxSecurityLevel")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldNameConstants
public class Cctv extends BaseEntity {

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "security_level", nullable = false, columnDefinition = "SMALLINT")
    @Builder.Default
    private RecordSecurityLevel securityLevel = RecordSecurityLevel.NORMAL;

    // ── Basic information ───────────────────────────────────────────────

    @Column(name = "org_unit_id")
    private UUID orgUnitId;

    @Column(name = "attached_infrastructure_type")
    private Integer attachedInfrastructureType;

    @Column(name = "attached_infrastructure_id")
    private UUID attachedInfrastructureId;

    @Column(name = "operating_unit_id")
    private String operatingUnitId;

    @Column(name = "province_id")
    private UUID provinceId;

    @Column(name = "unit_of_measure")
    private Integer unitOfMeasure;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "year_of_use")
    private Integer yearOfUse;

    @Column(name = "operational_status", nullable = false)
    @Convert(converter = OperationalStatusConverter.class)
    private OperationalStatus operationalStatus;

    // ── Equipment information ───────────────────────────────────────────

    @Column(name = "specifications", length = 2000)
    private String specifications;

    @Column(name = "maintenance_information", length = 2000)
    private String maintenanceInformation;

    @Column(name = "note", length = 2000)
    private String note;

    // ── GIS location ────────────────────────────────────────────────────

    @Column(name = "object_type")
    private Integer objectType;

    @Column(name = "map_symbol_id")
    private UUID mapSymbolId;

    @Column(name = "coordinate_system")
    private Integer coordinateSystem;

    @Column(name = "display_rule")
    private Integer displayRule;

    @Column(name = "spatial_id")
    private UUID spatialId;

    // ── Approval & audit ────────────────────────────────────────────────

    @Column(name = "approval_status", nullable = false)
    @Enumerated(EnumType.ORDINAL)
    private ApprovalStatus approvalStatus;

    // ── Identity fields ─────────────────────────────────────────────────

    @Column(name = "device_code", nullable = false, unique = true, length = 200)
    private String deviceCode;

    @Column(name = "device_name", nullable = false, length = 255)
    private String deviceName;

    @Column(name = "detailed_location", length = 500)
    private String detailedLocation;

    @Column(name = "model", length = 255)
    private String model;

    @Column(name = "manufacturer", length = 50)
    private String manufacturer;
}
