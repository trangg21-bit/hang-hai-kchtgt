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
import java.util.UUID;

/**
 * Entity representing a port (Cảng biển) — M-002 root entity.
 * Corresponds to table: cang_bien (Flyway V14 + V53).
 * <p>
 * Uses BaseEntity for UUID PK, soft-delete, and JPA auditing.
 * The code (maCang) is immutable after creation.
 * </p>
 */
@Entity
@Table(name = "cang_bien",
        uniqueConstraints = @UniqueConstraint(columnNames = "ma_cang"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class CangBien extends BaseEntity {

    @Column(name = "ma_cang", nullable = false, unique = true, length = 50)
    private String maCang;

    @Column(name = "ten_cang", nullable = false, length = 255)
    private String tenCang;

    @Column(name = "tinh_thanh_pho", length = 100)
    private String tinhThanhPho;

    @Column(name = "vi_do", precision = 10, scale = 6)
    private BigDecimal viDo;

    @Column(name = "kinh_do", precision = 10, scale = 6)
    private BigDecimal kinhDo;

    @Column(name = "dien_tich", precision = 15, scale = 2)
    private BigDecimal dienTich;

    @Column(name = "kha_nang_tiep_nhan", precision = 15, scale = 2)
    private BigDecimal khaNangTiepNhan;

    @Column(name = "trang_thai_hoat_dong")
    @Convert(converter = TrangThaiHoatDongConverter.class)
    private TrangThaiHoatDong trangThaiHoatDong;

    @Column(name = "trang_thai_phe_duyet", nullable = false)
    @Convert(converter = TrangThaiPheDuyetConverter.class)
    private TrangThaiPheDuyet trangThaiPheDuyet;

    @Column(name = "org_unit_id")
    private UUID orgUnitId;

    @Column(name = "nhom_cang_bien")
    private Integer nhomCangBien;

    @Column(name = "bieu_tuong_id")
    private java.util.UUID bieuTuongId;

    @Column(name = "spatial_id")
    private java.util.UUID khongGianId;

    // ── Extended fields (V53 — from hh.csdl Qlkc037Dto) ──────────────

    @Column(name = "dia_diem_chi_tiet", length = 500)
    private String diaDiemChiTiet;

    @Column(name = "phan_cap")
    private Integer phanCap;

    @Column(name = "he_quy_chieu")
    private Integer heQuyChieu;

    @Column(name = "quy_tac_hien_thi")
    private Integer quyTacHienThi;

    // ── zobjDataSub fields ───────────────────────────────────────────

    @Column(name = "pham_vi_vung_nuoc", length = 2000)
    private String phamViVungNuoc;

    @Column(name = "tong_so_ben_cang")
    private Integer tongSoBenCang;

    @Column(name = "tong_so_khu_neo_dau_chuyen_tai")
    private Integer tongSoKhuNeoDauChuyenTai;

    @Column(name = "tong_so_tuyen_luong_cong_cong")
    private Integer tongSoTuyenLuongCongCong;

    @Column(name = "tong_so_tuyen_luong_chuyen_dung")
    private Integer tongSoTuyenLuongChuyenDung;

    @Column(name = "tong_chieu_dai_luong_cong_cong", precision = 19, scale = 4)
    private BigDecimal tongChieuDaiLuongCongCong;

    @Column(name = "tong_chieu_dai_luong_chuyen_dung", precision = 19, scale = 4)
    private BigDecimal tongChieuDaiLuongChuyenDung;

    @Column(name = "tong_so_phao_tieu_bao_hieu")
    private Integer tongSoPhaoTieuBaoHieu;

    @Column(name = "tong_so_de_ke")
    private Integer tongSoDeKe;

    @Column(name = "tong_chieu_dai_de_ke", precision = 19, scale = 4)
    private BigDecimal tongChieuDaiDeKe;

    @Column(name = "tong_so_den_bien_dang_tieu")
    private Integer tongSoDenBienDangTieu;

    @Column(name = "so_luong_ben_phao")
    private Integer soLuongBenPhao;

    @Column(name = "so_luong_khu_neo_dau")
    private Integer soLuongKhuNeoDau;

    @Column(name = "so_luong_khu_chuyen_tai")
    private Integer soLuongKhuChuyenTai;

    @Column(name = "cac_khu_nuoc_khac", length = 2000)
    private String cacKhuNuocKhac;

    @Column(name = "ghi_chu", length = 2000)
    private String ghiChu;

}
