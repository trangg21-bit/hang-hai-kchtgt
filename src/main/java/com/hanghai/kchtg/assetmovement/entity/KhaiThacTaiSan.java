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
 * Entity khai thác tài sản KCHTGT (F-126).
 */
@Entity
@Table(name = "khai_thac_tai_san")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KhaiThacTaiSan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private UUID taiSanId;

    private Integer thoiGianHoatDong;

    @Column(precision = 5, scale = 2)
    private BigDecimal mucDoKhaiThac;

    @Column(precision = 15, scale = 2)
    private BigDecimal chiPhiVanHanh;

    @Column(precision = 15, scale = 2)
    private BigDecimal chiPhiBaoDuong;

    @Column(length = 500)
    private String tinhTrangKyThuat;

    private Integer thangKhaiThac;
    private Integer namKhaiThac;

    @Column(length = 1000)
    private String moTa;

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
