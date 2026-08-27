package com.hanghai.kchtg.aissystem.entity;

import com.hanghai.kchtg.common.entity.ApprovableEntity;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.common.enums.UnitOfMeasure;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.radarstation.entity.RadarStation;
import com.hanghai.kchtg.vtsoperationcenter.entity.VtsOperationCenter;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ais_system")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldNameConstants
@EqualsAndHashCode(callSuper = true)
@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
public class AisSystem extends BaseEntity implements ApprovableEntity {

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "vts_operation_center_id")
    private UUID vtsOperationCenterId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vts_operation_center_id", insertable = false, updatable = false)
    private VtsOperationCenter vtsOperationCenter;

    @Column(name = "radar_station_id")
    private UUID radarStationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "radar_station_id", insertable = false, updatable = false)
    private RadarStation radarStation;

    @Column(name = "operating_org_id", nullable = false)
    private UUID operatingOrgId;

    @Column(name = "detailed_location", length = 500)
    private String detailedLocation;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "unit_of_measure", nullable = false, columnDefinition = "SMALLINT")
    @Builder.Default
    private UnitOfMeasure unitOfMeasure = UnitOfMeasure.SET;

    @Column(name = "quantity", nullable = false)
    @Builder.Default
    private Integer quantity = 1;

    @Column(name = "model", length = 100)
    private String model;

    @Column(name = "specifications", length = 1000)
    private String specifications;

    @Column(name = "manufacturer", length = 255)
    private String manufacturer;

    @Column(name = "commissioning_year")
    private Integer commissioningYear;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "condition_status", nullable = false, columnDefinition = "SMALLINT")
    @Builder.Default
    private ConditionStatus conditionStatus = ConditionStatus.OPERATIONAL;

    @Column(name = "maintenance_info", length = 2000)
    private String maintenanceInfo;

    @Column(name = "note", length = 2000)
    private String note;

    @Column(name = "org_unit_id")
    private UUID orgUnitId;

    @Column(name = "province_id")
    private Integer provinceId;

    @Column(name = "spatial_id")
    private UUID spatialId;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "approval_status", nullable = false, columnDefinition = "SMALLINT")
    @Builder.Default
    private ApprovalStatus approvalStatus = ApprovalStatus.PROPOSED;

    @Column(name = "approver_level1")
    private UUID approverLevel1;

    @Column(name = "approved_date_level1")
    private LocalDateTime approvedDateLevel1;

    @Column(name = "approver_level2")
    private UUID approverLevel2;

    @Column(name = "approved_date_level2")
    private LocalDateTime approvedDateLevel2;

    @Column(name = "rejection_reason", length = 1000)
    private String rejectionReason;

    @PrePersist
    protected void onPrePersist() {
        if (this.approvalStatus == null) {
            this.approvalStatus = ApprovalStatus.PROPOSED;
        }
    }
}
