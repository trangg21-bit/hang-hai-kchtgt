package com.hanghai.kchtg.cangben.dto.bencang;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class BenCangResponse {
    private UUID id;
    private String maBen;
    private String tenBen;
    private UUID cangBienId;
    private String tenCangBien;
    private String tuyenDuongThuy;
    private BigDecimal viDo;
    private BigDecimal kinhDo;
    private BigDecimal chieuDai;
    private BigDecimal chieuRong;
    private com.hanghai.kchtg.cangben.entity.LoaiBen loaiBen;
    private BigDecimal doSauLuong;
    private String congNangKhaiThac;
    private com.hanghai.kchtg.common.entity.TrangThaiHoatDong trangThaiHoatDong;
    private com.hanghai.kchtg.common.entity.TrangThaiPheDuyet trangThaiPheDuyet;
    private UUID orgUnitId;
    private String createdBy;
    private String updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID bieuTuongId;
    private java.util.UUID khongGianId;
    private com.hanghai.kchtg.gis.spatial.entity.GisGeometryType loaiHinhHoc;
    private String toaDo;
}
