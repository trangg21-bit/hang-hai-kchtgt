package com.hanghai.kchtg.station.dto.coastal;
import lombok.*;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CoastalStationVTSUpdateRequest {

    private String stationCode;
    private String stationName;
    private Double latitude;
    private Double longitude;
    private String frequencyBand;
    private Double transmitPower;
    private String equipmentType;
    private String locationAddress;
    private String contactPerson;
    private String contactPhone;
}
