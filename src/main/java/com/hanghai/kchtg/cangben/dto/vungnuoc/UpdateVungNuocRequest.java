package com.hanghai.kchtg.cangben.dto.vungnuoc;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

@Data
public class UpdateVungNuocRequest {

    @NotNull(message = "ID không được để trống")
    private UUID id;

    private String tenVungNuoc;
    private UUID cangBienId;
    private BigDecimal dienTich;
    private BigDecimal doSauMax;
    private BigDecimal doSauTrungBinh;
    private com.hanghai.kchtg.cangben.entity.LoaiVungNuoc loaiVungNuoc;
    private com.hanghai.kchtg.common.entity.TrangThaiHoatDong trangThaiHoatDong;
    private java.util.UUID bieuTuongId;
    private GisGeometryType loaiHinhHoc;
    private String toaDo;
}
