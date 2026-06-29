package com.hanghai.kchtg.vanban.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Điều chỉnh quy hoạch — planning adjustment records.
 * Used by F-134 Cập nhật quy hoạch bến cảng.
 */
@Entity
@Table(name = "dieu_chinh_quy_hoach")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DieuChinhQuyHoach {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quy_hoach_id", nullable = false)
    private QuyHoachBenCang quyHoach;

    @Column(name = "loai_dieu_chinh", length = 100)
    private String loaiDieuChinh;

    @Column(name = "ly_do", columnDefinition = "TEXT")
    private String lyDo;

    @Column(name = "mo_ta_chi_tiet", columnDefinition = "TEXT")
    private String moTaChiTiet;

    @Column(name = "pham_vi_anh_huong", length = 500)
    private String phamViAnhHuong;

    @Enumerated(EnumType.STRING)
    @Column(name = "tinh_trang", length = 30)
    private TinhTrangDieuChinh tinhTrang;

    @Column(name = "nguoi_dang_ky", length = 100)
    private String nguoiDangKy;

    @Column(name = "ngay_dang_ky")
    private LocalDateTime ngayDangKy;

    @Column(name = "nguoi_sua_doi", length = 100)
    private String nguoiSuaDoi;

    @Column(name = "ngay_sua_doi")
    private LocalDateTime ngaySuaDoi;

    @OneToMany(mappedBy = "dieuChinh", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PheDuyetDieuChinh> pheDuyetDieuChinh = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.ngayDangKy = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.ngaySuaDoi = LocalDateTime.now();
    }
}
