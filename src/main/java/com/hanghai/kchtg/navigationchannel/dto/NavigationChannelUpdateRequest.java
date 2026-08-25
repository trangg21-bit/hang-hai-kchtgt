package com.hanghai.kchtg.navigationchannel.dto;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Update request for NavigationChannel (F-038). All fields optional.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NavigationChannelUpdateRequest {

    private RecordSecurityLevel securityLevel;

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
    private UUID symbolId;
}
