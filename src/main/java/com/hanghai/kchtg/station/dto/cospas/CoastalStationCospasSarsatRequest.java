package com.hanghai.kchtg.station.dto.cospas;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CoastalStationCospasSarsatRequest {

    @NotBlank(message = "Mã đài không được để trống")
    private String stationCode;
    private String stationName;
    private String frequency;
    private String coverageArea;
    private String beaconProtocol;
    private String emergencyChannel;
    private String antennaType;
    private String locationAddress;
    private String contactPerson;
    private String contactPhone;
    private Double signalRange;
    private String operatingMode;
}
