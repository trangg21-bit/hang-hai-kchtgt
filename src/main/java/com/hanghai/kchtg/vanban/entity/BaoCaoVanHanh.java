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
 * Báo cáo vận hành — operational reports.
 * Used by F-129 Quản lý thông tin vận hành.
 */
@Entity
@Table(name = "bao_cao_van_hanh")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BaoCaoVanHanh {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "loai_bao_cao", length = 100)
    private String loaiBaoCao;

    @Column(name = "ky_bat_dau")
    private LocalDate kyBatDau;

    @Column(name = "ky_ket_thuc")
    private LocalDate kyKetThuc;

    @Column(name = "tong_chi_phi", precision = 15, scale = 2)
    private BigDecimal tongChiPhi;

    @Column(name = "duong_dan_file", length = 500)
    private String duongDanFile;

    @Column(name = "nguoi_tao", length = 100)
    private String nguoiTao;

    @Column(name = "ngay_tao", updatable = false)
    private LocalDateTime ngayTao;

    @PrePersist
    protected void onCreate() {
        this.ngayTao = LocalDateTime.now();
    }
}
