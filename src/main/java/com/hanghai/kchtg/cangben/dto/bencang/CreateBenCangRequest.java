package com.hanghai.kchtg.cangben.dto.bencang;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class CreateBenCangRequest {

    @NotBlank(message = "Mã bến không được để trống")
    @Size(max = 50)
    private String maBen;

    @NotBlank(message = "Tên bến không được để trống")
    @Size(max = 255)
    private String tenBen;

    @NotNull(message = "Cảng biển chủ không được để trống")
    private UUID cangBienId;

    private UUID orgUnitId;

    private String tuyenDuongThuy;
    private BigDecimal viDo;
    private BigDecimal kinhDo;
    private BigDecimal chieuDai;
    private BigDecimal chieuRong;
    private com.hanghai.kchtg.cangben.entity.LoaiBen loaiBen;
    private BigDecimal doSauLuong;
    private String congNangKhaiThac;
    private com.hanghai.kchtg.common.entity.TrangThaiHoatDong trangThaiHoatDong;
    private UUID bieuTuongId;
    private com.hanghai.kchtg.gis.spatial.entity.GisGeometryType loaiHinhHoc;
    private String toaDo;

    // ── Extended fields from hh.csdl legacy Qlkc038Dto ────────────────

    @Size(max = 100)
    private String diaDiem;

    @Size(max = 500)
    private String diaDiemChiTiet;

    private Integer heQuyChieu;

    private Integer quyTacHienThi;

    @Size(max = 255)
    private String donViKhaiThac;

    @DecimalMin("0")
    private BigDecimal tongDienTich;

    @DecimalMin("0")
    private BigDecimal nangLucThongQuaThietKe;

    @DecimalMin("0")
    private BigDecimal nangLucThongQuaHienTrang;

    @DecimalMin("0")
    private BigDecimal coTauTiepNhanLonNhat;

    @DecimalMin("0")
    private BigDecimal quyHoachNangLucThongQua;

    @DecimalMin("0")
    private BigDecimal sanLuongHangHoaNamGanNhat;

    private LocalDateTime thoiDiemCongBoMo;

    @Size(max = 500)
    private String quyetDinhCongBo;

    @Size(max = 2000)
    private String vanBanThoaThuanDauTu;

    private Integer loaiKetCau;
}
