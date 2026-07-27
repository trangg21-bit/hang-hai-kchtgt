package com.hanghai.kchtg.vtssystem.dto;

import java.util.UUID;

import lombok.*;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VtsSystemUpdateRequest {
    private String systemName;
    private String location;
    private String conditionStatus;
    private String responsibilityLevel;
    private String source;
    private String partner;
    private UUID orgUnitId;
    private String scope;

    private GisGeometryType geometryType;
    private String coordinates;
}
