package com.hanghai.kchtg.document.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Kế hoạch bảo trì — maintenance planning records.
 * Used by F-130 Quản lý thông tin bảo trì.
 */
@Entity
@Table(name = "maintenance_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
@Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
public class MaintenancePlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "equipment", nullable = false, length = 200)
    private String equipment;

    @Enumerated(EnumType.STRING)
    @Column(name = "maintenance_type", length = 30)
    private MaintenanceType maintenanceType;

    @Column(name = "estimated_start_date")
    private LocalDate estimatedStartDate;

    @Column(name = "estimated_end_date")
    private LocalDate estimatedEndDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30)
    private MaintenanceStatus status;

    @Column(name = "estimated_cost", precision = 15, scale = 2)
    private BigDecimal estimatedCost;

    @Column(name = "org_unit_id")
    private UUID orgUnitId;

    @Column(name = "operating_org_unit_id")
    private UUID operatingOrgUnitId;

    @Column(name = "infrastructure_type", length = 50)
    private String infrastructureType;

    @Column(name = "code", length = 50)
    private String code;

    @Column(name = "name", length = 255)
    private String name;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdDate;

    @Column(name = "updated_by")
    private UUID updatedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedDate;

    @OneToMany(mappedBy = "maintenancePlan", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MaintenanceResult> results = new ArrayList<>();

    @OneToMany(mappedBy = "maintenancePlan", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MaintenancePlanWork> workItems = new ArrayList<>();

    @OneToMany(mappedBy = "maintenancePlan", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MaintenancePlanFile> files = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdDate = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedDate = LocalDateTime.now();
    }
}
