package com.hanghai.kchtg.cangben.dto.cangbien;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for CangBien entity.
 */
@Data
@Builder
public class CangBienResponse {

    private UUID id;
    private String maCang;
    private String tenCang;
    private String tinhThanhPho;
    private BigDecimal viDo;
    private BigDecimal kinhDo;
    private BigDecimal dienTich;
    private BigDecimal khaNangTiepNhan;
    private com.hanghai.kchtg.common.entity.TrangThaiHoatDong trangThaiHoatDong;
    private com.hanghai.kchtg.common.entity.TrangThaiPheDuyet trangThaiPheDuyet;
    private UUID orgUnitId;
    private Integer nhomCangBien;
    private String createdBy;
    private String updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private java.util.UUID bieuTuongId;
    private java.util.UUID khongGianId;
    private com.hanghai.kchtg.gis.spatial.entity.GisGeometryType loaiHinhHoc;
    private String toaDo;

    // ── Extended fields (V53) ────────────────────────────────────────

    private String diaDiemChiTiet;
    private Integer phanCap;
    private Integer heQuyChieu;
    private Integer quyTacHienThi;

    // ── zobjDataSub fields ───────────────────────────────────────────

    private String phamViVungNuoc;
    private Integer tongSoBenCang;
    private Integer tongSoKhuNeoDauChuyenTai;
    private Integer tongSoTuyenLuongCongCong;
    private Integer tongSoTuyenLuongChuyenDung;
    private BigDecimal tongChieuDaiLuongCongCong;
    private BigDecimal tongChieuDaiLuongChuyenDung;
    private Integer tongSoPhaoTieuBaoHieu;
    private Integer tongSoDeKe;
    private BigDecimal tongChieuDaiDeKe;
    private Integer tongSoDenBienDangTieu;
    private Integer soLuongBenPhao;
    private Integer soLuongKhuNeoDau;
    private Integer soLuongKhuChuyenTai;
    private String cacKhuNuocKhac;
    private String ghiChu;
}
