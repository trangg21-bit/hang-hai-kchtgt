package com.hanghai.kchtg.cangben.dto.vungnuoc;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

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
    private com.hanghai.kchtg.cangben.entity.LoaiVungNuoc waterZoneType;
    private com.hanghai.kchtg.common.entity.TrangThaiHoatDong operationalStatus;
    private com.hanghai.kchtg.common.entity.ApprovalStatus approvalStatus;
    private UUID orgUnitId;
    private String createdBy;
    private String updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID mapSymbolId;
    private UUID spatialId;
    private GisGeometryType geometryType;
    private String coordinates;
}
