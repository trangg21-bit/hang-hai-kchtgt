package com.hanghai.kchtg.station.dto.lrit;
import lombok.*;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CoastalStationLRITUpdateRequest {

    private String stationCode;
    private String stationName;
    private String terminalId;
    private String imoNumber;
    private Integer reportingInterval;
    private Double antennaHeight;
    private Double powerOutput;
    private String antennaType;
    private String locationAddress;
    private String contactPerson;
    private String contactPhone;
    private String dataFormat;
    private String communicationChannel;
    private String coverageArea;
}
