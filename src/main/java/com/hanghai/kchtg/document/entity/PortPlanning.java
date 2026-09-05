package com.hanghai.kchtg.document.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Quy hoạch bến cảng — port planning records (F-132/133/134).
 * Adopts the OperationPlan shape (D2): inline audit + orgUnitId + class-level
 * orgUnitFilter; BaseEntity is NOT extended.
 */
@Entity
@Table(name = "port_planning")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
@Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
@SQLRestriction("deleted_at IS NULL")
public class PortPlanning {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "project_name", length = 200)
    private String projectName;

    @Column(name = "approval_authority", length = 200)
    private String approvalAuthority;

    @Column(name = "approval_date")
    private LocalDate approvalDate;

    @Column(name = "application_scope", length = 500)
    private String applicationScope;

    @Column(name = "map_scale", length = 50)
    private String mapScale;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "status")
    private PlanningStatus status;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(name = "decision_number", length = 100)
    private String decisionNumber;

    @Column(name = "decision_date")
    private LocalDate decisionDate;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "planning_group")
    private PortPlanningGroup planningGroup;

    @Column(name = "seaport_id")
    private UUID seaportId;

    @Column(name = "seaport_group", length = 100)
    private String seaportGroup;

    @Column(name = "dry_port_id")
    private UUID dryPortId;

    @Column(name = "plan_to_year")
    private Integer planToYear;

    @Column(name = "plan_content", length = 4000)
    private String planContent;

    @Column(name = "land_water_demand", length = 4000)
    private String landWaterDemand;

    @Column(name = "capital_demand", length = 4000)
    private String capitalDemand;

    @Column(name = "implementation_solution", length = 4000)
    private String implementationSolution;

    @Column(name = "priority_projects", length = 4000)
    private String priorityProjects;

    @Column(name = "implementation_org", length = 4000)
    private String implementationOrg;

    @Column(name = "org_unit_id")
    private UUID orgUnitId;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_by")
    private UUID updatedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "deleted_by")
    private UUID deletedBy;

    @OneToMany(mappedBy = "portPlanning", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PlanningCategory> planningCategories = new ArrayList<>();

    @OneToMany(mappedBy = "portPlanning", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PortPlanningCargoForecast> cargoForecasts = new ArrayList<>();

    @OneToMany(mappedBy = "portPlanning", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PlanningFile> planningFiles = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Xóa mềm — mirror of the house soft-delete seam (BaseEntity-style),
     * inline because this entity does not extend BaseEntity (D2).
     */
    public void softDelete(UUID operatorId) {
        this.deletedAt = LocalDateTime.now();
        this.deletedBy = operatorId;
        this.updatedAt = LocalDateTime.now();
        this.updatedBy = operatorId;
    }
}
