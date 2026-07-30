package com.hanghai.kchtg.station.dto.inmarsat;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CoastalStationInmarsatRequest {
    @DecimalMin(value = "-90.0", message = "Vĩ độ phải từ -90 đến 90")
    @DecimalMax(value = "90.0", message = "Vĩ độ phải từ -90 đến 90")
    private Double latitude;

    @DecimalMin(value = "-180.0", message = "Kinh độ phải từ -180 đến 180")
    @DecimalMax(value = "180.0", message = "Kinh độ phải từ -180 đến 180")
    private Double longitude;

    @NotBlank(message = "Mã thiết bị không được để trống")
    private String deviceCode;

    @NotBlank(message = "Tên trạm không được để trống")
    private String stationName;

    private String modemType;
    private String frequency;
    private String coverageZone;
    private String sarCode;
    private String locationAddress;
    private String contactPerson;
    private String contactPhone;
}

