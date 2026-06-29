package com.hanghai.kchtg.assetmovement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Entity báo cáo kiểm kê tài sản KCHTGT (F-125).
 */
@Entity
@Table(name = "bao_cao_kiem_ke")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BaoCaoKiemKe {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private UUID keHoachId;

    private Integer tongSoTaiSan;
    private Integer soThua;
    private Integer soThieu;
    private Integer soKhacThuong;

    @Column(length = 1000)
    private String moTa;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private TrangThaiBaoCao trangThai;

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
