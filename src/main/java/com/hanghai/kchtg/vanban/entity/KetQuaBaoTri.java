package com.hanghai.kchtg.vanban.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Kết quả bảo trì — maintenance result records.
 * Used by F-130 Quản lý thông tin bảo trì.
 */
@Entity
@Table(name = "ket_qua_bao_tri")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KetQuaBaoTri {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ke_hoach_id", nullable = false)
    private KeHoachBaoTri keHoach;

    @Column(name = "thoi_gian_bat_dau_thuc_te")
    private LocalDateTime thoiGianBatDauThucTe;

    @Column(name = "thoi_gian_ket_thuc_thuc_te")
    private LocalDateTime thoiGianKetThucThucTe;

    @Column(name = "mo_ta_ket_qua", columnDefinition = "TEXT")
    private String moTaKetQua;

    @Column(name = "phu_ton_thay_the", length = 500)
    private String phuTonThayThe;

    @Column(name = "thoi_gian_ngung_hoat_dong")
    private Long thoiGianNgungHoatDong;

    @Column(name = "nguoi_ghi_nhan", length = 100)
    private String nguoiGhiNhan;

    @Column(name = "ngay_ghi_nhan")
    private LocalDate ngayGhiNhan;
}
