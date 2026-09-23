package com.hanghai.kchtg.radarstation.dto;

import com.hanghai.kchtg.common.dto.FieldPresenceTrackedRequest;
import com.hanghai.kchtg.common.validator.Decimal20_4;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO Request Cập nhật Trạm radar (F-043).
 */
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RadarStationUpdateRequest extends FieldPresenceTrackedRequest {

    @Size(max = 255, message = "Tên trạm radar không được vượt quá 255 ký tự")
    private String stationName;

    @Size(max = 100, message = "Loại trạm không được vượt quá 100 ký tự")
    private String stationType;

    @Size(max = 500, message = "Địa điểm không được vượt quá 500 ký tự")
    private String location;

    @Size(max = 500, message = "Vùng phủ sóng không được vượt quá 500 ký tự")
    private String coverage;

    @Decimal20_4(message = "Diện tích phát xạ không quá 20 chữ số (tối đa 4 số lẻ)")
    private BigDecimal emissionArea;

    @Size(max = 255, message = "Nguồn gốc không được vượt quá 255 ký tự")
    private String source;

    @Size(max = 50, message = "Tình trạng hoạt động không được vượt quá 50 ký tự")
    private String conditionStatus;

    private UUID orgUnitId;
    private UUID seaportId;
    private UUID vtsSystemId;
    private UUID vtsOperationCenterId;
    private UUID operatingUnitId;
    private Integer provinceId;

    @Size(max = 50, message = "Đơn vị tính không được vượt quá 50 ký tự")
    private String unitOfMeasure;

    private Integer quantity;

    @Decimal20_4(message = "Chiều cao tháp không quá 20 chữ số (tối đa 4 số lẻ)")
    private BigDecimal towerHeight;

    @Decimal20_4(message = "Tầm radar không quá 20 chữ số (tối đa 4 số lẻ)")
    private BigDecimal radarRange;

    @Size(max = 1000, message = "Ghi chú không được vượt quá 1000 ký tự")
    private String note;

    private BigDecimal latitude;
    private BigDecimal longitude;
    private UUID mapSymbolId;
    private String mapIcon;
    private GisGeometryType geometryType;
    private String coordinates;
    private Integer coordinateSystem;
    private Integer displayRule;

    private String saveAction;

    public void setStationName(String stationName) {
        markFieldPresent("stationName");
        this.stationName = (stationName != null && !stationName.trim().isEmpty()) ? stationName.trim() : null;
    }

    public void setStationType(String stationType) {
        markFieldPresent("stationType");
        this.stationType = (stationType != null && !stationType.trim().isEmpty()) ? stationType.trim() : null;
    }

    public void setLocation(String location) {
        markFieldPresent("location");
        this.location = (location != null && !location.trim().isEmpty()) ? location.trim() : null;
    }

    public void setCoverage(String coverage) {
        markFieldPresent("coverage");
        this.coverage = (coverage != null && !coverage.trim().isEmpty()) ? coverage.trim() : null;
    }

    public void setEmissionArea(BigDecimal emissionArea) {
        markFieldPresent("emissionArea");
        this.emissionArea = emissionArea;
    }

    public void setSource(String source) {
        markFieldPresent("source");
        this.source = (source != null && !source.trim().isEmpty()) ? source.trim() : null;
    }

    public void setConditionStatus(String conditionStatus) {
        markFieldPresent("conditionStatus");
        this.conditionStatus = (conditionStatus != null && !conditionStatus.trim().isEmpty()) ? conditionStatus.trim() : null;
    }

    public void setOrgUnitId(UUID orgUnitId) {
        markFieldPresent("orgUnitId");
        this.orgUnitId = orgUnitId;
    }

    public void setSeaportId(UUID seaportId) {
        markFieldPresent("seaportId");
        this.seaportId = seaportId;
    }

    public void setVtsSystemId(UUID vtsSystemId) {
        markFieldPresent("vtsSystemId");
        this.vtsSystemId = vtsSystemId;
    }

    public void setVtsOperationCenterId(UUID vtsOperationCenterId) {
        markFieldPresent("vtsOperationCenterId");
        this.vtsOperationCenterId = vtsOperationCenterId;
    }

    public void setOperatingUnitId(UUID operatingUnitId) {
        markFieldPresent("operatingUnitId");
        this.operatingUnitId = operatingUnitId;
    }

    public void setProvinceId(Integer provinceId) {
        markFieldPresent("provinceId");
        this.provinceId = provinceId;
    }

    public void setUnitOfMeasure(String unitOfMeasure) {
        markFieldPresent("unitOfMeasure");
        this.unitOfMeasure = (unitOfMeasure != null && !unitOfMeasure.trim().isEmpty()) ? unitOfMeasure.trim() : null;
    }

    public void setQuantity(Integer quantity) {
        markFieldPresent("quantity");
        this.quantity = quantity;
    }

    public void setTowerHeight(BigDecimal towerHeight) {
        markFieldPresent("towerHeight");
        this.towerHeight = towerHeight;
    }

    public void setRadarRange(BigDecimal radarRange) {
        markFieldPresent("radarRange");
        this.radarRange = radarRange;
    }

    public void setNote(String note) {
        markFieldPresent("note");
        this.note = (note != null && !note.trim().isEmpty()) ? note.trim() : null;
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

    public void setMapIcon(String mapIcon) {
        markFieldPresent("mapIcon");
        this.mapIcon = (mapIcon != null && !mapIcon.trim().isEmpty()) ? mapIcon.trim() : null;
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

    public static class RadarStationUpdateRequestBuilder {
        private final java.util.Set<String> presentFields = new java.util.HashSet<>();

        public RadarStationUpdateRequestBuilder stationName(String stationName) {
            this.stationName = stationName;
            this.presentFields.add("stationName");
            return this;
        }

        public RadarStationUpdateRequestBuilder stationType(String stationType) {
            this.stationType = stationType;
            this.presentFields.add("stationType");
            return this;
        }

        public RadarStationUpdateRequestBuilder location(String location) {
            this.location = location;
            this.presentFields.add("location");
            return this;
        }

        public RadarStationUpdateRequestBuilder coverage(String coverage) {
            this.coverage = coverage;
            this.presentFields.add("coverage");
            return this;
        }

        public RadarStationUpdateRequestBuilder emissionArea(BigDecimal emissionArea) {
            this.emissionArea = emissionArea;
            this.presentFields.add("emissionArea");
            return this;
        }

        public RadarStationUpdateRequestBuilder source(String source) {
            this.source = source;
            this.presentFields.add("source");
            return this;
        }

        public RadarStationUpdateRequestBuilder conditionStatus(String conditionStatus) {
            this.conditionStatus = conditionStatus;
            this.presentFields.add("conditionStatus");
            return this;
        }

        public RadarStationUpdateRequestBuilder orgUnitId(UUID orgUnitId) {
            this.orgUnitId = orgUnitId;
            this.presentFields.add("orgUnitId");
            return this;
        }

        public RadarStationUpdateRequestBuilder seaportId(UUID seaportId) {
            this.seaportId = seaportId;
            this.presentFields.add("seaportId");
            return this;
        }

        public RadarStationUpdateRequestBuilder vtsSystemId(UUID vtsSystemId) {
            this.vtsSystemId = vtsSystemId;
            this.presentFields.add("vtsSystemId");
            return this;
        }

        public RadarStationUpdateRequestBuilder vtsOperationCenterId(UUID vtsOperationCenterId) {
            this.vtsOperationCenterId = vtsOperationCenterId;
            this.presentFields.add("vtsOperationCenterId");
            return this;
        }

        public RadarStationUpdateRequestBuilder operatingUnitId(UUID operatingUnitId) {
            this.operatingUnitId = operatingUnitId;
            this.presentFields.add("operatingUnitId");
            return this;
        }

        public RadarStationUpdateRequestBuilder provinceId(Integer provinceId) {
            this.provinceId = provinceId;
            this.presentFields.add("provinceId");
            return this;
        }

        public RadarStationUpdateRequestBuilder unitOfMeasure(String unitOfMeasure) {
            this.unitOfMeasure = unitOfMeasure;
            this.presentFields.add("unitOfMeasure");
            return this;
        }

        public RadarStationUpdateRequestBuilder quantity(Integer quantity) {
            this.quantity = quantity;
            this.presentFields.add("quantity");
            return this;
        }

        public RadarStationUpdateRequestBuilder towerHeight(BigDecimal towerHeight) {
            this.towerHeight = towerHeight;
            this.presentFields.add("towerHeight");
            return this;
        }

        public RadarStationUpdateRequestBuilder radarRange(BigDecimal radarRange) {
            this.radarRange = radarRange;
            this.presentFields.add("radarRange");
            return this;
        }

        public RadarStationUpdateRequestBuilder note(String note) {
            this.note = note;
            this.presentFields.add("note");
            return this;
        }

        public RadarStationUpdateRequestBuilder latitude(BigDecimal latitude) {
            this.latitude = latitude;
            this.presentFields.add("latitude");
            return this;
        }

        public RadarStationUpdateRequestBuilder longitude(BigDecimal longitude) {
            this.longitude = longitude;
            this.presentFields.add("longitude");
            return this;
        }

        public RadarStationUpdateRequestBuilder mapSymbolId(UUID mapSymbolId) {
            this.mapSymbolId = mapSymbolId;
            this.presentFields.add("mapSymbolId");
            return this;
        }

        public RadarStationUpdateRequestBuilder mapIcon(String mapIcon) {
            this.mapIcon = mapIcon;
            this.presentFields.add("mapIcon");
            return this;
        }

        public RadarStationUpdateRequestBuilder geometryType(GisGeometryType geometryType) {
            this.geometryType = geometryType;
            this.presentFields.add("geometryType");
            return this;
        }

        public RadarStationUpdateRequestBuilder coordinates(String coordinates) {
            this.coordinates = coordinates;
            this.presentFields.add("coordinates");
            return this;
        }

        public RadarStationUpdateRequestBuilder coordinateSystem(Integer coordinateSystem) {
            this.coordinateSystem = coordinateSystem;
            this.presentFields.add("coordinateSystem");
            return this;
        }

        public RadarStationUpdateRequestBuilder displayRule(Integer displayRule) {
            this.displayRule = displayRule;
            this.presentFields.add("displayRule");
            return this;
        }

        public RadarStationUpdateRequestBuilder saveAction(String saveAction) {
            this.saveAction = saveAction;
            this.presentFields.add("saveAction");
            return this;
        }

        public RadarStationUpdateRequest build() {
            RadarStationUpdateRequest req = new RadarStationUpdateRequest();
            if (presentFields.contains("stationName")) req.setStationName(this.stationName);
            if (presentFields.contains("stationType")) req.setStationType(this.stationType);
            if (presentFields.contains("location")) req.setLocation(this.location);
            if (presentFields.contains("coverage")) req.setCoverage(this.coverage);
            if (presentFields.contains("emissionArea")) req.setEmissionArea(this.emissionArea);
            if (presentFields.contains("source")) req.setSource(this.source);
            if (presentFields.contains("conditionStatus")) req.setConditionStatus(this.conditionStatus);
            if (presentFields.contains("orgUnitId")) req.setOrgUnitId(this.orgUnitId);
            if (presentFields.contains("seaportId")) req.setSeaportId(this.seaportId);
            if (presentFields.contains("vtsSystemId")) req.setVtsSystemId(this.vtsSystemId);
            if (presentFields.contains("vtsOperationCenterId")) req.setVtsOperationCenterId(this.vtsOperationCenterId);
            if (presentFields.contains("operatingUnitId")) req.setOperatingUnitId(this.operatingUnitId);
            if (presentFields.contains("provinceId")) req.setProvinceId(this.provinceId);
            if (presentFields.contains("unitOfMeasure")) req.setUnitOfMeasure(this.unitOfMeasure);
            if (presentFields.contains("quantity")) req.setQuantity(this.quantity);
            if (presentFields.contains("towerHeight")) req.setTowerHeight(this.towerHeight);
            if (presentFields.contains("radarRange")) req.setRadarRange(this.radarRange);
            if (presentFields.contains("note")) req.setNote(this.note);
            if (presentFields.contains("latitude")) req.setLatitude(this.latitude);
            if (presentFields.contains("longitude")) req.setLongitude(this.longitude);
            if (presentFields.contains("mapSymbolId")) req.setMapSymbolId(this.mapSymbolId);
            if (presentFields.contains("mapIcon")) req.setMapIcon(this.mapIcon);
            if (presentFields.contains("geometryType")) req.setGeometryType(this.geometryType);
            if (presentFields.contains("coordinates")) req.setCoordinates(this.coordinates);
            if (presentFields.contains("coordinateSystem")) req.setCoordinateSystem(this.coordinateSystem);
            if (presentFields.contains("displayRule")) req.setDisplayRule(this.displayRule);
            if (presentFields.contains("saveAction")) req.setSaveAction(this.saveAction);
            return req;
        }
    }
}
