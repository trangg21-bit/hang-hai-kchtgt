package com.hanghai.kchtg.port.dto.waterzone;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.port.entity.WaterZoneType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class WaterZoneResponse {
    private UUID id;
    private String waterZoneCode;
    private String waterZoneName;
    private UUID portId;
    private String portName;
    private BigDecimal area;
    private BigDecimal maxDepth;
    private BigDecimal avgDepth;
    private WaterZoneType waterZoneType;
    private OperationalStatus operationalStatus;
    private ApprovalStatus approvalStatus;
    private UUID orgUnitId;
    private String orgUnitName;
    private UUID createdBy;
    private UUID updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID mapSymbolId;
    private UUID spatialId;
    private GisGeometryType geometryType;
    private String coordinates;
}
