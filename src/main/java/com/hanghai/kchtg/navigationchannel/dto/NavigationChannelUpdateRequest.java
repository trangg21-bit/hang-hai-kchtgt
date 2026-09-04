package com.hanghai.kchtg.navigationchannel.dto;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Update request for NavigationChannel (F-038) — all fields optional.
 * Same write surface as the create request (no #47-#71, no channelCode/routeCode — BR-038-03/06).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class NavigationChannelUpdateRequest {

    private UUID orgUnitId;

    private UUID seaportId;

    private UUID operatingUnitId;

    private String channelName;

    private Integer provinceId;

    private String detailedLocation;

    private ConditionStatus conditionStatus;

    private String managementStation;

    private Integer stationCount;

    private Integer stationStaffCount;

    private BigDecimal stationAreaSquareMeters;

    private LocalDate latestStationRepairMonth;

    private Integer latestMaintenanceYear;

    private BigDecimal latestDredgingVolumeCubicMeters;

    private Integer buoyCount;

    private Integer beaconCount;

    private String notes;

    private String announcementDecisionNumber;

    private LocalDate announcementDecisionDate;

    private String announcementDecisionIssuer;

    private List<ChannelRouteDetailRequest> routeDetails;

    private BigDecimal protectionScopeMeters;

    private String protectionNotes;

    private GisGeometryType geometryType;

    private UUID mapIconId;

    private String coordinateReferenceSystem;

    private String displayRule;

    private String coordinates;

    private List<NavigationChannelCoordinateRequest> coordinateList;

    private List<NavigationChannelAttachmentRequest> attachments;
}
