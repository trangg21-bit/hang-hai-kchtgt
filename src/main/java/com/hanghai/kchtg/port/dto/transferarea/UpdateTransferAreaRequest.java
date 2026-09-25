package com.hanghai.kchtg.port.dto.transferarea;

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
public class UpdateTransferAreaRequest extends FieldPresenceTrackedRequest {

    @NotNull(message = "ID không được để trống")
    private UUID id;

    @Size(max = 255)
    private String transferAreaName;

    private UUID portId;
    private UUID orgUnitId;
    private Integer provinceId;

    @Size(max = 500)
    private String detailedLocation;

    private String operationalFunctions;
    private OperationalStatus operationalStatus;

    @Size(max = 500)
    private String shapeDescription;

    @DecimalMin("0")
    private BigDecimal area;

    private String designWaterDepth;
    private String currentWaterDepth;
    private String bottomElevationDesign;
    private String maxVesselDWT;

    private Integer activeTransferCount;
    private Integer publishedTransferCount;
    private Integer underInvestmentTransferCount;

    private String remarks;

    private LocalDateTime openingAnnouncementDate;
    private String publicDecision;
    private String investmentAgreement;
    private LocalDateTime activityStartDate;
    private LocalDateTime activityEndDate;

    private BigDecimal latitude;
    private BigDecimal longitude;
    private UUID mapSymbolId;
    private GisGeometryType geometryType;
    private String coordinates;
    private Integer coordinateSystem;
    private Integer displayRule;

    private List<TransferAreaMooringWaterAreaRequest> mooringWaterAreas;
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

    public void setTransferAreaName(String transferAreaName) {
        markFieldPresent("transferAreaName");
        this.transferAreaName = (transferAreaName != null && !transferAreaName.trim().isEmpty()) ? transferAreaName.trim() : null;
    }

    public void setPortId(UUID portId) {
        markFieldPresent("portId");
        this.portId = portId;
    }

    public void setOrgUnitId(UUID orgUnitId) {
        markFieldPresent("orgUnitId");
        this.orgUnitId = orgUnitId;
    }

    public void setProvinceId(Integer provinceId) {
        markFieldPresent("provinceId");
        this.provinceId = provinceId;
    }

    public void setDetailedLocation(String detailedLocation) {
        markFieldPresent("detailedLocation");
        this.detailedLocation = (detailedLocation != null && !detailedLocation.trim().isEmpty()) ? detailedLocation.trim() : null;
    }

