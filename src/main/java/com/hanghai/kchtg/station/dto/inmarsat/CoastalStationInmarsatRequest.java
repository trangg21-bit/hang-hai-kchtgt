package com.hanghai.kchtg.station.dto.inmarsat;
import lombok.*;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CoastalStationInmarsatRequest {

    private String deviceCode;
    private String stationName;
    private String modemType;
    private String frequency;
    private String coverageZone;
    private String sarCode;
    private String locationAddress;
    private String contactPerson;
    private String contactPhone;
}
