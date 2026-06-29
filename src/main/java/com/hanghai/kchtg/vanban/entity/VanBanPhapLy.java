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
 * Văn bản pháp lý — records legal documents in the port administration system.
 * Used by F-128 Quản lý văn bản pháp lý.
 */
@Entity
@Table(name = "van_ban_phap_ly")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VanBanPhapLy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ten_van_ban", nullable = false, length = 200)
    private String tenVanBan;

    @Column(name = "so_hieu", length = 50)
    private String soHieu;

    @Column(name = "co_quan_ban_hanh", length = 200)
    private String coQuanBanHanh;

    @Column(name = "ngay_ban_hanh")
    private LocalDate ngayBanHanh;

    @Column(name = "ngay_co_hieu_luc")
    private LocalDate ngayCoHieuLuc;

    @Column(name = "ngay_het_hieu_luc")
    private LocalDate ngayHetHieuLuc;

    @Enumerated(EnumType.STRING)
    @Column(name = "loai_van_ban", length = 30)
    private LoaiVanBan loaiVanBan;

    @Column(name = "linh_vuc_ap_dung", length = 100)
    private String linhVucApDung;

    @Enumerated(EnumType.STRING)
    @Column(name = "tinh_trang_hieu_luc", length = 30)
    private TinhTrangHieuLuc tinhTrangHieuLuc;

    @Column(name = "nguoi_tao", length = 100)
    private String nguoiTao;

    @Column(name = "ngay_tao", updatable = false)
    private LocalDateTime ngayTao;

    @Column(name = "nguoi_sua_doi", length = 100)
    private String nguoiSuaDoi;

    @Column(name = "ngay_sua_doi")
    private LocalDateTime ngaySuaDoi;

    @OneToMany(mappedBy = "vanBan", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TaiLieuDinhKem> taiLieuDinhKem = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.ngayTao = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.ngaySuaDoi = LocalDateTime.now();
    }
}
