package com.hanghai.kchtg.assetmovement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Entity lưu phê duyệt trong quy trình biến động (F-127).
 */
@Entity
@Table(name = "luu_phe_duyệt")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LuuPheDuyet {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private UUID yeuCauId;

    private Integer capPheDuyet;

    private UUID nguoiPheDuyet;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private KetQuaPheDuyet ketQua;

    @Column(length = 2000)
    private String lyDo;

    private Instant ngayPheDuyet;

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