    public void setOperationalFunctions(String operationalFunctions) {
        markFieldPresent("operationalFunctions");
        this.operationalFunctions = (operationalFunctions != null && !operationalFunctions.trim().isEmpty()) ? operationalFunctions.trim() : null;
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

    public void setActiveTransferCount(Integer activeTransferCount) {
        markFieldPresent("activeTransferCount");
        this.activeTransferCount = activeTransferCount;
    }

    public void setPublishedTransferCount(Integer publishedTransferCount) {
        markFieldPresent("publishedTransferCount");
        this.publishedTransferCount = publishedTransferCount;
    }

    public void setUnderInvestmentTransferCount(Integer underInvestmentTransferCount) {
        markFieldPresent("underInvestmentTransferCount");
        this.underInvestmentTransferCount = underInvestmentTransferCount;
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

    public void setActivityStartDate(LocalDateTime activityStartDate) {
        markFieldPresent("activityStartDate");
        this.activityStartDate = activityStartDate;
    }

    public void setActivityEndDate(LocalDateTime activityEndDate) {
        markFieldPresent("activityEndDate");
        this.activityEndDate = activityEndDate;
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

    public void setMooringWaterAreas(List<TransferAreaMooringWaterAreaRequest> mooringWaterAreas) {
        markFieldPresent("mooringWaterAreas");
        this.mooringWaterAreas = mooringWaterAreas;
    }

    public void setSaveAction(String saveAction) {
        markFieldPresent("saveAction");
        this.saveAction = (saveAction != null && !saveAction.trim().isEmpty()) ? saveAction.trim() : null;
    }

    public static class UpdateTransferAreaRequestBuilder {
        private final java.util.Set<String> presentFields = new java.util.HashSet<>();

        public UpdateTransferAreaRequestBuilder id(UUID id) {
            this.id = id;
            this.presentFields.add("id");
            return this;
        }

        public UpdateTransferAreaRequestBuilder transferAreaName(String transferAreaName) {
            this.transferAreaName = transferAreaName;
            this.presentFields.add("transferAreaName");
            return this;
        }

        public UpdateTransferAreaRequestBuilder portId(UUID portId) {
            this.portId = portId;
            this.presentFields.add("portId");
            return this;
        }

        public UpdateTransferAreaRequestBuilder orgUnitId(UUID orgUnitId) {
            this.orgUnitId = orgUnitId;
            this.presentFields.add("orgUnitId");
            return this;
        }

        public UpdateTransferAreaRequestBuilder provinceId(Integer provinceId) {
            this.provinceId = provinceId;
            this.presentFields.add("provinceId");
            return this;
        }

        public UpdateTransferAreaRequestBuilder detailedLocation(String detailedLocation) {
            this.detailedLocation = detailedLocation;
            this.presentFields.add("detailedLocation");
            return this;
        }

        public UpdateTransferAreaRequestBuilder operationalFunctions(String operationalFunctions) {
            this.operationalFunctions = operationalFunctions;
            this.presentFields.add("operationalFunctions");
            return this;
        }

        public UpdateTransferAreaRequestBuilder operationalStatus(OperationalStatus operationalStatus) {
            this.operationalStatus = operationalStatus;
            this.presentFields.add("operationalStatus");
            return this;
        }

        public UpdateTransferAreaRequestBuilder shapeDescription(String shapeDescription) {
            this.shapeDescription = shapeDescription;
            this.presentFields.add("shapeDescription");
            return this;
        }

        public UpdateTransferAreaRequestBuilder area(BigDecimal area) {
            this.area = area;
            this.presentFields.add("area");
            return this;
        }

        public UpdateTransferAreaRequestBuilder designWaterDepth(String designWaterDepth) {
            this.designWaterDepth = designWaterDepth;
            this.presentFields.add("designWaterDepth");
            return this;
        }

        public UpdateTransferAreaRequestBuilder currentWaterDepth(String currentWaterDepth) {
            this.currentWaterDepth = currentWaterDepth;
            this.presentFields.add("currentWaterDepth");
            return this;
        }

        public UpdateTransferAreaRequestBuilder bottomElevationDesign(String bottomElevationDesign) {
            this.bottomElevationDesign = bottomElevationDesign;
            this.presentFields.add("bottomElevationDesign");
            return this;
        }

        public UpdateTransferAreaRequestBuilder maxVesselDWT(String maxVesselDWT) {
            this.maxVesselDWT = maxVesselDWT;
            this.presentFields.add("maxVesselDWT");
            return this;
        }

        public UpdateTransferAreaRequestBuilder activeTransferCount(Integer activeTransferCount) {
            this.activeTransferCount = activeTransferCount;
            this.presentFields.add("activeTransferCount");
            return this;
        }

        public UpdateTransferAreaRequestBuilder publishedTransferCount(Integer publishedTransferCount) {
            this.publishedTransferCount = publishedTransferCount;
            this.presentFields.add("publishedTransferCount");
            return this;
        }

        public UpdateTransferAreaRequestBuilder underInvestmentTransferCount(Integer underInvestmentTransferCount) {
            this.underInvestmentTransferCount = underInvestmentTransferCount;
            this.presentFields.add("underInvestmentTransferCount");
            return this;
        }

        public UpdateTransferAreaRequestBuilder remarks(String remarks) {
            this.remarks = remarks;
            this.presentFields.add("remarks");
            return this;
        }

        public UpdateTransferAreaRequestBuilder openingAnnouncementDate(LocalDateTime openingAnnouncementDate) {
            this.openingAnnouncementDate = openingAnnouncementDate;
            this.presentFields.add("openingAnnouncementDate");
            return this;
        }

        public UpdateTransferAreaRequestBuilder publicDecision(String publicDecision) {
            this.publicDecision = publicDecision;
            this.presentFields.add("publicDecision");
            return this;
        }

        public UpdateTransferAreaRequestBuilder investmentAgreement(String investmentAgreement) {
            this.investmentAgreement = investmentAgreement;
            this.presentFields.add("investmentAgreement");
            return this;
        }

        public UpdateTransferAreaRequestBuilder activityStartDate(LocalDateTime activityStartDate) {
            this.activityStartDate = activityStartDate;
            this.presentFields.add("activityStartDate");
            return this;
        }

        public UpdateTransferAreaRequestBuilder activityEndDate(LocalDateTime activityEndDate) {
            this.activityEndDate = activityEndDate;
            this.presentFields.add("activityEndDate");
            return this;
        }

        public UpdateTransferAreaRequestBuilder latitude(BigDecimal latitude) {
            this.latitude = latitude;
            this.presentFields.add("latitude");
            return this;
        }

        public UpdateTransferAreaRequestBuilder longitude(BigDecimal longitude) {
            this.longitude = longitude;
            this.presentFields.add("longitude");
            return this;
        }

        public UpdateTransferAreaRequestBuilder mapSymbolId(UUID mapSymbolId) {
            this.mapSymbolId = mapSymbolId;
            this.presentFields.add("mapSymbolId");
            return this;
        }

        public UpdateTransferAreaRequestBuilder geometryType(GisGeometryType geometryType) {
            this.geometryType = geometryType;
            this.presentFields.add("geometryType");
            return this;
        }

        public UpdateTransferAreaRequestBuilder coordinates(String coordinates) {
            this.coordinates = coordinates;
            this.presentFields.add("coordinates");
            return this;
        }

        public UpdateTransferAreaRequestBuilder coordinateSystem(Integer coordinateSystem) {
            this.coordinateSystem = coordinateSystem;
            this.presentFields.add("coordinateSystem");
            return this;
        }

        public UpdateTransferAreaRequestBuilder displayRule(Integer displayRule) {
            this.displayRule = displayRule;
            this.presentFields.add("displayRule");
            return this;
        }

        public UpdateTransferAreaRequestBuilder mooringWaterAreas(List<TransferAreaMooringWaterAreaRequest> mooringWaterAreas) {
            this.mooringWaterAreas = mooringWaterAreas;
            this.presentFields.add("mooringWaterAreas");
            return this;
        }

        public UpdateTransferAreaRequestBuilder saveAction(String saveAction) {
            this.saveAction = saveAction;
            this.presentFields.add("saveAction");
            return this;
        }

        public UpdateTransferAreaRequest build() {
            UpdateTransferAreaRequest req = new UpdateTransferAreaRequest();
            if (presentFields.contains("id")) req.setId(this.id);
            if (presentFields.contains("transferAreaName")) req.setTransferAreaName(this.transferAreaName);
            if (presentFields.contains("portId")) req.setPortId(this.portId);
            if (presentFields.contains("orgUnitId")) req.setOrgUnitId(this.orgUnitId);
            if (presentFields.contains("provinceId")) req.setProvinceId(this.provinceId);
            if (presentFields.contains("detailedLocation")) req.setDetailedLocation(this.detailedLocation);
            if (presentFields.contains("operationalFunctions")) req.setOperationalFunctions(this.operationalFunctions);
            if (presentFields.contains("operationalStatus")) req.setOperationalStatus(this.operationalStatus);
            if (presentFields.contains("shapeDescription")) req.setShapeDescription(this.shapeDescription);
            if (presentFields.contains("area")) req.setArea(this.area);
            if (presentFields.contains("designWaterDepth")) req.setDesignWaterDepth(this.designWaterDepth);
            if (presentFields.contains("currentWaterDepth")) req.setCurrentWaterDepth(this.currentWaterDepth);
            if (presentFields.contains("bottomElevationDesign")) req.setBottomElevationDesign(this.bottomElevationDesign);
            if (presentFields.contains("maxVesselDWT")) req.setMaxVesselDWT(this.maxVesselDWT);
            if (presentFields.contains("activeTransferCount")) req.setActiveTransferCount(this.activeTransferCount);
            if (presentFields.contains("publishedTransferCount")) req.setPublishedTransferCount(this.publishedTransferCount);
            if (presentFields.contains("underInvestmentTransferCount")) req.setUnderInvestmentTransferCount(this.underInvestmentTransferCount);
            if (presentFields.contains("remarks")) req.setRemarks(this.remarks);
            if (presentFields.contains("openingAnnouncementDate")) req.setOpeningAnnouncementDate(this.openingAnnouncementDate);
            if (presentFields.contains("publicDecision")) req.setPublicDecision(this.publicDecision);
            if (presentFields.contains("investmentAgreement")) req.setInvestmentAgreement(this.investmentAgreement);
            if (presentFields.contains("activityStartDate")) req.setActivityStartDate(this.activityStartDate);
            if (presentFields.contains("activityEndDate")) req.setActivityEndDate(this.activityEndDate);
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
