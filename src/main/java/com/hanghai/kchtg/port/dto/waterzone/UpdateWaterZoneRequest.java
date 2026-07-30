package com.hanghai.kchtg.port.dto.waterzone;

import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.port.entity.WaterZoneType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class UpdateWaterZoneRequest {

    @NotNull(message = "ID không được để trống")
    private UUID id;

    private String waterZoneName;
    private UUID portId;
    private BigDecimal area;
    private BigDecimal maxDepth;
    private BigDecimal avgDepth;
    private WaterZoneType waterZoneType;
    private OperationalStatus operationalStatus;
    private UUID mapSymbolId;
    private GisGeometryType geometryType;
    private String coordinates;
}
