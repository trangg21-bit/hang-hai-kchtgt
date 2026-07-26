package com.hanghai.kchtg.navigationchannel.dto;

import java.util.UUID;

import lombok.*;
import java.time.LocalDate;
import java.util.List;

/**
 * Create request for NavigationChannel (F-038).
 */
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import jakarta.validation.constraints.NotBlank;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class NavigationChannelCreateRequest {
    @NotBlank(message = "tên không được để trống")
    private String channelName;
    private String channelCode;
    private Integer stationAmountt;
    private LocalDate latestStationRepairDate;
    private java.math.BigDecimal stationArea;
    private String note;
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
