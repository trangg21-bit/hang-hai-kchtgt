package com.hanghai.kchtg.beacon.entity;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import com.hanghai.kchtg.security.RecordSecurityLevel;
import lombok.experimental.FieldNameConstants;

/**
 * Entity representing a nautical beacon light and its attached station (M-023).
 * Declares audit fields directly without @SQLRestriction so soft-deleted records
 * can be queried and displayed with status 'DELETED' in /beacon-stations.
 */
@Entity
@Table(name = "beacon_light")
@EntityListeners(AuditingEntityListener.class)
@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "(org_unit_id IN (:orgUnitIds) OR unit_id IN (:orgUnitIds))")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class BeaconStation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "deleted_by")
    private UUID deletedBy;

    @org.springframework.data.annotation.CreatedBy
    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "created_by")
    private UUID createdBy;

    @org.springframework.data.annotation.LastModifiedBy
    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "updated_by")
    private UUID updatedBy;

    public void softDelete(UUID userId) {
        this.deletedAt = LocalDateTime.now();
        this.deletedBy = userId;
    }

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
    @Column(name = "light_range", nullable = false)
    private Double lightRange;

    @Size(max = 50)
    @Column(name = "tower_color", length = 500)
    private String towerColor;

    @Size(max = 100)
    @Column(name = "primary_light_model", length = 100)
    private String primaryLightModel;

    @DecimalMin("0.01")
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

    @Column(name = "submitted_by")
    private java.util.UUID submittedBy;

    @Column(name = "submitted_at")
    private java.time.LocalDateTime submittedAt;

    @Column(name = "approver_level1")
    private java.util.UUID approverLevel1;

    @Column(name = "approved_date_level1")
    private java.time.LocalDateTime approvedDateLevel1;

    @Column(name = "approval_content_level1", length = 500)
    private String approvalContentLevel1;

    @Column(name = "approver_level2")
    private java.util.UUID approverLevel2;

    @Column(name = "approved_date_level2")
    private java.time.LocalDateTime approvedDateLevel2;

    @Column(name = "approval_content_level2", length = 500)
    private String approvalContentLevel2;

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

    @Column(name = "seaport_id")
    private java.util.UUID seaportId;

    @Size(max = 200)
    @Column(name = "operator", length = 200)
    private String operator;

    @Size(max = 500)
    @Column(name = "detailed_location", length = 500)
    private String detailedLocation;

    @Column(name = "operational_status")
    private Integer operationalStatus;

    @Size(max = 255)
    @Column(name = "region", length = 255)
    private String region;

    @Size(max = 500)
    @Column(name = "identifying_feature", length = 500)
    private String identifyingFeature;

    @Size(max = 1000)
    @Column(name = "note", length = 1000)
    private String note;

    @Size(max = 20)
    @Column(name = "geometry_type", length = 20)
    private String geometryType;

    @Column(name = "map_symbol_id")
    private java.util.UUID mapSymbolId;

    @Column(name = "coordinate_system")
    private Integer coordinateSystem;

    @Size(max = 255)
    @Column(name = "display_rule", length = 255)
    private String displayRule;
}
