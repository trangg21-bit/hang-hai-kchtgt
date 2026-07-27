package com.hanghai.kchtg.radarstation.dto;

import java.util.UUID;

import lombok.*;
import java.math.BigDecimal;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RadarStationUpdateRequest {
    private String stationName;
    private String location;
    private BigDecimal longitude;
    private BigDecimal latitude;
    private String stationType;
    private String coverage;
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
