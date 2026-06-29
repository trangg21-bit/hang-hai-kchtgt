package com.hanghai.kchtg.vanban.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Sự cố — incident records.
 * Used by F-131 Quản lý thông tin sự cố.
 */
@Entity
@Table(name = "su_co")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuCo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "thoi_gian_phat_hien")
    private LocalDateTime thoiGianPhatHien;

    @Column(name = "vi_tri", length = 300)
    private String viTri;

    @Enumerated(EnumType.STRING)
    @Column(name = "muc_do_nghiem_trong", length = 30)
    private MucDoNghiemTrong mucDoNghiemTrong;

    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;

    @Enumerated(EnumType.STRING)
    @Column(name = "tinh_trang_xu_ly", length = 30)
    private TinhTrangXuLy tinhTrangXuLy;

    @Column(name = "nguoi_bao_cao", length = 100)
    private String nguoiBaoCao;

    @Column(name = "ngay_tao", updatable = false)
    private LocalDateTime ngayTao;

    @Column(name = "nguoi_sua_doi", length = 100)
    private String nguoiSuaDoi;

    @Column(name = "ngay_sua_doi")
    private LocalDateTime ngaySuaDoi;

    @OneToMany(mappedBy = "suCo", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TienDoXuLy> tienDoXuLy = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.ngayTao = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.ngaySuaDoi = LocalDateTime.now();
    }
}
