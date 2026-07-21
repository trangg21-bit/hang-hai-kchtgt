package com.hanghai.kchtg.luonghanghai.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "chi_tiet_tuyen_luong")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ChiTietTuyenLuong {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "luong_hang_hai_id", nullable = false)
    private LuongHangHai luongHangHai;

    @Column(name = "stt") private Integer stt;
    @Column(name = "phan_loai", length = 5) private String phanLoai;
    @Column(name = "ma", length = 50) private String ma;
    @Column(name = "ten", length = 500) private String ten;
    @Column(name = "loai_tuyen_luong") private Integer loaiTuyenLuong;
    @Column(name = "do_sau_hien_tai", length = 20) private String doSauHienTai;
    @Column(name = "mai_doc_thiet_ke", length = 20) private String maiDocThietKe;
    @Column(name = "chieu_dai") private BigDecimal chieuDai;
    @Column(name = "rong_lon_nhat") private BigDecimal rongLonNhat;
    @Column(name = "rong_nho_nhat") private BigDecimal rongNhoNhat;
    @Column(name = "do_sau") private BigDecimal doSau;
    @Column(name = "khoi_luong_nao_vet") private BigDecimal khoiLuongNaoVet;
    @Column(name = "cong_cong") private Boolean congCong;
    @Column(name = "chuyen_dung") private Boolean chuyenDung;
    @Column(name = "chieu_cao_tinh_khong", length = 20) private String chieuCaoTinhKhong;
    @Column(name = "vi_tri_vung_quay_tau", length = 500) private String viTriVungQuayTau;
    @Column(name = "ban_kinh_vung_quay_tau") private BigDecimal banKinhVungQuayTau;
    @Column(name = "ban_kinh_cong_nho_nhat") private BigDecimal banKinhCongNhoNhat;
    @Column(name = "pham_vi_bao_ve_luong", length = 500) private String phamViBaoVeLuong;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;
    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }
    @PreUpdate protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
