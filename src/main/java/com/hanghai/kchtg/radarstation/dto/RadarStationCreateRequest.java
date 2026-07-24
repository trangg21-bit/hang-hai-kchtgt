package com.hanghai.kchtg.radarstation.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

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
    private BigDecimal kinhDo;

    @DecimalMin(value = "-90", message = "Vĩ độ phải từ -90 đến 90")
    @DecimalMax(value = "90", message = "Vĩ độ phải từ -90 đến 90")
    private BigDecimal viDo;

    private String stationType;
    private String coverage;

    @Positive(message = "Diện tích phải là số dương")
    private BigDecimal emissionArea;

    private String source;
    private String conditionStatus;
    private java.util.UUID orgUnitId;
    private BigDecimal towerHeight;
    private BigDecimal radarRange;
    private java.util.UUID vtsSystemId;
    private com.hanghai.kchtg.gis.spatial.entity.GisGeometryType loaiHinhHoc;
    private String toaDo;
}
