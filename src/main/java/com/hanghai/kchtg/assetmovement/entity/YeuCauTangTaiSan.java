package com.hanghai.kchtg.assetmovement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Entity yêu cầu tăng tài sản KCHTGT (F-122).
 */
@Entity
@Table(name = "yeu_cau_tang_tai_san")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class YeuCauTangTaiSan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private UUID taiSanId;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private LoaiTaiSanKCHT loaiTaiSan;

    @Column(length = 200)
    private String viTri;

    @Column(length = 1000)
    private String thongSoKyThuat;

    @Column(length = 200)
    private String nguonKinhPhi;

    @Column(precision = 15, scale = 2)
    private BigDecimal nguyenGia;

    @Column(length = 1000)
    private String moTa;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private TrangThaiYeuCau trangThai;

    private UUID approvedBy;
    private Instant approvedAt;

    @Column(length = 1000)
    private String approvedRemarks;

    private UUID unapprovedBy;
    private Instant unapprovedAt;

    @Column(length = 1000)
    private String unapprovedRemarks;

    private Boolean deleted = false;
    private UUID deletedBy;
    private Instant deletedAt;

    private Instant createdAt;
    private UUID createdBy;
    private Instant updatedAt;
    private UUID updatedBy;

    @Version
    private Integer lockVersion;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public void softDelete() {
        this.deleted = true;
    }
}
