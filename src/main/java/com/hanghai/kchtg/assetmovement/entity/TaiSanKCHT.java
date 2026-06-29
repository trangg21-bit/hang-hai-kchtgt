package com.hanghai.kchtg.assetmovement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Entity lưu thông tin tài sản KCHTGT.
 */
@Entity
@Table(name = "tai_san_kcht")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SQLRestriction("deleted = false")
public class TaiSanKCHT {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false, length = 50)
    private String maTaiSan;

    @Column(nullable = false, length = 200)
    private String tenTaiSan;

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

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal haoMonLucKe = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal giaTriConLai = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private TrangThaiTaiSan trangThai;

    private UUID approvedBy;
    private Instant approvedAt;

    @Column(length = 1000)
    private String approvedRemarks;

    private UUID unapprovedBy;
    private Instant unapprovedAt;

    @Column(length = 1000)
    private String unapprovedRemarks;

    @Builder.Default
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
