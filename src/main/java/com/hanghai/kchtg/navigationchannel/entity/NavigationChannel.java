package com.hanghai.kchtg.navigationchannel.entity;

import com.hanghai.kchtg.common.entity.BaseApprovableEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "navigation_channel")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldNameConstants
@EqualsAndHashCode(callSuper = true)
public class NavigationChannel extends BaseApprovableEntity {

    @Column(name = "channel_name", nullable = false, length = 100)
    private String channelName;

    @Column(name = "station_amountt")
    private Integer stationAmountt;

    @Column(name = "latest_station_repair_date")
    private LocalDate latestStationRepairDate;

    @Column(name = "station_area")
    private BigDecimal stationArea;

    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "channel_code", length = 50)
    private String channelCode;

    @Column(name = "seaport_id")
    private UUID seaportId;

    @Column(name = "operating_unit_id")
    private UUID operatingUnitId;

    @Column(name = "location", length = 6)
    private String location;

    @Column(name = "detailed_location", length = 500)
    private String detailedLocation;

    @Column(name = "channel_management_station", length = 500)
    private String channelManagementStation;

    @Column(name = "station_staff_amount")
    @Builder.Default
    private Integer stationStaffAmount = 0;

    @Column(name = "latest_maintenance_year")
    private Integer latestMaintenanceYear;

    @Column(name = "dredging_volume")
    private BigDecimal dredgingVolume;

    @Column(name = "clearance_height", length = 20)
    private String clearanceHeight;

    @Column(name = "buoy_amount")
    @Builder.Default
    private Integer buoyAmount = 0;

    @Column(name = "beacon_amount")
    @Builder.Default
    private Integer beaconAmount = 0;

    @Column(name = "status")
    @Builder.Default
    private Integer status = 1;

    @Column(name = "is_approved_level1", nullable = false)
    private Boolean isApprovedLevel1;

    @Column(name = "is_approved_level2", nullable = false)
    private Boolean isApprovedLevel2;

    @Column(name = "registered_area", length = 100)
    private String registeredArea;

    @Column(name = "operating_hours", length = 50)
    private String operatingHours;

    @Column(name = "recorded_date")
    private LocalDate recordedDate;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "load_capacity", length = 100)
    private String loadCapacity;

    @Column(name = "symbol_id")
    private UUID symbolId;

    @OneToMany(mappedBy = "navigationChannel", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ChannelRouteDetail> channelRouteDetailList = new ArrayList<>();

    public void setApprovedDateLevel1(LocalDate date) {
        setApprovedDateLevel1(date != null ? date.atStartOfDay() : null);
    }

    public void setApprovedDateLevel2(LocalDate date) {
        setApprovedDateLevel2(date != null ? date.atStartOfDay() : null);
    }
}
