package com.hanghai.kchtg.vtssystem.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.radarstation.entity.RadarStation;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "vts_system")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SQLRestriction("is_deleted = false")
public class VtsSystem extends BaseEntity {
    @Column(name = "province_id")
    private Integer provinceId;


    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "system_name", nullable = false, length = 255)
    private String systemName;

    @Column(name = "location", nullable = false, length = 500)
    private String location;

    @Column(name = "condition_status")
    private String conditionStatus;

    @Column(name = "responsibility_level", length = 255)
    private String responsibilityLevel;

    @Column(name = "source", length = 255)
    private String source;

    @Column(name = "partner", length = 255)
    private String partner;

    @Column(name = "org_unit_id")
    private UUID orgUnitId;

    @Column(name = "scope", length = 2000)
    private String scope;

    @Column(name = "spatial_id")
    private UUID spatialId;

    @Column(name = "approval_status", nullable = false)
    private String approvalStatus;

    @Column(name = "approved_level1")
    @Builder.Default
    private Boolean approvedLevel1 = false;

    @Column(name = "approver_level1", length = 100)
    private UUID approverLevel1;

    @Column(name = "approved_date_level1")
    private LocalDateTime approvedDateLevel1;

    @Column(name = "approved_level2")
    @Builder.Default
    private Boolean approvedLevel2 = false;

    @Column(name = "approver_level2", length = 100)
    private String approverLevel2;

    @Column(name = "approved_date_level2")
    private LocalDateTime approvedDateLevel2;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "created_by", nullable = false, length = 100)
    private UUID createdBy;

    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate;

    @Column(name = "updated_by", length = 100)
    private UUID updatedBy;

    @Column(name = "updated_date")
    private LocalDateTime updatedDate;

    @Column(name = "is_deleted")
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "deleted_by", length = 100)
    private UUID deletedBy;

    @OneToMany(mappedBy = "vtsSystem", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<VtsSystemAttachment> attachments = new ArrayList<>();

    @OneToMany(mappedBy = "vtsSystem")
    @Builder.Default
    private List<RadarStation> radarStations = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (approvalStatus == null) approvalStatus = "PROPOSED";
        if (approvedLevel1 == null) approvedLevel1 = false;
        if (approvedLevel2 == null) approvedLevel2 = false;
    }
}
