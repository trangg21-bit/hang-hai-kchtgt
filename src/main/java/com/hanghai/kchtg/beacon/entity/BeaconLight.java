package com.hanghai.kchtg.beacon.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;

/**
 * Entity representing nautical beacon light equipment (lighthouse, beacon light, beacon mark).
 * Extends BaseEntity for shared audit fields and soft-delete support.
 */
@Entity
@Table(name = "beacon_light")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BeaconLight extends BaseEntity {

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
    @DecimalMin("-90.0")
    @DecimalMax("90.0")
    @Column(name = "latitude", nullable = false)
    private Double latitude;

    @NotNull
    @DecimalMin("-180.0")
    @DecimalMax("180.0")
    @Column(name = "longitude", nullable = false)
    private Double longitude;

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
    @Builder.Default
    private String approvalStatus = "PENDING";

    @Column(name = "approval_level")
    private Integer approvalLevel;

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "approved_date")
    private java.time.LocalDateTime approvedDate;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "spatial_id")
    private java.util.UUID khongGianId;

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
