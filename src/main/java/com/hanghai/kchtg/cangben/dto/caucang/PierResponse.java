package com.hanghai.kchtg.cangben.dto.caucang;

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
    private com.hanghai.kchtg.cangben.entity.LoaiCau pierType;
    private String operationalFunction;
    private com.hanghai.kchtg.common.entity.TrangThaiHoatDong operationalStatus;
    private com.hanghai.kchtg.common.entity.TrangThaiPheDuyet approvalStatus;
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
