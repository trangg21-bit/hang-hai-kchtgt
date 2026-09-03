package com.hanghai.kchtg.station.dto.lrit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;

import java.math.BigDecimal;
import java.util.UUID;

import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
public class CoastalStationLRITRequest {

    private UUID orgUnitId;
    private UUID operatingOrgId;
    private Integer provinceId;

    private String code;
    private String stationCode;

    private String name;
    private String stationName;

    private String locationAddress;
    private ConditionStatus conditionStatus;

    // --- Đặc thù LRIT ---
    private String terminalId;
    private String imoNumber;
    private Integer reportingInterval;
    private Double antennaHeight;
    private Double powerOutput;
    private String antennaType;
    private String dataFormat;
    private String communicationChannel;
    private String coverageArea;
    private String servicesProvided;
    private String description;
    private String contactPerson;
    private String contactPhone;

    // --- GIS ---
    private UUID spatialId;
    private UUID symbolId;
    private String geometryType;
    private String objectType;
    private String symbol;
    private String coordinateSystem;
    private String displayRule;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String coordinates;

    public String getCode() {
        return (code != null && !code.isBlank()) ? code.trim() : (stationCode != null ? stationCode.trim() : null);
    }

    public String getName() {
        return (name != null && !name.isBlank()) ? name.trim() : (stationName != null ? stationName.trim() : null);
    }
}
