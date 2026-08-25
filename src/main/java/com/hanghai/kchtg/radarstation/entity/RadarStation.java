package com.hanghai.kchtg.radarstation.entity;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.BaseApprovableEntity;
import com.hanghai.kchtg.vtssystem.entity.VtsSystem;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "radar_station")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldNameConstants
@EqualsAndHashCode(callSuper = true)
@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
public class RadarStation extends BaseApprovableEntity {
    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

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

    @Column(name = "seaport_id")
    private UUID seaportId;

    @Column(name = "vts_operation_center_id")
    private UUID vtsOperationCenterId;

    @Column(name = "operating_unit_id")
    private UUID operatingUnitId;

    @Column(name = "unit_of_measure", length = 50)
    private String unitOfMeasure;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "note", length = 2000)
    private String note;

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
        if (getApprovalStatus() == null) {
            setApprovalStatus(ApprovalStatus.DRAFT);
        }
    }
}
