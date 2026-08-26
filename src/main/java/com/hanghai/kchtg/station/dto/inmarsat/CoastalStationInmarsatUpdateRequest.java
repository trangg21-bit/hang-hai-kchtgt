package com.hanghai.kchtg.station.dto.inmarsat;

import com.hanghai.kchtg.security.RecordSecurityLevel;
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
public class CoastalStationInmarsatUpdateRequest {

    private UUID orgUnitId;
    private UUID operatingOrgId;

    private String code;
    private String deviceCode;

    private String name;
    private String stationName;

    private Integer provinceId;
    private String locationAddress;
    private String locationDetail;

    private String conditionStatus;

    // --- Thông số đặc thù Inmarsat ---
    private String coverageZone;
    private String coverageArea;
    private String services;
    private String frequency;
    private String modemType;
    private String sarCode;
    private String satelliteSystem;
    private String notes;
    private String description;
    private String contactPerson;
    private String contactPhone;

    // --- GIS ---
    private UUID spatialId;
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

    private RecordSecurityLevel securityLevel;

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
