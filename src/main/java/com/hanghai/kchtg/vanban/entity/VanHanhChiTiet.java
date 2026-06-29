package com.hanghai.kchtg.vanban.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Chi tiết vận hành — operational detail records.
 * Used by F-129 Quản lý thông tin vận hành.
 */
@Entity
@Table(name = "van_hanh_chi_tiet")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VanHanhChiTiet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ke_hoach_id", nullable = false)
    private KeHoachVanHanh keHoach;

    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "san_luong_du_kien", precision = 15, scale = 2)
    private BigDecimal sanLuongDuKien;

    @Column(name = "san_luong_thuc_te", precision = 15, scale = 2)
    private BigDecimal sanLuongThucTe;

    @Column(name = "ghi_chu", length = 500)
    private String ghiChu;
}
