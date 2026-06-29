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
 * Quy hoạch bến cảng — port planning records.
 * Used by F-132 Quản lý quy hoạch bến cảng.
 */
@Entity
@Table(name = "quy_hoach_ben_cang")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuyHoachBenCang {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ten_do_an", nullable = false, length = 200)
    private String tenDoAn;

    @Column(name = "co_quan_phe_duyet", length = 200)
    private String coQuanPheDuyet;

    @Column(name = "ngay_phe_duyet")
    private LocalDate ngayPheDuyet;

    @Column(name = "pham_vi_ap_dung", length = 500)
    private String phamViApDung;

    @Column(name = "ti_le_ban_do", length = 50)
    private String tiLeBanDo;

    @Enumerated(EnumType.STRING)
    @Column(name = "tinh_trang", length = 30)
    private TinhTrangQuyHoach tinhTrang;

    @Column(name = "duong_dan_file", length = 500)
    private String duongDanFile;

    @Column(name = "nguoi_tao", length = 100)
    private String nguoiTao;

    @Column(name = "ngay_tao", updatable = false)
    private LocalDateTime ngayTao;

    @Column(name = "nguoi_sua_doi", length = 100)
    private String nguoiSuaDoi;

    @Column(name = "ngay_sua_doi")
    private LocalDateTime ngaySuaDoi;

    @OneToMany(mappedBy = "quyHoach", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<HamMucQuyHoach> hamMucQuyHoach = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.ngayTao = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.ngaySuaDoi = LocalDateTime.now();
    }
}
