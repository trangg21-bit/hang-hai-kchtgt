package com.hanghai.kchtg.deke.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.util.*;

@Entity
@Table(name = "de_ke")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DeKe {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "loai_de", nullable = false, length = 100)
    private String loaiDe;

    @Column(name = "vi_tri", nullable = false, length = 200)
    private String viTri;

    @Column(name = "chieu_dai")
    private Double chieuDai;

    @Column(name = "chieu_rong")
    private Double chieuRong;

    @Column(name = "chieu_cao")
    private Double chieuCao;

    @Column(name = "mat_vat_lieu", length = 100)
    private String matVatLieu;

    @Column(name = "tinh_trang", length = 100)
    private String tinhTrang;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai_phe_duyet", nullable = false, length = 30)
    private DeKeApprovalStatus trangThaiPheDuyet;

    @Column(name = "phe_duyet_c1", nullable = false)
    @Builder.Default
    private Boolean pheDuyetC1 = false;

    @Column(name = "nguoi_phe_duyet_c1", length = 100)
    private String nguoiPheDuyetC1;

    @Column(name = "ngay_phe_duyet_c1")
    private LocalDate ngayPheDuyetC1;

    @Column(name = "phe_duyet_c2", nullable = false)
    @Builder.Default
    private Boolean pheDuyetC2 = false;

    @Column(name = "nguoi_phe_duyet_c2", length = 100)
    private String nguoiPheDuyetC2;

    @Column(name = "ngay_phe_duyet_c2")
    private LocalDate ngayPheDuyetC2;

    @Column(name = "ly_do_tu_choi", length = 500)
    private String lyDoTuChoi;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @OneToMany(mappedBy = "deKe", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DeKeAttachment> attachments = new ArrayList<>();

    @OneToMany(mappedBy = "deKe", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PheDuyetLichSu> approvalHistory = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
