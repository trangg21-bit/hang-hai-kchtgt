package com.hanghai.kchtg.port.dto.anchorage;

import com.hanghai.kchtg.common.dto.FieldPresenceTrackedRequest;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateAnchorageRequest extends FieldPresenceTrackedRequest {

    @NotNull(message = "ID không được để trống")
    private UUID id;

    @Size(max = 255)
    private String anchorageName;

    private UUID portId;
    private UUID orgUnitId;
    private UUID navigationChannelId;
    private UUID buoyStationId;
    private Integer provinceId;

    @Size(max = 500)
    private String detailedLocation;

    private OperationalStatus operationalStatus;

    @Size(max = 500)
    private String shapeDescription;

    @DecimalMin("0")
    private BigDecimal area;

    private String designWaterDepth;
    private String currentWaterDepth;
    private String bottomElevationDesign;
    private String maxVesselDWT;

    private Integer activeAnchorageCount;
    private Integer publishedAnchorageCount;
    private Integer underInvestmentAnchorageCount;

    private String remarks;

    private LocalDateTime openingAnnouncementDate;
    private String publicDecision;
    private String investmentAgreement;

    private BigDecimal latitude;
    private BigDecimal longitude;
    private UUID mapSymbolId;
    private GisGeometryType geometryType;
    private String coordinates;
    private Integer coordinateSystem;
    private Integer displayRule;

    private List<MooringWaterAreaRequest> mooringWaterAreas;
    private String saveAction;
    private ApprovalStatus approvalStatus;

    public void setApprovalStatus(ApprovalStatus approvalStatus) {
        markFieldPresent("approvalStatus");
        this.approvalStatus = approvalStatus;
    }

    public void setId(UUID id) {
        markFieldPresent("id");
        this.id = id;
    }

    public void setAnchorageName(String anchorageName) {
        markFieldPresent("anchorageName");
        this.anchorageName = (anchorageName != null && !anchorageName.trim().isEmpty()) ? anchorageName.trim() : null;
    }

    public void setPortId(UUID portId) {
        markFieldPresent("portId");
        this.portId = portId;
    }

    public void setOrgUnitId(UUID orgUnitId) {
        markFieldPresent("orgUnitId");
        this.orgUnitId = orgUnitId;
    }

    public void setNavigationChannelId(UUID navigationChannelId) {
        markFieldPresent("navigationChannelId");
        this.navigationChannelId = navigationChannelId;
    }

    public void setBuoyStationId(UUID buoyStationId) {
        markFieldPresent("buoyStationId");
        this.buoyStationId = buoyStationId;
    }

    public void setProvinceId(Integer provinceId) {
        markFieldPresent("provinceId");
        this.provinceId = provinceId;
    }

    public void setDetailedLocation(String detailedLocation) {
        markFieldPresent("detailedLocation");
        this.detailedLocation = (detailedLocation != null && !detailedLocation.trim().isEmpty()) ? detailedLocation.trim() : null;
    }

    public void setOperationalStatus(OperationalStatus operationalStatus) {
        markFieldPresent("operationalStatus");
        this.operationalStatus = operationalStatus;
    }

    public void setShapeDescription(String shapeDescription) {
        markFieldPresent("shapeDescription");
        this.shapeDescription = (shapeDescription != null && !shapeDescription.trim().isEmpty()) ? shapeDescription.trim() : null;
    }

    public void setArea(BigDecimal area) {
        markFieldPresent("area");
        this.area = area;
    }

    public void setDesignWaterDepth(String designWaterDepth) {
        markFieldPresent("designWaterDepth");
        this.designWaterDepth = (designWaterDepth != null && !designWaterDepth.trim().isEmpty()) ? designWaterDepth.trim() : null;
    }

    public void setCurrentWaterDepth(String currentWaterDepth) {
        markFieldPresent("currentWaterDepth");
        this.currentWaterDepth = (currentWaterDepth != null && !currentWaterDepth.trim().isEmpty()) ? currentWaterDepth.trim() : null;
    }

    public void setBottomElevationDesign(String bottomElevationDesign) {
        markFieldPresent("bottomElevationDesign");
        this.bottomElevationDesign = (bottomElevationDesign != null && !bottomElevationDesign.trim().isEmpty()) ? bottomElevationDesign.trim() : null;
    }

    public void setMaxVesselDWT(String maxVesselDWT) {
        markFieldPresent("maxVesselDWT");
        this.maxVesselDWT = (maxVesselDWT != null && !maxVesselDWT.trim().isEmpty()) ? maxVesselDWT.trim() : null;
    }

    public void setActiveAnchorageCount(Integer activeAnchorageCount) {
        markFieldPresent("activeAnchorageCount");
        this.activeAnchorageCount = activeAnchorageCount;
    }

    public void setPublishedAnchorageCount(Integer publishedAnchorageCount) {
        markFieldPresent("publishedAnchorageCount");
        this.publishedAnchorageCount = publishedAnchorageCount;
    }

    public void setUnderInvestmentAnchorageCount(Integer underInvestmentAnchorageCount) {
        markFieldPresent("underInvestmentAnchorageCount");
        this.underInvestmentAnchorageCount = underInvestmentAnchorageCount;
    }

    public void setRemarks(String remarks) {
        markFieldPresent("remarks");
        this.remarks = (remarks != null && !remarks.trim().isEmpty()) ? remarks.trim() : null;
    }

    public void setOpeningAnnouncementDate(LocalDateTime openingAnnouncementDate) {
        markFieldPresent("openingAnnouncementDate");
        this.openingAnnouncementDate = openingAnnouncementDate;
    }

    public void setPublicDecision(String publicDecision) {
        markFieldPresent("publicDecision");
        this.publicDecision = (publicDecision != null && !publicDecision.trim().isEmpty()) ? publicDecision.trim() : null;
    }

    public void setInvestmentAgreement(String investmentAgreement) {
        markFieldPresent("investmentAgreement");
        this.investmentAgreement = (investmentAgreement != null && !investmentAgreement.trim().isEmpty()) ? investmentAgreement.trim() : null;
    }

    public void setLatitude(BigDecimal latitude) {
        markFieldPresent("latitude");
        this.latitude = latitude;
    }

    public void setLongitude(BigDecimal longitude) {
        markFieldPresent("longitude");
        this.longitude = longitude;
    }

    public void setMapSymbolId(UUID mapSymbolId) {
        markFieldPresent("mapSymbolId");
        this.mapSymbolId = mapSymbolId;
    }

    public void setGeometryType(GisGeometryType geometryType) {
        markFieldPresent("geometryType");
        this.geometryType = geometryType;
    }

    public void setCoordinates(String coordinates) {
        markFieldPresent("coordinates");
        this.coordinates = (coordinates != null && !coordinates.trim().isEmpty()) ? coordinates.trim() : null;
    }

    public void setCoordinateSystem(Integer coordinateSystem) {
        markFieldPresent("coordinateSystem");
        this.coordinateSystem = coordinateSystem;
    }

    public void setDisplayRule(Integer displayRule) {
        markFieldPresent("displayRule");
        this.displayRule = displayRule;
    }

    public void setMooringWaterAreas(List<MooringWaterAreaRequest> mooringWaterAreas) {
        markFieldPresent("mooringWaterAreas");
        this.mooringWaterAreas = mooringWaterAreas;
    }

    public void setSaveAction(String saveAction) {
        markFieldPresent("saveAction");
        this.saveAction = (saveAction != null && !saveAction.trim().isEmpty()) ? saveAction.trim() : null;
    }

    public static class UpdateAnchorageRequestBuilder {
        private final java.util.Set<String> presentFields = new java.util.HashSet<>();

        public UpdateAnchorageRequestBuilder id(UUID id) {
            this.id = id;
            this.presentFields.add("id");
            return this;
        }

        public UpdateAnchorageRequestBuilder anchorageName(String anchorageName) {
            this.anchorageName = anchorageName;
            this.presentFields.add("anchorageName");
            return this;
        }

        public UpdateAnchorageRequestBuilder portId(UUID portId) {
            this.portId = portId;
            this.presentFields.add("portId");
            return this;
        }

        public UpdateAnchorageRequestBuilder orgUnitId(UUID orgUnitId) {
            this.orgUnitId = orgUnitId;
            this.presentFields.add("orgUnitId");
            return this;
        }

        public UpdateAnchorageRequestBuilder navigationChannelId(UUID navigationChannelId) {
            this.navigationChannelId = navigationChannelId;
            this.presentFields.add("navigationChannelId");
            return this;
        }

        public UpdateAnchorageRequestBuilder buoyStationId(UUID buoyStationId) {
            this.buoyStationId = buoyStationId;
            this.presentFields.add("buoyStationId");
            return this;
        }

        public UpdateAnchorageRequestBuilder provinceId(Integer provinceId) {
            this.provinceId = provinceId;
            this.presentFields.add("provinceId");
            return this;
        }

        public UpdateAnchorageRequestBuilder detailedLocation(String detailedLocation) {
            this.detailedLocation = detailedLocation;
            this.presentFields.add("detailedLocation");
            return this;
        }

        public UpdateAnchorageRequestBuilder operationalStatus(OperationalStatus operationalStatus) {
            this.operationalStatus = operationalStatus;
            this.presentFields.add("operationalStatus");
            return this;
        }

        public UpdateAnchorageRequestBuilder shapeDescription(String shapeDescription) {
            this.shapeDescription = shapeDescription;
            this.presentFields.add("shapeDescription");
            return this;
        }

        public UpdateAnchorageRequestBuilder area(BigDecimal area) {
            this.area = area;
            this.presentFields.add("area");
            return this;
        }

        public UpdateAnchorageRequestBuilder designWaterDepth(String designWaterDepth) {
            this.designWaterDepth = designWaterDepth;
            this.presentFields.add("designWaterDepth");
            return this;
        }

        public UpdateAnchorageRequestBuilder currentWaterDepth(String currentWaterDepth) {
            this.currentWaterDepth = currentWaterDepth;
            this.presentFields.add("currentWaterDepth");
            return this;
        }

        public UpdateAnchorageRequestBuilder bottomElevationDesign(String bottomElevationDesign) {
            this.bottomElevationDesign = bottomElevationDesign;
            this.presentFields.add("bottomElevationDesign");
            return this;
        }

        public UpdateAnchorageRequestBuilder maxVesselDWT(String maxVesselDWT) {
            this.maxVesselDWT = maxVesselDWT;
            this.presentFields.add("maxVesselDWT");
            return this;
        }

        public UpdateAnchorageRequestBuilder activeAnchorageCount(Integer activeAnchorageCount) {
            this.activeAnchorageCount = activeAnchorageCount;
            this.presentFields.add("activeAnchorageCount");
            return this;
        }

        public UpdateAnchorageRequestBuilder publishedAnchorageCount(Integer publishedAnchorageCount) {
            this.publishedAnchorageCount = publishedAnchorageCount;
            this.presentFields.add("publishedAnchorageCount");
            return this;
        }

        public UpdateAnchorageRequestBuilder underInvestmentAnchorageCount(Integer underInvestmentAnchorageCount) {
            this.underInvestmentAnchorageCount = underInvestmentAnchorageCount;
            this.presentFields.add("underInvestmentAnchorageCount");
            return this;
        }

        public UpdateAnchorageRequestBuilder remarks(String remarks) {
            this.remarks = remarks;
            this.presentFields.add("remarks");
            return this;
        }

        public UpdateAnchorageRequestBuilder openingAnnouncementDate(LocalDateTime openingAnnouncementDate) {
            this.openingAnnouncementDate = openingAnnouncementDate;
            this.presentFields.add("openingAnnouncementDate");
            return this;
        }

        public UpdateAnchorageRequestBuilder publicDecision(String publicDecision) {
            this.publicDecision = publicDecision;
            this.presentFields.add("publicDecision");
            return this;
        }

        public UpdateAnchorageRequestBuilder investmentAgreement(String investmentAgreement) {
            this.investmentAgreement = investmentAgreement;
            this.presentFields.add("investmentAgreement");
            return this;
        }

        public UpdateAnchorageRequestBuilder latitude(BigDecimal latitude) {
            this.latitude = latitude;
            this.presentFields.add("latitude");
            return this;
        }

        public UpdateAnchorageRequestBuilder longitude(BigDecimal longitude) {
            this.longitude = longitude;
            this.presentFields.add("longitude");
            return this;
        }

        public UpdateAnchorageRequestBuilder mapSymbolId(UUID mapSymbolId) {
            this.mapSymbolId = mapSymbolId;
            this.presentFields.add("mapSymbolId");
            return this;
        }

        public UpdateAnchorageRequestBuilder geometryType(GisGeometryType geometryType) {
            this.geometryType = geometryType;
            this.presentFields.add("geometryType");
            return this;
        }

        public UpdateAnchorageRequestBuilder coordinates(String coordinates) {
            this.coordinates = coordinates;
            this.presentFields.add("coordinates");
            return this;
        }

        public UpdateAnchorageRequestBuilder coordinateSystem(Integer coordinateSystem) {
            this.coordinateSystem = coordinateSystem;
            this.presentFields.add("coordinateSystem");
            return this;
        }

        public UpdateAnchorageRequestBuilder displayRule(Integer displayRule) {
            this.displayRule = displayRule;
            this.presentFields.add("displayRule");
            return this;
        }

        public UpdateAnchorageRequestBuilder mooringWaterAreas(List<MooringWaterAreaRequest> mooringWaterAreas) {
            this.mooringWaterAreas = mooringWaterAreas;
            this.presentFields.add("mooringWaterAreas");
            return this;
        }

        public UpdateAnchorageRequestBuilder saveAction(String saveAction) {
            this.saveAction = saveAction;
            this.presentFields.add("saveAction");
            return this;
        }

        public UpdateAnchorageRequest build() {
            UpdateAnchorageRequest req = new UpdateAnchorageRequest();
            if (presentFields.contains("id")) req.setId(this.id);
            if (presentFields.contains("anchorageName")) req.setAnchorageName(this.anchorageName);
            if (presentFields.contains("portId")) req.setPortId(this.portId);
            if (presentFields.contains("orgUnitId")) req.setOrgUnitId(this.orgUnitId);
            if (presentFields.contains("navigationChannelId")) req.setNavigationChannelId(this.navigationChannelId);
            if (presentFields.contains("buoyStationId")) req.setBuoyStationId(this.buoyStationId);
            if (presentFields.contains("provinceId")) req.setProvinceId(this.provinceId);
            if (presentFields.contains("detailedLocation")) req.setDetailedLocation(this.detailedLocation);
            if (presentFields.contains("operationalStatus")) req.setOperationalStatus(this.operationalStatus);
            if (presentFields.contains("shapeDescription")) req.setShapeDescription(this.shapeDescription);
            if (presentFields.contains("area")) req.setArea(this.area);
            if (presentFields.contains("designWaterDepth")) req.setDesignWaterDepth(this.designWaterDepth);
            if (presentFields.contains("currentWaterDepth")) req.setCurrentWaterDepth(this.currentWaterDepth);
            if (presentFields.contains("bottomElevationDesign")) req.setBottomElevationDesign(this.bottomElevationDesign);
            if (presentFields.contains("maxVesselDWT")) req.setMaxVesselDWT(this.maxVesselDWT);
            if (presentFields.contains("activeAnchorageCount")) req.setActiveAnchorageCount(this.activeAnchorageCount);
            if (presentFields.contains("publishedAnchorageCount")) req.setPublishedAnchorageCount(this.publishedAnchorageCount);
            if (presentFields.contains("underInvestmentAnchorageCount")) req.setUnderInvestmentAnchorageCount(this.underInvestmentAnchorageCount);
            if (presentFields.contains("remarks")) req.setRemarks(this.remarks);
            if (presentFields.contains("openingAnnouncementDate")) req.setOpeningAnnouncementDate(this.openingAnnouncementDate);
            if (presentFields.contains("publicDecision")) req.setPublicDecision(this.publicDecision);
            if (presentFields.contains("investmentAgreement")) req.setInvestmentAgreement(this.investmentAgreement);
            if (presentFields.contains("latitude")) req.setLatitude(this.latitude);
            if (presentFields.contains("longitude")) req.setLongitude(this.longitude);
            if (presentFields.contains("mapSymbolId")) req.setMapSymbolId(this.mapSymbolId);
            if (presentFields.contains("geometryType")) req.setGeometryType(this.geometryType);
            if (presentFields.contains("coordinates")) req.setCoordinates(this.coordinates);
            if (presentFields.contains("coordinateSystem")) req.setCoordinateSystem(this.coordinateSystem);
            if (presentFields.contains("displayRule")) req.setDisplayRule(this.displayRule);
            if (presentFields.contains("mooringWaterAreas")) req.setMooringWaterAreas(this.mooringWaterAreas);
            if (presentFields.contains("saveAction")) req.setSaveAction(this.saveAction);
            return req;
        }
    }
}
