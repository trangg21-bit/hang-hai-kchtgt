package com.hanghai.kchtg.navigationchannel.dto;

import com.hanghai.kchtg.common.dto.FieldPresenceTrackedRequest;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Update request for NavigationChannel (F-038) — all fields optional.
 * Same write surface as the create request (no #47-#71, no channelCode/routeCode — BR-038-03/06).
 * Extends {@link FieldPresenceTrackedRequest} to accurately track fields sent as null (e.g. cleared by user).
 */
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
public class NavigationChannelUpdateRequest extends FieldPresenceTrackedRequest {

    private ApprovalStatus approvalStatus;

    private UUID orgUnitId;

    private UUID seaportId;

    private UUID operatingUnitId;

    @Size(max = 255, message = "Tên luồng hàng hải tối đa 255 ký tự")
    private String channelName;

    private Integer provinceId;

    @Size(max = 500, message = "Địa điểm chi tiết tối đa 500 ký tự")
    private String detailedLocation;

    private ConditionStatus conditionStatus;

    @Size(max = 500, message = "Trạm quản lý luồng tối đa 500 ký tự")
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

    @Size(max = 255, message = "Đơn vị ra quyết định công bố tối đa 255 ký tự")
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

    public void setApprovalStatus(ApprovalStatus approvalStatus) {
        markFieldPresent("approvalStatus");
        this.approvalStatus = approvalStatus;
    }

    public void setOrgUnitId(UUID orgUnitId) {
        markFieldPresent("orgUnitId");
        this.orgUnitId = orgUnitId;
    }

    public void setSeaportId(UUID seaportId) {
        markFieldPresent("seaportId");
        this.seaportId = seaportId;
    }

    public void setOperatingUnitId(UUID operatingUnitId) {
        markFieldPresent("operatingUnitId");
        this.operatingUnitId = operatingUnitId;
    }

    public void setChannelName(String channelName) {
        markFieldPresent("channelName");
        this.channelName = channelName;
    }

    public void setProvinceId(Integer provinceId) {
        markFieldPresent("provinceId");
        this.provinceId = provinceId;
    }

    public void setDetailedLocation(String detailedLocation) {
        markFieldPresent("detailedLocation");
        this.detailedLocation = detailedLocation;
    }

    public void setConditionStatus(ConditionStatus conditionStatus) {
        markFieldPresent("conditionStatus");
        this.conditionStatus = conditionStatus;
    }

    public void setManagementStation(String managementStation) {
        markFieldPresent("managementStation");
        this.managementStation = managementStation;
    }

    public void setStationCount(Integer stationCount) {
        markFieldPresent("stationCount");
        this.stationCount = stationCount;
    }

    public void setStationStaffCount(Integer stationStaffCount) {
        markFieldPresent("stationStaffCount");
        this.stationStaffCount = stationStaffCount;
    }

    public void setStationAreaSquareMeters(BigDecimal stationAreaSquareMeters) {
        markFieldPresent("stationAreaSquareMeters");
        this.stationAreaSquareMeters = stationAreaSquareMeters;
    }

    public void setLatestStationRepairMonth(LocalDate latestStationRepairMonth) {
        markFieldPresent("latestStationRepairMonth");
        this.latestStationRepairMonth = latestStationRepairMonth;
    }

    public void setLatestMaintenanceYear(Integer latestMaintenanceYear) {
        markFieldPresent("latestMaintenanceYear");
        this.latestMaintenanceYear = latestMaintenanceYear;
    }

    public void setLatestDredgingVolumeCubicMeters(BigDecimal latestDredgingVolumeCubicMeters) {
        markFieldPresent("latestDredgingVolumeCubicMeters");
        this.latestDredgingVolumeCubicMeters = latestDredgingVolumeCubicMeters;
    }

    public void setBuoyCount(Integer buoyCount) {
        markFieldPresent("buoyCount");
        this.buoyCount = buoyCount;
    }

    public void setBeaconCount(Integer beaconCount) {
        markFieldPresent("beaconCount");
        this.beaconCount = beaconCount;
    }

    public void setNotes(String notes) {
        markFieldPresent("notes");
        this.notes = notes;
    }

    public void setAnnouncementDecisionNumber(String announcementDecisionNumber) {
        markFieldPresent("announcementDecisionNumber");
        this.announcementDecisionNumber = announcementDecisionNumber;
    }

    public void setAnnouncementDecisionDate(LocalDate announcementDecisionDate) {
        markFieldPresent("announcementDecisionDate");
        this.announcementDecisionDate = announcementDecisionDate;
    }

    public void setAnnouncementDecisionIssuer(String announcementDecisionIssuer) {
        markFieldPresent("announcementDecisionIssuer");
        this.announcementDecisionIssuer = announcementDecisionIssuer;
    }

    public void setRouteDetails(List<ChannelRouteDetailRequest> routeDetails) {
        markFieldPresent("routeDetails");
        this.routeDetails = routeDetails;
    }

    public void setProtectionScopeMeters(BigDecimal protectionScopeMeters) {
        markFieldPresent("protectionScopeMeters");
        this.protectionScopeMeters = protectionScopeMeters;
    }

    public void setProtectionNotes(String protectionNotes) {
        markFieldPresent("protectionNotes");
        this.protectionNotes = protectionNotes;
    }

    public void setGeometryType(GisGeometryType geometryType) {
        markFieldPresent("geometryType");
        this.geometryType = geometryType;
    }

    public void setMapIconId(UUID mapIconId) {
        markFieldPresent("mapIconId");
        this.mapIconId = mapIconId;
    }

    public void setCoordinateReferenceSystem(String coordinateReferenceSystem) {
        markFieldPresent("coordinateReferenceSystem");
        this.coordinateReferenceSystem = coordinateReferenceSystem;
    }

    public void setDisplayRule(String displayRule) {
        markFieldPresent("displayRule");
        this.displayRule = displayRule;
    }

    public void setCoordinates(String coordinates) {
        markFieldPresent("coordinates");
        this.coordinates = coordinates;
    }

    public void setCoordinateList(List<NavigationChannelCoordinateRequest> coordinateList) {
        markFieldPresent("coordinateList");
        this.coordinateList = coordinateList;
    }

    public void setAttachments(List<NavigationChannelAttachmentRequest> attachments) {
        markFieldPresent("attachments");
        this.attachments = attachments;
    }

    public static NavigationChannelUpdateRequestBuilder builder() {
        return new NavigationChannelUpdateRequestBuilder();
    }

    public static class NavigationChannelUpdateRequestBuilder {
        private final Set<String> presentFields = new HashSet<>();
        private ApprovalStatus approvalStatus;
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

        public NavigationChannelUpdateRequestBuilder approvalStatus(ApprovalStatus approvalStatus) {
            this.approvalStatus = approvalStatus;
            this.presentFields.add("approvalStatus");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder orgUnitId(UUID orgUnitId) {
            this.orgUnitId = orgUnitId;
            this.presentFields.add("orgUnitId");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder seaportId(UUID seaportId) {
            this.seaportId = seaportId;
            this.presentFields.add("seaportId");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder operatingUnitId(UUID operatingUnitId) {
            this.operatingUnitId = operatingUnitId;
            this.presentFields.add("operatingUnitId");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder channelName(String channelName) {
            this.channelName = channelName;
            this.presentFields.add("channelName");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder provinceId(Integer provinceId) {
            this.provinceId = provinceId;
            this.presentFields.add("provinceId");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder detailedLocation(String detailedLocation) {
            this.detailedLocation = detailedLocation;
            this.presentFields.add("detailedLocation");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder conditionStatus(ConditionStatus conditionStatus) {
            this.conditionStatus = conditionStatus;
            this.presentFields.add("conditionStatus");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder managementStation(String managementStation) {
            this.managementStation = managementStation;
            this.presentFields.add("managementStation");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder stationCount(Integer stationCount) {
            this.stationCount = stationCount;
            this.presentFields.add("stationCount");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder stationStaffCount(Integer stationStaffCount) {
            this.stationStaffCount = stationStaffCount;
            this.presentFields.add("stationStaffCount");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder stationAreaSquareMeters(BigDecimal stationAreaSquareMeters) {
            this.stationAreaSquareMeters = stationAreaSquareMeters;
            this.presentFields.add("stationAreaSquareMeters");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder latestStationRepairMonth(LocalDate latestStationRepairMonth) {
            this.latestStationRepairMonth = latestStationRepairMonth;
            this.presentFields.add("latestStationRepairMonth");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder latestMaintenanceYear(Integer latestMaintenanceYear) {
            this.latestMaintenanceYear = latestMaintenanceYear;
            this.presentFields.add("latestMaintenanceYear");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder latestDredgingVolumeCubicMeters(BigDecimal latestDredgingVolumeCubicMeters) {
            this.latestDredgingVolumeCubicMeters = latestDredgingVolumeCubicMeters;
            this.presentFields.add("latestDredgingVolumeCubicMeters");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder buoyCount(Integer buoyCount) {
            this.buoyCount = buoyCount;
            this.presentFields.add("buoyCount");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder beaconCount(Integer beaconCount) {
            this.beaconCount = beaconCount;
            this.presentFields.add("beaconCount");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder notes(String notes) {
            this.notes = notes;
            this.presentFields.add("notes");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder announcementDecisionNumber(String announcementDecisionNumber) {
            this.announcementDecisionNumber = announcementDecisionNumber;
            this.presentFields.add("announcementDecisionNumber");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder announcementDecisionDate(LocalDate announcementDecisionDate) {
            this.announcementDecisionDate = announcementDecisionDate;
            this.presentFields.add("announcementDecisionDate");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder announcementDecisionIssuer(String announcementDecisionIssuer) {
            this.announcementDecisionIssuer = announcementDecisionIssuer;
            this.presentFields.add("announcementDecisionIssuer");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder routeDetails(List<ChannelRouteDetailRequest> routeDetails) {
            this.routeDetails = routeDetails;
            this.presentFields.add("routeDetails");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder protectionScopeMeters(BigDecimal protectionScopeMeters) {
            this.protectionScopeMeters = protectionScopeMeters;
            this.presentFields.add("protectionScopeMeters");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder protectionNotes(String protectionNotes) {
            this.protectionNotes = protectionNotes;
            this.presentFields.add("protectionNotes");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder geometryType(GisGeometryType geometryType) {
            this.geometryType = geometryType;
            this.presentFields.add("geometryType");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder mapIconId(UUID mapIconId) {
            this.mapIconId = mapIconId;
            this.presentFields.add("mapIconId");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder coordinateReferenceSystem(String coordinateReferenceSystem) {
            this.coordinateReferenceSystem = coordinateReferenceSystem;
            this.presentFields.add("coordinateReferenceSystem");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder displayRule(String displayRule) {
            this.displayRule = displayRule;
            this.presentFields.add("displayRule");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder coordinates(String coordinates) {
            this.coordinates = coordinates;
            this.presentFields.add("coordinates");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder coordinateList(List<NavigationChannelCoordinateRequest> coordinateList) {
            this.coordinateList = coordinateList;
            this.presentFields.add("coordinateList");
            return this;
        }

        public NavigationChannelUpdateRequestBuilder attachments(List<NavigationChannelAttachmentRequest> attachments) {
            this.attachments = attachments;
            this.presentFields.add("attachments");
            return this;
        }

        public NavigationChannelUpdateRequest build() {
            NavigationChannelUpdateRequest req = new NavigationChannelUpdateRequest();
            if (presentFields.contains("approvalStatus")) req.setApprovalStatus(this.approvalStatus);
            if (presentFields.contains("orgUnitId")) req.setOrgUnitId(this.orgUnitId);
            if (presentFields.contains("seaportId")) req.setSeaportId(this.seaportId);
            if (presentFields.contains("operatingUnitId")) req.setOperatingUnitId(this.operatingUnitId);
            if (presentFields.contains("channelName")) req.setChannelName(this.channelName);
            if (presentFields.contains("provinceId")) req.setProvinceId(this.provinceId);
            if (presentFields.contains("detailedLocation")) req.setDetailedLocation(this.detailedLocation);
            if (presentFields.contains("conditionStatus")) req.setConditionStatus(this.conditionStatus);
            if (presentFields.contains("managementStation")) req.setManagementStation(this.managementStation);
            if (presentFields.contains("stationCount")) req.setStationCount(this.stationCount);
            if (presentFields.contains("stationStaffCount")) req.setStationStaffCount(this.stationStaffCount);
            if (presentFields.contains("stationAreaSquareMeters")) req.setStationAreaSquareMeters(this.stationAreaSquareMeters);
            if (presentFields.contains("latestStationRepairMonth")) req.setLatestStationRepairMonth(this.latestStationRepairMonth);
            if (presentFields.contains("latestMaintenanceYear")) req.setLatestMaintenanceYear(this.latestMaintenanceYear);
            if (presentFields.contains("latestDredgingVolumeCubicMeters")) req.setLatestDredgingVolumeCubicMeters(this.latestDredgingVolumeCubicMeters);
            if (presentFields.contains("buoyCount")) req.setBuoyCount(this.buoyCount);
            if (presentFields.contains("beaconCount")) req.setBeaconCount(this.beaconCount);
            if (presentFields.contains("notes")) req.setNotes(this.notes);
            if (presentFields.contains("announcementDecisionNumber")) req.setAnnouncementDecisionNumber(this.announcementDecisionNumber);
            if (presentFields.contains("announcementDecisionDate")) req.setAnnouncementDecisionDate(this.announcementDecisionDate);
            if (presentFields.contains("announcementDecisionIssuer")) req.setAnnouncementDecisionIssuer(this.announcementDecisionIssuer);
            if (presentFields.contains("routeDetails")) req.setRouteDetails(this.routeDetails);
            if (presentFields.contains("protectionScopeMeters")) req.setProtectionScopeMeters(this.protectionScopeMeters);
            if (presentFields.contains("protectionNotes")) req.setProtectionNotes(this.protectionNotes);
            if (presentFields.contains("geometryType")) req.setGeometryType(this.geometryType);
            if (presentFields.contains("mapIconId")) req.setMapIconId(this.mapIconId);
            if (presentFields.contains("coordinateReferenceSystem")) req.setCoordinateReferenceSystem(this.coordinateReferenceSystem);
            if (presentFields.contains("displayRule")) req.setDisplayRule(this.displayRule);
            if (presentFields.contains("coordinates")) req.setCoordinates(this.coordinates);
            if (presentFields.contains("coordinateList")) req.setCoordinateList(this.coordinateList);
            if (presentFields.contains("attachments")) req.setAttachments(this.attachments);
            return req;
        }
    }
}
