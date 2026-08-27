package com.hanghai.kchtg.navigationchannel.entity;

import com.hanghai.kchtg.common.entity.BaseApprovableEntity;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Luồng hàng hải (F-038) — 71-field Excel target schema.
 * Columns map 1:1 to the design plan section 4.1 (English names, enums as ORDINAL SMALLINT).
 */
@Entity
@Table(name = "navigation_channel")
@Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldNameConstants
@EqualsAndHashCode(callSuper = true)
public class NavigationChannel extends BaseApprovableEntity {

    @Column(name = "channel_name", nullable = false, length = 100)
    private String channelName;

    @Column(name = "channel_code", length = 50)
    private String channelCode;

    @Column(name = "seaport_id")
    private UUID seaportId;

    @Column(name = "operating_unit_id")
    private UUID operatingUnitId;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "condition_status", nullable = false, columnDefinition = "SMALLINT")
    @Builder.Default
    private ConditionStatus conditionStatus = ConditionStatus.OPERATIONAL;

    @Column(name = "detailed_location", length = 500)
    private String detailedLocation;

    @Column(name = "management_station", length = 500)
    private String managementStation;

    @Column(name = "station_count")
    private Integer stationCount;

    @Column(name = "station_staff_count")
    @Builder.Default
    private Integer stationStaffCount = 0;

    @Column(name = "station_area_square_meters")
    private BigDecimal stationAreaSquareMeters;

    @Column(name = "latest_station_repair_month")
    private LocalDate latestStationRepairMonth;

    @Column(name = "latest_maintenance_year")
    private Integer latestMaintenanceYear;

    @Column(name = "latest_dredging_volume_cubic_meters")
    private BigDecimal latestDredgingVolumeCubicMeters;

    @Column(name = "buoy_count")
    @Builder.Default
    private Integer buoyCount = 0;

    @Column(name = "beacon_count")
    @Builder.Default
    private Integer beaconCount = 0;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "announcement_decision_number", length = 100)
    private String announcementDecisionNumber;

    @Column(name = "announcement_decision_date")
    private LocalDate announcementDecisionDate;

    @Column(name = "announcement_decision_issuer", length = 500)
    private String announcementDecisionIssuer;

    @Column(name = "protection_scope_meters")
    private BigDecimal protectionScopeMeters;

    @Column(name = "protection_notes", length = 500)
    private String protectionNotes;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "geometry_type", columnDefinition = "SMALLINT")
    private GisGeometryType geometryType;

    @Column(name = "map_icon_id")
    private UUID mapIconId;

    @Column(name = "coordinate_reference_system", length = 50)
    private String coordinateReferenceSystem;

    @Column(name = "display_rule", length = 500)
    private String displayRule;

    @OneToMany(mappedBy = "navigationChannel", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ChannelRouteDetail> channelRouteDetailList = new ArrayList<>();

    @OneToMany(mappedBy = "navigationChannel", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<NavigationChannelCoordinate> coordinates = new ArrayList<>();

    public void setApprovedDateLevel1(LocalDate date) {
        setApprovedDateLevel1(date != null ? date.atStartOfDay() : null);
    }

    public void setApprovedDateLevel2(LocalDate date) {
        setApprovedDateLevel2(date != null ? date.atStartOfDay() : null);
    }
}
