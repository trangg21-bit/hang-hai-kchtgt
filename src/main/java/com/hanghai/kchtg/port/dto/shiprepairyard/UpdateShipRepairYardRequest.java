package com.hanghai.kchtg.port.dto.shiprepairyard;

import com.hanghai.kchtg.common.dto.FieldPresenceTrackedRequest;
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
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateShipRepairYardRequest extends FieldPresenceTrackedRequest {

    @NotNull(message = "ID không được để trống")
    private UUID id;

    @Size(max = 255)
    private String shipRepairYardName;

    private UUID portId;
    private UUID pierId;
    private UUID orgUnitId;
    private Integer provinceId;

    @Size(max = 500)
    private String detailedLocation;

    private OperationalStatus operationalStatus;

    @Size(max = 255)
    private String usageFunction;

    @DecimalMin("0")
    private BigDecimal workshopArea;

    @Size(max = 255)
    private String vesselType;

    @Size(max = 100)
    private String vesselDwt;

    @Size(max = 255)
    private String businessType;

    @Size(max = 255)
    private String activity;

    private Integer slipwayCount;

    private String remarks;

    private BigDecimal latitude;
    private BigDecimal longitude;
    private UUID mapSymbolId;
    private GisGeometryType geometryType;
    private String coordinates;
    private Integer coordinateSystem;
    private Integer displayRule;

    private String saveAction;

    public void setId(UUID id) {
        markFieldPresent("id");
        this.id = id;
    }

    public void setShipRepairYardName(String shipRepairYardName) {
        markFieldPresent("shipRepairYardName");
        this.shipRepairYardName = (shipRepairYardName != null && !shipRepairYardName.trim().isEmpty()) ? shipRepairYardName.trim() : null;
    }

    public void setPortId(UUID portId) {
        markFieldPresent("portId");
        this.portId = portId;
    }

    public void setPierId(UUID pierId) {
        markFieldPresent("pierId");
        this.pierId = pierId;
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

    public void setOperationalStatus(OperationalStatus operationalStatus) {
        markFieldPresent("operationalStatus");
        this.operationalStatus = operationalStatus;
    }

    public void setUsageFunction(String usageFunction) {
        markFieldPresent("usageFunction");
        this.usageFunction = (usageFunction != null && !usageFunction.trim().isEmpty()) ? usageFunction.trim() : null;
    }

    public void setWorkshopArea(BigDecimal workshopArea) {
        markFieldPresent("workshopArea");
        this.workshopArea = workshopArea;
    }

    public void setVesselType(String vesselType) {
        markFieldPresent("vesselType");
        this.vesselType = (vesselType != null && !vesselType.trim().isEmpty()) ? vesselType.trim() : null;
    }

    public void setVesselDwt(String vesselDwt) {
        markFieldPresent("vesselDwt");
        this.vesselDwt = (vesselDwt != null && !vesselDwt.trim().isEmpty()) ? vesselDwt.trim() : null;
    }

    public void setBusinessType(String businessType) {
        markFieldPresent("businessType");
        this.businessType = (businessType != null && !businessType.trim().isEmpty()) ? businessType.trim() : null;
    }

    public void setActivity(String activity) {
        markFieldPresent("activity");
        this.activity = (activity != null && !activity.trim().isEmpty()) ? activity.trim() : null;
    }

    public void setSlipwayCount(Integer slipwayCount) {
        markFieldPresent("slipwayCount");
        this.slipwayCount = slipwayCount;
    }

    public void setRemarks(String remarks) {
        markFieldPresent("remarks");
        this.remarks = (remarks != null && !remarks.trim().isEmpty()) ? remarks.trim() : null;
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

    public void setSaveAction(String saveAction) {
        markFieldPresent("saveAction");
        this.saveAction = (saveAction != null && !saveAction.trim().isEmpty()) ? saveAction.trim() : null;
    }

    public static class UpdateShipRepairYardRequestBuilder {
        private final java.util.Set<String> presentFields = new java.util.HashSet<>();

        public UpdateShipRepairYardRequestBuilder id(UUID id) {
            this.id = id;
            this.presentFields.add("id");
            return this;
        }

        public UpdateShipRepairYardRequestBuilder shipRepairYardName(String shipRepairYardName) {
            this.shipRepairYardName = shipRepairYardName;
            this.presentFields.add("shipRepairYardName");
            return this;
        }

        public UpdateShipRepairYardRequestBuilder portId(UUID portId) {
            this.portId = portId;
            this.presentFields.add("portId");
            return this;
        }

        public UpdateShipRepairYardRequestBuilder pierId(UUID pierId) {
            this.pierId = pierId;
            this.presentFields.add("pierId");
            return this;
        }

        public UpdateShipRepairYardRequestBuilder orgUnitId(UUID orgUnitId) {
            this.orgUnitId = orgUnitId;
            this.presentFields.add("orgUnitId");
            return this;
        }

        public UpdateShipRepairYardRequestBuilder provinceId(Integer provinceId) {
            this.provinceId = provinceId;
            this.presentFields.add("provinceId");
            return this;
        }

        public UpdateShipRepairYardRequestBuilder detailedLocation(String detailedLocation) {
            this.detailedLocation = detailedLocation;
            this.presentFields.add("detailedLocation");
            return this;
        }

        public UpdateShipRepairYardRequestBuilder operationalStatus(OperationalStatus operationalStatus) {
            this.operationalStatus = operationalStatus;
            this.presentFields.add("operationalStatus");
            return this;
        }

        public UpdateShipRepairYardRequestBuilder usageFunction(String usageFunction) {
            this.usageFunction = usageFunction;
            this.presentFields.add("usageFunction");
            return this;
        }

        public UpdateShipRepairYardRequestBuilder workshopArea(BigDecimal workshopArea) {
            this.workshopArea = workshopArea;
            this.presentFields.add("workshopArea");
            return this;
        }

        public UpdateShipRepairYardRequestBuilder vesselType(String vesselType) {
            this.vesselType = vesselType;
            this.presentFields.add("vesselType");
            return this;
        }

        public UpdateShipRepairYardRequestBuilder vesselDwt(String vesselDwt) {
            this.vesselDwt = vesselDwt;
            this.presentFields.add("vesselDwt");
            return this;
        }

        public UpdateShipRepairYardRequestBuilder businessType(String businessType) {
            this.businessType = businessType;
            this.presentFields.add("businessType");
            return this;
        }

        public UpdateShipRepairYardRequestBuilder activity(String activity) {
            this.activity = activity;
            this.presentFields.add("activity");
            return this;
        }

        public UpdateShipRepairYardRequestBuilder slipwayCount(Integer slipwayCount) {
            this.slipwayCount = slipwayCount;
            this.presentFields.add("slipwayCount");
            return this;
        }

        public UpdateShipRepairYardRequestBuilder remarks(String remarks) {
            this.remarks = remarks;
            this.presentFields.add("remarks");
            return this;
        }

        public UpdateShipRepairYardRequestBuilder latitude(BigDecimal latitude) {
            this.latitude = latitude;
            this.presentFields.add("latitude");
            return this;
        }

        public UpdateShipRepairYardRequestBuilder longitude(BigDecimal longitude) {
            this.longitude = longitude;
            this.presentFields.add("longitude");
            return this;
        }

        public UpdateShipRepairYardRequestBuilder mapSymbolId(UUID mapSymbolId) {
            this.mapSymbolId = mapSymbolId;
            this.presentFields.add("mapSymbolId");
            return this;
        }

        public UpdateShipRepairYardRequestBuilder geometryType(GisGeometryType geometryType) {
            this.geometryType = geometryType;
            this.presentFields.add("geometryType");
            return this;
        }

        public UpdateShipRepairYardRequestBuilder coordinates(String coordinates) {
            this.coordinates = coordinates;
            this.presentFields.add("coordinates");
            return this;
        }

        public UpdateShipRepairYardRequestBuilder coordinateSystem(Integer coordinateSystem) {
            this.coordinateSystem = coordinateSystem;
            this.presentFields.add("coordinateSystem");
            return this;
        }

        public UpdateShipRepairYardRequestBuilder displayRule(Integer displayRule) {
            this.displayRule = displayRule;
            this.presentFields.add("displayRule");
            return this;
        }

        public UpdateShipRepairYardRequestBuilder saveAction(String saveAction) {
            this.saveAction = saveAction;
            this.presentFields.add("saveAction");
            return this;
        }

        public UpdateShipRepairYardRequest build() {
            UpdateShipRepairYardRequest req = new UpdateShipRepairYardRequest();
            if (presentFields.contains("id")) req.setId(this.id);
            if (presentFields.contains("shipRepairYardName")) req.setShipRepairYardName(this.shipRepairYardName);
            if (presentFields.contains("portId")) req.setPortId(this.portId);
            if (presentFields.contains("pierId")) req.setPierId(this.pierId);
            if (presentFields.contains("orgUnitId")) req.setOrgUnitId(this.orgUnitId);
            if (presentFields.contains("provinceId")) req.setProvinceId(this.provinceId);
            if (presentFields.contains("detailedLocation")) req.setDetailedLocation(this.detailedLocation);
            if (presentFields.contains("operationalStatus")) req.setOperationalStatus(this.operationalStatus);
            if (presentFields.contains("usageFunction")) req.setUsageFunction(this.usageFunction);
            if (presentFields.contains("workshopArea")) req.setWorkshopArea(this.workshopArea);
            if (presentFields.contains("vesselType")) req.setVesselType(this.vesselType);
            if (presentFields.contains("vesselDwt")) req.setVesselDwt(this.vesselDwt);
            if (presentFields.contains("businessType")) req.setBusinessType(this.businessType);
            if (presentFields.contains("activity")) req.setActivity(this.activity);
            if (presentFields.contains("slipwayCount")) req.setSlipwayCount(this.slipwayCount);
            if (presentFields.contains("remarks")) req.setRemarks(this.remarks);
            if (presentFields.contains("latitude")) req.setLatitude(this.latitude);
            if (presentFields.contains("longitude")) req.setLongitude(this.longitude);
            if (presentFields.contains("mapSymbolId")) req.setMapSymbolId(this.mapSymbolId);
            if (presentFields.contains("geometryType")) req.setGeometryType(this.geometryType);
            if (presentFields.contains("coordinates")) req.setCoordinates(this.coordinates);
            if (presentFields.contains("coordinateSystem")) req.setCoordinateSystem(this.coordinateSystem);
            if (presentFields.contains("displayRule")) req.setDisplayRule(this.displayRule);
            if (presentFields.contains("saveAction")) req.setSaveAction(this.saveAction);
            return req;
        }
    }
}
