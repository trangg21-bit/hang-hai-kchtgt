package com.hanghai.kchtg.luonghanghai.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.util.*;

@Entity
@Table(name = "luong_hang_hai")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class LuongHangHai {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private java.util.UUID id;
    @Column(name = "ten", nullable = false, length = 100) private String ten;
    @Column(name = "so_luong_tram") private Integer soLuongTram;
    @Column(name = "thoi_diem_sua_chua_tram_gan_nhat") private LocalDate thoiDiemSuaChuaTramGanNhat;
    @Column(name = "dien_tich_tram") private java.math.BigDecimal dienTichTram;
    @Column(name = "ghi_chu", length = 500) private String ghiChu;
    @Column(name = "ma_luong_hang_hai", length = 50) private String maLuongHangHai;
    @Column(name = "cang_bien_id") private UUID cangBienId;
    @Column(name = "don_vi_van_hanh_id") private UUID donViVanHanhId;
    @Column(name = "dia_diem", length = 6) private String diaDiem;
    @Column(name = "dia_diem_chi_tiet", length = 500) private String diaDiemChiTiet;
    @Column(name = "tram_quan_ly_luong", length = 500) private String tramQuanLyLuong;
    @Column(name = "so_luong_nhan_su_tai_tram") @Builder.Default private Integer soLuongNhanSuTaiTram = 0;
    @Column(name = "nam_bao_tri_gan_nhat") private Integer namBaoTriGanNhat;
    @Column(name = "khoi_luong_nao_vet") private java.math.BigDecimal khoiLuongNaoVet;
    @Column(name = "chieu_cao_tinh_khong", length = 20) private String chieuCaoTinhKhong;
    @Column(name = "so_luong_phao") @Builder.Default private Integer soLuongPhao = 0;
    @Column(name = "so_luong_tieu") @Builder.Default private Integer soLuongTieu = 0;
    @Column(name = "tinh_trang") @Builder.Default private Integer tinhTrang = 1;
    @Column(name = "org_unit_id") private UUID donViId;
    @Column(name = "trang_thai_phe_duyet", nullable = false)
    @Convert(converter = LuongHangHaiApprovalStatusConverter.class)
    private LuongHangHaiApprovalStatus approvalStatus;
    @Column(name = "phe_duyet_c1", nullable = false) private Boolean pheDuyetC1;
    @Column(name = "nguoi_phe_duyet_c1", length = 100) private String nguoiPheDuyetC1;
    @Column(name = "ngay_phe_duyet_c1") private LocalDate ngayPheDuyetC1;
    @Column(name = "phe_duyet_c2", nullable = false) private Boolean pheDuyetC2;
    @Column(name = "nguoi_phe_duyet_c2", length = 100) private String nguoiPheDuyetC2;
    @Column(name = "ngay_phe_duyet_c2") private LocalDate ngayPheDuyetC2;
    @Column(name = "ly_do_tu_choi", length = 500) private String lyDoTuChoi;
    @Column(name = "is_deleted", nullable = false) @Builder.Default private Boolean isDeleted = false;
    @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;
    @Column(name = "created_by", length = 100) private String createdBy;
    @Column(name = "updated_by", length = 100) private String updatedBy;
    @Column(name = "spatial_id") private UUID khongGianId;
    @OneToMany(mappedBy = "luongHangHai", cascade = CascadeType.ALL, orphanRemoval = true) @Builder.Default private List<LuongHangHaiAttachment> attachments = new ArrayList<>();
    @OneToMany(mappedBy = "luongHangHai", cascade = CascadeType.ALL, orphanRemoval = true) @Builder.Default private List<PheDuyetLichSu> approvalHistory = new ArrayList<>();
    @OneToMany(mappedBy = "luongHangHai", cascade = CascadeType.ALL, orphanRemoval = true) @Builder.Default private List<ChiTietTuyenLuong> chiTietTuyenLuongList = new ArrayList<>();
    @PrePersist protected void onCreate() { this.createdAt = LocalDateTime.now(); }
    @PreUpdate protected void onUpdate() { this.updatedAt = LocalDateTime.now(); }
}
