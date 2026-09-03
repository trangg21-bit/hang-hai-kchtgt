package com.hanghai.kchtg.station.dto.haiphong;

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
public class CoastalStationHaiphongRequest {

    private UUID orgUnitId;
    private UUID operatingOrgId;
    private Integer provinceId;

    private String code;
    private String stationCode;

    private String name;
    private String stationName;

    private String locationAddress;
    private String conditionStatus;

    // --- Đặc thù TTXLTT Hà Nội / Hải Phòng ---
    private String portName;
    private String district;
    private String ward;
    private String operationalLicense;
    private String licenseExpiry;
    private String inspectorName;
    private String inspectorPhone;
    private String lastInspectionDate;
    private String nextInspectionDate;
    private String coverageArea;
    private String equipmentType;
    private String communicationFrequency;
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
