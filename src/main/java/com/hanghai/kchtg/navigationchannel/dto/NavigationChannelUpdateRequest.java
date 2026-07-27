package com.hanghai.kchtg.navigationchannel.dto;

import java.util.UUID;

import lombok.*;

import java.time.LocalDate;

/**
 * Update request for NavigationChannel (F-038). All fields optional.
 */
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NavigationChannelUpdateRequest {

    private String channelName;

    private Integer stationAmountt;

    private LocalDate latestStationRepairDate;

    private java.math.BigDecimal stationArea;

    private String note;

    private String channelCode;

    private UUID seaportId;

    private UUID operatingUnitId;

    private String location;

    private String detailedLocation;

    private String channelManagementStation;

    private Integer stationStaffAmount;

    private Integer latestMaintenanceYear;

    private java.math.BigDecimal dredgingVolume;

    @Builder.Default private Integer buoyAmount = 0;

    @Builder.Default private Integer beaconAmount = 0;

    @Builder.Default private Integer status = 1;

    private UUID orgUnitId;
    private GisGeometryType geometryType;
    private String coordinates;
    private UUID bieuTuongId;
}
