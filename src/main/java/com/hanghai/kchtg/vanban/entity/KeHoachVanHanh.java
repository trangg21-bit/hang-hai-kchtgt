package com.hanghai.kchtg.vanban.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Kế hoạch vận hành — operational planning records.
 * Used by F-129 Quản lý thông tin vận hành.
 */
@Entity
@Table(name = "ke_hoach_van_hanh")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KeHoachVanHanh {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ngay_van_hanh")
    private LocalDate ngayVanHanh;

    @Column(name = "cau_cang", length = 200)
    private String cauCang;

    @Column(name = "thiet_bi", length = 200)
    private String thietBi;

    @Column(name = "thoi_gian_bat_dau")
    private LocalTime thoiGianBatDau;

    @Column(name = "thoi_gian_ket_thuc")
    private LocalTime thoiGianKetThuc;

    @Enumerated(EnumType.STRING)
    @Column(name = "tinh_trang", length = 30)
    private TinhTrangVanHanh tinhTrang;

    @Column(name = "nguoi_tao", length = 100)
    private String nguoiTao;

    @Column(name = "ngay_tao", updatable = false)
    private LocalDateTime ngayTao;

    @Column(name = "nguoi_sua_doi", length = 100)
    private String nguoiSuaDoi;

    @Column(name = "ngay_sua_doi")
    private LocalDateTime ngaySuaDoi;

    @OneToMany(mappedBy = "keHoach", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<VanHanhChiTiet> vanHanhChiTiet = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.ngayTao = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.ngaySuaDoi = LocalDateTime.now();
    }
}
