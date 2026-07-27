package com.hanghai.kchtg.port.dto.dryport;

import java.util.UUID;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

@Data
@Builder
public class DryPortResponse {
    private UUID id;
    private String dryPortCode;
    private String dryPortName;
    private String province;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal area;
    private BigDecimal teuCapacity;
    private com.hanghai.kchtg.common.entity.OperationalStatus operationalStatus;
    private com.hanghai.kchtg.common.entity.ApprovalStatus approvalStatus;
    private UUID orgUnitId;
    private UUID createdBy;
    private UUID updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID mapSymbolId;
    private UUID spatialId;
    private GisGeometryType geometryType;
    private String coordinates;
}
