package com.hanghai.kchtg.station.dto.inmarsat;

import com.hanghai.kchtg.common.dto.FieldPresenceTrackedRequest;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Request DTO cập nhật Đài thông tin vệ tinh Inmarsat (F-099).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
public class CoastalStationInmarsatUpdateRequest extends FieldPresenceTrackedRequest {

    private UUID orgUnitId;
    private UUID operatingOrgId;

    private String code;
    private String deviceCode;

    private String name;
    private String stationName;

    private Integer provinceId;
    private String locationAddress;
    private String locationDetail;

    private ConditionStatus conditionStatus;

    // --- Thông số đặc thù Inmarsat ---
    private String coverageZone;
    private String coverageArea;
    private String services;
    private String frequency;
    private String notes;
    private String description;

    // --- GIS ---
    private UUID spatialId;
    private String symbolId;
    private String objectType;
    private String symbol;
    private String coordinateSystem;
    private String displayRule;

    @DecimalMin(value = "-90.0", message = "Vĩ độ phải từ -90 đến 90")
    @DecimalMax(value = "90.0", message = "Vĩ độ phải từ -90 đến 90")
    private BigDecimal latitude;

    @DecimalMin(value = "-180.0", message = "Kinh độ phải từ -180 đến 180")
    @DecimalMax(value = "180.0", message = "Kinh độ phải từ -180 đến 180")
    private BigDecimal longitude;

    private String coordinates;

    public void setOrgUnitId(UUID value) { markFieldPresent("orgUnitId"); this.orgUnitId = value; }
    public void setOperatingOrgId(UUID value) { markFieldPresent("operatingOrgId"); this.operatingOrgId = value; }
    public void setProvinceId(Integer value) { markFieldPresent("provinceId"); this.provinceId = value; }
    public void setLocationAddress(String value) { markFieldPresent("locationAddress"); this.locationAddress = value; }
    public void setLocationDetail(String value) { markFieldPresent("locationDetail"); this.locationDetail = value; }
    public void setConditionStatus(ConditionStatus value) { markFieldPresent("conditionStatus"); this.conditionStatus = value; }
    public void setCoverageZone(String value) { markFieldPresent("coverageZone"); this.coverageZone = value; }
    public void setCoverageArea(String value) { markFieldPresent("coverageArea"); this.coverageArea = value; }
    public void setServices(String value) { markFieldPresent("services"); this.services = value; }
    public void setFrequency(String value) { markFieldPresent("frequency"); this.frequency = value; }
    public void setNotes(String value) { markFieldPresent("notes"); this.notes = value; }
    public void setDescription(String value) { markFieldPresent("description"); this.description = value; }
    public void setSpatialId(UUID value) { markFieldPresent("spatialId"); this.spatialId = value; }
    public void setSymbolId(String value) { markFieldPresent("symbolId"); this.symbolId = value; }
    public void setObjectType(String value) { markFieldPresent("objectType"); this.objectType = value; }
    public void setSymbol(String value) { markFieldPresent("symbol"); this.symbol = value; }
    public void setCoordinateSystem(String value) { markFieldPresent("coordinateSystem"); this.coordinateSystem = value; }
    public void setDisplayRule(String value) { markFieldPresent("displayRule"); this.displayRule = value; }
    public void setLatitude(BigDecimal value) { markFieldPresent("latitude"); this.latitude = value; }
    public void setLongitude(BigDecimal value) { markFieldPresent("longitude"); this.longitude = value; }
    public void setCoordinates(String value) { markFieldPresent("coordinates"); this.coordinates = value; }

    public String getEffectiveCode() {
        if (code != null && !code.isBlank()) return code.trim();
        if (deviceCode != null && !deviceCode.isBlank()) return deviceCode.trim();
        return null;
    }

    public String getEffectiveName() {
        if (name != null && !name.isBlank()) return name.trim();
        if (stationName != null && !stationName.isBlank()) return stationName.trim();
        return null;
    }
}
