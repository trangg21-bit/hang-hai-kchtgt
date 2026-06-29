package com.hanghai.kchtg.vanban.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Biên bản sự cố — incident records with recovery measures.
 * Used by F-131 Quản lý thông tin sự cố.
 */
@Entity
@Table(name = "bien_ban_su_co")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BienBanSuCo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "su_co_id")
    private Long suCoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "su_co_id", insertable = false, updatable = false)
    private SuCo suCo;

    @Column(name = "mo_ta_chi_tiet", columnDefinition = "TEXT")
    private String moTaChiTiet;

    @Column(name = "bien_phap_kac_phuc", columnDefinition = "TEXT")
    private String bienPhapKacPhuc;

    @Column(name = "thoi_gian_xu_ly_ket_thuc")
    private LocalDateTime thoiGianXuLyKetThuc;

    @Column(name = "nguoi_lap_bien_ban", length = 100)
    private String nguoiLapBienBan;

    @Column(name = "ngay_lap", updatable = false)
    private LocalDateTime ngayLap;

    @Column(name = "tai_lieu_dinh_kem", length = 500)
    private String taiLieuDinhKem;

    @PrePersist
    protected void onCreate() {
        this.ngayLap = LocalDateTime.now();
    }
}
