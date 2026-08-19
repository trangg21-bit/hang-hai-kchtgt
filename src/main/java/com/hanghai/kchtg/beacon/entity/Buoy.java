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
    @Size(max = 255)
    @Column(nullable = false, length = 255)
    private String name;

    @Column
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
    @Enumerated(EnumType.STRING)
    private ApprovalStatus approvalStatus;

    @Column(name = "approval_level")
    private Integer approvalLevel;

    @Column(name = "approved_by")
    private java.util.UUID approvedBy;

    @Column(name = "approved_date")
    private java.time.LocalDateTime approvedDate;

    @Column(name = "submitted_for_approval_by")
    private java.util.UUID submittedForApprovalBy;

    @Column(name = "submitted_for_approval_at")
    private java.time.LocalDateTime submittedForApprovalAt;

    @Column(name = "level1_approved_by")
    private java.util.UUID level1ApprovedBy;

    @Column(name = "level1_approved_date")
    private java.time.LocalDateTime level1ApprovedDate;

    @Column(name = "level2_approved_by")
    private java.util.UUID level2ApprovedBy;

    @Column(name = "level2_approved_date")
    private java.time.LocalDateTime level2ApprovedDate;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "geometry_type", length = 20)
    private String geometryType;

    @Column(name = "map_symbol_id")
    private java.util.UUID mapSymbolId;

    @Column(name = "coordinate_system")
    private Integer coordinateSystem;

    @Column(name = "display_rule", length = 255)
    private String displayRule;

    @Column(name = "spatial_id")
    private java.util.UUID spatialId;

    // ── Các trường bổ sung theo đặc tả CSV 'QL Phao tiêu' (56 trường) ──
    @Column(name = "buoy_station_id")
    private java.util.UUID buoyStationId;

    @Size(max = 100)
    private String classification;

    @Size(max = 100)
    @Column(name = "classification_buoy")
    private String classificationBuoy;

    @Size(max = 100)
    @Column(name = "classification_mark")
    private String classificationMark;

    @Size(max = 500)
    @Column(name = "location_detail")
    private String locationDetail;

    @Size(max = 100)
    private String condition;

    @Size(max = 2000)
    private String structure;

    private Double area;

    @Column(name = "body_height")
    private Double bodyHeight;

    private Double diameter;

    @Size(max = 100)
    @Column(name = "beacon_light")
    private String beaconLight;

    @Column(name = "tower_height")
    private Double towerHeight;

    @Column(name = "light_height")
    private Double lightHeight;

    @Size(max = 100)
    @Column(name = "light_model")
    private String lightModel;

    @Size(max = 200)
    @Column(name = "tower_color")
    private String towerColor;

    @Size(max = 500)
    @Column(name = "power_supply")
    private String powerSupply;

    @Column(name = "commissioned_date")
    private LocalDate commissionedDate;

    @Column(name = "last_repair_date")
    private LocalDate lastRepairDate;

    @Size(max = 50)
    @Column(name = "light_color")
    private String lightColor;

    @Size(max = 50)
    @Column(name = "flash_type")
    private String flashType;

    @Size(max = 50)
    private String period;

    // ── Các trường bổ sung theo đặc tả CSV 'QL Phao tiêu' (STT 41/44 — Nội dung phê duyệt) ──
    @Size(max = 1000)
    @Column(name = "level1_approval_content")
    private String level1ApprovalContent;

    @Size(max = 1000)
    @Column(name = "level2_approval_content")
    private String level2ApprovalContent;

    // ── Thông tin vận hành khai thác (CSV STT 45-48, read-only) ──
    @Size(max = 100)
    @Column(name = "operation_plan_code")
    private String operationPlanCode;

    @Size(max = 255)
    @Column(name = "operation_plan_name")
    private String operationPlanName;

    @Column(name = "operation_start_date")
    private String operationStartDate;

    @Column(name = "operation_end_date")
    private String operationEndDate;

    // ── Thông tin bảo trì (CSV STT 49-52, read-only) ──
    @Size(max = 100)
    @Column(name = "maintenance_plan_code")
    private String maintenancePlanCode;

    @Size(max = 255)
    @Column(name = "maintenance_plan_name")
    private String maintenancePlanName;

    @Column(name = "maintenance_start_time")
    private String maintenanceStartTime;

    @Column(name = "maintenance_end_time")
    private String maintenanceEndTime;

    // ── Thông tin sự cố (CSV STT 53-56, read-only) ──
    @Size(max = 100)
    @Column(name = "incident_code")
    private String incidentCode;

    @Size(max = 100)
    @Column(name = "incident_type")
    private String incidentType;

    @Size(max = 500)
    @Column(name = "incident_location")
    private String incidentLocation;

    @Column(name = "incident_time")
    private String incidentTime;

    @PrePersist
    protected void onPrePersist() {
        if (approvalStatus == null) approvalStatus = ApprovalStatus.PENDING_APPROVAL;
    }
}
