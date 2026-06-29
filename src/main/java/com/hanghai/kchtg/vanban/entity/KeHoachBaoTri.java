package com.hanghai.kchtg.vanban.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Kế hoạch bảo trì — maintenance planning records.
 * Used by F-130 Quản lý thông tin bảo trì.
 */
@Entity
@Table(name = "ke_hoach_bao_tri")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KeHoachBaoTri {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "thiet_bi", nullable = false, length = 200)
    private String thietBi;

    @Enumerated(EnumType.STRING)
    @Column(name = "loai_bao_tri", length = 30)
    private LoaiBaoTri loaiBaoTri;

    @Column(name = "ngay_bat_dau_du_kien")
    private LocalDate ngayBatDauDuKien;

    @Column(name = "ngay_ket_thuc_du_kien")
    private LocalDate ngayKetThucDuKien;

    @Enumerated(EnumType.STRING)
    @Column(name = "tinh_trang", length = 30)
    private TinhTrangBaoTri tinhTrang;

    @Column(name = "chi_phi_du_kien", precision = 15, scale = 2)
    private BigDecimal chiPhiDuKien;

    @Column(name = "nguoi_tao", length = 100)
    private String nguoiTao;

    @Column(name = "ngay_tao", updatable = false)
    private LocalDateTime ngayTao;

    @Column(name = "nguoi_sua_doi", length = 100)
    private String nguoiSuaDoi;

    @Column(name = "ngay_sua_doi")
    private LocalDateTime ngaySuaDoi;
}
