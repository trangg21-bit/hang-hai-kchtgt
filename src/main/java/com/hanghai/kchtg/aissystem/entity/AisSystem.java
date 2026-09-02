package com.hanghai.kchtg.aissystem.entity;

import com.hanghai.kchtg.common.entity.BaseApprovableEntity;
import com.hanghai.kchtg.common.enums.UnitOfMeasure;
import com.hanghai.kchtg.radarstation.entity.RadarStation;
import com.hanghai.kchtg.vtsoperationcenter.entity.VtsOperationCenter;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import lombok.experimental.SuperBuilder;

import java.util.UUID;


@Entity
@Table(name = "ais_system")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldNameConstants
@EqualsAndHashCode(callSuper = true)
@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
public class AisSystem extends BaseApprovableEntity {



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
    private UnitOfMeasure unitOfMeasure;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

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
    private ConditionStatus conditionStatus;

    @Column(name = "maintenance_info", length = 2000)
    private String maintenanceInfo;

    @Column(name = "note", length = 2000)
    private String note;

    @Column(name = "symbol_id")
    private UUID symbolId;
}
