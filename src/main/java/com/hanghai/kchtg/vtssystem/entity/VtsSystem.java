package com.hanghai.kchtg.vtssystem.entity;

import com.hanghai.kchtg.common.entity.BaseApprovableEntity;
import com.hanghai.kchtg.radarstation.entity.RadarStation;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "vts_system")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldNameConstants
@EqualsAndHashCode(callSuper = true)
@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
@org.hibernate.annotations.Filter(name = "recordSecurityLevelFilter", condition = "security_level <= :maxSecurityLevel")
public class VtsSystem extends BaseApprovableEntity {

    @Column(name = "system_name", nullable = false, length = 255)
    private String systemName;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "condition_status", columnDefinition = "SMALLINT")
    private ConditionStatus conditionStatus;

    @Column(name = "scope", length = 2000)
    private String scope;

    @Column(name = "note", length = 2000)
    private String note;

    @Column(name = "code", length = 50, unique = true)
    private String code;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "maritime_notice", length = 2000)
    private String maritimeNotice;

    @Column(name = "operation_start_date")
    private LocalDate operationStartDate;

    @Column(name = "owning_org_id")
    private UUID owningOrgId;

    @Column(name = "operating_org_id")
    private UUID operatingOrgId;

    @Column(name = "port_id")
    private UUID portId;

    @OneToMany(mappedBy = "vtsSystem", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<VtsZone> zones = new ArrayList<>();

    @OneToMany(mappedBy = "vtsSystem")
    @Builder.Default
    private List<RadarStation> radarStations = new ArrayList<>();
}
