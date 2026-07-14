package com.hanghai.kchtg.cangben.dto.caucang;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

@Data
@Builder
public class CauCangResponse {
    private UUID id;
    private String maCau;
    private String tenCau;
    private UUID benCangId;
    private String tenBenCang;
    private BigDecimal chieuDai;
    private BigDecimal taiTrong;
    private com.hanghai.kchtg.cangben.entity.LoaiCau loaiCau;
    private String congNangKhaiThac;
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
