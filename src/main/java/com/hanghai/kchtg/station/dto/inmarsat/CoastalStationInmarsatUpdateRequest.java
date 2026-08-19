package com.hanghai.kchtg.station.dto.inmarsat;

import com.hanghai.kchtg.security.RecordSecurityLevel;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CoastalStationInmarsatUpdateRequest {

    private RecordSecurityLevel securityLevel;

    @DecimalMin(value = "-90.0", message = "Vĩ độ phải từ -90 đến 90")
    @DecimalMax(value = "90.0", message = "Vĩ độ phải từ -90 đến 90")
    private Double latitude;

    @DecimalMin(value = "-180.0", message = "Kinh độ phải từ -180 đến 180")
    @DecimalMax(value = "180.0", message = "Kinh độ phải từ -180 đến 180")
    private Double longitude;

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

