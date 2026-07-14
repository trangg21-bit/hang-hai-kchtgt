package com.hanghai.kchtg.cangben.dto.caucang;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

@Data
public class UpdateCauCangRequest {

    @NotNull(message = "ID không được để trống")
    private UUID id;

    private String tenCau;
    private UUID benCangId;
    private BigDecimal chieuDai;
    private BigDecimal taiTrong;
    private com.hanghai.kchtg.cangben.entity.LoaiCau loaiCau;
    private String congNangKhaiThac;
    private com.hanghai.kchtg.common.entity.TrangThaiHoatDong trangThaiHoatDong;
    private GisGeometryType loaiHinhHoc;
    private String toaDo;
    private java.util.UUID bieuTuongId;
}
