package com.hanghai.kchtg.radarstation.dto;

import java.util.UUID;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RadarStationCreateRequest {
    @NotBlank(message = "Tên trạm không được để trống")
    private String stationName;

    @NotBlank(message = "Vị trí không được để trống")
    private String location;

    @DecimalMin(value = "-180", message = "Kinh độ phải từ -180 đến 180")
    @DecimalMax(value = "180", message = "Kinh độ phải từ -180 đến 180")
    private BigDecimal longitude;

    @DecimalMin(value = "-90", message = "Vĩ độ phải từ -90 đến 90")
    @DecimalMax(value = "90", message = "Vĩ độ phải từ -90 đến 90")
    private BigDecimal latitude;

    private String stationType;
    private String coverage;

    @Positive(message = "Diện tích phải là số dương")
    private BigDecimal emissionArea;

    private String source;
    private String conditionStatus;
    private UUID orgUnitId;
    private BigDecimal towerHeight;
    private BigDecimal radarRange;
    private UUID vtsSystemId;
    private GisGeometryType geometryType;
    private String coordinates;
}
