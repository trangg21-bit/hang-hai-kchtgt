package com.hanghai.kchtg.station.dto.lrit;

import com.hanghai.kchtg.security.RecordSecurityLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;

import java.math.BigDecimal;
import java.util.UUID;

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
    private String conditionStatus;

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
    private String geometryType;
    private String symbol;
    private String coordinateSystem;
    private String displayRule;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String coordinates;
}
