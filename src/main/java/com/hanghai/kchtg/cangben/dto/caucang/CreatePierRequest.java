package com.hanghai.kchtg.cangben.dto.caucang;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

@Data
public class CreatePierRequest {

    @NotBlank(message = "Mã cầu không được để trống")
    @Size(max = 50)
    private String pierCode;

    @NotBlank(message = "Tên cầu không được để trống")
    @Size(max = 255)
    private String pierName;

    @NotNull(message = "Bến cảng chủ không được để trống")
    private UUID berthId;

    private BigDecimal length;
    private BigDecimal designLoad;
    private com.hanghai.kchtg.cangben.entity.LoaiCau pierType;
    private String operationalFunction;
    private com.hanghai.kchtg.common.entity.TrangThaiHoatDong operationalStatus;
    private GisGeometryType geometryType;
    private String coordinates;
    private java.util.UUID mapSymbolId;
}
