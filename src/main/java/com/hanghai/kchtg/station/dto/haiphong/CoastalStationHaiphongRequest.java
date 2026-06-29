package com.hanghai.kchtg.station.dto.haiphong;
import lombok.*;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CoastalStationHaiphongRequest {

    private String stationCode;
    private String stationName;
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
    private String locationAddress;
    private String contactPerson;
    private String contactPhone;
}
