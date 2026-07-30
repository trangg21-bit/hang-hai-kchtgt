package com.hanghai.kchtg.radarstation.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.vtssystem.entity.VtsSystem;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "radar_station")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SQLRestriction("is_deleted = false")
public class RadarStation extends BaseEntity {
    @Column(name = "province_id")
    private Integer provinceId;


    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "station_name", nullable = false, length = 255)
    private String stationName;

    @Column(name = "location", nullable = false, length = 500)
    private String location;

    @Column(name = "station_type", length = 100)
    private String stationType;

    @Column(name = "coverage", length = 100)
    private String coverage;

    @Column(name = "emission_area", precision = 10, scale = 2)
    private BigDecimal emissionArea;

    @Column(name = "source", length = 255)
    private String source;

    @Column(name = "condition_status", length = 50)
    private String conditionStatus;

    @Column(name = "org_unit_id")
    private UUID orgUnitId;

    @Column(name = "approval_status", nullable = false)
    @Convert(converter = RadarStationApprovalStatusConverter.class)
    private RadarStationApprovalStatus approvalStatus;

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
    private UUID approverLevel2;

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

    @Column(name = "spatial_id")
    private UUID spatialId;

    @Column(name = "vts_system_id")
    private UUID vtsSystemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vts_system_id", insertable = false, updatable = false)
    private VtsSystem vtsSystem;

    @Column(name = "tower_height", precision = 20, scale = 4)
    private BigDecimal towerHeight;

    @Column(name = "radar_range", precision = 20)
    private BigDecimal radarRange;

    @OneToMany(mappedBy = "radarStation", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RadarStationAttachment> attachments = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (approvalStatus == null) approvalStatus = RadarStationApprovalStatus.PROPOSED;
        if (approvedLevel1 == null) approvedLevel1 = false;
        if (approvedLevel2 == null) approvedLevel2 = false;
    }
}
