package com.hanghai.kchtg.cangben.dto.vungnuoc;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

@Data
@Builder
public class VungNuocResponse {
    private UUID id;
    private String maVungNuoc;
    private String tenVungNuoc;
    private UUID cangBienId;
    private String tenCangBien;
    private BigDecimal dienTich;
    private BigDecimal doSauMax;
    private BigDecimal doSauTrungBinh;
    private com.hanghai.kchtg.cangben.entity.LoaiVungNuoc loaiVungNuoc;
    private com.hanghai.kchtg.common.entity.TrangThaiHoatDong trangThaiHoatDong;
    private com.hanghai.kchtg.common.entity.TrangThaiPheDuyet trangThaiPheDuyet;
    private UUID donViId;
    private String createdBy;
    private String updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID bieuTuongId;
    private UUID khongGianId;
    private GisGeometryType loaiHinhHoc;
    private String toaDo;
}
