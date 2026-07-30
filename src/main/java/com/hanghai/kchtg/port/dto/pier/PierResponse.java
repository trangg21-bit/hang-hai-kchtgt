package com.hanghai.kchtg.port.dto.pier;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.port.entity.PierType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

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
    private PierType pierType;
    private String operationalFunction;
    private OperationalStatus operationalStatus;
    private ApprovalStatus approvalStatus;
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
