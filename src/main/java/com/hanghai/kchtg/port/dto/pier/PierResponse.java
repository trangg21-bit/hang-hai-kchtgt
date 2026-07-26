package com.hanghai.kchtg.port.dto.pier;

import java.util.UUID;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

@Data
@Builder
public class PierResponse {
    private UUID id;
    private String pierCode;
    private String pierName;
    private UUID berthId;
    private String berthName;
    private BigDecimal length;
    private BigDecimal designLoad;
    private com.hanghai.kchtg.port.entity.PierType pierType;
    private String operationalFunction;
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
