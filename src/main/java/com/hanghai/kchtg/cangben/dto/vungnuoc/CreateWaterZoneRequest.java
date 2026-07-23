package com.hanghai.kchtg.cangben.dto.vungnuoc;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

@Data
public class CreateWaterZoneRequest {

    @NotBlank(message = "Mã vùng nước không được để trống")
    @Size(max = 50)
    private String waterZoneCode;

    @NotBlank(message = "Tên vùng nước không được để trống")
    @Size(max = 255)
    private String waterZoneName;

    @NotNull(message = "Cảng biển chủ không được để trống")
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
