package com.hanghai.kchtg.assetmovement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Entity kế hoạch kiểm kê tài sản KCHTGT (F-125).
 */
@Entity
@Table(name = "ke_hoach_kiem_ke")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KeHoachKiemKe {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private LoaiKiemKe loaiKiemKe;

    @Column(length = 500)
    private String phamVi;

    private Instant ngayBatDau;
    private Instant ngayKetThuc;

    @Column(length = 200)
    private String toTruongKiemKe;

    @Column(length = 1000)
    private String moTa;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private TrangThaiKeHoach trangThai;

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
