package com.hanghai.kchtg.cangben.dto.vungnuoc;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

@Data
public class UpdateWaterZoneRequest {

    @NotNull(message = "ID không được để trống")
    private UUID id;

    private String waterZoneName;
    private UUID portId;
    private BigDecimal area;
    private BigDecimal maxDepth;
    private BigDecimal avgDepth;
    private com.hanghai.kchtg.cangben.entity.LoaiVungNuoc waterZoneType;
    private com.hanghai.kchtg.common.entity.TrangThaiHoatDong operationalStatus;
    private java.util.UUID mapSymbolId;
    private GisGeometryType geometryType;
    private String coordinates;
}
