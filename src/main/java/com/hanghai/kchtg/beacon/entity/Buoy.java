package com.hanghai.kchtg.beacon.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;

/**
 * Entity representing nautical buoy equipment (cardinal, sector, special, safe water, isolated danger).
 * Extends BaseEntity for shared audit fields and soft-delete support.
 */
@Entity
@Table(name = "buoy")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Buoy extends BaseEntity {
    @Column(name = "province_id")
    private Integer provinceId;


    @NotBlank(message = "Mã phao tiêu không được để trống")
    @Size(max = 50)
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @NotBlank(message = "Tên phao tiêu không được để trống")
    @Size(max = 200)
    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false)
    private String type;


    @Size(max = 50)
    private String color;

    @Size(max = 50)
    private String shape;

    @Size(max = 100)
    @Column(name = "light_characteristic", length = 100)
    private String lightCharacteristic;

    @NotNull
    @DecimalMin("0.01")
    @DecimalMax("100.0")
    private Double range;

    @Size(max = 1000)
    private String description;

    @Column(name = "unit_id")
    private java.util.UUID unitId;

    @Column(name = "last_inspection_date")
    private LocalDate lastInspectionDate;

    @Column(name = "next_inspection_date")
    private LocalDate nextInspectionDate;

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
    private java.util.UUID approvedBy;

    @Column(name = "approved_date")
    private java.time.LocalDateTime approvedDate;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "spatial_id")
    private java.util.UUID spatialId;
}
