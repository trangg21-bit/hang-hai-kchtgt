package com.hanghai.kchtg.navigationchannel.entity;

import java.util.UUID;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "chi_tiet_tuyen_luong")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ChannelRouteDetail {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "navigation_channel_id", nullable = false)
    private NavigationChannel navigationChannel;

    @Column(name = "sequenceNo") private Integer sequenceNo;
    @Column(name = "phan_loai", length = 5) private String classification;
    @Column(name = "ma", length = 50) private String code;
    @Column(name = "ten", length = 500) private String name;
    @Column(name = "loai_tuyen_luong") private Integer channelRouteType;
    @Column(name = "do_sau_hien_tai", length = 20) private String currentDepth;
    @Column(name = "mai_doc_thiet_ke", length = 20) private String designSlope;
    @Column(name = "chieu_dai") private BigDecimal length;
    @Column(name = "rong_lon_nhat") private BigDecimal maxWidth;
    @Column(name = "rong_nho_nhat") private BigDecimal minWidth;
    @Column(name = "do_sau") private BigDecimal depth;
    @Column(name = "khoi_luong_nao_vet") private BigDecimal dredgingVolume;
    @Column(name = "cong_cong") private Boolean publicAccess;
    @Column(name = "chuyen_dung") private Boolean dedicated;
    @Column(name = "chieu_cao_tinh_khong", length = 20) private String clearanceHeight;
    @Column(name = "vi_tri_vung_quay_tau", length = 500) private String turningBasinLocation;
    @Column(name = "ban_kinh_vung_quay_tau") private BigDecimal turningBasinRadius;
    @Column(name = "ban_kinh_cong_nho_nhat") private BigDecimal minCurveRadius;
    @Column(name = "pham_vi_bao_ve_luong", length = 500) private String channelProtectionScope;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;
    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }
    @PreUpdate protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
