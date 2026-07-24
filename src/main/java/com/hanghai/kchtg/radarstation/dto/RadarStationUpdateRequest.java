package com.hanghai.kchtg.radarstation.dto;

import lombok.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RadarStationUpdateRequest {
    private String stationName;
    private String location;
    private BigDecimal kinhDo;
    private BigDecimal viDo;
    private String stationType;
    private String coverage;
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
