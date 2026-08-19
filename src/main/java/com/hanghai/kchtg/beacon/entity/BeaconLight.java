package com.hanghai.kchtg.beacon.entity;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;

import com.hanghai.kchtg.security.RecordSecurityLevel;
import lombok.experimental.FieldNameConstants;

/**
 * Entity representing nautical beacon light equipment (lighthouse, beacon light, beacon mark).
 * Extends BaseEntity for shared audit fields and soft-delete support.
 */
@Entity
@Table(name = "beacon_light")
@SQLRestriction("deleted_at IS NULL")
@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
@org.hibernate.annotations.Filter(name = "recordSecurityLevelFilter", condition = "security_level <= :maxSecurityLevel")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class BeaconLight extends BaseEntity {

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "security_level", nullable = false, columnDefinition = "SMALLINT")
    @Builder.Default
    private RecordSecurityLevel securityLevel = RecordSecurityLevel.NORMAL;

    @Column(name = "org_unit_id")
    private java.util.UUID orgUnitId;

    @Column(name = "province_id")
    private Integer provinceId;


    @NotBlank(message = "Mã đèn biển không được để trống")
    @Size(max = 50)
    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @NotBlank(message = "Tên đèn biển không được để trống")
    @Size(max = 200)
    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "type", nullable = false)
    private String type;

    @NotNull
    @DecimalMin("0.01")
    @DecimalMax("60.0")
    @Column(name = "light_range", nullable = false)
    private Double lightRange;

    @Size(max = 50)
    @Column(name = "tower_color", length = 500)
    private String towerColor;

    @Size(max = 100)
    @Column(name = "primary_light_model", length = 100)
    private String primaryLightModel;

    @DecimalMin("0.01")
    @DecimalMax("100.0")
    @Column(name = "area")
    private Double area;

    @Size(max = 1000)
    @Column(name = "location", length = 500)
    private String location;

    @Column(name = "unit_id")
    private java.util.UUID unitId;

    @Column(name = "last_repair_date")
    private LocalDate lastRepairDate;

    @Column(name = "commissioned_date")
    private LocalDate commissionedDate;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(nullable = false)
    @Builder.Default
    private String status = "DRAFT";

    @Column(name = "approval_status", nullable = false)
    @Enumerated(EnumType.STRING)
    private ApprovalStatus approvalStatus;

    @Column(name = "approval_level")
    private Integer approvalLevel;

    @Column(name = "approved_by")
    private java.util.UUID approvedBy;

    @Column(name = "approved_date")
    private java.time.LocalDateTime approvedDate;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "spatial_id")
    private java.util.UUID spatialId;

    @PrePersist
    protected void onPrePersist() {
        if (approvalStatus == null) approvalStatus = ApprovalStatus.PENDING_APPROVAL;
    }

    @Column(name = "shape", length = 255)
    private String shape;

    @Column(name = "structure", length = 2000)
    private String structure;

    @Column(name = "tower_height")
    private Double towerHeight;

    @Column(name = "light_height")
    private Double lightHeight;

    @Column(name = "geographic_range", length = 20)
    private String geographicRange;

    @Column(name = "backup_light_model", length = 100)
    private String backupLightModel;

    @Column(name = "power_supply", length = 500)
    private String powerSupply;

    @Column(name = "staff_count")
    private Integer staffCount;

    @Column(name = "station_area")
    private Double stationArea;
}
