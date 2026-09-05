package com.hanghai.kchtg.document.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Sự cố — incident records (F-131 Quản lý thông tin sự cố).
 * Adopts the OperationPlan shape (D2): inline audit + orgUnitId + class-level
 * orgUnitFilter; BaseEntity is NOT extended (its NOT-NULL audit / deleted_at /
 * SQLRestriction contract does not fit the legacy schema).
 */
@Entity
@Table(name = "incidents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
@Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
@SQLRestriction("deleted_at IS NULL")
public class Incident {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "code", length = 20)
    private String code;

    @Column(name = "incident_type", length = 100)
    private String incidentType;

    @Column(name = "occurred_from")
    private LocalDateTime discoveryTime;

    @Column(name = "occurred_to")
    private LocalDateTime occurredTo;

    @Column(name = "location", length = 300)
    private String location;

    @Column(name = "infrastructure_type", length = 100)
    private String infrastructureType;

    @Column(name = "infrastructure_id")
    private UUID infrastructureId;

    @Column(name = "infrastructure_name", length = 300)
    private String infrastructureName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "damage_status", length = 500)
    private String damageStatus;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "severity_level")
    private SeverityLevel severityLevel;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "processing_status")
    private ProcessingStatus processingStatus;

    @Column(name = "reporter", length = 100)
    private String reporter;

    @Column(name = "note", length = 500)
    private String note;

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

    @OneToMany(mappedBy = "incident", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProcessingProgress> processingProgress = new ArrayList<>();

    @OneToMany(mappedBy = "incident", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<IncidentEvolution> evolutions = new ArrayList<>();

    @OneToMany(mappedBy = "incident", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<IncidentHandling> handlings = new ArrayList<>();

    @OneToMany(mappedBy = "incident", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<IncidentFile> files = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Alias for the legacy {@code discoveryTime} property name (column
     * {@code occurred_from}, §5.1.2) — keeps the design-plan field naming
     * available while the legacy Java surface stays intact.
     */
    public LocalDateTime getOccurredFrom() {
        return discoveryTime;
    }

    public void setOccurredFrom(LocalDateTime occurredFrom) {
        this.discoveryTime = occurredFrom;
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
