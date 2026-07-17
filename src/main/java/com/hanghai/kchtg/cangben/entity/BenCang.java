package com.hanghai.kchtg.cangben.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.common.entity.TrangThaiHoatDong;
import com.hanghai.kchtg.common.entity.TrangThaiHoatDongConverter;
import com.hanghai.kchtg.common.entity.TrangThaiPheDuyet;
import com.hanghai.kchtg.common.entity.TrangThaiPheDuyetConverter;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing a berth (Bến cảng) — child of CangBien.
 * Corresponds to table: ben_cang (Flyway V15).
 * FK: cang_bien_id → cang_bien.id (NOT NULL)
 */
@Entity
@Table(name = "ben_cang",
        uniqueConstraints = @UniqueConstraint(columnNames = "ma_ben"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class BenCang extends BaseEntity {

    @Column(name = "ma_ben", nullable = false, unique = true, length = 50)
    private String maBen;

    @Column(name = "ten_ben", nullable = false, length = 255)
    private String tenBen;

    @Column(name = "cang_bien_id", nullable = false)
    private UUID cangBienId;

    @Column(name = "tuyen_duong_thuy", length = 255)
    private String tuyenDuongThuy;

    @Column(name = "vi_do", precision = 10, scale = 6)
    private BigDecimal viDo;

    @Column(name = "kinh_do", precision = 10, scale = 6)
    private BigDecimal kinhDo;

    @Column(name = "chieu_dai", precision = 15, scale = 2)
    private BigDecimal chieuDai;

    @Column(name = "chieu_rong", precision = 15, scale = 2)
    private BigDecimal chieuRong;

    @Column(name = "loai_ben")
    @Convert(converter = LoaiBenConverter.class)
    private LoaiBen loaiBen;

    @Column(name = "do_sau_luong", precision = 10, scale = 2)
    private BigDecimal doSauLuong;

    @Column(name = "trang_thai_hoat_dong")
    @Convert(converter = TrangThaiHoatDongConverter.class)
    private TrangThaiHoatDong trangThaiHoatDong;

    @Column(name = "trang_thai_phe_duyet", nullable = false)
    @Convert(converter = TrangThaiPheDuyetConverter.class)
    private TrangThaiPheDuyet trangThaiPheDuyet;

    @Column(name = "org_unit_id")
    private UUID orgUnitId;

    @Column(name = "cong_nang_khai_thac", length = 255)
    private String congNangKhaiThac;

    @Column(name = "bieu_tuong_id")
    private java.util.UUID bieuTuongId;

    @Column(name = "spatial_id")
    private java.util.UUID khongGianId;

    // ── Extended fields from hh.csdl legacy Qlkc038Dto ────────────────

    @Column(name = "dia_diem", length = 100)
    private String diaDiem;

    @Column(name = "dia_diem_chi_tiet", length = 500)
    private String diaDiemChiTiet;

    @Column(name = "he_quy_chieu")
    private Integer heQuyChieu;

    @Column(name = "quy_tac_hien_thi")
    private Integer quyTacHienThi;

    @Column(name = "don_vi_khai_thac", length = 255)
    private String donViKhaiThac;

    @Column(name = "tong_dien_tich", precision = 19, scale = 4)
    private BigDecimal tongDienTich;

    @Column(name = "nang_luc_thong_qua_thiet_ke", precision = 19, scale = 4)
    private BigDecimal nangLucThongQuaThietKe;

    @Column(name = "nang_luc_thong_qua_hien_trang", precision = 19, scale = 4)
    private BigDecimal nangLucThongQuaHienTrang;

    @Column(name = "co_tau_tiep_nhan_lon_nhat", precision = 19, scale = 4)
    private BigDecimal coTauTiepNhanLonNhat;

    @Column(name = "quy_hoach_nang_luc_thong_qua", precision = 19, scale = 4)
    private BigDecimal quyHoachNangLucThongQua;

    @Column(name = "san_luong_hang_hoa_nam_gan_nhat", precision = 19, scale = 4)
    private BigDecimal sanLuongHangHoaNamGanNhat;

    @Column(name = "thoi_diem_cong_bo_mo")
    private LocalDateTime thoiDiemCongBoMo;

    @Column(name = "quyet_dinh_cong_bo", length = 500)
    private String quyetDinhCongBo;

    @Column(name = "van_ban_thoa_thuan_dau_tu", length = 2000)
    private String vanBanThoaThuanDauTu;

    @Column(name = "loai_ket_cau")
    private Integer loaiKetCau;
}

