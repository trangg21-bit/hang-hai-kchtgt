package com.hanghai.kchtg.station.entity;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;
import java.util.UUID;

import com.hanghai.kchtg.security.RecordSecurityLevel;
import lombok.Builder;
import lombok.experimental.FieldNameConstants;

@Entity
@Table(name = "buoy_station")
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldNameConstants
@SQLRestriction("deleted_at IS NULL")
@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "unit_id IN (:orgUnitIds)")
@org.hibernate.annotations.Filter(name = "recordSecurityLevelFilter", condition = "security_level <= :maxSecurityLevel")
public class BuoyStation extends BaseEntity {

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "security_level", nullable = false, columnDefinition = "SMALLINT")
    @Builder.Default
    private RecordSecurityLevel securityLevel = RecordSecurityLevel.NORMAL;

    @Column(name = "province_id")
    private Integer provinceId;

    @Column(length = 50)
    protected String code;

    @Column(length = 255)
    protected String name;

    @Column(length = 1000)
    protected String description;

    @Column(name = "unit_id")
    protected UUID unitId;

    @Column(name = "operating_org_id")
    protected UUID operatingOrgId;

    @Column(name = "port_id")
    protected UUID portId;

    @Column(name = "waterway_id")
    protected UUID waterwayId;

    @Column(name = "waterway_route_id")
    protected UUID waterwayRouteId;

    @Column(length = 100)
    protected String province;

    @Column(length = 500)
    protected String address;

    @Column(name = "construction_date")
    protected LocalDate constructionDate;

    @Column(name = "total_area")
    protected Double totalArea;

    @Column(name = "usable_area")
    protected Double usableArea;

    @Column(name = "staff_count")
    protected Integer staffCount;

    @Column(name = "last_maintenance_year")
    protected Integer lastMaintenanceYear;

    @Column(length = 1000)
    protected String note;

    @Column(name = "object_type", length = 20)
    protected String objectType;

    @Column(length = 100)
    protected String icon;

    @Column(name = "coordinate_system", length = 50)
    protected String coordinateSystem;

    @Column(name = "display_format", length = 50)
    protected String displayFormat;

    @Column(name = "spatial_id")
    protected UUID spatialId;

    @Column(name = "is_active")
    protected Boolean isActive;

    @Enumerated(jakarta.persistence.EnumType.ORDINAL)
    @Column(name = "status", columnDefinition = "smallint default 0")
    protected StationStatus status;

    @Enumerated(jakarta.persistence.EnumType.ORDINAL)
    @Column(name = "approval_status", columnDefinition = "smallint default 0")
    protected ApprovalStatus approvalStatus;

    @Enumerated(jakarta.persistence.EnumType.ORDINAL)
    protected ApprovalLevel approvalLevel;

    @Column(name = "approved_by")
    protected String approvedBy;

    @Column(name = "approved_date")
    protected java.time.LocalDateTime approvedDate;

    @Column(length = 1000)
    protected String rejectionReason;

    private String type;
    private String color;
    private String shape;
    private String lightCharacteristic;
    private Double range;
    private LocalDate lastInspectionDate;
    private LocalDate nextInspectionDate;
}
