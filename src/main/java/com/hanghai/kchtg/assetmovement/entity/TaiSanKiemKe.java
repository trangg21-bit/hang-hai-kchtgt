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
 * Entity tài sản kiểm kê trong kế hoạch kiểm kê (F-125).
 */
@Entity
@Table(name = "tai_san_kiem_ke")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaiSanKiemKe {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private UUID keHoachId;
    private UUID taiSanId;

    @Column(precision = 15, scale = 2)
    private BigDecimal giaTriSach;

    @Column(precision = 15, scale = 2)
    private BigDecimal giaTriThucTe;

    @Column(precision = 15, scale = 2)
    private BigDecimal chenhLech;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private TrangThaiKiemKe trangThaiKiemKe;

    @Column(length = 1000)
    private String ghiChu;

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
