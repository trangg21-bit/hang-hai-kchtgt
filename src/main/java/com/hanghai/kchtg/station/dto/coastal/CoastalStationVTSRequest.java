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
public class CoastalStationVTSRequest {
    private Double latitude;
    private Double longitude;


    @jakarta.validation.constraints.NotBlank(message = "Mã trạm không được để trống")
    private String stationCode;

    @jakarta.validation.constraints.NotBlank(message = "Tên trạm không được để trống")
    private String stationName;

    private String frequencyBand;
    private Double transmitPower;
    private String equipmentType;
    private String locationAddress;
    private String contactPerson;
    private String contactPhone;
}

