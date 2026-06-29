package com.hanghai.kchtg.luonghanghai.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.util.*;

@Entity
@Table(name = "luong_hang_hai")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class LuongHangHai {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "loai_tau", nullable = false, length = 100) private String loaiTau;
    @Column(name = "so_luong") private Integer soLuong;
    @Column(name = "ngay_ghi_nhan") private LocalDate ngayGhiNhan;
    @Column(name = "gio_dien", length = 50) private String gioDien;
    @Column(name = "tai_trong", length = 100) private String taiTrong;
    @Column(name = "dien_tich_dang_bo", length = 100) private String dienTichDangBo;
    @Column(name = "ghi_chu", length = 500) private String ghiChu;
    @Enumerated(EnumType.STRING) @Column(name = "trang_thai_phe_duyet", nullable = false, length = 30) private LuongHangHaiApprovalStatus approvalStatus;
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
    @OneToMany(mappedBy = "luongHangHai", cascade = CascadeType.ALL, orphanRemoval = true) @Builder.Default private List<LuongHangHaiAttachment> attachments = new ArrayList<>();
    @OneToMany(mappedBy = "luongHangHai", cascade = CascadeType.ALL, orphanRemoval = true) @Builder.Default private List<PheDuyetLichSu> approvalHistory = new ArrayList<>();
    @PrePersist protected void onCreate() { this.createdAt = LocalDateTime.now(); }
    @PreUpdate protected void onUpdate() { this.updatedAt = LocalDateTime.now(); }
}
