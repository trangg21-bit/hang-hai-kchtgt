package com.hanghai.kchtg.radarstation.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.vtssystem.entity.VtsSystem;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

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
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class RadarStation extends BaseEntity {
    @Column(name = "province_id")
    private Integer provinceId;

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

    @Column(name = "approver_level1")
    private UUID approverLevel1;

    @Column(name = "approved_date_level1")
    private LocalDateTime approvedDateLevel1;

    @Column(name = "approved_level2")
    @Builder.Default
    private Boolean approvedLevel2 = false;

    @Column(name = "approver_level2")
    private UUID approverLevel2;

    @Column(name = "approved_date_level2")
    private LocalDateTime approvedDateLevel2;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

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

    @PrePersist
    protected void onCreate() {
        if (approvalStatus == null) approvalStatus = RadarStationApprovalStatus.PROPOSED;
        if (approvedLevel1 == null) approvedLevel1 = false;
        if (approvedLevel2 == null) approvedLevel2 = false;
    }
}
