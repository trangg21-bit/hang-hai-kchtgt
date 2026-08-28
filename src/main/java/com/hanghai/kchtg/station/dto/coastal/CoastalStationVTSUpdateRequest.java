package com.hanghai.kchtg.station.dto.coastal;

import com.hanghai.kchtg.security.RecordSecurityLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CoastalStationVTSUpdateRequest {
    private Double latitude;
    private Double longitude;


    private String stationCode;
    private String stationName;
    private String frequencyBand;
    private Double transmitPower;
    private String equipmentType;
    private String locationAddress;
    private String contactPerson;
    private String contactPhone;
}

